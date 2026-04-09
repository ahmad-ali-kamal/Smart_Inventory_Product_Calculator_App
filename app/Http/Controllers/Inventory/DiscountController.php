<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Batch;
use App\Models\ProductDiscount;
use App\Models\ActivityLog;
use App\Services\SallaApiService;
use Illuminate\Http\Request;

class DiscountController extends Controller
{
    /**
     * الحصول على اقتراح الخصم من AI
     */
    public function suggest(Product $product, Request $request)
    {
        $this->authorize('update', $product);

        // الحصول على الدفعة الصفراء الأقرب للانتهاء
        $batchItem = $product->batchItems()
            ->whereHas('batch', function ($q) {
                $q->where('status', 'yellow');
            })
            ->with('batch')
            ->get()
            ->sortBy('batch.days_until_expiry')
            ->first();

        if (!$batchItem) {
            return response()->json([
                'message' => 'لا توجد دفعات تحتاج إلى خصم',
            ], 400);
        }

        $batch = $batchItem->batch;
        $days = $batch->days_until_expiry;
        
        // حساب نسبة الخصم المقترحة
        $suggestedDiscount = 20; // افتراضي

        if ($days <= 10) {
            $suggestedDiscount = 40;
        } elseif ($days <= 20) {
            $suggestedDiscount = 30;
        } elseif ($days <= 30) {
            $suggestedDiscount = 25;
        }

        $reasoning = "المنتج '{$product->name}' في الدفعة '{$batch->batch_code}' " .
                    "بكمية {$batchItem->remaining_quantity} وحدة لديه {$days} يوم حتى انتهاء الصلاحية. " .
                    "قد لا يُباع في الوقت المتبقي، لذا نقترح خصم {$suggestedDiscount}% لتصريف الدفعة.";

        return response()->json([
            'discount_percentage' => $suggestedDiscount,
            'reasoning' => $reasoning,
            'batch' => [
                'id' => $batch->id,
                'batch_code' => $batch->batch_code,
                'quantity' => $batchItem->quantity,
                'remaining_quantity' => $batchItem->remaining_quantity,
                'days_until_expiry' => $batch->days_until_expiry,
                'expiry_date' => $batch->expiry_date->format('Y-m-d'),
            ],
        ]);
    }

    /**
     * تطبيق الخصم
     */
    public function apply(Request $request, Product $product)
    {
        $this->authorize('update', $product);

        $validated = $request->validate([
            'discount_percentage' => 'required|numeric|min:5|max:70',
            'ends_at' => 'nullable|date|after:today',
            'batch_id' => 'nullable|exists:batches,id',
            'is_ai_suggested' => 'boolean',
        ]);

        // التحقق من أن الدفعة صفراء
        if (isset($validated['batch_id'])) {
            $batch = Batch::find($validated['batch_id']);
            
            if ($batch->status !== 'yellow') {
                return back()->with('error', 'الدفعة المحددة ليست في الحالة الصفراء');
            }
        } else {
            // إذا لم يحدد batch، نستخدم أقرب دفعة صفراء
            $batch = $product->batchItems()
                ->whereHas('batch', function ($q) {
                    $q->where('status', 'yellow');
                })
                ->with('batch')
                ->get()
                ->sortBy('batch.days_until_expiry')
                ->first()
                ?->batch;

            if (!$batch) {
                return back()->with('error', 'لا توجد دفعات صفراء لتطبيق الخصم عليها');
            }
        }

        try {
            // حساب السعر بعد الخصم
            $discountedPrice = $product->price * (1 - ($validated['discount_percentage'] / 100));

            // تطبيق الخصم في سلة
            $sallaApi = SallaApiService::for($request->user());
            $sallaApi->applySpecialPrice(
                $product->salla_product_id,
                $discountedPrice,
                now()->toIso8601String(),
                $validated['ends_at'] ?? now()->addMonth()->toIso8601String()
            );

            // حفظ الخصم في قاعدة البيانات
            $discount = ProductDiscount::create([
                'product_id' => $product->id,
                'batch_id' => $batch->id,
                'discount_percentage' => $validated['discount_percentage'],
                'starts_at' => now(),
                'ends_at' => $validated['ends_at'] ?? now()->addMonth(),
                'status' => 'active',
                'is_ai_suggested' => $validated['is_ai_suggested'] ?? false,
                'applied_to_salla' => true,
            ]);

            // مسح الكاش
            \Cache::forget("inventory_dashboard_{$request->user()->id}");

            // تسجيل النشاط
            ActivityLog::log(
                $request->user()->id,
                'discount_applied',
                "تم تطبيق خصم {$validated['discount_percentage']}% على المنتج: {$product->name} (الدفعة: {$batch->batch_code})",
                $product,
                [
                    'discount_id' => $discount->id,
                    'batch_id' => $batch->id,
                    'batch_code' => $batch->batch_code,
                ]
            );

            return back()->with('success', 'تم تطبيق الخصم بنجاح');

        } catch (\Exception $e) {
            \Log::error('Failed to apply discount', [
                'product_id' => $product->id,
                'batch_id' => $batch->id,
                'error' => $e->getMessage(),
            ]);

            return back()->with('error', 'فشل تطبيق الخصم: ' . $e->getMessage());
        }
    }

    /**
     * إلغاء الخصم
     */
    public function cancel(ProductDiscount $discount)
    {
        $this->authorize('update', $discount->product);

        try {
            // إزالة الخصم من سلة
            if ($discount->applied_to_salla) {
                $sallaApi = SallaApiService::for(auth()->user());
                $sallaApi->removeSpecialPrice($discount->product->salla_product_id);
            }

            $discount->cancel();

            ActivityLog::log(
                auth()->id(),
                'discount_cancelled',
                "تم إلغاء الخصم على المنتج: {$discount->product->name}",
                $discount->product
            );

            return back()->with('success', 'تم إلغاء الخصم');

        } catch (\Exception $e) {
            return back()->with('error', 'فشل إلغاء الخصم');
        }
    }

    /**
     * إخفاء المنتج (للمنتجات الحمراء)
     */
    public function hideProduct(Product $product)
    {
        $this->authorize('update', $product);

        if (!$product->isExpired()) {
            return back()->with('error', 'يمكن إخفاء المنتجات المنتهية الصلاحية فقط');
        }

        try {
            $sallaApi = SallaApiService::for(auth()->user());
            $sallaApi->hideProduct($product->salla_product_id);

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

    /**
     * إعادة توفير المنتج (حذف الدفعات المنتهية)
     */
    public function restock(Product $product)
    {
        $this->authorize('update', $product);

        // حذف فقط BatchItems المرتبطة بدفعات منتهية
        $expiredBatchItems = $product->batchItems()
            ->whereHas('batch', function ($q) {
                $q->where('status', 'red');
            })
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
}