<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Batch;
use App\Models\BatchItem;
use App\Models\BatchSetting;
use App\Models\ProductDiscount;
use App\Models\ActivityLog;
use App\Services\SallaApiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DiscountController extends Controller
{
    // =========================================================
    // اقتراح الخصم (يحسب النسبة بناءً على إعدادات التاجر)
    // =========================================================

    public function suggest(Product $product, Request $request)
    {
        $this->authorize('update', $product);

        // أقرب دفعة صفراء للانتهاء
        $batchItem = $product->batchItems()
            ->whereHas('batch', fn($q) => $q->where('status', 'yellow'))
            ->with('batch')
            ->get()
            ->sortBy('batch.days_until_expiry')
            ->first();

        if (!$batchItem || !$batchItem->batch) {
            return response()->json(['message' => 'لا توجد دفعات تحتاج إلى خصم'], 400);
        }

        $batch    = $batchItem->batch;
        $days     = $batch->days_until_expiry;
        $merchant = $product->merchant;

        // ─── نسبة الخصم: من إعدادات التاجر أو القيم الافتراضية ────────
        $setting = BatchSetting::where('merchant_id', $merchant->id)->first();

        if ($setting && $setting->discount_auto) {
            // وضع الخصم الأوتوماتيكي: يحسب بناءً على عدد الأيام
            $suggestedDiscount = $this->calcAutoDiscount($days, $setting);
            $discountMode      = 'auto';
        } else {
            // وضع ثابت: التاجر حدّد نسبة مخصصة
            $suggestedDiscount = (int) ($setting->fixed_discount_percentage ?? 20);
            $discountMode      = 'fixed';
        }

        return response()->json([
            'discount_percentage' => $suggestedDiscount,
            'discount_mode'       => $discountMode,
            'days_until_expiry'   => $days,
            'reasoning'           => $this->buildReasoning($product, $batch, $batchItem, $days, $suggestedDiscount),
            'batch' => [
                'id'               => $batch->id,
                'batch_code'       => $batch->batch_code,
                'salla_variant_id' => $batch->salla_variant_id,
                'quantity'         => $batchItem->quantity,
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
            'is_ai_suggested'     => 'boolean',
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

        // ─── التحقق من وجود salla_variant_id ─────────────────────────
        if (!$batch->salla_variant_id) {
            return response()->json([
                'success' => false,
                'message' => 'هذه الدفعة لم تُزامَن مع سلة بعد — شغّل المزامنة أولاً',
            ], 422);
        }

        try {
            $sallaApi          = SallaApiService::for($merchant);
            $discountPct       = (float) $validated['discount_percentage'];
            $batchItem         = BatchItem::where('batch_id', $batch->id)->first();

            // حساب السعر بعد الخصم
            $originalPrice  = (float) ($batchItem?->unit_cost ?? $product->price ?? 0);
            $salePrice      = round($originalPrice * (1 - $discountPct / 100), 2);

            // ✅ جلب جميع بيانات الـ Variant من سلة
            $variantDetails = $sallaApi->getVariantDetails($batch->salla_variant_id);
            $variantData    = $variantDetails['data'] ?? [];
            // ✅ استخدام SKU: من variant أو من جدول Product
            $currentSku     = $variantData['sku'] ?? $product->sku ?? null;
            $currentPrice   = (float) ($variantData['price']['amount'] ?? $originalPrice);

            if (!$currentSku) {
                Log::warning('[Discount] لا يوجد SKU للـ variant - لا يمكن التحديث');
                return response()->json(['success' => false, 'message' => 'لا يوجد SKU للـ variant'], 400);
            }
            // ✅ جلب الكمية من جدول Product (حقل quantity)
            $currentStock   = (int) ($product->quantity ?? 0);

            // ✅ جلب باقي البيانات من variant
            $barcode     = $variantData['barcode'] ?? null;
            $costPrice  = (float) ($variantData['cost_price']['amount'] ?? $currentPrice);
            $weight     = (int) ($variantData['weight'] ?? 0);
            $mpn        = $variantData['mpn'] ?? null;
            $gtin       = $variantData['gtin'] ?? null;

            Log::info('[Discount] بيانات الإرسال:', [
                'variant_id'     => $batch->salla_variant_id,
                'sku'            => $currentSku,
                'price'          => $currentPrice,
                'sale_price'     => $salePrice,
                'stock_quantity' => $currentStock,
                'cost_price'     => $costPrice,
            ]);

            // ✅ تحديث كامل للـ Variant согласно توثيق سلة (جميع الحقول المطلوبة)
            $variantRes = $sallaApi->updateBatchVariant($batch->salla_variant_id, [
                'sku'            => $currentSku,
                'barcode'        => $barcode,
                'price'          => $currentPrice,
                'sale_price'     => $salePrice,
                'cost_price'     => $costPrice,
                'stock_quantity' => $currentStock,
                'weight'         => $weight,
                'mpn'            => $mpn,
                'gtin'           => $gtin,
            ]);

            if (!$variantRes) {
                return response()->json([
                    'success' => false,
                    'message' => 'فشل تحديث السعر في سلة — راجع الـ logs',
                ], 500);
            }

            Log::info('[Discount] ✅ تم تطبيق الخصم على الـ Variant', [
                'variant_id'     => $batch->salla_variant_id,
                'original_price' => $originalPrice,
                'sale_price'     => $salePrice,
                'discount_pct'   => $discountPct,
            ]);

            // ─── حفظ سجل الخصم في قاعدة البيانات ────────────────────
            // ألغِ أي خصم نشط سابق على نفس الدفعة
            ProductDiscount::where('batch_id', $batch->id)
                ->where('status', 'active')
                ->update(['status' => 'cancelled']);

            $endsAt = $validated['ends_at']
                ?? $batch->expiry_date->toDateTimeString(); // ينتهي مع الدفعة

            $discount = ProductDiscount::create([
                'product_id'          => $product->id,
                'batch_id'            => $batch->id,
                'discount_percentage' => $discountPct,
                'starts_at'           => now(),
                'ends_at'             => $endsAt,
                'status'              => 'active',
                'is_ai_suggested'     => $validated['is_ai_suggested'] ?? false,
                'applied_to_salla'    => true,
                'salla_special_price_id' => null, // لا نستخدم Special Offers، نُحدّث Variant مباشرة
                'ai_reasoning'        => null,
            ]);

            ActivityLog::log(
                $merchant->id,
                'discount_applied',
                "تم تطبيق خصم {$discountPct}% على الدفعة {$batch->batch_code} للمنتج: {$product->name}",
                $product,
                ['discount_id' => $discount->id, 'batch_id' => $batch->id, 'sale_price' => $salePrice]
            );

            \Cache::forget("inventory_dashboard_{$merchant->id}");

            return response()->json([
                'success'        => true,
                'message'        => 'تم تطبيق الخصم بنجاح',
                'original_price' => $originalPrice,
                'sale_price'     => $salePrice,
                'discount_id'    => $discount->id,
            ]);

        } catch (\Exception $e) {
            Log::error('[Discount] فشل تطبيق الخصم', [
                'product_id' => $product->id,
                'batch_id'   => $batch->id,
                'error'      => $e->getMessage(),
            ]);
            return response()->json(['success' => false, 'message' => 'فشل تطبيق الخصم: ' . $e->getMessage()], 500);
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
            ->whereHas('batch', fn($q) => $q->where('status', 'yellow')
                ->whereNotNull('salla_variant_id'))
            ->with('batch')
            ->get();

        if ($yellowBatches->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'لا توجد دفعات صفراء مزامَنة مع سلة'], 400);
        }

        $applied = 0;
        foreach ($yellowBatches as $item) {
            $batch = $item->batch;
            if (!$batch || !$batch->salla_variant_id) continue;

            $days          = $batch->days_until_expiry;
            $discountPct   = $setting?->discount_auto
                ? $this->calcAutoDiscount($days, $setting)
                : (float) ($setting?->fixed_discount_percentage ?? 20);

            $originalPrice = (float) ($item->unit_cost ?? $product->price ?? 0);
            $salePrice     = round($originalPrice * (1 - $discountPct / 100), 2);

            // ✅ جلب جميع بيانات الـ Variant من سلة
            $variantDetails = $sallaApi->getVariantDetails($batch->salla_variant_id);
            $variantData   = $variantDetails['data'] ?? [];
            // ✅ استخدام SKU: من variant أو من جدول Product
            $currentSku    = $variantData['sku'] ?? $product->sku ?? null;
            $currentPrice  = (float) ($variantData['price']['amount'] ?? $originalPrice);
            $currentStock  = (int) ($product->quantity ?? 0);

            if (!$currentSku) {
                continue; // تخطي إذا لا يوجد SKU
            }

            // ✅ جلب باقي البيانات من variant
            $barcode     = $variantData['barcode'] ?? null;
            $costPrice  = (float) ($variantData['cost_price']['amount'] ?? $currentPrice);
            $weight     = (int) ($variantData['weight'] ?? 0);
            $mpn        = $variantData['mpn'] ?? null;
            $gtin       = $variantData['gtin'] ?? null;

            // ✅ تحديث كامل للـ Variant согласно توثيق سلة (جميع الحقول المطلوبة)
            $res = $sallaApi->updateBatchVariant($batch->salla_variant_id, [
                'sku'            => $currentSku,
                'barcode'        => $barcode,
                'price'          => $currentPrice,
                'sale_price'     => $salePrice,
                'cost_price'     => $costPrice,
                'stock_quantity' => $currentStock,
                'weight'         => $weight,
                'mpn'            => $mpn,
                'gtin'           => $gtin,
            ]);

            if ($res) {
                // إلغاء الخصم القديم وحفظ الجديد
                ProductDiscount::where('batch_id', $batch->id)
                    ->where('status', 'active')
                    ->update(['status' => 'cancelled']);

                ProductDiscount::create([
                    'product_id'          => $product->id,
                    'batch_id'            => $batch->id,
                    'discount_percentage' => $discountPct,
                    'starts_at'           => now(),
                    'ends_at'             => $batch->expiry_date->toDateTimeString(),
                    'status'              => 'active',
                    'is_ai_suggested'     => false,
                    'applied_to_salla'    => true,
                ]);
                $applied++;
            }
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

    public function cancel(ProductDiscount $discount)
    {
        $this->authorize('update', $discount->product);

        try {
            $batch = $discount->batch;

            if ($discount->applied_to_salla && $batch?->salla_variant_id) {
                $sallaApi = SallaApiService::for($discount->product->merchant);

                // ✅ جلب جميع بيانات الـ Variant من سلة
                $variantDetails = $sallaApi->getVariantDetails($batch->salla_variant_id);
                $variantData    = $variantDetails['data'] ?? [];
                // ✅ استخدام SKU: من variant أو من جدول Product
                $currentSku     = $variantData['sku'] ?? $discount->product->sku ?? null;
                $currentPrice   = (float) ($variantData['price']['amount'] ?? 0);
                $currentStock   = (int) ($variantData['stock_quantity'] ?? 0);

                if (!$currentSku) {
                    Log::warning('[Discount] لا يوجد SKU لإلغاء الخصم');
                } else {

                // ✅ جلب باقي البيانات من variant
                $barcode     = $variantData['barcode'] ?? null;
                $costPrice  = (float) ($variantData['cost_price']['amount'] ?? $currentPrice);
                $weight     = (int) ($variantData['weight'] ?? 0);
                $mpn        = $variantData['mpn'] ?? null;
                $gtin       = $variantData['gtin'] ?? null;

                // ✅ تصفير sale_price مع إرسال جميع البيانات للحفاظ على المخزون
                $sallaApi->updateBatchVariant($batch->salla_variant_id, [
                    'sku'            => $currentSku,
                    'barcode'        => $barcode,
                    'price'          => $currentPrice,
                    'sale_price'     => null, // إزالة الخصم
                    'cost_price'     => $costPrice,
                    'stock_quantity' => $currentStock,
                    'weight'         => $weight,
                    'mpn'            => $mpn,
                    'gtin'           => $gtin,
                ]);
            }

            $discount->cancel();

            ActivityLog::log(
                auth()->id(),
                'discount_cancelled',
                "تم إلغاء الخصم على المنتج: {$discount->product->name}",
                $discount->product
            );

            return response()->json(['success' => true, 'message' => 'تم إلغاء الخصم']);

            } // close if at line 357

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