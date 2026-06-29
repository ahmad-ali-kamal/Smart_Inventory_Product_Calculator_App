<?php

namespace App\Http\Controllers\Harees;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Batch;
use App\Models\BatchSetting;
use App\Models\BatchDiscount;
use App\Models\ActivityLog;
use App\Services\SallaApiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DiscountController extends Controller
{
    // =========================================================
    // اقتراح الخصم (يحسب النسبة بناءً على إعدادات التاجر)
    // =========================================================

    public function suggest(Request $request, Product $product)
    {
        $this->authorize('update', $product);

        $batchId = $request->input('batch_id');

        if ($batchId) {
            $batch = Batch::where('id', $batchId)
                ->where('merchant_id', $product->merchant_id)
                ->first();
        } else {
            $batch = $product->batch;
        }

        if (!$batch || $batch->status !== 'yellow') {
            return response()->json(['message' => 'لا توجد دفعات تحتاج إلى خصم'], 400);
        }

        $days     = $batch->days_until_expiry;
        $merchant = $product->merchant;

        $setting = BatchSetting::where('merchant_id', $merchant->id)->first();

        if ($setting && $setting->auto_discounts) {
            $suggestedDiscount = $this->calcAutoDiscount($days, $setting);
            $discountMode      = 'auto';
        } else {
            $suggestedDiscount = (int) ($setting->fixed_discount_percentage ?? 20);
            $discountMode      = 'fixed';
        }

        return response()->json([
            'discount_percentage' => $suggestedDiscount,
            'discount_mode'       => $discountMode,
            'days_until_expiry'   => $days,
            'reasoning'           => $this->buildReasoning($product, $batch, $days, $suggestedDiscount),
            'batch' => [
                'id'               => $batch->id,
                'expiry_date'      => $batch->expiry_date->format('Y-m-d'),
                'days_until_expiry'=> $days,
                'quantity'         => $batch->batch_qty ?? 0,
            ],
        ]);
    }

    // =========================================================
    // تطبيق الخصم على الـ Variant مباشرةً عبر سلة API
    // =========================================================

    public function apply(Request $request, Product $product)
    {
        $this->authorize('update', $product);

        $validated = $request->validate([
            'discount_percentage' => 'required|numeric|min:1|max:90',
            'ends_at'             => 'nullable|date|after:today',
            'batch_id'            => 'nullable|exists:batches,id',
        ]);

        $merchant = $product->merchant;

        if (!empty($validated['batch_id'])) {
            $batch = Batch::where('id', $validated['batch_id'])
                ->where('merchant_id', $merchant->id)
                ->first();
        } else {
            $batch = $product->batch;
        }

        if (!$batch) {
            return response()->json(['success' => false, 'message' => 'الدفعة غير موجودة'], 404);
        }

        if ($batch->status !== 'yellow') {
            return response()->json([
                'success' => false,
                'message' => 'الخصم يُطبَّق فقط على الدفعات الصفراء (القريبة من الانتهاء)',
            ], 422);
        }

        try {
            $sallaApi    = SallaApiService::for($merchant);
            $discountPct = (float) $validated['discount_percentage'];

            $this->ensureOriginalDataStored($batch, $product, $sallaApi);

            $variantIds = $batch->batchVariants()->pluck('variant_id');

            if ($variantIds->isEmpty()) {
                $currentPrice = (float) ($batch->original_price ?: ($product->price ?? 0));
                $salePrice    = round($currentPrice * (1 - $discountPct / 100), 2);

                $sallaApi->updateProductPrice($product->salla_product_id, $currentPrice, $salePrice);

                $batchQty = $batch->batch_qty ?? 0;
                if ($batchQty > 0) {
                    $sallaApi->updateProductQuantity($product->salla_product_id, $batchQty);
                }

                $this->saveDiscountRecord($batch, $discountPct, $product, $validated['ends_at']);

                \Cache::forget("harees_dashboard_{$merchant->id}");
                \Cache::forget("harees_dashboard_api_{$merchant->id}");

                return response()->json([
                    'success'        => true,
                    'message'        => "تم تطبيق الخصم على المنتج بنجاح",
                    'sale_price'     => $salePrice,
                ]);
            }

            $appliedCount = 0;
            $savedLastSalePrice = null;

            foreach ($batch->batchVariants as $batchVariant) {
                $variantId = $batchVariant->variant_id;

                $originalVariantPrices = $batch->original_variant_prices ?? [];
                $matchedPrice = null;
                foreach ($originalVariantPrices as $ovp) {
                    if ((int) ($ovp['variant_id'] ?? 0) === (int) $variantId) {
                        $matchedPrice = (float) ($ovp['price'] ?? 0);
                        break;
                    }
                }

                $currentPrice = $matchedPrice ?: (float) ($product->price ?? 0);

                $salePrice = round($currentPrice * (1 - $discountPct / 100), 2);

                $variantRes = $sallaApi->updateBatchVariant($variantId, [
                    'price'      => $currentPrice,
                    'sale_price' => $salePrice,
                    'stock_quantity' => $batchVariant->batch_qty ?? 0,
                ]);

                if (!$variantRes) {
                    Log::error('[Discount] فشل تحديث السعر في سلة', ['variant_id' => $variantId]);
                    continue;
                }

                $appliedCount++;
                $savedLastSalePrice = $salePrice;

                Log::info('[Discount] تم تطبيق الخصم على الـ Variant', [
                    'variant_id'     => $variantId,
                    'original_price' => $currentPrice,
                    'sale_price'     => $salePrice,
                    'discount_pct'   => $discountPct,
                ]);
            }

            if ($appliedCount === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'فشل تطبيق الخصم على أي variant — راجع الـ logs',
                ], 500);
            }

            $this->saveDiscountRecord($batch, $discountPct, $product, $validated['ends_at']);

            \Cache::forget("harees_dashboard_{$merchant->id}");
            \Cache::forget("harees_dashboard_api_{$merchant->id}");

            return response()->json([
                'success'        => true,
                'message'        => "تم تطبيق الخصم على {$appliedCount} variant(s) بنجاح",
                'sale_price'     => $savedLastSalePrice,
                'applied_count'  => $appliedCount,
            ]);

        } catch (\Exception $e) {
            Log::error('[Discount] فشل تطبيق الخصم', [
                'product_id' => $product->id,
                'batch_id'   => $batch->id,
                'error'      => $e->getMessage(),
            ]);
            return response()->json(['success' => false, 'message' => 'فشل تطبيق الخصم'], 500);
        }
    }

    private function ensureOriginalDataStored(Batch $batch, Product $product, SallaApiService $sallaApi): void
    {
        if ($batch->original_price !== null && $batch->original_qty !== null) return;

        try {
            $data = $sallaApi->getProduct($product->salla_product_id);
            $productData = $data['data'] ?? [];

            $originalPrice = (float) ($productData['price']['amount'] ?? $product->price ?? 0);
            $originalQty   = (int) ($productData['quantity'] ?? $product->quantity ?? 0);

            $originalVariantPrices = [];
            $originalVariantQtys   = [];
            $variants = $productData['variants'] ?? [];
            if (!empty($variants)) {
                foreach ($variants as $v) {
                    if (isset($v['id'])) {
                        $originalVariantPrices[] = ['variant_id' => $v['id'], 'price' => (float) ($v['price']['amount'] ?? 0)];
                        $originalVariantQtys[]   = ['variant_id' => $v['id'], 'qty' => (int) ($v['stock_quantity'] ?? 0)];
                    }
                }
            }

            $batch->update([
                'original_price'         => $originalPrice,
                'original_qty'           => $originalQty,
                'original_variant_prices' => !empty($originalVariantPrices) ? $originalVariantPrices : null,
                'original_variant_qtys'   => !empty($originalVariantQtys) ? $originalVariantQtys : null,
            ]);

            Log::info('[Discount] تم حفظ البيانات الأصلية', [
                'batch_id' => $batch->id,
                'price'    => $originalPrice,
                'qty'      => $originalQty,
            ]);
        } catch (\Exception $e) {
            Log::warning('[Discount] فشل حفظ البيانات الأصلية: ' . $e->getMessage());
        }
    }

    private function saveDiscountRecord(Batch $batch, float $discountPct, Product $product, ?string $endsAt): void
    {
        BatchDiscount::where('batch_id', $batch->id)
            ->where('status', 'active')
            ->update(['status' => 'cancelled']);

        BatchDiscount::create([
            'batch_id'            => $batch->id,
            'discount_percentage' => $discountPct,
            'starts_at'           => now(),
            'ends_at'             => $endsAt ?? $batch->expiry_date->toDateTimeString(),
            'status'              => 'active',
            'created_by'          => auth()->id(),
        ]);

        $batch->markAsManuallyDiscounted();

        ActivityLog::log(
            $product->merchant_id,
            'discount_applied',
            "تم تطبيق خصم {$discountPct}% على المنتج: {$product->name}",
            $product,
            ['batch_id' => $batch->id]
        );
    }

    // =========================================================
    // تطبيق الخصم على كل الدفعات الصفراء للمنتج دفعةً واحدة
    // =========================================================

    public function applyToAllYellow(Request $request, Product $product)
    {
        $this->authorize('update', $product);
        $merchant = $product->merchant;
        $sallaApi = SallaApiService::for($merchant);
        $setting  = BatchSetting::where('merchant_id', $merchant->id)->first();

        $batch = $product->batch;

        if (!$batch || $batch->status !== 'yellow') {
            return response()->json(['success' => false, 'message' => 'لا توجد دفعات صفراء مزامَنة مع سلة'], 400);
        }

        $applied = 0;
        $days    = $batch->days_until_expiry;
        $discountPct = $setting?->auto_discounts
            ? $this->calcAutoDiscount($days, $setting)
            : (float) ($setting?->fixed_discount_percentage ?? 20);

        $variantIds = $batch->batchVariants()->pluck('variant_id');

        if ($variantIds->isNotEmpty()) {
            foreach ($batch->batchVariants as $batchVariant) {
                $variantId = $batchVariant->variant_id;

                $variantData  = $product->getVariantById($variantId) ?? [];
                $currentSku   = $variantData['sku'] ?? $product->sku ?? null;
                $currentPrice = (float) ($variantData['price'] ?? $product->price ?? 0);

                if (!$currentSku) continue;

                $salePrice = round($currentPrice * (1 - $discountPct / 100), 2);

                $res = $sallaApi->updateBatchVariant($variantId, [
                    'price'      => $currentPrice,
                    'sale_price' => $salePrice,
                ]);

                if ($res) {
                    $this->saveDiscountRecord($batch, $discountPct, $product, null);
                    $applied++;
                }
            }
        } else {
            $currentPrice = (float) ($product->price ?? 0);
            $salePrice    = round($currentPrice * (1 - $discountPct / 100), 2);

            $sallaApi->updateProductPrice($product->salla_product_id, $currentPrice, $salePrice);
            $this->saveDiscountRecord($batch, $discountPct, $product, null);
            $applied = 1;
        }

        ActivityLog::log(
            $merchant->id,
            'discount_applied_bulk',
            "تم تطبيق الخصم على {$applied} دفعة صفراء للمنتج: {$product->name}",
            $product
        );

        return response()->json([
            'success' => true,
            'message' => "تم تطبيق الخصم على {$applied} دفعة",
            'applied' => $applied,
        ]);
    }

    // =========================================================
    // إلغاء الخصم — يُصفّر sale_price في سلة مباشرةً
    // =========================================================

    public function cancel(BatchDiscount $discount)
    {
        $discount->load('batch.product');
        $batch = $discount->batch;

        try {
            $product = $batch?->product;

            if ($product) {
                $sallaApi = SallaApiService::for($product->merchant);

                $variantIds = $batch->batchVariants()->pluck('variant_id');

                if ($variantIds->isNotEmpty()) {
                    $originalVariantPrices = $batch->original_variant_prices ?? [];
                    foreach ($batch->batchVariants as $batchVariant) {
                        $matchedPrice = null;
                        foreach ($originalVariantPrices as $ovp) {
                            if ((int) ($ovp['variant_id'] ?? 0) === (int) $batchVariant->variant_id) {
                                $matchedPrice = (float) ($ovp['price'] ?? 0);
                                break;
                            }
                        }
                        $restorePrice = $matchedPrice ?: (float) ($product->price ?? 0);

                        $sallaApi->updateBatchVariant($batchVariant->variant_id, [
                            'price'      => $restorePrice,
                            'sale_price' => 0,
                        ]);
                    }
                } else {
                    $restorePrice = (float) ($batch->original_price ?: ($product->price ?? 0));
                    $sallaApi->updateProductPrice($product->salla_product_id, $restorePrice, 0);
                }

                $originalQty = $batch->original_qty;
                if ($originalQty !== null && $originalQty > 0) {
                    $originalVariantQtys = $batch->original_variant_qtys ?? [];
                    if (!empty($originalVariantQtys)) {
                        $batchVariantMap = $batch->batchVariants->keyBy('variant_id');
                        foreach ($originalVariantQtys as $ovq) {
                            $variantId = $ovq['variant_id'] ?? null;
                            if (!$variantId) continue;
                            $originalStock = (int) ($ovq['qty'] ?? 0);
                            $bv = $batchVariantMap->get($variantId);
                            if ($bv) {
                                $soldDuringBatch = $bv->total_qty - $bv->batch_qty;
                                $restoreQty = max(0, $originalStock - $soldDuringBatch);
                            } else {
                                $restoreQty = $originalStock;
                            }
                            $sallaApi->updateBatchVariant($variantId, [
                                'stock_quantity' => $restoreQty,
                            ]);
                        }
                    } else {
                        $restoreQty = $originalQty;
                        if ($batch->total_qty && $batch->batch_qty !== null) {
                            $soldDuringBatch = $batch->total_qty - $batch->batch_qty;
                            $restoreQty = max(0, $originalQty - $soldDuringBatch);
                        }
                        $sallaApi->updateProductQuantity($product->salla_product_id, $restoreQty);
                    }
                }
            }

            $discount->cancel();

            if ($batch) {
                $batch->markAsPending();
            }

            if ($product) {
                ActivityLog::log(
                    auth()->id(),
                    'discount_cancelled',
                    "تم إلغاء الخصم على المنتج: {$product->name}",
                    $product
                );
            }

            return response()->json(['success' => true, 'message' => 'تم إلغاء الخصم']);

        } catch (\Exception $e) {
            Log::error('[Discount] فشل إلغاء الخصم: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'فشل إلغاء الخصم'], 500);
        }
    }

    // =========================================================
    // إخفاء المنتج (للمنتجات ذات الدفعات الحمراء فقط)
    // =========================================================

    public function hideProduct(Product $product)
    {
        $this->authorize('update', $product);

        if (!$product->isExpired()) {
            return back()->with('error', 'يمكن إخفاء المنتجات المنتهية الصلاحية فقط');
        }

        try {
            $sallaApi = SallaApiService::for($product->merchant);
            // ✅ string مباشرة
            $sallaApi->updateProductStatusOnly($product->salla_product_id, 'hidden');

            $product->update(['status' => 'hidden']);

            ActivityLog::log(
                auth()->id(),
                'product_hidden',
                "تم إخفاء المنتج: {$product->name}",
                $product
            );

            return back()->with('success', 'تم إخفاء المنتج');

        } catch (\Exception $e) {
            return back()->with('error', 'فشل إخفاء المنتج');
        }
    }

    // =========================================================
    // إعادة التوفير (حذف الدفعات المنتهية)
    // =========================================================

    public function restock(Product $product)
    {
        $this->authorize('update', $product);

        $batch = $product->batch;

        if ($batch && $batch->status === 'red') {
            $merchant = $product->merchant;

            try {
                $sallaApi = SallaApiService::for($merchant);

                $this->cancelDiscountForBatch($batch, $product, $sallaApi);

                $originalQty = $batch->original_qty;
                if ($originalQty !== null && $originalQty > 0) {
                    $originalVariantQtys = $batch->original_variant_qtys ?? [];
                    if (!empty($originalVariantQtys)) {
                        $batchVariantMap = $batch->batchVariants->keyBy('variant_id');
                        foreach ($originalVariantQtys as $ovq) {
                            $variantId = $ovq['variant_id'] ?? null;
                            if (!$variantId) continue;
                            $originalStock = (int) ($ovq['qty'] ?? 0);
                            $bv = $batchVariantMap->get($variantId);
                            if ($bv) {
                                $soldDuringBatch = $bv->total_qty - $bv->batch_qty;
                                $restoreQty = max(0, $originalStock - $soldDuringBatch);
                            } else {
                                $restoreQty = $originalStock;
                            }
                            $sallaApi->updateBatchVariant($variantId, ['stock_quantity' => $restoreQty]);
                        }
                    } else {
                        $restoreQty = $originalQty;
                        if ($batch->total_qty && $batch->batch_qty !== null) {
                            $soldDuringBatch = $batch->total_qty - $batch->batch_qty;
                            $restoreQty = max(0, $originalQty - $soldDuringBatch);
                        }
                        $sallaApi->updateProductQuantity($product->salla_product_id, $restoreQty);
                    }
                }
            } catch (\Exception $e) {
                Log::warning('[Restock] فشل استعادة البيانات: ' . $e->getMessage());
            }

            $batch->batchVariants()->delete();
            $batch->delete();
        }

        ActivityLog::log(
            auth()->id(),
            'product_restocked',
            "تم إعادة توفير المنتج: {$product->name} (تم حذف الدفعة المنتهية)",
            $product
        );

        return back()->with('success', 'تم إعادة توفير المنتج. يمكنك الآن إضافة دفعات جديدة.');
    }

    private function cancelDiscountForBatch(Batch $batch, Product $product, SallaApiService $sallaApi): void
    {
        try {
            $originalPrice = $batch->original_price;
            $originalVariantPrices = $batch->original_variant_prices ?? [];

            $hasVariants = $batch->batchVariants()->exists();

            if ($hasVariants && !empty($originalVariantPrices)) {
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
            } elseif ($originalPrice !== null && $originalPrice > 0) {
                $sallaApi->updateProductPrice($product->salla_product_id, $originalPrice, 0);
            }

            BatchDiscount::where('batch_id', $batch->id)
                ->where('status', 'active')
                ->update(['status' => 'cancelled']);

            if ($batch->isAutoDiscounted() || $batch->isManuallyDiscounted()) {
                $batch->markAsPending();
            }
        } catch (\Exception $e) {
            Log::warning('[Restock] فشل إلغاء الخصم: ' . $e->getMessage());
        }
    }

    // =========================================================
    // Helpers
    // =========================================================

    /**
     * حساب نسبة الخصم الأوتوماتيكي بناءً على الأيام المتبقية
     * وإعدادات التاجر (medium_term_days كعتبة)
     */
    private function calcAutoDiscount(int $days, ?BatchSetting $setting): int
    {
        // عتبة التحذير (الصفراء) من إعدادات التاجر
        $threshold = (int) ($setting?->medium_term_days ?? 14);

        // كلما اقترب من الانتهاء كلما زاد الخصم
        if ($days <= 3)                        return 50;
        if ($days <= 7)                        return 40;
        if ($days <= (int) ($threshold / 2))   return 30;
        return 20; // قريب من بداية المرحلة الصفراء
    }

    private function buildReasoning(Product $product, Batch $batch, int $days, int $pct): string
    {
        return "المنتج '{$product->name}' — لديه {$days} يوم حتى انتهاء الصلاحية. " .
               "نقترح خصم {$pct}% لتصريف الدفعة في الوقت المتبقي.";
    }
}