<?php

namespace App\Jobs\Harees;

use App\Models\Batch;
use App\Models\BatchSetting;
use App\Models\Merchant;
use App\Services\SallaApiService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class CheckBatchStatusesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        Log::info('[Harees] 🚀 بدء فحص حالات الباتشات');

        Merchant::all()->each(function ($merchant) {
            if (!$merchant->name) return;

            $this->processMerchantBatches($merchant);
        });

        Log::info('[Harees] ✅ اكتمل فحص حالات الباتشات');
    }

    private function processMerchantBatches(Merchant $merchant): void
    {
        Batch::where('merchant_id', $merchant->id)
            ->whereNotNull('expiry_date')
            ->get()
            ->each(function ($batch) use ($merchant) {
                $this->updateBatchStatus($batch, $merchant);
            });
    }

    private function updateBatchStatus(Batch $batch, Merchant $merchant): bool
    {
        $oldStatus = $batch->status;
        $batch->calculateStatus();
        $batch->save();

        Log::info('[CheckBatchStatusesJob] بعد حساب الحالة', [
            'batch_id'      => $batch->id,
            'old_status'    => $oldStatus,
            'new_status'    => $batch->status,
            'discount_type' => $batch->discount_type,
        ]);

        if ($oldStatus !== $batch->status && in_array($batch->status, ['yellow', 'red'])) {
            \App\Services\BatchExpiryNotifierService::notify($batch, $batch->status, $merchant);
            Cache::forget("harees_dashboard_api_{$merchant->id}");
        }

        // Apply auto discount for all yellow pending batches every cycle
        // (not just on transition) to catch batches that were already yellow
        if ($batch->status === 'yellow') {
            Log::info('[CheckBatchStatusesJob] محاولة تطبيق الخصم التلقائي', ['batch_id' => $batch->id]);
            $this->applyAutoDiscountOnYellow($batch, $merchant);
        }

        return $oldStatus !== $batch->status;
    }

    private function applyAutoDiscountOnYellow(Batch $batch, Merchant $merchant): void
    {
        Log::info('[AutoDiscount::Job] بدء', ['batch_id' => $batch->id, 'discount_type' => $batch->discount_type]);

        try {
            $settings = BatchSetting::where('merchant_id', $merchant->id)->first();
            if (!$settings || !$settings->auto_discounts) {
                Log::info('[AutoDiscount::Job] تخطي: الإعدادات غير مفعلة', ['batch_id' => $batch->id]);
                return;
            }
            if (!$batch->canAutoDiscount()) {
                Log::info('[AutoDiscount::Job] تخطي: cannot auto discount', ['batch_id' => $batch->id, 'discount_type' => $batch->discount_type]);
                return;
            }

            $product = $batch->product;
            if (!$product || !$product->salla_product_id) {
                Log::info('[AutoDiscount::Job] تخطي: المنتج غير مرتبط بسلة', ['batch_id' => $batch->id]);
                return;
            }

            Log::info('[AutoDiscount::Job] جميع الشروط مستوفاة', ['batch_id' => $batch->id]);

            $sallaApi = SallaApiService::for($merchant);

            // Save original data if not already stored
            if ($batch->original_price === null || $batch->original_qty === null) {
                $productData = $sallaApi->getProduct($product->salla_product_id);
                $data = $productData['data'] ?? [];

                $originalPrice = (float) ($data['price']['amount'] ?? $product->price ?? 0);
                $originalQty   = (int) ($data['quantity'] ?? $product->quantity ?? 0);

                $originalVariantPrices = [];
                $originalVariantQtys   = [];
                $variants = $data['variants'] ?? [];
                if (!empty($variants)) {
                    foreach ($variants as $v) {
                        if (isset($v['id'])) {
                            $originalVariantPrices[] = ['variant_id' => $v['id'], 'price' => (float) ($v['price']['amount'] ?? 0)];
                            $originalVariantQtys[]   = ['variant_id' => $v['id'], 'qty' => (int) ($v['stock_quantity'] ?? 0)];
                        }
                    }
                }

                $batch->update([
                    'original_price'          => $originalPrice,
                    'original_qty'            => $originalQty,
                    'original_variant_prices'  => !empty($originalVariantPrices) ? $originalVariantPrices : null,
                    'original_variant_qtys'    => !empty($originalVariantQtys) ? $originalVariantQtys : null,
                ]);
            }

            // Calculate discount percentage
            $discountPercent = $this->calculateDiscountPercent($batch, $settings);
            if ($discountPercent <= 0) return;

            // Apply discount
            $hasVariants = $batch->batchVariants()->exists();

            $batch->markAsAutoDiscounted();

            if ($hasVariants) {
                $this->applyDiscountToVariants($sallaApi, $batch, $discountPercent);
            } else {
                $currentPrice = $batch->original_price ?: (float) ($product->price ?? 0);
                if ($currentPrice > 0) {
                    $salePrice = round($currentPrice * (1 - $discountPercent / 100), 2);
                    if ($salePrice < $currentPrice) {
                        $sallaApi->updateProductPrice($product->salla_product_id, $currentPrice, $salePrice);
                        try { $batch->update(['applied_sale_price' => $salePrice]); } catch (\Throwable $e) {}
                    }
                }
            }

            // Sync batch quantity to Salla
            if ($hasVariants) {
                foreach ($batch->batchVariants as $bv) {
                    try {
                        $sallaApi->updateBatchVariant($bv->variant_id, [
                            'stock_quantity' => $bv->batch_qty ?? 0,
                        ]);
                    } catch (\Throwable $e) {
                        Log::warning('[AutoDiscount] فشل تحديث كمية variant: ' . $e->getMessage(), [
                            'batch_id'   => $batch->id,
                            'variant_id' => $bv->variant_id,
                        ]);
                    }
                }
            } else {
                $batchQty = $batch->batch_qty ?? 0;
                if ($batchQty > 0) {
                    try {
                        $sallaApi->updateProductQuantity($product->salla_product_id, $batchQty);
                    } catch (\Throwable $e) {
                        Log::warning('[AutoDiscount] فشل تحديث كمية المنتج: ' . $e->getMessage(), [
                            'batch_id' => $batch->id,
                        ]);
                    }
                }
            }

            Cache::forget("harees_dashboard_api_{$merchant->id}");

            Log::info('[AutoDiscount] ✅ خصم تلقائي فوري عند التحول للأصفر', [
                'batch_id'    => $batch->id,
                'product'     => $product->name,
                'discount_pct'=> $discountPercent,
            ]);

        } catch (\Throwable $e) {
            Log::error('[AutoDiscount] فشل الخصم التلقائي الفوري: ' . $e->getMessage(), [
                'batch_id' => $batch->id,
            ]);
        }
    }

    private function applyDiscountToVariants(SallaApiService $sallaApi, Batch $batch, float $discountPercent): void
    {
        $product = $batch->product;
        if (!$product || !$product->salla_product_id) return;

        $currentVariants = $sallaApi->getProductVariants($product->salla_product_id);
        $sallaVariants = $currentVariants['data'] ?? [];

        foreach ($batch->batchVariants as $batchVariant) {
            $storedVariantId = $batchVariant->variant_id;
            $matchedVariant = null;

            foreach ($sallaVariants as $sv) {
                if ($sv['id'] == $storedVariantId) {
                    $matchedVariant = $sv;
                    break;
                }
            }

            if (!$matchedVariant) continue;

            $currentPrice = (float) ($matchedVariant['price']['amount'] ?? 0);
            if ($currentPrice <= 0) continue;

            $salePrice = round($currentPrice * (1 - $discountPercent / 100), 2);
            if ($salePrice >= $currentPrice) continue;

            $sallaApi->updateBatchVariant($matchedVariant['id'], [
                'price'      => $currentPrice,
                'sale_price' => $salePrice,
            ]);

            Log::info("[AutoDiscount] ✅ خصم فوري على Variant {$matchedVariant['id']}: {$currentPrice} → {$salePrice} SAR");
        }
    }

    private function calculateDiscountPercent(Batch $batch, BatchSetting $settings): float
    {
        if ($batch->discount_pct !== null && $batch->discount_pct > 0) {
            return (float) $batch->discount_pct;
        }

        if (!$settings->auto_discounts) return 0;

        $daysLeft = $batch->days_until_expiry ?? 0;
        if ($daysLeft < 0) return 0;

        $discountPercent = (float) ($settings->auto_discount_percent ?? 20);

        if ($discountPercent > 0) {
            return $discountPercent;
        }

        return 0;
    }
}
