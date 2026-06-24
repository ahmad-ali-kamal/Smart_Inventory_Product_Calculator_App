<?php

namespace App\Jobs\Harees;

use App\Models\BatchItem;
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

class UpdateBatchOptionsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public const GREEN_LABEL = 'السعر الأساسي';

    public function handle(): void
    {
        Log::info('[Harees] 🚀 بدء مزامنة خيارات الشراء');

        Merchant::all()->each(function ($merchant) {
            if (!$merchant->name) return;

            try {
                $settings = BatchSetting::where('merchant_id', $merchant->id)->first();
                $sallaApi = SallaApiService::for($merchant);

                $this->syncOptionsForMerchant($sallaApi, $merchant, $settings);

            } catch (\Throwable $e) {
                Log::error("[BatchOptions] خطأ في التاجر {$merchant->id}: " . $e->getMessage());
            }
        });

        Log::info('[Harees] ✅ اكتملت مزامنة خيارات الشراء');
    }

    private function syncOptionsForMerchant(SallaApiService $sallaApi, Merchant $merchant, ?BatchSetting $settings): void
    {
        Product::where('merchant_id', $merchant->id)
            ->whereHas('batchItems.batch')
            ->with('batchItems.batch')
            ->get()
            ->each(function ($product) use ($sallaApi, $settings) {
                $this->syncProductOption($sallaApi, $product, $settings);
            });
    }

    private function syncProductOption(SallaApiService $sallaApi, Product $product, ?BatchSetting $settings): void
    {
        if (!$product->salla_product_id) return;

        try {
            $batches = $product->batchItems()
                ->with('batch')
                ->get()
                ->map(fn($item) => $item->batch)
                ->filter()
                ->unique('id');

            $optionsResponse = $sallaApi->getProductOptions($product->salla_product_id);
            $currentOptions = $optionsResponse['data'] ?? [];

            $batchOption = collect($currentOptions)->firstWhere('name', SallaApiService::BATCH_OPTION_NAME);

            if ($batches->isEmpty()) {
                if ($batchOption) {
                    $sallaApi->deleteProductOption($batchOption['id']);
                }
                return;
            }

            $activeBatches = $batches->whereIn('status', ['yellow', 'green']);

            if ($activeBatches->isEmpty()) {
                if ($batchOption) {
                    $sallaApi->deleteProductOption($batchOption['id']);
                }
                return;
            }

            $valuesToKeep = collect();
            if ($activeBatches->contains(fn($b) => $b->status === 'green')) {
                $valuesToKeep->push(['name' => self::GREEN_LABEL]);
            }
            $yellowLabel = $settings->yellow_batch_label ?? 'عرض التوفير (كمية محدودة)';
            if ($activeBatches->contains(fn($b) => $b->status === 'yellow')) {
                $valuesToKeep->push(['name' => $yellowLabel]);
            }

            if ($valuesToKeep->isEmpty()) {
                if ($batchOption) {
                    $sallaApi->deleteProductOption($batchOption['id']);
                }
                return;
            }

            if (!$batchOption) {
                $sallaApi->createProductOption(
                    $product->salla_product_id,
                    SallaApiService::BATCH_OPTION_NAME,
                    $valuesToKeep->values()->toArray()
                );
            } else {
                $sallaApi->updateProductOption(
                    $batchOption['id'],
                    SallaApiService::BATCH_OPTION_NAME,
                    $valuesToKeep->values()->toArray()
                );
            }

        } catch (\Throwable $e) {
            Log::error("[BatchOptions] خطأ في المنتج {$product->id}: " . $e->getMessage());
        }
    }

}
