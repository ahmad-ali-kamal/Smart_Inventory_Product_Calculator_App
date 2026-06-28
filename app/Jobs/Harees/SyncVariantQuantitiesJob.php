<?php

namespace App\Jobs\Harees;

use App\Models\Batch;
use App\Models\BatchVariant;
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
            ->whereHas('batch')
            ->with('batch.batchVariants')
            ->get()
            ->each(function ($product) use ($sallaApi) {
                $this->syncVariantQuantity($sallaApi, $product);
            });
    }

    private function syncVariantQuantity(SallaApiService $sallaApi, Product $product): void
    {
        if (!$product->salla_product_id) return;

        try {
            $batch = $product->batch;
            if (!$batch || !in_array($batch->status, ['yellow', 'green'])) return;

            $variantsResponse = $sallaApi->getProductVariants($product->salla_product_id);
            $variants = $variantsResponse['data'] ?? [];

            if (empty($variants)) return;

            $optionsResponse = $sallaApi->getProductOptions($product->salla_product_id);
            $options = $optionsResponse['data'] ?? [];

            $valueIdToName = [];
            foreach ($options as $option) {
                foreach ($option['values'] ?? [] as $value) {
                    $valueIdToName[$value['id']] = $value['name'];
                }
            }

            $dateName = $this->formatBatchName($batch);

            $compoundVariants = [];
            foreach ($variants as $v) {
                $vNames = array_values(array_filter(array_map(
                    fn($id) => $valueIdToName[$id] ?? null,
                    $v['related_option_values'] ?? []
                )));
                if (in_array($dateName, $vNames)) {
                    $compoundVariants[] = $v;
                }
            }

            if (empty($compoundVariants)) return;

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

                $baseOptionNames = array_values(array_filter(
                    $valueNames,
                    fn($n) => $n !== $dateName
                ));
                if (empty($baseOptionNames)) continue;

                $batchVariant = $batch->batchVariants
                    ->sortBy('id')
                    ->first(function ($bv) use ($baseOptionNames, $variants, $product, $valueIdToName, $batch) {
                        $sallaVariant = collect($variants)->firstWhere('id', (int) $bv->variant_id);
                        if (!$sallaVariant) {
                            $localVariantsData = is_string($product->variants_data)
                                ? json_decode($product->variants_data, true)
                                : ($product->variants_data ?? []);
                            $sallaVariant = collect($localVariantsData)->firstWhere('id', (int) $bv->variant_id);
                        }
                        if (!$sallaVariant) return false;

                        $lookupValueIds = $sallaVariant['related_option_values'] ?? [];
                        if (empty($lookupValueIds)) return false;

                        $lookupNames = array_values(array_filter(array_map(
                            fn($id) => $valueIdToName[$id] ?? null,
                            $lookupValueIds
                        )));
                        $cleanNames = array_values(array_filter(
                            $lookupNames,
                            fn($n) => $n !== $dateName
                        ));

                        return count(array_intersect($cleanNames, $baseOptionNames)) === count($cleanNames)
                            && count($cleanNames) === count($baseOptionNames);
                    });

                if (!$batchVariant) continue;

                $stockFromDb = $batchVariant->total_qty ?? 0;

                try {
                    $currentVariant = $sallaApi->getVariantDetails($variantId);
                    $currentVariantData = $currentVariant['data'] ?? [];
                    $isUnlimited = $currentVariantData['unlimited_quantity'] ?? false;

                    if (!$isUnlimited) {
                        $sallaApi->updateBatchVariant($variantId, [
                            'stock_quantity' => $stockFromDb,
                        ]);
                    }

                    $batchVariant->update([
                        'variant_id' => $variantId,
                        'batch_qty'  => $stockFromDb,
                    ]);

                    Log::info('[SyncQuantities] ✅ مزامنة الكمية', [
                        'variant_id'  => $variantId,
                        'stock'       => $isUnlimited ? 'unlimited' : $stockFromDb,
                    ]);

                    $updatedCount++;
                } catch (\Exception $e) {
                    Log::error('[SyncQuantities] فشل تحديث المخزون', [
                        'variant_id' => $variantId,
                        'error'      => $e->getMessage(),
                    ]);
                }
            }

        } catch (\Throwable $e) {
            Log::error("[SyncQuantities] خطأ في المنتج {$product->id}: " . $e->getMessage());
        }
    }

    private function formatBatchName(Batch $batch): string
    {
        $expiry = $batch->expiry_date;
        $dateStr = $expiry ? $expiry->format('Y-m-d') : 'Unknown';
        return "تاريخ انتهاء المنتج {$dateStr}";
    }
}
