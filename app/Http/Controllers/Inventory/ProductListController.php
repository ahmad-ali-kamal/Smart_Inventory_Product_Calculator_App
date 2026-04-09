<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\BatchSetting;
use App\Models\CategoryMapping;
use App\Jobs\FetchProductsJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ProductListController extends Controller
{
    /**
     * عرض قائمة المنتجات مع حساب الحالة (ألوان الإشعارات) ديناميكياً
     */
    public function index(Request $request)
    {
        $merchant = Auth::user();

        // 1. جلب إعدادات التاجر للمدد الزمنية (أو الافتراضية)
        $settings = BatchSetting::where('merchant_id', $merchant->id)->first();
        
        if (!$settings) {
            $settings = (object) BatchSetting::getDefaults();
        }

        // 2. جلب خريطة التصنيفات (اسم التصنيف => نوع الـ Bucket)
        $categoryMappings = CategoryMapping::where('merchant_id', $merchant->id)
                            ->pluck('bucket', 'category_name')
                            ->toArray();

        // 3. جلب المنتجات مع الدفعات المرتبطة
        $products = Product::where('merchant_id', $merchant->id)
            ->with(['images', 'batchItems.batch'])
            ->orderBy('name')
            ->paginate(15);

        // 4. معالجة كل منتج لتحديد حالته (Status) وكلاس الفلتر
        $products->getCollection()->transform(function ($product) use ($merchant, $settings, $categoryMappings) {
            
            // أ. تحديد نوع الـ Bucket للمنتج (الافتراضي medium إذا لم يصنف بعد)
            $bucket = $categoryMappings[$product->category] ?? 'medium';
            
            // ب. جلب أيام الإشعار الخاصة بهذا الـ Bucket من الإعدادات
            $thresholdKey = $bucket . '_term_days';
            $threshold = $settings->$thresholdKey ?? 14;

            // ج. إيجاد أقرب تاريخ انتهاء (أقل عدد أيام متبقية) للمنتج ككل
            $minDaysRemaining = 999; 
            
            if ($product->batchItems && $product->batchItems->count() > 0) {
                $minDaysRemaining = $product->batchItems->map(function($item) {
                    // نتحقق أن الـ batch موجود فعلاً وله قيمة تاريخ انتهاء
                    if (!$item->batch || !$item->batch->expiry_date) return 999;
                    
                    $expiry = \Carbon\Carbon::parse($item->batch->expiry_date)->startOfDay();
                    $today  = \Carbon\Carbon::now()->startOfDay();
                    return (int) $today->diffInDays($expiry, false);
                })->min() ?? 999;

                // د. تحديد حالة كل "دفعة" (Batch) بشكل منفصل لعرضها في تفاصيل المنتج
                $product->batchItems->each(function ($item) use ($threshold) {
                    if (!$item->batch || !$item->batch->expiry_date) return;

                    $expiry = \Carbon\Carbon::parse($item->batch->expiry_date)->startOfDay();
                    $today  = \Carbon\Carbon::now()->startOfDay();
                    $days   = (int) $today->diffInDays($expiry, false);

                    $item->batch->status = match(true) {
                        $days <= 0           => 'red',    // منتهي
                        $days <= $threshold  => 'yellow', // قريب الانتهاء
                        default              => 'green',  // آمن
                    };
                });
            }

            // هـ. تحديد الحالة العامة للمنتج بناءً على أقرب دفعة
            $status = BatchSetting::getStatusForDays($minDaysRemaining, $merchant->id);

            // و. إضافة الخصائص للمنتج لتظهر في واجهة العرض
            $product->status = $status;
            $product->filterClass = "status-" . $status; 
            $product->bucket_type = $bucket;
            $product->days_left = $minDaysRemaining; 

            return $product;
        });

        return view('inventory.products', compact('products', 'settings'));
    }

    /**
     * مزامنة المنتجات من سلة في الخلفية
     */
    public function sync(Request $request)
    {
        $merchant = Auth::user();

        try {
            FetchProductsJob::dispatch($merchant);
            Cache::forget("inventory_dashboard_{$merchant->id}");
            return back()->with('success', 'بدأت المزامنة في الخلفية. ستظهر المنتجات هنا فور اكتمال السحب من سلة.');
        } catch (\Exception $e) {
            Log::error('Product sync failed for merchant ' . $merchant->id . ': ' . $e->getMessage());
            return back()->with('error', 'فشل بدء المزامنة: ' . $e->getMessage());
        }
    }

    /**
     * عرض تفاصيل المنتج والدفعات
     */
    public function show($id)
    {
        $merchant = Auth::user();
        
        $product = Product::where('id', $id)
            ->where('merchant_id', $merchant->id)
            ->with(['batchItems.batch', 'images'])
            ->firstOrFail();

        return view('inventory.show', compact('product'));
    }
}