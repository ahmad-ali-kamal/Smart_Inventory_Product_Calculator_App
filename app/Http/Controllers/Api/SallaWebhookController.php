<?php

/**
 * ====================================================================
 * SallaWebhookController — الموحَّد
 * ====================================================================
 *
 * دمج ثلاثة ملفات كانت موجودة:
 *  1. App\Http\Controllers\Api\SallaWebhookController   (منتجات + صور)
 *  2. App\Http\Controllers\SallaWebhookController       (orders + حماية الحالة)
 *  3. الملف الجديد                                      (Batch/Variant sync)
 *
 * المسار النهائي: App\Http\Controllers\Api\SallaWebhookController
 *
 * في routes/api.php:
 *   Route::post('/webhooks/salla', [\App\Http\Controllers\Api\SallaWebhookController::class, 'handle']);
 *
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
use Illuminate\Support\Facades\Log;

class SallaWebhookController extends Controller
{
/**
     * نقطة الدخول الموحَّدة لكل أحداث سلة
     */
    public function handle(Request $request)
    {
        // ─── استخراج الحدث من سلة ───
        // سلة ترسل الحدث في الهيدر أو في الـ body
        $event = $request->header('Salla-Event')
                ?? $request->header('x-salla-event')
                ?? $request->header('X-Salla-Event')
                ?? $request->input('event')
                ?? $request->input('type')
                ?? 'unknown';

        // ─── استخراج البيانات من الـ body ───
        $body = $request->all();
        
        // ─── استخراج merchant_id من عدة مصادر ───
        $merchantId = $body['merchant_id']
                    ?? $body['merchant']
                    ?? $request->input('merchant_id')
                    ?? $request->input('merchant');

        // ─── استخراج data (سلة ترسل في data أو مباشرة في body) ───
        $data = $body['data'] ?? $body;

        Log::info('[Webhook] حدث من سلة', [
            'event'        => $event,
            'merchant_id'  => $merchantId,
            'body_keys'    => array_keys($body),
        ]);

        // ─── إذا لم يتم العثور على merchant_id ───
        if (!$merchantId) {
            Log::warning('[Webhook] لم يتم العثور على merchant_id - يتم التجاوز');
            // نرجع 200 حتى لا تعيد سلة الإرسال
            return response()->json(['success' => true, 'note' => 'merchant not found']);
        }

        // ─── التحقق من التوكن ───
        $token = $request->bearerToken() ?? '';
        
        // ─── إذا لم يتم التحقق من التوكن، نتجاوز التحقق في بيئة التطوير ───
        if (!app()->environment('local') && !$this->isTokenValid($token)) {
            Log::error('[Webhook] توكن غير صالح للتاجر: ' . $merchantId);
            return response()->json(['message' => 'Unauthorized Token'], 401);
        }

        $merchant = Merchant::where('salla_merchant_id', $merchantId)->first();
        if (!$merchant) {
            Log::error('[Webhook] تاجر غير موجود: ' . $merchantId);
            return response()->json(['success' => true, 'note' => 'merchant not found']);
        }

        try {
            Log::info('[Webhook] معالجة الحدث: ' . $event);

            match ($event) {
                // ─── أحداث المنتجات ───────────────────────────────────
                'product.created',
                'product.updated'          => $this->upsertProduct($merchant, $data),

                'product.deleted'          => $this->deleteProduct($merchant, $data['id'] ?? null),

                'product.status.updated',
                'product.available'        => $this->upsertProduct($merchant, $data),

                // ─── أحداث الـ Variants ────────────────────────────────
                'variant.created',
                'variant.updated'          => $this->upsertVariant($merchant, $data),
                'variant.deleted'          => $this->deleteVariant($merchant, $data),

                // ─── تحديث الكمية من التاجر ───────────────────────────
                'product.quantity.updated',
                'quantity.updated',
                'stock.updated'            => $this->handleQuantityUpdated($merchant, $data),

                // ─── أحداث الطلبات ────────────────────────────────────
                'order.created'            => $this->handleOrderCreated($merchant, $data),

                // ─── أحداث أخرى غير مدعومة ────────────────────────────
                default => Log::info('[Webhook] حدث غير مُعالَج: ' . $event),
            };
        } catch (\Exception $e) {
            Log::error('[Webhook] خطأ: ' . $e->getMessage(), [
                'event'    => $event,
                'merchant' => $merchantId,
            ]);
        }

return response()->json(['success' => true]);
    }

    // =========================================================
    // المنتجات: إنشاء أو تحديث
    // =========================================================

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

        // تحديث جراحي — فقط الحقول الموجودة في الـ payload
        if (isset($p['name']) && !empty($p['name']))  $product->name     = $p['name'];
        if (isset($p['price']['amount']))              $product->price    = $p['price']['amount'];
        if (isset($p['sku']))                          $product->sku      = $p['sku'];
        if (isset($p['quantity']))                     $product->quantity = $p['quantity'];

        // ─── درع الحماية ضد حلقة الإخفاء ───────────────────────
        // إذا سلة حاولت تخفي المنتج وعندنا دفعات صالحة → نجبرها ترجع sale
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

        // تحديث الصور إذا أرسلت سلة صور جديدة
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

        Log::info('[Webhook] ✅ تم تحديث المنتج ' . $p['id'] . ' → status: ' . ($product->status ?? 'N/A'));
    }

    /**
     * حذف المنتج من قاعدة بياناتنا عند حذفه من سلة
     */
    private function deleteProduct(Merchant $merchant, $sallaProductId): void
    {
        if (!$sallaProductId) return;

        Product::where('merchant_id', $merchant->id)
            ->where('salla_product_id', $sallaProductId)
            ->delete();

        Log::info('[Webhook] تم حذف المنتج: ' . $sallaProductId);
    }

    // =========================================================
    // order.created → تنقيص الكمية بعد البيع
    //
    // بيانات الطلب من سلة:
    //   data.items[].product.id   — معرف المنتج في سلة
    //   data.items[].sku          — SKU المنتج أو الـ Variant
    //   data.items[].quantity     — الكمية المشتراة
    // =========================================================

    private function handleOrderCreated(Merchant $merchant, array $data): void
    {
        $items = $data['items'] ?? [];
        if (empty($items)) return;

        $sallaApi = SallaApiService::for($merchant);

        foreach ($items as $item) {
            $sallaProductId = $item['product']['id'] ?? null;
            $sku            = $item['sku']            ?? null;
            $soldQty        = (int) ($item['quantity'] ?? 1);

            // ─── 1. تحديث كمية المنتج الكلي ──────────────────────
            if ($sallaProductId) {
                $product = Product::where('merchant_id', $merchant->id)
                    ->where('salla_product_id', $sallaProductId)
                    ->first();

                if ($product) {
                    $product->quantity = max(0, $product->quantity - $soldQty);
                    $product->save();
                    Log::info('[Webhook] تنقيص كمية المنتج', [
                        'product_id' => $product->id,
                        'sold'       => $soldQty,
                        'remaining'  => $product->quantity,
                    ]);
                }
            }

            // ─── 2. تحديث كمية الـ Batch/Variant المحدد ──────────
            if (!$sku) continue;

            // نبحث بالـ SKU (batch_code) أو salla_variant_id
            $batch = Batch::where('merchant_id', $merchant->id)
                ->where(function ($q) use ($sku) {
                    $q->where('batch_code', $sku)
                      ->orWhere('salla_variant_id', $sku);
                })
                ->first();

            if (!$batch) {
                Log::info('[Webhook] لم يُعثر على Batch للـ SKU: ' . $sku);
                continue;
            }

            // تحديث كمية BatchItem
            $batchItem = BatchItem::where('batch_id', $batch->id)->first();
            if ($batchItem) {
                $oldQty            = $batchItem->quantity;
                $newQty            = max(0, $oldQty - $soldQty);
                $batchItem->quantity = $newQty;
                $batchItem->save();

                Log::info('[Webhook] ✅ تنقيص كمية الـ Batch بعد البيع', [
                    'batch_id'   => $batch->id,
                    'batch_code' => $batch->batch_code,
                    'old_qty'    => $oldQty,
                    'sold_qty'   => $soldQty,
                    'new_qty'    => $newQty,
                ]);

                // مزامنة الـ Variant في سلة
                if ($batch->salla_variant_id) {
                    $sallaApi->decrementVariantQuantity(
                        $batch->salla_variant_id,
                        $soldQty,
                        $oldQty
                    );
                }

                // إعادة حساب حالة الباتش إذا وصلت الكمية صفر
                if ($newQty === 0) {
                    $batch->calculateStatus();
                    $batch->save();
                    Log::info('[Webhook] الكمية وصلت صفر', [
                        'batch_id' => $batch->id,
                        'status'   => $batch->status,
                    ]);
                }
            }
        }
    }

    // =========================================================
    // product.quantity.updated → التاجر غيّر الكمية في سلة
    //
    // بيانات الحدث:
    //   data.product.id             — معرف المنتج
    //   data.variants[].id          — معرف الـ Variant
    //   data.variants[].quantity    — الكمية الجديدة
    //   data.variants[].sku         — SKU
    // =========================================================

    private function handleQuantityUpdated(Merchant $merchant, array $data): void
    {
        $variants = $data['variants'] ?? [];
        if (empty($variants)) return;

        foreach ($variants as $variantData) {
            $sallaVariantId = (string) ($variantData['id']       ?? '');
            $newQty         = (int)    ($variantData['quantity'] ?? 0);
            $sku            = $variantData['sku'] ?? null;

            // نبحث عن الـ Batch المرتبط
            $batch = Batch::where('merchant_id', $merchant->id)
                ->where(function ($q) use ($sallaVariantId, $sku) {
                    $q->where('salla_variant_id', $sallaVariantId);
                    if ($sku) {
                        $q->orWhere('batch_code', $sku);
                    }
                })
                ->first();

            if (!$batch) {
                Log::info('[Webhook] لم يُعثر على Batch للـ Variant: ' . $sallaVariantId);
                continue;
            }

            // تحديث كمية BatchItem
            $batchItem = BatchItem::where('batch_id', $batch->id)->first();
            if ($batchItem) {
                $oldQty            = $batchItem->quantity;
                $batchItem->quantity = $newQty;
                $batchItem->save();
            }

            // إعادة حساب حالة الباتش
            $batch->calculateStatus();
            $batch->save();

            Log::info('[Webhook] ✅ تحديث كمية الـ Batch بعد تعديل التاجر', [
                'batch_id'         => $batch->id,
                'salla_variant_id' => $sallaVariantId,
                'old_qty'          => $oldQty ?? '—',
                'new_qty'          => $newQty,
                'new_status'       => $batch->status,
            ]);

            // لا نُرسل لسلة هنا — التعديل جاء منها أصلاً
        }
    }

    // =========================================================
    // التحقق من التوكن
    // =========================================================

    private function isTokenValid(string $token): bool
    {
        if (empty($token)) return false;

        return in_array($token, array_filter([
            env('SALLA_MANAGEMENT_WEBHOOK_SECRET'),
            env('SALLA_CALCULATOR_WEBHOOK_SECRET'),
        ]));
    }

    // =========================================================
    // variants.updated → تحديث بيانات الـ Variant (سعر، مخزون، خصم)
    // =========================================================

    /**
     * إنشاء أو تحديث Variant
     */
    private function upsertVariant(Merchant $merchant, array $data): void
    {
        $variantId = $data['id'] ?? null;
        $productId = $data['product_id'] ?? null;

        if (!$variantId || !$productId) return;

        // ─── جلب أو إنشاء المنتج ───
        $product = Product::where('merchant_id', $merchant->id)
            ->where('salla_product_id', $productId)
            ->first();

        if (!$product) return;

        // ─── تحديث variants_data في المنتج ───
        $variantsData = $product->variants_data ?? [];

        // البحث عن الـ variant الموجود
        $found = false;
        foreach ($variantsData as $key => $variant) {
            if ($variant['id'] == $variantId) {
                // تحديث بيانات الـ variant
                $variantsData[$key] = array_merge($variant, [
                    'id'              => $variantId,
                    'sku'             => $data['sku'] ?? $variant['sku'] ?? null,
                    'name'            => $data['name'] ?? $variant['name'] ?? 'Variant ' . $variantId,
                    'price'           => $data['price']['amount'] ?? $variant['price'] ?? 0,
                    'stock_quantity'  => $data['stock_quantity'] ?? $variant['stock_quantity'] ?? 0,
                    'unlimited_quantity' => $data['unlimited_quantity'] ?? false,
                    'has_special_price' => $data['has_special_price'] ?? false,
                    'sale_price'      => $data['sale_price']['amount'] ?? $variant['sale_price'] ?? 0,
                    'updated_at'      => now()->toISOString(),
                ]);
                $found = true;
                break;
            }
        }

        // إضافة variant جديد إذا لم يكن موجوداً
        if (!$found) {
            $variantsData[] = [
                'id'                   => $variantId,
                'sku'                  => $data['sku'] ?? null,
                'name'                 => $data['name'] ?? 'Variant ' . $variantId,
                'price'                => $data['price']['amount'] ?? 0,
                'stock_quantity'       => $data['stock_quantity'] ?? 0,
                'unlimited_quantity'   => $data['unlimited_quantity'] ?? false,
                'has_special_price'    => $data['has_special_price'] ?? false,
                'sale_price'           => $data['sale_price']['amount'] ?? 0,
                'related_option_values' => $data['related_option_values'] ?? [],
            ];
        }

        $product->variants_data = $variantsData;
        $product->save();

        // ─── تحديث batch_items المرتبطة ───
        BatchItem::where('product_id', $product->id)
            ->where('salla_variant_id', $variantId)
            ->update(['variant_quantity' => $data['stock_quantity'] ?? 0]);

        Log::info('[Webhook] ✅ تم تحديث Variant', [
            'product_id' => $productId,
            'variant_id' => $variantId,
            'price'      => $data['price']['amount'] ?? 0,
            'stock'      => $data['stock_quantity'] ?? 0,
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

        // ─── حذف من variants_data ───
        $product = Product::where('merchant_id', $merchant->id)
            ->where('salla_product_id', $productId)
            ->first();

        if ($product) {
            $variantsData = $product->variants_data ?? [];
            $variantsData = array_values(array_filter($variantsData, function ($v) use ($variantId) {
                return $v['id'] != $variantId;
            }));
            $product->variants_data = $variantsData;
            $product->save();
        }

        // ─── مسح salla_variant_id من batch_items ───
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

        // ─── مزامنة منتج واحد أو الكل ───
        $query = Product::where('merchant_id', $merchant->id);
        if ($sallaProductId) {
            $query->where('salla_product_id', $sallaProductId);
        }

        $products = $query->where('salla_product_id', '>', 0)->get();

        foreach ($products as $product) {
            try {
                // جلب الـ variants من سلة
                $variantsResp = $sallaApi->getProductVariants($product->salla_product_id);
                $variants = $variantsResp['data'] ?? [];

                if (empty($variants)) {
                    continue;
                }

                // ─── حساب إجمالي المخزون ───
                $totalStock = 0;
                $variantsData = [];

                foreach ($variants as $v) {
                    $stockQty = (int) ($v['stock_quantity'] ?? 0);

                    // جلب المخزون من branches_quantities
                    $branchesQty = $v['branches_quantities'] ?? [];
                    if (!empty($branchesQty)) {
                        foreach ($branchesQty as $branch) {
                            $stockQty = max($stockQty, (int) ($branch['quantity'] ?? 0));
                        }
                    }

                    $totalStock += $stockQty;

                    $variantsData[] = [
                        'id'                  => $v['id'],
                        'sku'                 => $v['sku'] ?? null,
                        'name'                => $v['name'] ?? 'Variant ' . $v['id'],
                        'price'               => $v['price']['amount'] ?? 0,
                        'stock_quantity'      => $stockQty,
                        'unlimited_quantity'  => $v['unlimited_quantity'] ?? false,
                        'has_special_price'   => $v['has_special_price'] ?? false,
                        'sale_price'          => $v['sale_price']['amount'] ?? 0,
                        'related_option_values' => $v['related_option_values'] ?? [],
                    ];
                }

                // ─── تحديث المنتج ───
                $product->variants_data = $variantsData;
                $product->quantity = $totalStock;
                $product->save();

                // ─── تحديث batch_items ───
                foreach ($variantsData as $variant) {
                    BatchItem::where('product_id', $product->id)
                        ->where('salla_variant_id', $variant['id'])
                        ->update(['variant_quantity' => $variant['stock_quantity']]);
                }

                Log::info('[Webhook] تم مزامنة المخزون للمنتج: ' . $product->name, [
                    'salla_product_id' => $product->salla_product_id,
                    'total_stock'     => $totalStock,
                    'variants_count'  => count($variantsData),
                ]);

            } catch (\Exception $e) {
                Log::error('[Webhook] خطأ في مزامنة المخزون: ' . $e->getMessage(), [
                    'product_id' => $product->id,
                ]);
            }
        }
    }
}