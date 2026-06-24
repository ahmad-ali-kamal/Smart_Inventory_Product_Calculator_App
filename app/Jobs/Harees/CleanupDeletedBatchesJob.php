<?php

namespace App\Jobs\Harees;

use App\Models\Batch;
use App\Models\BatchDiscount;
use App\Models\BatchSetting;
use App\Models\Merchant;
use App\Models\Product;
use App\Services\SallaApiService;
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
        Log::info('[Harees] 🚀 بدء تنظيف الباتشات المحذوفة');

        Merchant::all()->each(function ($merchant) {
            if (!$merchant->name) return;

            try {
                $settings = BatchSetting::where('merchant_id', $merchant->id)->first();
                if (!$settings) return;

                $sallaApi = SallaApiService::for($merchant);

                $this->hideExpiredProducts($sallaApi, $merchant, $settings);
                $this->cancelOrphanedDiscounts($merchant);

            } catch (\Throwable $e) {
                Log::error("[Cleanup] خطأ في التاجر {$merchant->id}: " . $e->getMessage());
            }
        });

        Log::info('[Harees] ✅ اكتمل تنظيف الباتشات المحذوفة');
    }

    private function hideExpiredProducts(SallaApiService $sallaApi, Merchant $merchant, BatchSetting $settings): void
    {
        if (!$settings->auto_hide_expired) {
            Log::info('[Cleanup] الإخفاء التلقائي معطّل');
            return;
        }

        Product::where('merchant_id', $merchant->id)
            ->whereHas('batchItems.batch')
            ->with('batchItems.batch')
            ->get()
            ->each(function ($product) use ($sallaApi) {
                $batches = $product->batchItems()
                    ->with('batch')
                    ->get()
                    ->map(fn($item) => $item->batch)
                    ->filter();

                if ($batches->isEmpty()) return;

                $allRed = $batches->every(fn($batch) => $batch && $batch->status === 'red');

                $newStatus = $allRed ? 'hidden' : 'sale';

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
