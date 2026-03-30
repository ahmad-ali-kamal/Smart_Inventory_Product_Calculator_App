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

class ProductListController extends Controller
{
    /**
     * عرض قائمة المنتجات مع حساب الحالة (ألوان الإشعارات) ديناميكياً
     */
    public function index(Request $request)
    {
        $merchant = Auth::user();

        // 1. جلب إعدادات التاجر للمدد الزمنية (أو الافتراضية)
        $settings = BatchSetting::where('merchant_id', $merchant->id)->first() 
                    ?? (object) BatchSetting::getDefaults();

        // 2. جلب خريطة التصنيفات (اسم التصنيف => نوع الـ Bucket)
        // هذا يسمح لنا بمعرفة هل "المخبوزات" هي short أم long
        $categoryMappings = CategoryMapping::where('merchant_id', $merchant->id)
                            ->pluck('bucket', 'category_name')
                            ->toArray();

        // 3. جلب المنتجات مع الدفعات المرتبطة
        $products = Product::where('merchant_id', $merchant->id)
            ->with(['images', 'batchItems.batch'])
            ->orderBy('name')
            ->paginate(15);

        // 4. معالجة كل منتج لتحديد حالته (Status) وكلاس الفلتر
        $products->getCollection()->transform(function ($product) use ($settings, $categoryMappings) {
            
            // أ. تحديد نوع الـ Bucket للمنتج (الافتراضي medium إذا لم يصنف بعد)
            $bucket = $categoryMappings[$product->category] ?? 'medium';
            
            // ب. جلب أيام الإشعار الخاصة بهذا الـ Bucket من الإعدادات
            $thresholdKey = $bucket . '_term_days';
            $threshold = $settings->$thresholdKey ?? 14;

            // ج. إيجاد أقرب تاريخ انتهاء (أقل عدد أيام متبقية) بين كل الدفعات
            $minDaysRemaining = $product->batchItems->map(function($item) {
                return $item->batch->days_until_expiry; // تأكد أن هذه الدالة موجودة في مودل Batch
            })->min();

            // د. تحديد الحالة باستخدام الدالة الـ Static التي وضعناها في BatchSetting
            // نرسل لها (الأيام المتبقية، عتبة الإشعار)
            $status = BatchSetting::getStatusForDays($minDaysRemaining ?? 999, $threshold);

            // هـ. إضافة الخصائص للمنتج لكي يقرأها الـ Blade والـ JS
            $product->status = $status;
            $product->filterClass = "status-" . $status; // تستخدم في الفلترة بصفحة المنتجات
            $product->bucket_type = $bucket;

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

            return back()->with('success', 'بدأت المزامنة في الخلفية. ستحدث الألوان والبيانات فور انتهائها.');
        } catch (\Exception $e) {
            \Log::error('Product sync failed: ' . $e->getMessage());
            return back()->with('error', 'فشل بدء المزامنة.');
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