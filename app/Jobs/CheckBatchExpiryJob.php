<?php

namespace App\Jobs;

use App\Models\Batch;
use App\Models\Merchant;
use App\Models\Product;
use App\Services\SallaApiService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CheckBatchExpiryJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        Log::info('[Harees Engine] 🚀 تشغيل المزامنة النهائية والمضمونة');

        Merchant::all()->each(function ($merchant) {
            Log::info('[Merchant] معالجة تاجر: ' . ($merchant->name ?? $merchant->id));

            $sallaApi = SallaApiService::for($merchant);
            $batches  = Batch::where('merchant_id', $merchant->id)
                ->whereNotNull('expiry_date')
                ->get();

            Log::info('[Merchant] عدد Batches: ' . $batches->count());

            foreach ($batches as $batch) {
                $batch->calculateStatus();
                $batch->save();

                Log::info('[Batch] تحديث حالة', [
                    'batch_id' => $batch->id,
                    'status'   => $batch->status,
                    'days'     => now()->diffInDays($batch->expiry_date, false),
                ]);

                // الباتشات الحمراء: تصفير الكمية فقط إن كان Variant موجوداً، لا ننشئ جديداً
                if ($batch->status === 'red') {
                    if ($batch->salla_variant_id) {
                        Log::info('[Batch] باتش أحمر — تصفير الكمية', ['batch_id' => $batch->id]);
                        $this->zeroOutVariant($sallaApi, $batch);
                    }
                    continue;
                }

                // الباتشات الخضراء والصفراء → مزامنة كاملة
                $product     = $batch->products()->first();
                $variantName = ($batch->batch_code ?? 'Batch') . ' - ' . $batch->expiry_date->format('Y-m-d');

                Log::info('[Batch] معالجة Batch', [
                    'batch_id'     => $batch->id,
                    'product'      => $product?->name ?? 'N/A',
                    'variant_name' => $variantName,
                    'status'       => $batch->status,
                ]);

                $this->syncBatchProcess($sallaApi, $batch);
            }

            $this->reconcileVisibility($sallaApi, $merchant);
        });
    }

    // =========================================================
    // إنشاء أو تحديث الـ Variant للباتشات الخضراء/الصفراء
    // =========================================================

    private function syncBatchProcess(SallaApiService $sallaApi, Batch $batch): void
    {
        $product = $batch->products()->first();
        if (!$product) {
            Log::warning('[Batch Sync] لا يوجد منتج مرتبط بالدفعة', ['batch_id' => $batch->id]);
            return;
        }

        if (!$batch->salla_variant_id) {
            $variantName = ($batch->batch_code ?? 'Batch') . ' - ' . $batch->expiry_date->format('Y-m-d');
            Log::info('[Batch Sync] Variant غير موجود، سيتم إنشاؤه', [
                'product_id' => $product->salla_product_id,
                'batch_name' => $variantName,
            ]);
            $this->createVariantForBatch($sallaApi, $batch, $product, $variantName);
        } else {
            Log::info('[Batch Sync] Variant موجود، تحديث الكمية والسعر', [
                'variant_id' => $batch->salla_variant_id,
            ]);
            $this->updateVariantStock($sallaApi, $batch);
        }
    }

    private function createVariantForBatch(
        SallaApiService $sallaApi,
        Batch $batch,
        $product,
        string $variantName
    ): void {
        $details = $sallaApi->getProductDetails($product->salla_product_id);
        $options = $details['data']['options'] ?? [];

        // ✅ نبحث دائماً بالاسم الموحَّد من الـ Constant
        $targetOption = null;
        foreach ($options as $opt) {
            if (trim($opt['name']) === SallaApiService::BATCH_OPTION_NAME) {
                $targetOption = $opt;
                break;
            }
        }

        $variantId = null;
        $res       = null;

        if (!$targetOption) {
            // إنشاء خيار جديد مع أول قيمة
            Log::info('[Batch Sync] إنشاء خيار جديد "' . SallaApiService::BATCH_OPTION_NAME . '"', [
                'product_id' => $product->salla_product_id,
            ]);
            $res = $sallaApi->createProductOption(
                $product->salla_product_id,
                SallaApiService::BATCH_OPTION_NAME,
                $variantName
            );
            // سلة ترجع data.skus[0].id بعد إنشاء الخيار
            $variantId = $res['data']['skus'][0]['id']
                      ?? $res['data'][0]['skus'][0]['id']
                      ?? null;
        } else {
            // إضافة قيمة لخيار موجود
            Log::info('[Batch Sync] إضافة قيمة لخيار موجود', [
                'option_id' => $targetOption['id'],
            ]);
            $res = $sallaApi->addValueToOption($targetOption['id'], $variantName);
            $variantId = $res['data']['skus'][0]['id']
                      ?? $res['data']['variant_id']
                      ?? null;
        }

        if ($variantId) {
            $batch->update(['salla_variant_id' => $variantId]);
            Log::info('[Batch Sync] ✅ تم حفظ variant_id', ['variant_id' => $variantId]);
            // نحدّث السعر والكمية بعد الإنشاء (سلة لا تقبلهم وقت الإنشاء)
            $this->updateVariantStock($sallaApi, $batch);
        } else {
            Log::error('[Batch Sync] ❌ لم يُعثر على variant_id', [
                'batch_id' => $batch->id,
                'response' => $res,
            ]);
        }
    }

    // =========================================================
    // تحديث الكمية والسعر حسب الحالة
    // =========================================================

    private function updateVariantStock(SallaApiService $sallaApi, Batch $batch): void
    {
        $payload = [
            'sku'            => $batch->batch_code ?? 'B-' . $batch->id,
            'stock_quantity' => $batch->quantity,
            // خصم 30% للصفراء فقط — 0 يعني لا يوجد سعر مخفض في سلة
            'sale_price'     => ($batch->status === 'yellow')
                                    ? round($batch->price * 0.7, 2)
                                    : 0,
        ];

        Log::info('[Batch Sync] تحديث stock/price للـ Variant', [
            'variant_id' => $batch->salla_variant_id,
            'payload'    => $payload,
        ]);

        $sallaApi->updateBatchVariant($batch->salla_variant_id, $payload);
    }

    private function zeroOutVariant(SallaApiService $sallaApi, Batch $batch): void
    {
        $sallaApi->updateBatchVariant($batch->salla_variant_id, [
            'sku'            => $batch->batch_code ?? 'B-' . $batch->id,
            'stock_quantity' => 0,
            'sale_price'     => 0,
        ]);
    }

    // =========================================================
    // مزامنة ظهور/إخفاء المنتج
    //
    // القواعد:
    //   - منتج بدون باتشات مسجّلة        → لا نلمسه (يديره التاجر يدوياً)
    //   - كل باتشاته حمراء                → hidden
    //   - فيه باتش أخضر أو أصفر واحد على الأقل → sale
    // =========================================================

    private function reconcileVisibility(SallaApiService $sallaApi, Merchant $merchant): void
    {
        $products = Product::where('merchant_id', $merchant->id)
            ->whereHas('batches')
            ->get();

        foreach ($products as $product) {
            $batches = $product->batches;

            $hasActiveBatch = $batches->contains(
                fn($b) => in_array($b->status, ['green', 'yellow'])
            );

            $newStatus = $hasActiveBatch ? 'sale' : 'hidden';

            Log::info('[Visibility] تحديث حالة المنتج', [
                'product_id' => $product->salla_product_id,
                'status'     => $newStatus,
            ]);

            // ✅ يستخدم المسار الصحيح: POST /products/{id}/status
            $sallaApi->updateProductStatusOnly($product->salla_product_id, $newStatus);
        }
    }
}