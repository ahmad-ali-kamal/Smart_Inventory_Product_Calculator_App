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
            // تحويل المصفوفة الافتراضية إلى Object لتجنب أخطاء السهم ->
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

            // ج. إيجاد أقرب تاريخ انتهاء (أقل عدد أيام متبقية)
            $minDaysRemaining = 999; 
            
            if ($product->batchItems && $product->batchItems->count() > 0) {
                $minDaysRemaining = $product->batchItems->map(function($item) {
                    // نتحقق أن الـ batch موجود فعلاً وله قيمة
                    return ($item->batch && isset($item->batch->days_until_expiry)) 
                           ? (int) $item->batch->days_until_expiry 
                           : 999;
                })->min();
            }

            // د. تحديد الحالة باستخدام الدالة الـ Static (تم إصلاح المتغير هنا)
            $status = BatchSetting::getStatusForDays($minDaysRemaining, $merchant->id);

            // هـ. إضافة الخصائص للمنتج لتظهر في واجهة الـ React/Blade
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
            // تشغيل الوظيفة في الخلفية
            FetchProductsJob::dispatch($merchant);
            
            // حذف الكاش الخاص بالداشبورد ليتم تحديث الأرقام
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