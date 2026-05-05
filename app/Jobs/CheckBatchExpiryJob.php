<?php

namespace App\Jobs;

use App\Models\Batch;
use App\Models\BatchSetting;
use App\Models\Merchant;
use App\Models\Product;
use App\Notifications\BatchExpiryNotification;
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
        Log::info('[Harees Engine] 🚀 بدء دورة الفحص والمزامنة المركزية');

        Merchant::all()->each(function ($merchant) {
            if (!$merchant->name) return;

            Log::info("[Merchant] ▶ معالجة التاجر: {$merchant->name}");

            $settings = BatchSetting::where('merchant_id', $merchant->id)->first();
            if (!$settings) {
                Log::warning("[Merchant] لا إعدادات للتاجر {$merchant->id} — تم التجاوز");
                return;
            }

            try {
                $sallaApi = SallaApiService::for($merchant);

                // ─── 1. تحديث حالات جميع الباتشات ──────────────────────
                Batch::where('merchant_id', $merchant->id)
                    ->whereNotNull('expiry_date')
                    ->get()
                    ->each(function ($batch) use ($merchant) {
                        $oldStatus = $batch->status;
                        $batch->calculateStatus();
                        $batch->save();

                        if ($oldStatus !== $batch->status && in_array($batch->status, ['yellow', 'red'])) {
                            $merchant->notify(new BatchExpiryNotification($batch, $batch->status));
                        }
                    });

                // ─── 2. مزامنة خيار "بيانات الدفعة" لكل منتج ────────────
                $this->syncBatchOptionsForAllProducts($sallaApi, $merchant);

                // ─── 3. تطبيق الخصومات على الباتشات الصفراء ────────────
                // ⚠️ يجب تنفيذها بعد ربط variant_id!
                $this->applyDiscountsToYellowBatches($sallaApi, $merchant, $settings);

                // ─── 4. إخفاء المنتجات إذا كل الباتشات حمراء ────────────
                $this->hideProductsWithAllRedBatches($sallaApi, $merchant, $settings);

            } catch (\Throwable $e) {
                Log::error("[Merchant] خطأ في معالجة التاجر {$merchant->id}: " . $e->getMessage());
            }
        });

        Log::info('[Harees Engine] ✅ اكتملت دورة الفحص');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 2. مزامنة خيار "بيانات الدفعة" لكل منتج
    // ═══════════════════════════════════════════════════════════════════════

    private function syncBatchOptionsForAllProducts(SallaApiService $sallaApi, Merchant $merchant): void
    {
        Product::where('merchant_id', $merchant->id)
            ->whereHas('batchItems.batch')
            ->get()
            ->each(function ($product) use ($sallaApi) {
                $this->syncBatchOptionForProduct($sallaApi, $product);
            });
    }

    private function syncBatchOptionForProduct(SallaApiService $sallaApi, Product $product): void
    {
        if (!$product->salla_product_id) return;

        try {
            // جلب جميع الباتشات للمنتج
            $batches = $product->batchItems()
                ->with('batch')
                ->get()
                ->map(fn($item) => $item->batch)
                ->filter()
                ->unique('id');

            if ($batches->isEmpty()) return;

            // فلترة الباتشات: فقط الصفراء والخضراء (الحمراء تُحذف)
            $activeBatches = $batches->whereIn('status', ['yellow', 'green']);

            // جلب الخيارات الحالية من سلة
            $optionsResponse = $sallaApi->getProductOptions($product->salla_product_id);
            $currentOptions = $optionsResponse['data'] ?? [];

            // البحث عن خيار "بيانات الدفعة"
            $batchOption = collect($currentOptions)->firstWhere('name', SallaApiService::BATCH_OPTION_NAME);

            // ─── حالة 1: لا يوجد باتشات نشطة → حذف الخيار ────────────
            if ($activeBatches->isEmpty()) {
                if ($batchOption) {
                    $sallaApi->deleteProductOption($batchOption['id']);
                    Log::info("[BatchOption] حذف خيار للمنتج {$product->id} (لا باتشات نشطة)");
                }
                return;
            }

            // ─── حالة 2: يوجد باتشات نشطة ────────────────────────────

            // بناء قائمة القيم المطلوبة (كل batch = قيمة منفصلة)
            $valuesToKeep = $activeBatches->map(function ($batch) {
                return ['name' => $this->formatBatchName($batch)];
            })->values()->toArray();

            if (!$batchOption) {
                // إنشاء خيار جديد
                Log::info("[BatchOption] إنشاء خيار جديد للمنتج {$product->id}");
                $sallaApi->createProductOption(
                    $product->salla_product_id,
                    SallaApiService::BATCH_OPTION_NAME,
                    $valuesToKeep
                );
            } else {
                // تحديث الخيار الموجود
                Log::info("[BatchOption] تحديث خيار للمنتج {$product->id}");
                $sallaApi->updateProductOption(
                    $batchOption['id'],
                    SallaApiService::BATCH_OPTION_NAME,
                    $valuesToKeep
                );
            }

            // ─── ربط variant_id مع كل batch (الخطوة الحاسمة) ─────────
            $this->linkVariantsToBatches($sallaApi, $product, $activeBatches);

        } catch (\Throwable $e) {
            Log::error("[BatchOption] خطأ في مزامنة المنتج {$product->id}: " . $e->getMessage());
        }
    }

    /**
     * ربط variant_id من سلة مع batch في قاعدة البيانات
     */
    private function linkVariantsToBatches(SallaApiService $sallaApi, Product $product, $activeBatches): void
    {
        try {
            // جلب الـvariants من سلة
            $variantsResponse = $sallaApi->getProductVariants($product->salla_product_id);
            $variants = $variantsResponse['data'] ?? [];

            if (empty($variants)) {
                Log::warning("[LinkVariant] لا يوجد variants للمنتج {$product->id}");
                return;
            }

            // جلب الخيارات لمطابقة الأسماء
            $optionsResponse = $sallaApi->getProductOptions($product->salla_product_id);
            $options = $optionsResponse['data'] ?? [];

            // بناء خريطة: value_id => value_name
            $valueIdToName = [];
            foreach ($options as $option) {
                foreach ($option['values'] ?? [] as $value) {
                    $valueIdToName[$value['id']] = $value['name'];
                }
            }

            // مطابقة كل variant مع batch
            foreach ($variants as $variant) {
                $variantId = $variant['id'] ?? null;
                $relatedValueIds = $variant['related_option_values'] ?? [];

                if (!$variantId || empty($relatedValueIds)) continue;

                // جلب أسماء القيم المرتبطة
                $valueNames = array_map(fn($id) => $valueIdToName[$id] ?? null, $relatedValueIds);
                $valueNames = array_filter($valueNames);

                if (empty($valueNames)) continue;

                // البحث عن batch يطابق اسم القيمة
                foreach ($activeBatches as $batch) {
                    $batchName = $this->formatBatchName($batch);

                    if (in_array($batchName, $valueNames)) {
                        if ($batch->salla_variant_id !== $variantId) {
                            $batch->update(['salla_variant_id' => $variantId]);
                            Log::info("[LinkVariant] ✅ حفظ salla_variant_id={$variantId} للباتش {$batch->id} ({$batch->batch_code})");
                        }
                        break;
                    }
                }
            }

        } catch (\Throwable $e) {
            Log::error("[LinkVariant] خطأ في ربط variants للمنتج {$product->id}: " . $e->getMessage());
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 3. تطبيق الخصومات على الباتشات الصفراء
    // ═══════════════════════════════════════════════════════════════════════

    private function applyDiscountsToYellowBatches(SallaApiService $sallaApi, Merchant $merchant, BatchSetting $settings): void
    {
        $yellowBatches = Batch::where('merchant_id', $merchant->id)
            ->where('status', 'yellow')
            ->whereNotNull('salla_variant_id')
            ->get();

        if ($yellowBatches->isEmpty()) {
            Log::info('[Discount] لا يوجد باتشات صفراء لتطبيق الخصم');
            return;
        }

        Log::info("[Discount] 🟡 بدء تطبيق الخصومات على {$yellowBatches->count()} باتش");

        $yellowBatches->each(function ($batch) use ($sallaApi, $settings) {
            $this->applyDiscountToBatch($sallaApi, $batch, $settings);
        });
    }

    private function applyDiscountToBatch(SallaApiService $sallaApi, Batch $batch, BatchSetting $settings): void
    {
        try {
            // جلب تفاصيل الـvariant من سلة
            $variantDetails = $sallaApi->getVariantDetails($batch->salla_variant_id);
            $variantData = $variantDetails['data'] ?? [];

            // جلب بيانات المنتج والدفعة
            $batchItem = $batch->batchItems()->first();
            $product = $batchItem?->product;

            // الـ SKU من سلة أو من كود الدفعة
            $currentSKU = $variantData['sku'] ?? $batch->batch_code ?? ('B-' . $batch->id);

            // السعر: من سلة أو من المنتج
            $currentPrice = (float) ($variantData['price']['amount'] ?? $product?->price ?? $batch->price ?? 0);

            // الكمية: من جدول Product (حقل quantity)
            $currentStock = (int) ($product?->quantity ?? 0);

            Log::info('[Discount] بيانات الجلب:', [
                'variant_id'     => $batch->salla_variant_id,
                'sku'            => $currentSKU,
                'price'          => $currentPrice,
                'stock_quantity' => $currentStock,
                'product_quantity' => $product?->quantity,
            ]);

            if ($currentPrice <= 0) {
                Log::warning("[Discount] سعر الـvariant {$batch->salla_variant_id} = 0 - تم التجاوز");
                return;
            }

            // حساب نسبة الخصم
            $discountPercent = $this->calculateDiscountPercentage($batch, $settings);

            Log::info('[Discount] نسبة الخصم المحسوبة:', [
                'batch_id'       => $batch->id,
                'discount_pct'   => $discountPercent,
                'custom_discount' => $batch->custom_discount_percentage,
                'auto_discounts'  => $settings->auto_discounts,
                'days_left'      => $batch->days_until_expiry,
            ]);

            if ($discountPercent <= 0) {
                // لا خصم → إزالة sale_price (إذا كان موجوداً)
                if (isset($variantData['sale_price']['amount']) && $variantData['sale_price']['amount'] > 0) {
                    // جلب باقي البيانات لإرسال جميع الحقول المطلوبة
                    $barcode = $variantData['barcode'] ?? null;
                    $costPrice = (float) ($variantData['cost_price']['amount'] ?? $currentPrice);
                    $weight = (int) ($variantData['weight'] ?? 0);
                    $mpn = $variantData['mpn'] ?? null;
                    $gtin = $variantData['gtin'] ?? null;

                    $sallaApi->updateBatchVariant($batch->salla_variant_id, [
                        'sku'            => $currentSKU,
                        'barcode'        => $barcode,
                        'price'          => $currentPrice,
                        'cost_price'     => $costPrice,
                        'stock_quantity' => $currentStock,
                        'weight'         => $weight,
                        'mpn'            => $mpn,
                        'gtin'           => $gtin,
                        'sale_price'     => null, // إزالة الخصم
                    ]);
                    $batch->update(['applied_sale_price' => null]);
                    Log::info("[Discount] ❌ إزالة الخصم من الباتش {$batch->id}");
                }
                return;
            }

            // حساب السعر بعد الخصم
            $salePrice = round($currentPrice * (1 - $discountPercent / 100), 2);

            // التحقق من أن السعر المخفض أقل من الأصلي
            if ($salePrice >= $currentPrice) {
                Log::warning("[Discount] سعر الخصم ({$salePrice}) >= الأصلي ({$currentPrice})!");
                return;
            }

            // تطبيق الخصم - إرسال جميع الحقول المطلوبة согласно توثيق سلة
            // جلب البيانات الكاملة من variant موجود
            $barcode = $variantData['barcode'] ?? null;
            $costPrice = (float) ($variantData['cost_price']['amount'] ?? $currentPrice);
            $weight = (int) ($variantData['weight'] ?? 0);
            $mpn = $variantData['mpn'] ?? null;
            $gtin = $variantData['gtin'] ?? null;

            Log::info('[Discount] ✅ إرسال ALL الحقول:', [
                'variant_id'     => $batch->salla_variant_id,
                'sku'            => $currentSKU,
                'barcode'        => $barcode,
                'price'          => $currentPrice,
                'sale_price'     => $salePrice,
                'cost_price'     => $costPrice,
                'stock_quantity' => $currentStock,
                'weight'         => $weight,
                'mpn'            => $mpn,
                'gtin'           => $gtin,
            ]);

            $sallaApi->updateBatchVariant($batch->salla_variant_id, [
                'sku'            => $currentSKU,
                'barcode'        => $barcode,
                'price'          => $currentPrice,
                'sale_price'     => $salePrice,
                'cost_price'     => $costPrice,
                'stock_quantity' => $currentStock,
                'weight'         => $weight,
                'mpn'            => $mpn,
                'gtin'           => $gtin,
            ]);

            $batch->update(['applied_sale_price' => $salePrice]);

            Log::info("[Discount] ✅ تطبيق خصم {$discountPercent}% على Batch {$batch->id} ({$currentPrice} → {$salePrice} SAR)");

        } catch (\Throwable $e) {
            Log::warning("[Discount] تعذّر تطبيق الخصم على الباتش {$batch->id}: " . $e->getMessage());
        }
    }

    /**
     * حساب نسبة الخصم حسب الأولوية:
     * 1. خصم مخصص للباتش (custom_discount_percentage)
     * 2. خصم تلقائي حسب الأيام المتبقية
     *
     * @return float نسبة الخصم (0-100)
     */
    private function calculateDiscountPercentage(Batch $batch, BatchSetting $settings): float
    {
        // 1. خصم مخصص للباتش له الأولوية
        if ($batch->custom_discount_percentage !== null && $batch->custom_discount_percentage > 0) {
            return (float) $batch->custom_discount_percentage;
        }

        // 2. خصم تلقائي
        if (!$settings->auto_discounts) {
            Log::info('[Discount] الخصم التلقائي معطل في الإعدادات');
            return 0;
        }

        $daysLeft = $batch->days_until_expiry ?? 0;
        if ($daysLeft < 0) return 0; // منتهي الصلاحية

        // جلب إعدادت الخصم - استخدام default إذا كانت 0
        $rawDurationDays = $settings->auto_discount_duration_days ?? 0;
        $durationDays = ($rawDurationDays > 0) ? $rawDurationDays : 7; // default to 7 if 0 or null
        $discountPercent = (float) ($settings->auto_discount_percent ?? 20); // default to 20%

        Log::info('[Discount] إعدادات الخصم (after defaults):', [
            'raw_duration'     => $rawDurationDays,
            'duration_days'    => $durationDays,
            'discount_percent' => $discountPercent,
            'days_left'        => $daysLeft,
            'will_apply'       => ($daysLeft <= $durationDays && $discountPercent > 0),
        ]);

        // إذا كان durationDays عدد صحيح (Integer) وليس JSON
        if (is_numeric($durationDays)) {
            // خصم واحد فقط: إذا كانت الأيام المتبقية <= threshold
            if ($daysLeft <= (int) $durationDays && $discountPercent > 0) {
                Log::info('[Discount] ✅ خصم تلقائي: أيام=' . $daysLeft . ' <= ' . $durationDays . ' → خصم ' . $discountPercent . '%');
                return $discountPercent;
            }
            return 0;
        }

        // إذا كان JSON - تحليل كما كان
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

        // البحث عن أكبر خصم ينطبق
        $applicableDiscount = 0;
        foreach ($autoDiscounts as $discountPct => $minDays) {
            if ($daysLeft <= (int)$minDays) {
                $applicableDiscount = max($applicableDiscount, (float)$discountPercent);
            }
        }

        return $applicableDiscount;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 4. إخفاء المنتجات إذا كل الباتشات حمراء
    // ═══════════════════════════════════════════════════════════════════════

    private function hideProductsWithAllRedBatches(SallaApiService $sallaApi, Merchant $merchant, BatchSetting $settings): void
    {
        if (!$settings->auto_hide_expired) {
            Log::info('[AutoHide] الإخفاء التلقائي معطّل في الإعدادات');
            return;
        }

        Product::where('merchant_id', $merchant->id)
            ->whereHas('batchItems.batch')
            ->get()
            ->each(function ($product) use ($sallaApi) {
                $batches = $product->batchItems()
                    ->with('batch')
                    ->get()
                    ->map(fn($item) => $item->batch)
                    ->filter();

                if ($batches->isEmpty()) return;

                // هل كل الباتشات حمراء؟
                $allRed = $batches->every(fn($batch) => $batch && $batch->status === 'red');

                $newStatus = $allRed ? 'hidden' : 'sale';

                if ($product->status !== $newStatus && $product->salla_product_id) {
                    try {
                        $sallaApi->updateProductStatusOnly($product->salla_product_id, $newStatus);
                        $product->update(['status' => $newStatus]);
                        Log::info("[AutoHide] {$product->name} → {$newStatus}");
                    } catch (\Throwable $e) {
                        Log::error("[AutoHide] خطأ في المنتج {$product->id}: " . $e->getMessage());
                    }
                }
            });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Helpers
    // ═══════════════════════════════════════════════════════════════════════

    private function formatBatchName(Batch $batch): string
    {
        $code = $batch->batch_code ?? 'B-' . $batch->id;
        $date = $batch->expiry_date ? $batch->expiry_date->format('Y-m-d') : 'Unknown';
        return "{$code} - {$date}";
    }
}