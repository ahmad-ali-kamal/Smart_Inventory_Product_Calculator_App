<?php

namespace App\Jobs\Harees;

use App\Models\Batch;
use App\Models\BatchItem;
use App\Models\Product;
use App\Models\Merchant;
use App\Services\SallaApiService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncVariantQuantitiesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        Log::info('[Harees] 🚀 بدء مزامنة كميات الـ variants');

        Merchant::all()->each(function ($merchant) {
            if (!$merchant->name) return;

            try {
                $sallaApi = SallaApiService::for($merchant);
                $this->syncQuantitiesForMerchant($sallaApi, $merchant);
            } catch (\Throwable $e) {
                Log::error("[SyncQuantities] خطأ في التاجر {$merchant->id}: " . $e->getMessage());
            }
        });

        Log::info('[Harees] ✅ اكتملت مزامنة كميات الـ variants');
    }

    private function syncQuantitiesForMerchant(SallaApiService $sallaApi, Merchant $merchant): void
    {
        Product::where('merchant_id', $merchant->id)
            ->whereHas('batchItems.batch')
            ->with('batchItems.batch')
            ->get()
            ->each(function ($product) use ($sallaApi) {
                $this->syncVariantQuantity($sallaApi, $product);
            });
    }

    private function syncVariantQuantity(SallaApiService $sallaApi, Product $product): void
    {
        if (!$product->salla_product_id) return;

        try {
            $batches = $product->batchItems()
                ->with('batch')
                ->get()
                ->map(fn($item) => $item->batch)
                ->filter()
                ->unique('id');

            $activeBatches = $batches->whereIn('status', ['yellow', 'green']);

            if ($activeBatches->isEmpty()) return;

            // ربط variant_id مع الباتشات وتحديث الكميات
            $this->linkVariantsAndSyncQuantity($sallaApi, $product, $activeBatches);

        } catch (\Throwable $e) {
            Log::error("[SyncQuantities] خطأ في المنتج {$product->id}: " . $e->getMessage());
        }
    }

    private function linkVariantsAndSyncQuantity(SallaApiService $sallaApi, Product $product, $activeBatches): void
    {
        $maxAttempts = 3;
        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            $linked = $this->syncBatchQuantities($sallaApi, $product, $activeBatches);

            if ($linked) break;

            if ($attempt < $maxAttempts) {
                $wait = $attempt * 3;
                Log::info("[SyncQuantities] ⏳ انتظار {$wait}ث (محاولة {$attempt}/{$maxAttempts})");
                sleep($wait);
            }
        }
    }

    private function syncBatchQuantities(SallaApiService $sallaApi, Product $product, $activeBatches): bool
    {
        try {
            $variantsResponse = $sallaApi->getProductVariants($product->salla_product_id);
            $variants = $variantsResponse['data'] ?? [];

            if (empty($variants)) {
                Log::warning("[SyncQuantities] لا يوجد variants للمنتج {$product->id}");
                return false;
            }

            $optionsResponse = $sallaApi->getProductOptions($product->salla_product_id);
            $options = $optionsResponse['data'] ?? [];

            $valueIdToName = [];
            foreach ($options as $option) {
                foreach ($option['values'] ?? [] as $value) {
                    $valueIdToName[$value['id']] = $value['name'];
                }
            }

            $allBatchItems = BatchItem::where('product_id', $product->id)
                ->get()
                ->groupBy('batch_id');

            $allDateNames = $activeBatches->map(fn($b) => $this->formatBatchName($b))->values()->toArray();

            $compoundVariants = [];
            foreach ($variants as $v) {
                $vNames = array_values(array_filter(array_map(
                    fn($id) => $valueIdToName[$id] ?? null,
                    $v['related_option_values'] ?? []
                )));
                $hasDate = !empty(array_intersect($vNames, $allDateNames));
                if ($hasDate) {
                    $compoundVariants[] = $v;
                }
            }

            if (empty($compoundVariants)) {
                return false;
            }

            $updatedCount = 0;
            foreach ($compoundVariants as $variant) {
                $variantId = $variant['id'] ?? null;
                $relatedValueIds = $variant['related_option_values'] ?? [];

                if (!$variantId || empty($relatedValueIds)) continue;

                $valueNames = array_values(array_filter(array_map(
                    fn($id) => $valueIdToName[$id] ?? null,
                    $relatedValueIds
                )));
                if (empty($valueNames)) continue;

                $matchedBatch = null;
                foreach ($activeBatches as $batch) {
                    $dateName = $this->formatBatchName($batch);
                    if (in_array($dateName, $valueNames)) {
                        $matchedBatch = $batch;
                        break;
                    }
                }

                if (!$matchedBatch) continue;

                $baseOptionNames = array_values(array_filter(
                    $valueNames,
                    fn($n) => !in_array($n, $allDateNames)
                ));
                if (empty($baseOptionNames)) continue;

                $batchItems = $allBatchItems->get($matchedBatch->id, collect())
                    ->sortBy('id')
                    ->values();

                $foundItem = null;
                $stockFromDb = 0;

                if ($batchItems->isNotEmpty()) {
                    foreach ($batchItems as $bi) {
                        if (!$bi->salla_variant_id) continue;

                        $lookupVariant = collect($variants)->firstWhere('id', (int) $bi->salla_variant_id);

                        if (!$lookupVariant) {
                            $localVariantsData = is_string($product->variants_data)
                                ? json_decode($product->variants_data, true)
                                : ($product->variants_data ?? []);
                            $lookupVariant = collect($localVariantsData)->firstWhere('id', (int) $bi->salla_variant_id);
                        }

                        if (!$lookupVariant) continue;

                        $lookupValueIds = $lookupVariant['related_option_values'] ?? [];
                        if (empty($lookupValueIds)) continue;

                        $lookupNames = array_values(array_filter(array_map(
                            fn($id) => $valueIdToName[$id] ?? null,
                            $lookupValueIds
                        )));
                        if (empty($lookupNames)) continue;

                        $cleanNames = array_values(array_filter(
                            $lookupNames,
                            fn($n) => !in_array($n, $allDateNames)
                        ));
                        if (empty($cleanNames)) continue;

                        $intersect = array_intersect($cleanNames, $baseOptionNames);
                        if (count($intersect) === count($cleanNames) && count($cleanNames) === count($baseOptionNames)) {
                            $foundItem = $bi;
                            break;
                        }
                    }

                    if ($foundItem) {
                        $stockFromDb = (int) ($foundItem->variant_quantity ?? $foundItem->quantity ?? 0);
                    }
                }

                if (!$foundItem) continue;

                // ── التحقق من unlimited_quantity قبل تحديث المخزون ──
                try {
                    $currentVariant = $sallaApi->getVariantDetails($variantId);
                    $currentVariantData = $currentVariant['data'] ?? [];
                    $isUnlimited = $currentVariantData['unlimited_quantity'] ?? false;

                    if ($isUnlimited) {
                        Log::info('[SyncQuantities] ⏭️ تخطي — المخزون لانهائي', [
                            'variant_id' => $variantId,
                        ]);
                    } else {
                        $sallaApi->updateBatchVariant($variantId, [
                            'stock_quantity' => $stockFromDb,
                        ]);
                    }

                    $oldVariantId = $foundItem->salla_variant_id;
                    $foundItem->update([
                        'salla_variant_id' => $variantId,
                        'variant_quantity' => $stockFromDb,
                    ]);

                    Log::info('[SyncQuantities] ✅ مزامنة الكمية', [
                        'batch_item_id'  => $foundItem->id,
                        'variant_id'     => $variantId,
                        'stock'          => $isUnlimited ? 'unlimited' : $stockFromDb,
                    ]);

                    $updatedCount++;
                } catch (\Exception $e) {
                    Log::error('[SyncQuantities] فشل تحديث المخزون', [
                        'variant_id' => $variantId,
                        'error'      => $e->getMessage(),
                    ]);
                }
            }

            return $updatedCount > 0;

        } catch (\Throwable $e) {
            Log::error("[SyncQuantities] خطأ في المنتج {$product->id}: " . $e->getMessage());
            return false;
        }
    }

    private function formatBatchName(Batch $batch): string
    {
        $expiry = $batch->expiry_date;
        $dateStr = $expiry ? $expiry->format('Y-m-d') : 'Unknown';
        return "تاريخ انتهاء المنتج {$dateStr}";
    }
}
