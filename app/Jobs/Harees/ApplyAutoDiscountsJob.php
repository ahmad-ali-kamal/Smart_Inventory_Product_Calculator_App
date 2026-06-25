<?php

namespace App\Jobs\Harees;

use App\Models\Batch;
use App\Models\BatchSetting;
use App\Models\Merchant;
use App\Services\SallaApiService;
use App\Jobs\Harees\UpdateBatchOptionsJob;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ApplyAutoDiscountsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        Log::info('[Harees] 🚀 بدء تطبيق الخصومات التلقائية');

        Merchant::all()->each(function ($merchant) {
            if (!$merchant->name) return;

            try {
                $settings = BatchSetting::where('merchant_id', $merchant->id)->first();
                if (!$settings || !$settings->auto_discounts) {
                    Log::info('[AutoDiscount] الخصم التلقائي معطل للتاجر ' . $merchant->id);
                    return;
                }

                $sallaApi = SallaApiService::for($merchant);

                $this->applyAutoDiscountsForMerchant($sallaApi, $merchant, $settings);

            } catch (\Throwable $e) {
                Log::error("[AutoDiscount] خطأ في التاجر {$merchant->id}: " . $e->getMessage());
            }
        });

        UpdateBatchOptionsJob::dispatch();

        Log::info('[Harees] ✅ اكتمل تطبيق الخصومات التلقائية');
    }

    private function applyAutoDiscountsForMerchant(SallaApiService $sallaApi, Merchant $merchant, BatchSetting $settings): void
    {
        $yellowBatches = Batch::where('merchant_id', $merchant->id)
            ->where('status', 'yellow')
            ->whereHas('batchItems')
            ->with('batchItems.product')
            ->get();

        if ($yellowBatches->isEmpty()) {
            Log::info('[AutoDiscount] لا توجد باتشات صفراء');
            return;
        }

        Log::info("[AutoDiscount] 🟡 معالجة {$yellowBatches->count()} باتش");

        $yellowBatches->each(function ($batch) use ($sallaApi, $settings) {
            $this->applyAutoDiscountToBatch($sallaApi, $batch, $settings);
        });
    }

    private function applyAutoDiscountToBatch(SallaApiService $sallaApi, Batch $batch, BatchSetting $settings): void
    {
        try {
            if (!$batch->canAutoDiscount()) {
                Log::info("[AutoDiscount] تخطي batch {$batch->id} — " . ($batch->discount_type ?? 'غير مؤهل'));
                return;
            }

            if ($batch->isPending() && $settings->auto_discounts) {
                $this->executeAutoDiscount($sallaApi, $batch, $settings);
            }

        } catch (\Exception $e) {
            Log::error("[AutoDiscount] خطأ في الباتش {$batch->id}: " . $e->getMessage());
        }
    }

    private function executeAutoDiscount(SallaApiService $sallaApi, Batch $batch, BatchSetting $settings): void
    {
        $batchItems = $batch->batchItems;
        if ($batchItems->isEmpty()) {
            return;
        }

        $discountPercent = $this->calculateDiscountPercentage($batch, $settings);
        if ($discountPercent <= 0) {
            Log::info("[AutoDiscount] نسبة الخصم 0 للباتش {$batch->id} — تم التجاوز");
            return;
        }

        $variantItems = $batchItems->filter(fn($item) => $item->salla_variant_id && $item->salla_variant_id > 0);

        if ($variantItems->count() > 0) {
            $this->applyDiscountToVariants($sallaApi, $batch, $variantItems, $discountPercent);
        } else {
            $this->applyDiscountToProduct($sallaApi, $batch, $discountPercent);
        }

        $batch->markAsAutoDiscounted();
        Log::info("[AutoDiscount] ✅ الباتش {$batch->id} → auto_discounted");
    }

    private function applyDiscountToVariants(SallaApiService $sallaApi, Batch $batch, $variantItems, float $discountPercent): void
    {
        $batchItem = $batch->batchItems->first();
        $product = $batchItem?->product;

        if (!$product || !$product->salla_product_id) {
            Log::warning("[AutoDiscount] المنتج ليس له salla_product_id");
            return;
        }

        $currentVariants = $sallaApi->getProductVariants($product->salla_product_id);
        $sallaVariants = $currentVariants['data'] ?? [];

        $optionsResponse = $sallaApi->getProductOptions($product->salla_product_id);
        $options = $optionsResponse['data'] ?? [];
        $valueIdToName = [];
        foreach ($options as $option) {
            foreach ($option['values'] ?? [] as $value) {
                $valueIdToName[$value['id']] = $value['name'];
            }
        }

        $lastPrice = null;
        $usedVariantIds = [];

        foreach ($variantItems as $variantItem) {
            $storedVariantId = $variantItem->salla_variant_id;
            $batchName = $this->formatBatchName($batch);

            try {
                $matchedVariant = null;

                foreach ($sallaVariants as $sv) {
                    if ($sv['id'] == $storedVariantId) {
                        $matchedVariant = $sv;
                        break;
                    }
                }

                if (!$matchedVariant) {
                    foreach ($sallaVariants as $sv) {
                        if (in_array($sv['id'], $usedVariantIds)) {
                            continue;
                        }
                        $relatedValueIds = $sv['related_option_values'] ?? [];
                        $valueNames = array_filter(array_map(fn($id) => $valueIdToName[$id] ?? null, $relatedValueIds));
                        if (in_array($batchName, $valueNames)) {
                            $matchedVariant = $sv;
                            break;
                        }
                    }
                }

                if (!$matchedVariant) {
                    Log::warning("[AutoDiscount] لم يتم العثور على variant للباتش {$batch->id}");
                    continue;
                }

                $variantId = $matchedVariant['id'];
                $variantData = $matchedVariant;
                $currentPrice = (float) ($variantData['price']['amount'] ?? 0);

                $salePrice = round($currentPrice * (1 - $discountPercent / 100), 2);

                if ($salePrice >= $currentPrice) {
                    continue;
                }

                // ⚠️ تطبيق الخصم فقط — لا نُرسل stock_quantity أبداً
                $sallaApi->updateBatchVariant($variantId, [
                    'price'      => $currentPrice,
                    'sale_price' => $salePrice,
                ]);

                $usedVariantIds[] = $variantId;
                Log::info("[AutoDiscount] ✅ خصم تلقائي على Variant {$variantId}: {$currentPrice} → {$salePrice} SAR");

            } catch (\Exception $e) {
                Log::error("[AutoDiscount] خطأ في تطبيق الخصم: " . $e->getMessage());
            }
        }

        $batch->update(['applied_sale_price' => $lastPrice ? round($lastPrice * (1 - $discountPercent / 100), 2) : null]);
    }

    private function applyDiscountToProduct(SallaApiService $sallaApi, Batch $batch, float $discountPercent): void
    {
        $batchItem = $batch->batchItems->first();
        $product = $batchItem?->product;

        if (!$product || !$product->salla_product_id) {
            Log::warning("[AutoDiscount] المنتج {$product?->id} ليس له salla_product_id");
            return;
        }

        try {
            $productData = $sallaApi->getProduct($product->salla_product_id);
            $productDetails = $productData['data'] ?? [];

            $currentPrice = (float) ($productDetails['price']['amount'] ?? $product->price ?? 0);
            if ($currentPrice <= 0) {
                Log::warning("[AutoDiscount] سعر المنتج {$product->id} = 0 - تم التجاوز");
                return;
            }

            $salePrice = round($currentPrice * (1 - $discountPercent / 100), 2);
            if ($salePrice >= $currentPrice) {
                Log::warning("[AutoDiscount] سعر الخصم ({$salePrice}) >= الأصلي ({$currentPrice})!");
                return;
            }

            // ⚠️ تطبيق السعر فقط — لا نُرسل كمية
            $sallaApi->updateProductPrice($product->salla_product_id, $currentPrice, $salePrice);

            $batch->update(['applied_sale_price' => $salePrice]);

            Log::info("[AutoDiscount] ✅ خصم تلقائي على المنتج {$product->id}: {$currentPrice} → {$salePrice} SAR");

        } catch (\Exception $e) {
            Log::error("[AutoDiscount] خطأ في تطبيق الخصم على المنتج {$product->id}: " . $e->getMessage());
        }
    }

    private function calculateDiscountPercentage(Batch $batch, BatchSetting $settings): float
    {
        if ($batch->custom_discount_percentage !== null && $batch->custom_discount_percentage > 0) {
            return (float) $batch->custom_discount_percentage;
        }

        if (!$settings->auto_discounts) {
            return 0;
        }

        $daysLeft = $batch->days_until_expiry ?? 0;
        if ($daysLeft < 0) return 0;

        $rawDurationDays = $settings->auto_discount_duration_days ?? 0;
        $durationDays = ($rawDurationDays > 0) ? $rawDurationDays : 7;
        $discountPercent = (float) ($settings->auto_discount_percent ?? 20);

        Log::info('[AutoDiscount] إعدادات الخصم:', [
            'duration_days'    => $durationDays,
            'discount_percent' => $discountPercent,
            'days_left'        => $daysLeft,
        ]);

        if (is_numeric($durationDays)) {
            if ($daysLeft <= (int) $durationDays && $discountPercent > 0) {
                return $discountPercent;
            }
            return 0;
        }

        $rawDiscountDays = $settings->auto_discount_duration_days;
        $autoDiscounts = [];
        if (is_array($rawDiscountDays)) {
            $autoDiscounts = $rawDiscountDays;
        } elseif (is_string($rawDiscountDays)) {
            $decoded = json_decode($rawDiscountDays, true);
            $autoDiscounts = is_array($decoded) ? $decoded : [];
        }

        if (empty($autoDiscounts)) {
            return 0;
        }

        $applicableDiscount = 0;
        foreach ($autoDiscounts as $discountPct => $minDays) {
            if ($daysLeft <= (int)$minDays) {
                $applicableDiscount = max($applicableDiscount, (float)$discountPercent);
            }
        }

        return $applicableDiscount;
    }

    private function formatBatchName(Batch $batch): string
    {
        $expiry = $batch->expiry_date;
        $dateStr = $expiry ? $expiry->format('Y-m-d') : 'Unknown';
        return "تاريخ انتهاء المنتج {$dateStr}";
    }
}
