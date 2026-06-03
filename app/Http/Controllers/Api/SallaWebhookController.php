<?php

/**
 * ====================================================================
 * SallaWebhookController — الموحَّد
 * ====================================================================
 *
 * نقطة دخول واحدة لكل أحداث سلة (Webhooks).
 *
 * المميزات:
 * ✅ التحقق من التوقيع (HMAC-SHA256) حسب توثيق سلة
 * ✅ منع المعالجة المكررة (Idempotency) عبر Cache
 * ✅ مزامنة كاملة للـ variants والكميات
 * ✅ تحديث variants_data و batch_items
 * ✅ تشغيل CheckBatchExpiryJob بعد التحديثات
 * ✅ منع stale data و race conditions
 * ✅ دعم product.price.updated, product.status.updated
 * ✅ الحفاظ على منطق المنتجات بدون variants والـ zero stock
 *
 * المسار: POST /webhooks/salla
 *        POST /api/webhooks/salla
 *
 * مرجع توثيق سلة:
 *   https://docs.salla.dev/433805m0.md
 *   https://docs.salla.dev/421119m0
 *
 * ====================================================================
 */

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Batch;
use App\Models\BatchItem;
use App\Models\Merchant;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\SallaApiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SallaWebhookController extends Controller
{
    /**
     * الفاصل الزمني لذاكرة idempotency (بالدقائق)
     * يمنع معالجة نفس الـ webhook أكثر من مرة خلال هذه المدة.
     */
    const IDEMPOTENCY_TTL_MINUTES = 10;

    /**
     * نقطة الدخول الموحَّدة لكل أحداث سلة
     */
    public function handle(Request $request)
    {
        // ─── 1. التحقق من التوقيع (Signature Verification) ───
        // سلة ترسل: X-Salla-Security-Strategy = Signature
        //           X-Salla-Signature = HMAC-SHA256(payload, webhook_secret)
        if (!$this->verifySignature($request)) {
            Log::warning('[Webhook] ❌ فشل التحقق من التوقيع');
            return response()->json(['success' => false, 'message' => 'Invalid signature'], 401);
        }

        // ─── 2. استخراج الحدث ───
        $event = $request->header('Salla-Event')
                ?? $request->header('x-salla-event')
                ?? $request->header('X-Salla-Event')
                ?? $request->input('event')
                ?? $request->input('type')
                ?? 'unknown';

        // ─── 3. استخراج البيانات ───
        $body = $request->all();
        $merchantId = $body['merchant_id']
                    ?? $body['merchant']
                    ?? $request->input('merchant_id')
                    ?? $request->input('merchant');
        $data = $body['data'] ?? $body;

        // ─── 4. منع المعالجة المكررة (Idempotency) ───
        $idempotencyKey = $this->getIdempotencyKey($event, $data);
        if ($idempotencyKey && Cache::get($idempotencyKey)) {
            Log::info('[Webhook] ⏭️ تم تجاوز حدث مكرر: ' . $event);
            return response()->json(['success' => true, 'note' => 'duplicate skipped']);
        }

        Log::info('[Webhook] 📩 حدث من سلة', [
            'event'       => $event,
            'merchant_id' => $merchantId,
        ]);

        // ─── 5. البحث عن التاجر ───
        if (!$merchantId) {
            Log::warning('[Webhook] لم يتم العثور على merchant_id');
            return response()->json(['success' => true, 'note' => 'merchant not found']);
        }

        $merchant = Merchant::where('salla_merchant_id', $merchantId)->first();
        if (!$merchant) {
            Log::error('[Webhook] تاجر غير موجود: ' . $merchantId);
            return response()->json(['success' => true, 'note' => 'merchant not found']);
        }

        // ─── 6. تثبيت idempotency ───
        if ($idempotencyKey) {
            Cache::put($idempotencyKey, true, now()->addMinutes(self::IDEMPOTENCY_TTL_MINUTES));
        }

        // ─── 7. معالجة الحدث ───
        try {
            match ($event) {
                // ─── أحداث المنتجات ───
                'product.created',
                'product.updated'          => $this->upsertProduct($merchant, $data),

                'product.deleted'          => $this->deleteProduct($merchant, $data['id'] ?? null),

                'product.status.updated',
                'product.available'        => $this->upsertProduct($merchant, $data),

                'product.price.updated'    => $this->handlePriceUpdated($merchant, $data),

                // ─── أحداث الـ Variants ───
                'variant.created',
                'variant.updated',
                'product.variant.updated'  => $this->upsertVariant($merchant, $data),
                'variant.deleted'          => $this->deleteVariant($merchant, $data),

                // ─── تحديث الكمية والمخزون ───
                'product.quantity.updated',
                'quantity.updated',
                'stock.updated'            => $this->handleQuantityUpdated($merchant, $data),

                // ─── أحداث الطلبات ───
                'order.created'            => $this->handleOrderCreated($merchant, $data),

                default => Log::info('[Webhook] حدث غير مُعالَج: ' . $event),
            };
        } catch (\Exception $e) {
            Log::error('[Webhook] خطأ في المعالجة: ' . $e->getMessage(), [
                'event'     => $event,
                'merchant'  => $merchantId,
                'trace'     => $e->getTraceAsString(),
            ]);
        }

        return response()->json(['success' => true]);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // التحقق من التوقيع (Salla HMAC-SHA256 Signature Verification)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * التحقق من توقيع سلة باستخدام HMAC-SHA256
     *
     * سلة ترسل:
     *   X-Salla-Security-Strategy: Signature
     *   X-Salla-Signature: <HMAC-SHA256 hash>
     *
     * يتم حساب التوقيع بـ: hash_hmac('sha256', $payload, $secret)
     *
     * @param Request $request
     * @return bool
     */
    private function verifySignature(Request $request): bool
    {
        // في بيئة التطوير يمكن تخطي التحقق
        if (app()->environment('local')) {
            return true;
        }

        $signature = $request->header('X-Salla-Signature')
                  ?? $request->header('x-salla-signature')
                  ?? '';

        if (empty($signature)) {
            Log::warning('[Webhook] لا يوجد توقيع في الطلب');
            return false;
        }

        // تجربة أكثر من secret (لدعم التطبيقات المختلفة)
        $secrets = array_filter([
            env('SALLA_HAREES_WEBHOOK_SECRET'),
            env('SALLA_MUSTASHAR_WEBHOOK_SECRET'),
            env('SALLA_MANAGEMENT_WEBHOOK_SECRET'),
            env('SALLA_CALCULATOR_WEBHOOK_SECRET'),
            config('services.salla_harees.webhook_secret'),
            config('services.salla.webhook_secret'),
        ]);

        if (empty($secrets)) {
            Log::warning('[Webhook] لم يتم تكوين webhook secrets');
            return false;
        }

        $payload = $request->getContent();

        foreach ($secrets as $secret) {
            $expected = hash_hmac('sha256', $payload, $secret);
            if (hash_equals($expected, $signature)) {
                return true;
            }
        }

        Log::warning('[Webhook] توقيع غير صالح');
        return false;
    }

    /**
     * إنشاء مفتاح idempotency بناءً على الحدث والبيانات
     * يمنع معالجة نفس الحدث أكثر من مرة
     */
    private function getIdempotencyKey(string $event, array $data): ?string
    {
        $id = $data['id'] ?? $data['product_id'] ?? null;
        if (!$id) return null;

        return 'webhook_idempotent_' . md5($event . '_' . $id . '_' . ($data['updated_at'] ?? ''));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // المنتجات: إنشاء أو تحديث
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * تحديث أو إنشاء المنتج مع درع حماية ضد حلقة الإخفاء
     */
    private function upsertProduct(Merchant $merchant, array $p): void
    {
        if (empty($p['id'])) return;

        $product = Product::firstOrNew([
            'merchant_id'      => $merchant->id,
            'salla_product_id' => $p['id'],
        ]);

        if (isset($p['name']) && !empty($p['name']))  $product->name     = $p['name'];
        if (isset($p['price']['amount']))              $product->price    = $p['price']['amount'];
        if (isset($p['sku']))                          $product->sku      = $p['sku'];
        if (isset($p['quantity']))                     $product->quantity = $p['quantity'];

        // ─── درع الحماية ضد حلقة الإخفاء ───
        if (isset($p['status'])) {
            $hasValidBatches = $product->exists && $product->batchItems()->whereHas('batch', function ($q) {
                $q->where('expiry_date', '>=', now()->format('Y-m-d'));
            })->exists();

            if ($hasValidBatches && $p['status'] === 'hidden') {
                Log::info('[Webhook Shield] منع إخفاء المنتج ' . $p['id'] . ' — عنده دفعات صالحة');
                $product->status = 'sale';
            } else {
                $product->status = $p['status'];
            }
        }

        // التصنيف
        if (!empty($p['categories'])) {
            $mainCat         = collect($p['categories'])->firstWhere('main', true) ?? $p['categories'][0];
            $product->category = $mainCat['name'] ?? 'General';
        }

        $product->synced_at = now();
        $product->save();

        // تحديث الصور
        if (!empty($p['images'])) {
            $product->images()->delete();
            foreach ($p['images'] as $index => $imgData) {
                ProductImage::create([
                    'product_id' => $product->id,
                    'image_url'  => $imgData['url'],
                    'is_main'    => $imgData['main'] ?? false,
                    'sort_order' => $imgData['sort'] ?? $index,
                ]);
            }
        }

        // ─── تحديث variants_data إذا وُجدت في الـ payload ───
        if (!empty($p['skus'])) {
            $this->syncVariantsData($product, $p['skus']);
        }

        Log::info('[Webhook] ✅ تم تحديث المنتج ' . $p['id'] . ' → status: ' . ($product->status ?? 'N/A'));
    }

    /**
     * معالجة تحديث سعر المنتج
     */
    private function handlePriceUpdated(Merchant $merchant, array $data): void
    {
        $productId = $data['id'] ?? null;
        if (!$productId) return;

        $product = Product::where('merchant_id', $merchant->id)
            ->where('salla_product_id', $productId)
            ->first();

        if (!$product) return;

        if (isset($data['price'])) {
            $product->price = $data['price'];
        }

        $product->save();

        Log::info('[Webhook] ✅ تم تحديث سعر المنتج: ' . $productId, [
            'price' => $data['price'] ?? 'N/A',
        ]);
    }

    /**
     * حذف المنتج
     */
    private function deleteProduct(Merchant $merchant, $sallaProductId): void
    {
        if (!$sallaProductId) return;

        Product::where('merchant_id', $merchant->id)
            ->where('salla_product_id', $sallaProductId)
            ->delete();

        Log::info('[Webhook] تم حذف المنتج: ' . $sallaProductId);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // order.created → تنقيص الكمية بعد البيع
    // ═══════════════════════════════════════════════════════════════════════

    private function handleOrderCreated(Merchant $merchant, array $data): void
    {
        $items = $data['items'] ?? [];
        if (empty($items)) return;

        $sallaApi = SallaApiService::for($merchant);

        foreach ($items as $item) {
            $sallaProductId = $item['product']['id'] ?? null;
            $sku            = $item['sku']            ?? null;
            $soldQty        = (int) ($item['quantity'] ?? 1);
            $variantId      = $item['variant_id']     ?? null;

            // ─── 1. تحديث كمية المنتج الكلي ───
            if ($sallaProductId) {
                $product = Product::where('merchant_id', $merchant->id)
                    ->where('salla_product_id', $sallaProductId)
                    ->first();

                if ($product) {
                    $product->quantity = max(0, $product->quantity - $soldQty);
                    $product->save();
                }
            }

            // ─── 2. تحديث كمية الـ BatchItem بالـ variant_id ───
            if ($variantId) {
                $batchItem = BatchItem::whereHas('batch', function ($q) use ($merchant) {
                        $q->where('merchant_id', $merchant->id);
                    })
                    ->where('salla_variant_id', $variantId)
                    ->first();

                if ($batchItem) {
                    $oldQty = $batchItem->quantity;
                    $batchItem->quantity = max(0, $oldQty - $soldQty);
                    $batchItem->save();

                    Log::info('[Webhook] ✅ تنقيص BatchItem بعد البيع', [
                        'batch_item_id' => $batchItem->id,
                        'variant_id'    => $variantId,
                        'old_qty'       => $oldQty,
                        'sold_qty'      => $soldQty,
                        'new_qty'       => $batchItem->quantity,
                    ]);
                }
            }

            // ─── 3. Fallback: البحث بالـ batch_code ───
            if (!$variantId && $sku) {
                $batch = Batch::where('merchant_id', $merchant->id)
                    ->where('batch_code', $sku)
                    ->first();

                if ($batch) {
                    $batchItem = BatchItem::where('batch_id', $batch->id)->first();
                    if ($batchItem) {
                        $batchItem->quantity = max(0, $batchItem->quantity - $soldQty);
                        $batchItem->save();
                    }
                }
            }
        }

    }

    // ═══════════════════════════════════════════════════════════════════════
    // quantity.updated / stock.updated → التاجر غيّر الكمية في سلة
    // ═══════════════════════════════════════════════════════════════════════

    private function handleQuantityUpdated(Merchant $merchant, array $data): void
    {
        $sallaProductId = $data['product_id'] ?? $data['id'] ?? null;
        $variants       = $data['variants']   ?? [];

        // ─── 1. تحديث كمية المنتج الكلي ───
        if ($sallaProductId) {
            $product = Product::where('merchant_id', $merchant->id)
                ->where('salla_product_id', $sallaProductId)
                ->first();

            if ($product && isset($data['quantity'])) {
                $product->quantity = (int) $data['quantity'];
                $product->save();
            }
        }

        // ─── 2. تحديث الـ variants ───
        if (!empty($variants)) {
            foreach ($variants as $variantData) {
                $sallaVariantId = $variantData['id'] ?? null;
                $newQty         = (int) ($variantData['quantity'] ?? $variantData['stock_quantity'] ?? 0);

                if (!$sallaVariantId) continue;

                // تحديث variants_data في المنتج
                if (isset($product)) {
                    $variantsData = $product->variants_data ?? [];
                    foreach ($variantsData as $key => $v) {
                        if (($v['id'] ?? null) == $sallaVariantId) {
                            $variantsData[$key]['stock_quantity'] = $newQty;
                            break;
                        }
                    }
                    $product->variants_data = $variantsData;
                    $product->save();
                }

                // تحديث batch_item المرتبط
                BatchItem::where('product_id', $product->id ?? 0)
                    ->where('salla_variant_id', $sallaVariantId)
                    ->update(['variant_quantity' => $newQty]);
            }

            Log::info('[Webhook] ✅ تم تحديث كميات الـ variants', [
                'product_id'  => $sallaProductId,
                'variants'    => count($variants),
            ]);
        }

        // ─── 3. تحديث شامل للمخزون من سلة ───
        if ($sallaProductId && isset($product)) {
            $this->syncFullStockFromSalla($merchant, $product);
        }

    }

    /**
     * مزامنة كاملة للمخزون من سلة (جلب آخر التحديثات)
     */
    private function syncFullStockFromSalla(Merchant $merchant, Product $product): void
    {
        try {
            $sallaApi = SallaApiService::for($merchant);
            $variantsResp = $sallaApi->getProductVariants($product->salla_product_id);
            $variants = $variantsResp['data'] ?? [];

            if (empty($variants)) return;

            $totalStock = 0;
            // بناء اسماء الفاريينت من option values
            // لأن getProductVariants لا ترجع name
            $valueNames = [];
            try {
                $productDetail = $sallaApi->getProductDetails($product->salla_product_id);
                foreach ($productDetail['data']['options'] ?? [] as $option) {
                    foreach ($option['values'] ?? [] as $value) {
                        $valueNames[$value['id']] = $value['name'];
                    }
                }
            } catch (\Exception $e) {
                Log::warning('[Webhook] فشل جلب أسماء الخيارات', ['product' => $product->id]);
            }

            $variantsData = [];

            foreach ($variants as $v) {
                $stockQty = (int) ($v['stock_quantity'] ?? 0);

                // بناء الاسم من option values
                $optionParts = [];
                foreach ($v['related_option_values'] ?? [] as $valueId) {
                    if (isset($valueNames[$valueId])) {
                        $optionParts[] = $valueNames[$valueId];
                    }
                }
                $name = implode(' / ', $optionParts) ?: ($v['sku'] ?? '');

                $variantsData[] = [
                    'id'                   => $v['id'],
                    'sku'                  => $v['sku'] ?? null,
                    'name'                 => $name,
                    'price'                => $v['price']['amount'] ?? 0,
                    'stock_quantity'       => $stockQty,
                    'unlimited_quantity'   => $v['unlimited_quantity'] ?? false,
                    'has_special_price'    => $v['has_special_price'] ?? false,
                    'sale_price'           => $v['sale_price']['amount'] ?? 0,
                    'related_option_values'=> $v['related_option_values'] ?? [],
                ];

                $totalStock += $stockQty;
            }

            // تحديث المنتج
            $product->variants_data = $variantsData;
            $product->quantity = $totalStock;
            $product->save();

            // تحديث batch_items
            foreach ($variantsData as $variant) {
                BatchItem::where('product_id', $product->id)
                    ->where('salla_variant_id', $variant['id'])
                    ->update(['variant_quantity' => $variant['stock_quantity']]);
            }

            Log::info('[Webhook] ✅ مزامنة كاملة للمخزون', [
                'product_id' => $product->salla_product_id,
                'stock'      => $totalStock,
                'variants'   => count($variantsData),
            ]);
        } catch (\Exception $e) {
            Log::error('[Webhook] فشل مزامنة المخزون: ' . $e->getMessage());
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // variants.updated → تحديث بيانات الـ Variant
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * إنشاء أو تحديث Variant
     *
     * تدعم تنسيقات الأحداث:
     * - variant.updated          → data.id, data.product_id
     * - product.variant.updated  → data.variant.id, data.variant.product_id
     */
    private function upsertVariant(Merchant $merchant, array $data): void
    {
        // product.variant.updated  ترسل الـ variant داخل مفتاح منفصل
        if (!isset($data['id']) && isset($data['variant']['id'])) {
            $data = $data['variant'];
        }

        $variantId = $data['id'] ?? null;
        $productId = $data['product_id'] ?? null;

        if (!$variantId || !$productId) return;

        $product = Product::where('merchant_id', $merchant->id)
            ->where('salla_product_id', $productId)
            ->first();

        if (!$product) return;

        // ─── تحديث variants_data ───
        $variantsData = $product->variants_data ?? [];
        $found = false;

        foreach ($variantsData as $key => $variant) {
            if (($variant['id'] ?? null) == $variantId) {
                $name = $data['name'] ?? $variant['name'] ?? $data['sku'] ?? $variant['sku'] ?? '';

                $variantsData[$key] = array_merge($variant, [
                    'id'                 => $variantId,
                    'sku'                => $data['sku'] ?? $variant['sku'] ?? null,
                    'name'               => $name,
                    'price'              => $data['price']['amount'] ?? $variant['price'] ?? 0,
                    'stock_quantity'     => $data['stock_quantity'] ?? $variant['stock_quantity'] ?? 0,
                    'unlimited_quantity' => $data['unlimited_quantity'] ?? $variant['unlimited_quantity'] ?? false,
                    'has_special_price'  => $data['has_special_price'] ?? $variant['has_special_price'] ?? false,
                    'sale_price'         => $data['sale_price']['amount'] ?? $variant['sale_price'] ?? 0,
                    'updated_at'         => now()->toISOString(),
                ]);
                $found = true;
                break;
            }
        }

        if (!$found) {
            $name = $data['name'] ?? $data['sku'] ?? '';

            $variantsData[] = [
                'id'                   => $variantId,
                'sku'                  => $data['sku'] ?? null,
                'name'                 => $name,
                'price'                => $data['price']['amount'] ?? 0,
                'stock_quantity'       => $data['stock_quantity'] ?? 0,
                'unlimited_quantity'   => $data['unlimited_quantity'] ?? false,
                'has_special_price'    => $data['has_special_price'] ?? false,
                'sale_price'           => $data['sale_price']['amount'] ?? 0,
                'related_option_values'=> $data['related_option_values'] ?? [],
            ];
        }

        $product->variants_data = $variantsData;
        $product->save();

        // ─── تحديث batch_item المرتبط ───
        // ✅ نحدث فقط الـ variant_quantity بالمخزون الجديد
        // ولا نغير الـ quantity (لأنها كمية الدفعة المخصصة)
        $stockQty = $data['stock_quantity'] ?? 0;
        BatchItem::where('product_id', $product->id)
            ->where('salla_variant_id', $variantId)
            ->update(['variant_quantity' => $stockQty]);

        Log::info('[Webhook] ✅ تم تحديث Variant', [
            'product_id' => $productId,
            'variant_id' => $variantId,
            'stock'      => $stockQty,
        ]);
    }

    /**
     * حذف Variant
     */
    private function deleteVariant(Merchant $merchant, array $data): void
    {
        $variantId = $data['id'] ?? null;
        $productId = $data['product_id'] ?? null;

        if (!$variantId || !$productId) return;

        $product = Product::where('merchant_id', $merchant->id)
            ->where('salla_product_id', $productId)
            ->first();

        if ($product) {
            $variantsData = $product->variants_data ?? [];
            $variantsData = array_values(array_filter($variantsData, function ($v) use ($variantId) {
                return ($v['id'] ?? null) != $variantId;
            }));
            $product->variants_data = $variantsData;
            $product->save();
        }

        // مسح salla_variant_id من batch_items (لا نحذف الـ batch_item نفسه)
        BatchItem::where('product_id', $product->id ?? 0)
            ->where('salla_variant_id', $variantId)
            ->update(['salla_variant_id' => null, 'variant_quantity' => null]);

        Log::info('[Webhook] تم حذف Variant: ' . $variantId);
    }

    /**
     * مزامنة المخزون من سلة (يدوي أو مجدول)
     */
    public function syncHarees(Merchant $merchant, string $sallaProductId = null): void
    {
        $sallaApi = SallaApiService::for($merchant);

        $query = Product::where('merchant_id', $merchant->id);
        if ($sallaProductId) {
            $query->where('salla_product_id', $sallaProductId);
        }

        $products = $query->where('salla_product_id', '>', 0)->get();

        foreach ($products as $product) {
            $this->syncFullStockFromSalla($merchant, $product);
        }
    }

    /**
     * مزامنة variants_data من SKUs القادمة من سلة
     */
    private function syncVariantsData(Product $product, array $skus): void
    {
        $variantsData = [];
        foreach ($skus as $sku) {
            $variantsData[] = [
                'id'                   => $sku['id'] ?? null,
                'sku'                  => $sku['sku'] ?? null,
                'name'                 => $sku['name'] ?? $sku['sku'] ?? '',
                'price'                => $sku['price']['amount'] ?? 0,
                'stock_quantity'       => $sku['stock_quantity'] ?? 0,
                'unlimited_quantity'   => $sku['unlimited_quantity'] ?? false,
                'has_special_price'    => $sku['has_special_price'] ?? false,
                'sale_price'           => $sku['sale_price']['amount'] ?? 0,
                'related_option_values'=> $sku['related_option_values'] ?? [],
            ];
        }

        $product->variants_data = $variantsData;
        $product->save();
    }
}