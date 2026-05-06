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
        // سلة ترسل الحدث في الهيدر أو في الـ body
        $event      = $request->header('Salla-Event')
                   ?? $request->header('x-salla-event')
                   ?? $request->input('event');

        $merchantId = $request->input('merchant');
        $payload    = $request->input('data', []);

        Log::info('[Webhook] حدث جديد من سلة', [
            'event'      => $event,
            'merchant'   => $merchantId,
        ]);

        if (!$merchantId) {
            return response()->json(['message' => 'Merchant ID missing'], 400);
        }

        // التحقق من التوكن
        $token = str_replace('Bearer ', '', $request->header('Authorization') ?? '');
        if (!$this->isTokenValid($token)) {
            Log::error('[Webhook] توكن غير صالح للتاجر: ' . $merchantId);
            return response()->json(['message' => 'Unauthorized Token'], 401);
        }

        $merchant = Merchant::where('salla_merchant_id', $merchantId)->first();
        if (!$merchant) {
            Log::error('[Webhook] تاجر غير موجود: ' . $merchantId);
            // نرجع 200 حتى لا تُعيد سلة الإرسال
            return response()->json(['success' => true, 'note' => 'merchant not found']);
        }

        try {
            match ($event) {
                // ─── أحداث المنتجات ───────────────────────────────────
                'product.created',
                'product.updated'          => $this->upsertProduct($merchant, $payload),

                'product.deleted'          => $this->deleteProduct($merchant, $payload['id'] ?? null),

                // product.status.updated و product.available موجودان لكن deprecated
                // نستخدم upsertProduct للتعامل معهما مع درع الحماية
                'product.status.updated',
                'product.available'        => $this->upsertProduct($merchant, $payload),

                // ─── تحديث الكمية من التاجر ───────────────────────────
                'product.quantity.updated' => $this->handleQuantityUpdated($merchant, $payload),

                // ─── أحداث الطلبات ────────────────────────────────────
                'order.created'            => $this->handleOrderCreated($merchant, $payload),

                // ─── أحداث أخرى غير مدعومة ────────────────────────────
                default => Log::info('[Webhook] حدث غير مُعالَج: ' . $event),
            };
        } catch (\Exception $e) {
            Log::error('[Webhook] خطأ: ' . $e->getMessage(), [
                'event'    => $event,
                'merchant' => $merchantId,
            ]);
            // نرجع 200 دائماً لسلة لكن نسجل الخطأ
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
}