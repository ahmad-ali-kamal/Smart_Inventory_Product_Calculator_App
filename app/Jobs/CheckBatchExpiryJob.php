<?php

namespace App\Jobs;

use App\Models\Batch;
use App\Models\BatchItem;
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
            ->with('batchItems.batch')
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

            // جلب الخيارات الحالية من سلة
            $optionsResponse = $sallaApi->getProductOptions($product->salla_product_id);
            $currentOptions = $optionsResponse['data'] ?? [];

            // البحث عن خيار "بيانات الدفعة"
            $batchOption = collect($currentOptions)->firstWhere('name', SallaApiService::BATCH_OPTION_NAME);

            // ─── لا يوجد باتشات في النظام ← حذف الخيار من سلة إن وجد ───
            if ($batches->isEmpty()) {
                if ($batchOption) {
                    $sallaApi->deleteProductOption($batchOption['id']);
                    Log::info("[BatchOption] حذف خيار للمنتج {$product->id} (لا باتشات في النظام)");
                }
                return;
            }

            // فلترة الباتشات: فقط الصفراء والخضراء (الحمراء تُحذف)
            $activeBatches = $batches->whereIn('status', ['yellow', 'green']);

            Log::info('[Batch Sync] بدء مزامنة خيار الدفعة', [
                'product_id'    => $product->id,
                'salla_product' => $product->salla_product_id,
                'active_count'  => $activeBatches->count(),
                'dates'         => $activeBatches->map(fn($b) => $b->expiry_date?->format('Y-m-d'))->values(),
            ]);

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

            Log::info('[Batch Option] ✅ تم مزامنة خيار الدفعة في سلة', [
                'product_id'    => $product->id,
                'option_exists' => !$batchOption ? 'created' : 'updated',
            ]);

            // ─── ربط variant_id مع كل batch (الخطوة الحاسمة) ─────────
            // قد تحتاج سلة وقتاً لإنشاء الـ compound variants (async)
            // لذلك نُعيد المحاولة في حال لم نجد أي compound variant
            $maxAttempts = 3;
            for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
                $linked = $this->linkVariantsToBatches($sallaApi, $product, $activeBatches);

                if ($linked) {
                    break; // تم الربط بنجاح
                }

                if ($attempt < $maxAttempts) {
                    $wait = $attempt * 3; // 3s, 6s
                    Log::info("[BatchOption] ⏳ انتظار {$wait}ث لإكمال إنشاء compound variants (محاولة {$attempt}/{$maxAttempts})");
                    sleep($wait);
                } else {
                    Log::warning("[BatchOption] ⚠️ لم يتم العثور على compound variants بعد {$maxAttempts} محاولات — سيتم المزامنة في الدورة القادمة");
                }
            }

        } catch (\Throwable $e) {
            Log::error("[BatchOption] خطأ في مزامنة المنتج {$product->id}: " . $e->getMessage());
        }
    }

    /**
     * ربط variant_id من سلة مع batch_items في قاعدة البيانات
     */
    private function linkVariantsToBatches(SallaApiService $sallaApi, Product $product, $activeBatches): bool
    {
        try {
            // ─── 1. جلب الـ compound variants من سلة ─────────────
            $variantsResponse = $sallaApi->getProductVariants($product->salla_product_id);
            $variants = $variantsResponse['data'] ?? [];

            if (empty($variants)) {
                Log::warning("[LinkVariant] لا يوجد variants للمنتج {$product->id}");
                return false;
            }

            // ─── 2. جلب الخيارات لمطابقة الأسماء ────────────────
            $optionsResponse = $sallaApi->getProductOptions($product->salla_product_id);
            $options = $optionsResponse['data'] ?? [];

            // بناء خريطة: value_id => value_name
            $valueIdToName = [];
            foreach ($options as $option) {
                foreach ($option['values'] ?? [] as $value) {
                    $valueIdToName[$value['id']] = $value['name'];
                }
            }

            // ─── 3. جلب جميع batch_items للمنتج دفعة واحدة ──────
            $allBatchItems = \App\Models\BatchItem::where('product_id', $product->id)
                ->get()
                ->groupBy('batch_id');

            // ─── 4. قائمة بأسماء تواريخ جميع الباتشات النشطة ─────
            $allDateNames = $activeBatches->map(fn($b) => $this->formatBatchName($b))->values()->toArray();

            // ─── 5. تصنيف الـ variants: compound (لها تاريخ) vs base ──
            // الـ compound variants فقط هي التي تحتوي على اسم تاريخ batch
            // الـ base variants ليس لها اسم تاريخ → نتخطاها
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

            Log::info('[Batch Sync] تصنيف الـ variants', [
                'product_id' => $product->id,
                'total'      => count($variants),
                'compound'   => count($compoundVariants),
                'base'       => count($variants) - count($compoundVariants),
                'dates'      => $allDateNames,
            ]);

            if (empty($compoundVariants)) {
                Log::warning('[Batch Sync] ⚠️ لا يوجد compound variants بعد — سلة لم تنشئها بعد (async)');
                return false;
            }

            // ─── 6. مطابقة كل compound variant مع batch_item ────
            $updatedCount = 0;
            foreach ($compoundVariants as $variant) {
                $variantId       = $variant['id'] ?? null;
                $relatedValueIds = $variant['related_option_values'] ?? [];

                if (!$variantId || empty($relatedValueIds)) {
                    continue;
                }

                $valueNames = array_values(array_filter(array_map(
                    fn($id) => $valueIdToName[$id] ?? null,
                    $relatedValueIds
                )));
                if (empty($valueNames)) {
                    continue;
                }

                // ─── 6a. إيجاد الـ batch المطابق ──────────────
                $matchedBatch    = null;
                $matchedDateName = null;
                foreach ($activeBatches as $batch) {
                    $dateName = $this->formatBatchName($batch);
                    if (in_array($dateName, $valueNames)) {
                        $matchedBatch    = $batch;
                        $matchedDateName = $dateName;
                        break;
                    }
                }

                // ─── إذا بلا batch → صفر ← تجاهل (هذا ليس variant باتش) ──
                if (!$matchedBatch) {
                    continue;
                }

                // ─── 6b. أسماء الخيارات الأساسية (بدون التاريخ) ──
                $baseOptionNames = array_values(array_filter(
                    $valueNames,
                    fn($n) => $n !== $matchedDateName
                ));
                if (empty($baseOptionNames)) {
                    continue;
                }

                // ─── 6c. جلب batch_items لهذا الباتش ────────────
                $batchItems = $allBatchItems->get($matchedBatch->id, collect())
                    ->sortBy('id')
                    ->values();

                // ─── 6d. البحث عن batch_item يطابق base option names ──
                $foundItem = null;
                $stockFromDb = 0;

                if ($batchItems->isNotEmpty()) {
                    foreach ($batchItems as $bi) {
                        if (!$bi->salla_variant_id) continue;

                        $lookupVariant = collect($variants)->firstWhere('id', (int) $bi->salla_variant_id);

                        if (!$lookupVariant) {
                            try {
                                $detailResponse = $sallaApi->getVariantDetails($bi->salla_variant_id);
                                if (!empty($detailResponse['data'])) {
                                    $lookupVariant = $detailResponse['data'];
                                }
                            } catch (\Exception $e) { /* 404 */ }
                        }

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

                // ─── 6e. تحضير السعر ──────────────────────────
                $priceData = $foundItem && $foundItem->salla_variant_id
                    ? (collect($variants)->firstWhere('id', (int) $foundItem->salla_variant_id) ?: $variant)
                    : $variant;

                // ─── 6f. دفع الكمية إلى سلة ────────────────────
                Log::info('[Variant Batch Sync]', [
                    'batch_id'                => $matchedBatch->id,
                    'batch_item_id'           => $foundItem?->id,
                    'matched'                 => $foundItem ? 'yes' : 'no',
                    'variant_name'            => implode(' / ', $baseOptionNames),
                    'variant_quantity_from_db'=> $stockFromDb,
                    'quantity_sent_to_salla'  => $stockFromDb,
                ]);

                try {
                    $sallaApi->updateBatchVariant($variantId, [
                        'stock_quantity' => $stockFromDb,
                        'price'          => (float) ($priceData['price']['amount'] ?? $priceData['price'] ?? 0),
                        'sale_price'     => (float) ($priceData['sale_price']['amount'] ?? $priceData['sale_price'] ?? 0),
                    ]);

                    if ($foundItem) {
                        $oldVariantId = $foundItem->salla_variant_id;
                        $foundItem->update([
                            'salla_variant_id' => $variantId,
                            'variant_quantity' => $stockFromDb,
                        ]);

                        Log::info('[Batch Sync] ✅ ربط compound variant', [
                            'batch_id'       => $matchedBatch->id,
                            'batch_item_id'  => $foundItem->id,
                            'old_variant_id' => $oldVariantId,
                            'new_variant_id' => $variantId,
                            'stock_to_push'  => $stockFromDb,
                        ]);
                    } else {
                        Log::info('[Batch Sync] ⏭️ compound variant لم يُربط — دفع 0', [
                            'variant_id'  => $variantId,
                            'batch_id'    => $matchedBatch->id,
                            'batch_name'  => $matchedDateName,
                            'base_options'=> $baseOptionNames,
                        ]);
                    }

                    $updatedCount++;
                } catch (\Exception $e) {
                    Log::error('[Batch Sync] فشل تحديث مخزون سلة', [
                        'variant_id' => $variantId,
                        'error'      => $e->getMessage(),
                    ]);
                }
            }

            if ($updatedCount > 0) {
                Log::info("[Batch Sync] ✅ تم تحديث {$updatedCount} compound variant(s) للمنتج {$product->id}");
            } else {
                Log::warning("[Batch Sync] ⚠️ لم يتم تحديث أي compound variant للمنتج {$product->id}");
            }
            return $updatedCount > 0;

        } catch (\Throwable $e) {
            Log::error("[LinkVariant] خطأ في ربط variants للمنتج {$product->id}: " . $e->getMessage());
            return false;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 3. تطبيق الخصومات على الباتشات الصفراء
    // ═══════════════════════════════════════════════════════════════════════

    private function applyDiscountsToYellowBatches(SallaApiService $sallaApi, Merchant $merchant, BatchSetting $settings): void
    {
        // جلب الباتشات الصفراء التي لها batch_items
        $yellowBatches = Batch::where('merchant_id', $merchant->id)
            ->where('status', 'yellow')
            ->whereHas('batchItems')
            ->with('batchItems.product')
            ->get();

        if ($yellowBatches->isEmpty()) {
            Log::info('[Discount] لا يوجد باتشات صفراء لتطبيق الخصم');
            return;
        }

        Log::info("[Discount] 🟡 معالجة {$yellowBatches->count()} باتش (auto_discounts=" . ($settings->auto_discounts ? 'ON' : 'OFF') . ")");

        $yellowBatches->each(function ($batch) use ($sallaApi, $settings) {
            $this->applyDiscountToBatch($sallaApi, $batch, $settings);
        });
    }

    /**
     * تطبيق الخصم لكل باتش بناءً على discount_type و auto_discounts
     *
     * ─── Non-Retroactive Rules (قواعد عدم التأثير الرجعي) ──────────────
     * manually_discounted → ممنوع اللمس بأي حال
     * auto_discounted     → ممنوع إعادة التطبيق (Non-Retroactive)
     * pending + ON        → طبق الخصم → auto_discounted
     * pending + OFF       → لا شيء (يبقى pending)
     */
    private function applyDiscountToBatch(SallaApiService $sallaApi, Batch $batch, BatchSetting $settings): void
    {
        try {
            // ─── قاعدة 1: الخصم اليدوي — ممنوع اللمس قطعياً ────────────
            if ($batch->isManuallyDiscounted()) {
                Log::info("[Discount] تخطي batch {$batch->id} — manually_discounted (ممنوع اللمس)");
                return;
            }

            // ─── قاعدة 2: الخصم التلقائي السابق — Non-Retroactive ──────
            if ($batch->isAutoDiscounted()) {
                Log::info("[Discount] تخطي batch {$batch->id} — auto_discounted (Non-Retroactive)");
                return;
            }

            // ─── قاعدة 3: pending + Auto Discount OFF → لا تفعل شيئاً ──
            if ($batch->isPending() && !$settings->auto_discounts) {
                Log::info("[Discount] تخطي batch {$batch->id} — pending + auto_discounts=OFF");
                return;
            }

            // ─── قاعدة 4: pending + Auto Discount ON → طبق الخصم ──────
            if ($batch->isPending() && $settings->auto_discounts) {
                $this->executeDiscountAndMark($sallaApi, $batch, $settings);
            }

        } catch (\Exception $e) {
            Log::error("[Discount] خطأ في الباتش {$batch->id}: " . $e->getMessage());
        }
    }

    /**
     * تنفيذ الخصم وتحديث الحالة إلى auto_discounted
     */
    private function executeDiscountAndMark(SallaApiService $sallaApi, Batch $batch, BatchSetting $settings): void
    {
        $batchItems = $batch->batchItems;
        if ($batchItems->isEmpty()) {
            $batchItems = $batch->batchItems()->get();
        }

        $variantItems = $batchItems->filter(fn($item) => $item->salla_variant_id && $item->salla_variant_id > 0);
        $discountPercent = $this->calculateDiscountPercentage($batch, $settings);

        Log::info('[Discount] نسبة الخصم المحسوبة:', [
            'batch_id'       => $batch->id,
            'discount_pct'   => $discountPercent,
            'has_variants'   => $variantItems->count() > 0,
            'days_left'      => $batch->days_until_expiry,
        ]);

        if ($discountPercent <= 0) {
            Log::info("[Discount] نسبة الخصم 0 للباتش {$batch->id} — تم التجاوز");
            return;
        }

        if ($variantItems->count() > 0) {
            $this->applyDiscountToVariants($sallaApi, $batch, $variantItems, $discountPercent);
        } else {
            $this->applyDiscountToProduct($sallaApi, $batch, $discountPercent);
        }

        // تحديث الحالة بعد تطبيق الخصم بنجاح
        $batch->markAsAutoDiscounted();
        Log::info("[Discount] ✅ الباتش {$batch->id} → auto_discounted");
    }

    /**
     * تطبيق الخصم على الـ variants المرتبطة بالـ batch
     */
    private function applyDiscountToVariants(SallaApiService $sallaApi, Batch $batch, $variantItems, float $discountPercent): void
    {
        $batchItem = $batch->batchItems->first();
        $product = $batchItem?->product;
        
        if (!$product || !$product->salla_product_id) {
            Log::warning("[Discount] المنتج ليس له salla_product_id");
            return;
        }
        
        // ─── جلب الـ variants الحالية من سلة ───
        $currentVariants = $sallaApi->getProductVariants($product->salla_product_id);
        $sallaVariants = $currentVariants['data'] ?? [];
        
        // ─── بناء خريطة: batch name → variant data ───
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
                // ─── إيجاد الـ variant من سلة ───
                $matchedVariant = null;
                
                // ─── البحث أولاً بالـ stored variant_id ───
                foreach ($sallaVariants as $sv) {
                    if ($sv['id'] == $storedVariantId) {
                        $matchedVariant = $sv;
                        break;
                    }
                }
                
                // ─── إذا لم يوجد، البحث بالاسم ───
                if (!$matchedVariant) {
                    foreach ($sallaVariants as $sv) {
                        // ─── تخطي المتغيرات المستخدمة ───
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
                
                // ─── إذا لم يتم العثور ───
                if (!$matchedVariant) {
                    Log::warning("[Discount] لم يتم العثور على variant للمباتش {$batch->id} - لا يوجد متغيرات متاحة");
                    continue;
                }
                
                $variantId = $matchedVariant['id'];
                $variantData = $matchedVariant;
                $currentPrice = (float) ($variantData['price']['amount'] ?? 0);
                $currentSku = $variantData['sku'] ?? null;
                $batchItemQuantity = $variantItem->variant_quantity ?? $variantItem->quantity ?? 0;

                // ─── إزالة الخصم ───
                if ($discountPercent <= 0) {
                    $sallaApi->updateBatchVariant($variantId, [
                        'price'      => $currentPrice,
                        'sale_price' => 0,
                    ]);
                    continue;
                }

                $salePrice = round($currentPrice * (1 - $discountPercent / 100), 2);

                if ($salePrice >= $currentPrice) {
                    continue;
                }

                // ─── تطبيق الخصم ───
                $sallaApi->updateBatchVariant($variantId, [
                    'price'      => $currentPrice,
                    'sale_price' => $salePrice,
                ]);
                
                $usedVariantIds[] = $variantId;
                Log::info("[Discount] ✅ خصم على Variant {$variantId}: {$currentPrice} → {$salePrice} SAR (stock: {$batchItemQuantity})");

            } catch (\Exception $e) {
                Log::error("[Discount] خطأ في تطبيق الخصم: " . $e->getMessage());
            }
        }

        // Note: Auto discounts do NOT create BatchDiscount records anymore
        // They are applied directly via Salla API
        $batch->update(['applied_sale_price' => $lastPrice ? round($lastPrice * (1 - $discountPercent / 100), 2) : null]);
    }

    /**
     * تطبيق الخصم على سعر المنتج (بدون variants)
     */
    private function applyDiscountToProduct(SallaApiService $sallaApi, Batch $batch, float $discountPercent): void
    {
        $batchItem = $batch->batchItems->first();
        $product = $batchItem?->product;

        if (!$product || !$product->salla_product_id) {
            Log::warning("[Discount] المنتج {$product?->id} ليس له salla_product_id");
            return;
        }

        try {
            // جلب تفاصيل المنتج من سلة
            $productData = $sallaApi->getProduct($product->salla_product_id);
            $productDetails = $productData['data'] ?? [];
            
            $currentPrice = (float) ($productDetails['price']['amount'] ?? $product->price ?? 0);

            if ($currentPrice <= 0) {
                Log::warning("[Discount] سعر المنتج {$product->id} = 0 - تم التجاوز");
                return;
            }

            // إزالة الخصم إذا كانت النسبة = 0
            if ($discountPercent <= 0) {
                if (isset($productDetails['sale_price']['amount']) && $productDetails['sale_price']['amount'] > 0) {
                    $sallaApi->updateProductPrice($product->salla_product_id, $currentPrice, null);
                }
                return;
            }

            // حساب السعر بعد الخصم
            $salePrice = round($currentPrice * (1 - $discountPercent / 100), 2);

            if ($salePrice >= $currentPrice) {
                Log::warning("[Discount] سعر الخصم ({$salePrice}) >= الأصلي ({$currentPrice})!");
                return;
            }

            // تطبيق الخصم على المنتج
            $sallaApi->updateProductPrice($product->salla_product_id, $currentPrice, $salePrice);

            $batch->update(['applied_sale_price' => $salePrice]);

            // Note: Auto discounts do NOT create BatchDiscount records anymore
            // They are applied directly via Salla API

            Log::info("[Discount] ✅ خصم على المنتج {$product->id}: {$currentPrice} → {$salePrice} SAR");

        } catch (\Exception $e) {
            Log::error("[Discount] خطأ في تطبيق الخصم على المنتج {$product->id}: " . $e->getMessage());
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
            ->with('batchItems.batch')
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
        $expiry = $batch->expiry_date;
        $dateStr = $expiry ? $expiry->format('Y-m-d') : 'Unknown';
        return "تاريخ انتهاء المنتج {$dateStr}";
    }
}