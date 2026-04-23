<?php

namespace App\Jobs;

use App\Models\Batch;
use App\Models\Merchant;
use App\Models\Product;
use App\Services\BatchSyncService;
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
            Log::info("[Merchant] معالجة تاجر: " . ($merchant->name ?? $merchant->id));

            $sallaApi    = SallaApiService::for($merchant);
            $syncService = new BatchSyncService($sallaApi);

            // 1. معالجة الدفعات
            $batches = Batch::where('merchant_id', $merchant->id)
                ->whereNotNull('expiry_date')
                ->get();

            Log::info("[Merchant] عدد Batches: " . $batches->count());

            foreach ($batches as $batch) {
                // تحديث الحالة داخلياً أولاً
                $batch->calculateStatus();
                $batch->save();

                // التحقق من وجود المنتج المرتبط (تجنب خطأ first() on null)
                $product = $batch->products()->first();
                if (!$product) {
                    Log::warning("[Batch] باتش يتيم بدون منتج مرتبط! ID: {$batch->id}");
                    continue; 
                }

                $variantName = ($batch->batch_code ?? 'Batch') . ' - ' . $batch->expiry_date->format('Y-m-d');

                // الحالة الحمراء: تصفير الكمية في سلة
                if ($batch->status === 'red') {
                    if ($batch->salla_variant_id) {
                        Log::info('[Batch] باتش أحمر — تصفير الكمية', ['batch_id' => $batch->id]);
                        $sallaApi->updateBatchVariant($batch->salla_variant_id, [
                            'sku'            => $batch->batch_code ?? 'B-' . $batch->id,
                            'stock_quantity' => 0,
                            'sale_price'     => 0,
                        ]);
                    }
                    continue;
                }

                // الحالة الخضراء والصفراء: مزامنة كاملة
                if (!$batch->salla_variant_id) {
                    $syncService->syncBatch($batch, $product);
                } else {
                    $sallaApi->updateBatchVariant($batch->salla_variant_id, [
                        'sku'            => $batch->batch_code ?? 'B-' . $batch->id,
                        'stock_quantity' => (int) $batch->batchItems()->sum('quantity'),
                        'sale_price'     => ($batch->status === 'yellow')
                                            ? round($batch->price * 0.7, 2)
                                            : 0,
                    ]);
                }

                // التوافق الدوري (Reconciliation)
                if ($batch->salla_variant_id) {
                    $result = $syncService->reconcileQuantity($batch, $product, true);
                    if ($result['status'] === 'conflict' || $result['status'] === 'fixed') {
                        Log::warning('[Reconcile] فرق في الكمية', array_merge(['batch_id' => $batch->id], $result));
                    }
                }
            }

            // 2. مزامنة ظهور المنتجات
            $this->reconcileVisibility($sallaApi, $merchant);
        });
    }

    private function reconcileVisibility(SallaApiService $sallaApi, Merchant $merchant): void
    {
        $allProducts = Product::where('merchant_id', $merchant->id)->get();

        foreach ($allProducts as $product) {
            $batches = $product->batchItems()->with('batch')->get()
                ->map(fn($i) => $i->batch)
                ->filter();

            if ($batches->isEmpty()) {
                if ($product->status === 'hidden') {
                    $sallaApi->updateProductStatusOnly($product->salla_product_id, 'sale');
                    $product->update(['status' => 'sale']);
                }
                continue;
            }

            $hasActiveBatch = $batches->contains(fn($b) => $b && in_array($b->status, ['green', 'yellow']));
            $newStatus = $hasActiveBatch ? 'sale' : 'hidden';

            if ($product->status !== $newStatus) {
                $sallaApi->updateProductStatusOnly($product->salla_product_id, $newStatus);
                $product->update(['status' => $newStatus]);
            }
        }
    }
}