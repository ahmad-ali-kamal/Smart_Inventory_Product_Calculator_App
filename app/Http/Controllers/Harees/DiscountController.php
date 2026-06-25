<?php

namespace App\Http\Controllers\Harees;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Batch;
use App\Models\BatchItem;
use App\Models\BatchSetting;
use App\Models\BatchDiscount;
use App\Models\ActivityLog;
use App\Services\SallaApiService;
use App\Jobs\Harees\UpdateBatchOptionsJob;
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
                ->with('batchItems')
                ->first();
        } else {
            $batchItem = $product->batchItems()
                ->whereHas('batch', fn($q) => $q->where('status', 'yellow'))
                ->with('batch')
                ->get()
                ->sortBy('batch.days_until_expiry')
                ->first();
            $batch = $batchItem?->batch;
        }

        if (!$batch) {
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

        $batchItem = $batch->batchItems->first();

        return response()->json([
            'discount_percentage' => $suggestedDiscount,
            'discount_mode'       => $discountMode,
            'days_until_expiry'   => $days,
            'reasoning'           => $this->buildReasoning($product, $batch, $batchItem, $days, $suggestedDiscount),
            'batch' => [
                'id'               => $batch->id,
                'batch_code'       => $batch->batch_code,
                'salla_variant_id' => $batchItem?->salla_variant_id,
                'quantity'         => $batchItem?->quantity ?? 0,
                'days_until_expiry'=> $days,
                'expiry_date'      => $batch->expiry_date->format('Y-m-d'),
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

        // ─── تحديد الدفعة المستهدفة ───────────────────────────────────
        if (!empty($validated['batch_id'])) {
            $batch = Batch::where('id', $validated['batch_id'])
                ->where('merchant_id', $merchant->id)
                ->first();

            if (!$batch) {
                return response()->json(['success' => false, 'message' => 'الدفعة غير موجودة'], 404);
            }

            if ($batch->status !== 'yellow') {
                return response()->json([
                    'success' => false,
                    'message' => 'الخصم يُطبَّق فقط على الدفعات الصفراء (القريبة من الانتهاء)',
                ], 422);
            }
        } else {
            // أقرب دفعة صفراء تلقائياً
            $batchItem = $product->batchItems()
                ->whereHas('batch', fn($q) => $q->where('status', 'yellow'))
                ->with('batch')
                ->get()
                ->sortBy('batch.days_until_expiry')
                ->first();

            if (!$batchItem || !$batchItem->batch) {
                return response()->json([
                    'success' => false,
                    'message' => 'لا توجد دفعات صفراء لتطبيق الخصم عليها',
                ], 400);
            }
            $batch = $batchItem->batch;
        }

        try {
            // ─── جلب جميع batchItems لهذه الدفعة ───────────────────
            $sallaApi          = SallaApiService::for($merchant);
            $discountPct       = (float) $validated['discount_percentage'];
            $batchItems        = BatchItem::where('batch_id', $batch->id)->get();

            if ($batchItems->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'هذه الدفعة لم تُزامَن مع سلة بعد — شغّل المزامنة أولاً',
                ], 422);
            }

            $appliedCount = 0;
            $savedLastSalePrice = null;

            foreach ($batchItems as $batchItem) {
                $variantId = $batchItem->salla_variant_id;

                if (!$variantId) {
                    Log::warning('[Discount] تخطي batch_item بدون salla_variant_id', ['batch_item_id' => $batchItem->id]);
                    continue;
                }

                // حساب السعر بعد الخصم
                $originalPrice  = (float) ($batchItem->unit_cost ?? $product->price ?? 0);
                $salePrice      = round($originalPrice * (1 - $discountPct / 100), 2);

                // ✅ جلب بيانات الـ Variant من المخزن المحلي
                $variantData    = $product->getVariantById($variantId) ?? [];
                $currentSku     = $variantData['sku'] ?? $product->sku ?? null;
                $currentPrice   = (float) ($variantData['price'] ?? $originalPrice);

                if (!$currentSku) {
                    Log::warning('[Discount] لا يوجد SKU للـ variant - لا يمكن التحديث', ['variant_id' => $variantId]);
                    continue;
                }

                Log::info('[Discount] بيانات الإرسال:', [
                    'variant_id'     => $variantId,
                    'sku'            => $currentSku,
                    'price'          => $currentPrice,
                    'sale_price'     => $salePrice,
                ]);

                // ✅ تحديث الـ Variant — updateBatchVariant يحافظ على المخزون الحالي
                $variantRes = $sallaApi->updateBatchVariant($variantId, [
                    'price'      => $currentPrice,
                    'sale_price' => $salePrice,
                ]);

                if (!$variantRes) {
                    Log::error('[Discount] فشل تحديث السعر في سلة', ['variant_id' => $variantId]);
                    continue;
                }

                $appliedCount++;
                $savedLastSalePrice = $salePrice;

                Log::info('[Discount] ✅ تم تطبيق الخصم على الـ Variant', [
                    'variant_id'     => $variantId,
                    'original_price' => $originalPrice,
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

            // ─── حفظ سجل الخصم في قاعدة البيانات ────────────────────
            // ألغِ أي خصم نشط سابق على نفس الدفعة
            BatchDiscount::where('batch_id', $batch->id)
                ->where('status', 'active')
                ->update(['status' => 'cancelled']);

            $endsAt = $validated['ends_at']
                ?? $batch->expiry_date->toDateTimeString();

            $discount = BatchDiscount::create([
                'batch_id'            => $batch->id,
                'discount_percentage' => $discountPct,
                'starts_at'           => now(),
                'ends_at'             => $endsAt,
                'status'              => 'active',
                'created_by'         => auth()->id(),
            ]);

            // ✅ تحديث discount_type → manually_discounted
            // الخصم التلقائي لن يلمس هذا الباتش مستقبلاً
            $batch->markAsManuallyDiscounted();

            ActivityLog::log(
                $merchant->id,
                'discount_applied',
                "تم تطبيق خصم {$discountPct}% على {$appliedCount} variant(s) في الدفعة {$batch->batch_code} للمنتج: {$product->name}",
                $product,
                ['discount_id' => $discount->id, 'batch_id' => $batch->id, 'sale_price' => $savedLastSalePrice, 'applied_count' => $appliedCount]
            );

            \Cache::forget("harees_dashboard_{$merchant->id}");
            \Cache::forget("harees_dashboard_api_{$merchant->id}");

            UpdateBatchOptionsJob::dispatch();

            return response()->json([
                'success'        => true,
                'message'        => "تم تطبيق الخصم على {$appliedCount} variant(s) بنجاح",
                'original_price' => $savedLastSalePrice, // last variant's sale price as reference
                'sale_price'     => $savedLastSalePrice,
                'discount_id'    => $discount->id,
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

    // =========================================================
    // تطبيق الخصم على كل الدفعات الصفراء للمنتج دفعةً واحدة
    // =========================================================

    public function applyToAllYellow(Request $request, Product $product)
    {
        $this->authorize('update', $product);
        $merchant = $product->merchant;
        $sallaApi = SallaApiService::for($merchant);
        $setting  = BatchSetting::where('merchant_id', $merchant->id)->first();

        $yellowBatches = $product->batchItems()
            ->whereHas('batch', fn($q) => $q->where('status', 'yellow'))
            ->whereNotNull('salla_variant_id')
            ->with('batch')
            ->get();

        if ($yellowBatches->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'لا توجد دفعات صفراء مزامَنة مع سلة'], 400);
        }

        $applied = 0;
        foreach ($yellowBatches as $item) {
            $batch = $item->batch;
            // ✅ استخدام salla_variant_id من BatchItem بدلاً من Batch
            $variantId = $item->salla_variant_id;
            if (!$batch || !$variantId) continue;

            $days          = $batch->days_until_expiry;
            $discountPct   = $setting?->auto_discounts
                ? $this->calcAutoDiscount($days, $setting)
                : (float) ($setting?->fixed_discount_percentage ?? 20);

            $originalPrice = (float) ($item->unit_cost ?? $product->price ?? 0);
            $salePrice     = round($originalPrice * (1 - $discountPct / 100), 2);

            // ✅ جلب بيانات الـ Variant من المخزن المحلي
            $variantData   = $product->getVariantById($variantId) ?? [];
            // ✅ استخدام SKU: من variant أو من جدول Product
            $currentSku    = $variantData['sku'] ?? $product->sku ?? null;
            $currentPrice  = (float) ($variantData['price'] ?? $originalPrice);
            $batchItemQty  = (int) ($item->quantity ?? 0);

            if (!$currentSku) {
                continue; // تخطي إذا لا يوجد SKU
            }

            // ✅ تحديث الـ Variant — updateBatchVariant يحافظ على المخزون الحالي
            $res = $sallaApi->updateBatchVariant($variantId, [
                'price'      => $currentPrice,
                'sale_price' => $salePrice,
            ]);

            if ($res) {
                // إلغاء الخصم القديم وحفظ الجديد
                BatchDiscount::where('batch_id', $batch->id)
                    ->where('status', 'active')
                    ->update(['status' => 'cancelled']);

                BatchDiscount::create([
                    'batch_id'            => $batch->id,
                    'discount_percentage' => $discountPct,
                    'starts_at'           => now(),
                    'ends_at'             => $batch->expiry_date->toDateTimeString(),
                    'status'              => 'active',
                    'created_by'          => auth()->id(),
                ]);

                // ✅ Non-Retroactive: وضع علامة manual على الباتش
                // الخصم التلقائي لن يلمس هذا الباتش مستقبلاً
                $batch->markAsManuallyDiscounted();
                $applied++;
            }
        }

        ActivityLog::log(
            $merchant->id,
            'discount_applied_bulk',
            "تم تطبيق الخصم على {$applied} دفعة صفراء للمنتج: {$product->name}",
            $product
        );

        UpdateBatchOptionsJob::dispatch();

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
        $discount->load('batch.batchItems.product.merchant');
        $batch = $discount->batch;

        try {
            $batchItem = $batch?->batchItems->first();
            $variantId = $batchItem?->salla_variant_id;

            $product = $batchItem?->product;

            if ($variantId && $product) {
                $sallaApi = SallaApiService::for($product->merchant);

                $variantData    = $product->getVariantById($variantId) ?? [];
                $currentSku     = $variantData['sku'] ?? $product->sku ?? null;
                $currentPrice   = (float) ($variantData['price'] ?? 0);
                $batchItemQty   = (int) ($batchItem?->quantity ?? 0);

                if ($currentSku) {
                    $sallaApi->updateBatchVariant($variantId, [
                        'price'      => $currentPrice,
                        'sale_price' => 0,
                    ]);
                }
            }

            $discount->cancel();

            // ✅ Non-Retroactive: إعادة الحالة إلى pending بعد الإلغاء اليدوي
            // حتى يتمكن الخصم التلقائي من إعادة تطبيقه إذا توفرت الشروط
            if ($batch) {
                $batch->markAsPending();
            }

            if ($product) {
                ActivityLog::log(
                    auth()->id(),
                    'discount_cancelled',
                    "تم إلغاء الخصم على الدفعة: {$batch->batch_code}",
                    $product
                );
            }

            UpdateBatchOptionsJob::dispatch();

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

        $expiredBatchItems = $product->batchItems()
            ->whereHas('batch', fn($q) => $q->where('status', 'red'))
            ->get();

        foreach ($expiredBatchItems as $item) {
            $item->delete();
        }

        ActivityLog::log(
            auth()->id(),
            'product_restocked',
            "تم إعادة توفير المنتج: {$product->name} (تم حذف {$expiredBatchItems->count()} دفعة منتهية)",
            $product
        );

        return back()->with('success', 'تم إعادة توفير المنتج. يمكنك الآن إضافة دفعات جديدة.');
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

    private function buildReasoning(Product $product, Batch $batch, BatchItem $batchItem, int $days, int $pct): string
    {
        return "المنتج '{$product->name}' — الدفعة '{$batch->batch_code}' " .
               "بكمية {$batchItem->quantity} وحدة لديه {$days} يوم حتى انتهاء الصلاحية. " .
               "نقترح خصم {$pct}% لتصريف الدفعة في الوقت المتبقي.";
    }
}