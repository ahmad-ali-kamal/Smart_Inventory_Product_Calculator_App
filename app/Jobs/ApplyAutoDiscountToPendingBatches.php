<?php

namespace App\Jobs;

use App\Models\Batch;
use App\Models\BatchSetting;
use App\Models\Merchant;
use App\Services\SallaApiService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ApplyAutoDiscountToPendingBatches implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $merchantId
    ) {}

    public function handle(): void
    {
        $merchant = Merchant::find($this->merchantId);
        if (!$merchant) {
            Log::warning("[ApplyAutoDiscount] التاجر {$this->merchantId} غير موجود");
            return;
        }

        $settings = BatchSetting::where('merchant_id', $this->merchantId)->first();
        $autoDiscountsOn = $settings && $settings->auto_discounts;

        Log::info('[AUTO DISCOUNT] بدء التطبيق', [
            'merchant_id'    => $this->merchantId,
            'auto_discounts' => $autoDiscountsOn,
        ]);

        if (!$autoDiscountsOn) {
            Log::info('[AUTO DISCOUNT] الخصم التلقائي معطل — لا حاجة للمعالجة');
            return;
        }

        // ─── البحث عن الباتشات المعلقة فقط ────────
        $pendingBatches = Batch::where('merchant_id', $this->merchantId)
            ->where('status', 'yellow')
            ->where('discount_type', 'pending')
            ->whereHas('batchItems')
            ->with('batchItems.product')
            ->get();

        $pendingCount = $pendingBatches->count();
        $totalBatches = Batch::where('merchant_id', $this->merchantId)
            ->where('status', 'yellow')
            ->count();

        Log::info('[AUTO DISCOUNT] إحصائيات الباتشات', [
            'merchant_id'         => $this->merchantId,
            'total_yellow'        => $totalBatches,
            'pending'             => $pendingCount,
            'auto_discounted'     => Batch::where('merchant_id', $this->merchantId)
                ->where('status', 'yellow')
                ->where('discount_type', 'auto_discounted')->count(),
            'manually_discounted' => Batch::where('merchant_id', $this->merchantId)
                ->where('status', 'yellow')
                ->where('discount_type', 'manually_discounted')->count(),
            'null_discount_type'  => Batch::where('merchant_id', $this->merchantId)
                ->where('status', 'yellow')
                ->whereNull('discount_type')->count(),
        ]);

        if ($pendingBatches->isEmpty()) {
            Log::info('[AUTO DISCOUNT] لا توجد باتشات معلقة — إنهاء', [
                'merchant_id' => $this->merchantId,
            ]);
            // مع ذلك شغّل CheckBatchExpiryJob لمزامنة الخيارات
            CheckBatchExpiryJob::dispatch();
            return;
        }

        try {
            $sallaApi = SallaApiService::for($merchant);
        } catch (\Exception $e) {
            Log::error("[AUTO DISCOUNT] فشل الاتصال بسلة: " . $e->getMessage());
            return;
        }

        $applied   = 0;
        $skipped   = 0;
        $failed    = 0;

        foreach ($pendingBatches as $batch) {
            $batchId = $batch->id;
            $batchCode = $batch->batch_code;

            try {
                $discountPercent = $this->calculateDiscountPercentage($batch, $settings);

                Log::info('[AUTO DISCOUNT] معالجة باتش', [
                    'batch_id'          => $batchId,
                    'batch_code'        => $batchCode,
                    'discount_percent'  => $discountPercent,
                    'days_until_expiry' => $batch->days_until_expiry,
                    'has_variants'      => $batch->batchItems->filter(
                        fn($i) => $i->salla_variant_id && $i->salla_variant_id > 0
                    )->isNotEmpty(),
                ]);

                if ($discountPercent <= 0) {
                    Log::info("[AUTO DISCOUNT] تم التجاوز (نسبة 0)", ['batch_id' => $batchId]);
                    $skipped++;
                    continue;
                }

                $this->applyDiscount($sallaApi, $batch, $discountPercent);

                // ✅ تحديث الحالة بعد التطبيق الفعلي على سلة
                $batch->discount_type = 'auto_discounted';
                $batch->save();

                $applied++;
                Log::info("[AUTO DISCOUNT] ✅ تم التطبيق", [
                    'batch_id' => $batchId,
                    'percent'  => $discountPercent,
                ]);

            } catch (\Exception $e) {
                $failed++;
                Log::error("[AUTO DISCOUNT] ❌ فشل الباتش {$batchId}", [
                    'batch_id'  => $batchId,
                    'error'     => $e->getMessage(),
                    'trace'     => $e->getTraceAsString(),
                ]);
            }
        }

        Log::info('[AUTO DISCOUNT] ✅ تقرير الإنجاز', [
            'merchant_id' => $this->merchantId,
            'total'       => $pendingCount,
            'applied'     => $applied,
            'skipped'     => $skipped,
            'failed'      => $failed,
        ]);

        Cache::forget("harees_dashboard_{$this->merchantId}");
        Cache::forget("harees_dashboard_api_{$this->merchantId}");

        // ─── تشغيل CheckBatchExpiryJob لمزامنة خيارات سلة ───
        // الـ Job هذا يقوم بإنشاء/تحديث خيار "بيانات الدفعة" لكل منتج
        // وربط variant_id مع batch_items
        Log::info('[AUTO DISCOUNT] تشغيل CheckBatchExpiryJob لمزامنة سلة');
        CheckBatchExpiryJob::dispatch();
    }

    private function calculateDiscountPercentage(Batch $batch, BatchSetting $settings): float
    {
        if ($batch->custom_discount_percentage !== null && $batch->custom_discount_percentage > 0) {
            return (float) $batch->custom_discount_percentage;
        }
        if (!$settings->auto_discounts) return 0;

        $daysLeft = $batch->days_until_expiry ?? 0;
        if ($daysLeft < 0) return 0;

        $durationDays = ($settings->auto_discount_duration_days > 0)
            ? $settings->auto_discount_duration_days : 7;
        $discountPercent = (float) ($settings->auto_discount_percent ?? 20);

        if ($daysLeft <= $durationDays && $discountPercent > 0) {
            return $discountPercent;
        }
        return 0;
    }

    private function applyDiscount(SallaApiService $sallaApi, Batch $batch, float $discountPercent): void
    {
        $batchItems = $batch->batchItems;
        if ($batchItems->isEmpty()) return;

        $variantItems = $batchItems->filter(fn($item) => $item->salla_variant_id && $item->salla_variant_id > 0);

        if ($variantItems->isNotEmpty()) {
            foreach ($variantItems as $item) {
                $product = $item->product;
                if (!$product || !$product->salla_product_id) {
                    Log::warning("[AUTO DISCOUNT] تخطي — المنتج ليس له salla_product_id", [
                        'batch_item_id' => $item->id,
                    ]);
                    continue;
                }

                $variantData  = $product->getVariantById($item->salla_variant_id) ?? [];
                $currentSku   = $variantData['sku'] ?? $product->sku ?? null;
                $currentPrice = (float) ($variantData['price'] ?? 0);
                $batchItemQty = (int) ($item->variant_quantity ?? $item->quantity ?? 0);

                if (!$currentSku) {
                    Log::warning("[AUTO DISCOUNT] تخطي — لا يوجد SKU للـ variant", [
                        'salla_variant_id' => $item->salla_variant_id,
                    ]);
                    continue;
                }

                $salePrice = round($currentPrice * (1 - $discountPercent / 100), 2);
                if ($salePrice >= $currentPrice) {
                    Log::warning("[AUTO DISCOUNT] تخطي — سعر الخصم >= السعر الأصلي", [
                        'price'     => $currentPrice,
                        'sale_price' => $salePrice,
                    ]);
                    continue;
                }

                $sallaApi->updateBatchVariant($item->salla_variant_id, [
                    'price'      => $currentPrice,
                    'sale_price' => $salePrice,
                ]);

                Log::info("[AUTO DISCOUNT] ✅ تم تطبيق الخصم على variant {$item->salla_variant_id}", [
                    'original_price' => $currentPrice,
                    'sale_price'     => $salePrice,
                    'discount_pct'   => $discountPercent,
                    'stock_qty'      => $batchItemQty,
                ]);
            }
        } else {
            $batchItem = $batchItems->first();
            $product   = $batchItem?->product;
            if (!$product || !$product->salla_product_id) return;

            $productData    = $sallaApi->getProduct($product->salla_product_id);
            $productDetails = $productData['data'] ?? [];
            $currentPrice   = (float) ($productDetails['price']['amount'] ?? $product->price ?? 0);

            if ($currentPrice <= 0) return;

            $salePrice = round($currentPrice * (1 - $discountPercent / 100), 2);
            if ($salePrice >= $currentPrice) return;

            $sallaApi->updateProductPrice($product->salla_product_id, $currentPrice, $salePrice);

            Log::info("[AUTO DISCOUNT] ✅ تم تطبيق الخصم على المنتج {$product->id}", [
                'original_price' => $currentPrice,
                'sale_price'     => $salePrice,
            ]);
        }
    }
}
