<?php

namespace App\Jobs\Harees;

use App\Models\Batch;
use App\Models\BatchDiscount;
use App\Models\BatchSetting;
use App\Models\Merchant;
use App\Models\Product;
use App\Services\SallaApiService;
use App\Services\BatchInventoryService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CleanupDeletedBatchesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        Log::info('[Harees] بدء تنظيف الباتشات المنتهية');

        Merchant::all()->each(function ($merchant) {
            if (!$merchant->name) return;

            try {
                $settings = BatchSetting::where('merchant_id', $merchant->id)->first();
                if (!$settings) return;

                $sallaApi = SallaApiService::for($merchant);

                $this->processRedBatches($sallaApi, $merchant);
                $this->hideExpiredProducts($sallaApi, $merchant, $settings);
                $this->cancelOrphanedDiscounts($merchant);

            } catch (\Throwable $e) {
                Log::error("[Cleanup] خطأ في التاجر {$merchant->id}: " . $e->getMessage());
            }
        });

        Log::info('[Harees] اكتمل تنظيف الباتشات المنتهية');
    }

    private function processRedBatches(SallaApiService $sallaApi, Merchant $merchant): void
    {
        Batch::where('merchant_id', $merchant->id)
            ->where('status', 'red')
            ->whereNotNull('product_id')
            ->with('product')
            ->get()
            ->each(function ($batch) use ($sallaApi) {
                $this->restoreOriginalData($sallaApi, $batch);
            });
    }

    private function restoreOriginalData(SallaApiService $sallaApi, Batch $batch): void
    {
        $product = $batch->product;
        if (!$product || !$product->salla_product_id) return;

        try {
            BatchInventoryService::restoreBatchQuantities($batch);

            $originalPrice = $batch->original_price;
            $originalVariantPrices = $batch->original_variant_prices ?? [];

            $hasVariants = $batch->batchVariants()->exists();

            if ($hasVariants) {
                if (!empty($originalVariantPrices)) {
                    foreach ($originalVariantPrices as $ovp) {
                        $variantId = $ovp['variant_id'] ?? null;
                        $price = (float) ($ovp['price'] ?? 0);
                        if ($variantId) {
                            $sallaApi->updateBatchVariant($variantId, [
                                'price'      => $price,
                                'sale_price' => 0,
                            ]);
                        }
                    }
                }

                BatchDiscount::where('batch_id', $batch->id)
                    ->where('status', 'active')
                    ->update(['status' => 'expired']);

                if ($batch->isAutoDiscounted() || $batch->isManuallyDiscounted()) {
                    $batch->markAsPending();
                }
            } else {
                $restorePrice = ($originalPrice !== null && $originalPrice > 0)
                    ? (float) $originalPrice
                    : (float) ($product->price ?? 0);
                $sallaApi->updateProductPrice($product->salla_product_id, $restorePrice, 0);

                BatchDiscount::where('batch_id', $batch->id)
                    ->where('status', 'active')
                    ->update(['status' => 'expired']);

                if ($batch->isAutoDiscounted() || $batch->isManuallyDiscounted()) {
                    $batch->markAsPending();
                }
            }

            Log::info("[Cleanup] تم استعادة البيانات الأصلية للباتش {$batch->id}", [
                'product' => $product->name,
                'price'   => $originalPrice,
            ]);

        } catch (\Exception $e) {
            Log::error("[Cleanup] فشل استعادة البيانات للباتش {$batch->id}: " . $e->getMessage());
        }
    }

    private function hideExpiredProducts(SallaApiService $sallaApi, Merchant $merchant, BatchSetting $settings): void
    {
        if (!$settings->auto_hide_expired) {
            Log::info('[Cleanup] الإخفاء التلقائي معطّل');
            return;
        }

        Product::where('merchant_id', $merchant->id)
            ->whereHas('batch')
            ->with('batch')
            ->get()
            ->each(function ($product) use ($sallaApi, $settings) {
                $batch = $product->batch;
                if (!$batch) return;

                $shouldHide = false;
                if ($batch->expiry_date) {
                    $expiry     = \Carbon\Carbon::parse($batch->expiry_date)->startOfDay();
                    $today      = \Carbon\Carbon::now()->startOfDay();
                    $daysLeft   = (int) $today->diffInDays($expiry, false);
                    $beforeDays = (int) ($settings->auto_hide_before_expiry_days ?? 0);

                    // If beforeDays is 0, only hide when batch is actually expired (red status)
                    // This prevents yellow batches from being hidden early
                    if ($beforeDays > 0) {
                        if ($daysLeft <= $beforeDays) {
                            $shouldHide = true;
                        }
                    } else {
                        if ($daysLeft <= 0 && $batch->status === 'red') {
                            $shouldHide = true;
                        }
                    }
                }

                $newStatus = $shouldHide ? 'hidden' : 'sale';

                if ($product->status !== $newStatus && $product->salla_product_id) {
                    try {
                        $sallaApi->updateProductStatusOnly($product->salla_product_id, $newStatus);
                        $product->update(['status' => $newStatus]);
                        Log::info("[Cleanup] {$product->name} → {$newStatus}");
                    } catch (\Throwable $e) {
                        Log::error("[Cleanup] خطأ في المنتج {$product->id}: " . $e->getMessage());
                    }
                }
            });
    }

    private function cancelOrphanedDiscounts(Merchant $merchant): void
    {
        BatchDiscount::whereHas('batch', function ($q) use ($merchant) {
            $q->where('merchant_id', $merchant->id)
              ->whereNull('expiry_date');
        })->orWhereHas('batch', function ($q) use ($merchant) {
            $q->where('merchant_id', $merchant->id)
              ->where('expiry_date', '<', now());
        })->where('status', 'active')
          ->update(['status' => 'expired']);
    }
}
