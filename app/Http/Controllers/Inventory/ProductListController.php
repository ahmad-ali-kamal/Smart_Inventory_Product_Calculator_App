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
        // تأكد أنك نفذت الميجريشن لتغيير اسم العمود إلى bucket
        $categoryMappings = CategoryMapping::where('merchant_id', $merchant->id)
                            ->pluck('bucket', 'category_name')
                            ->toArray();

        // 3. جلب المنتجات مع الدفعات المرتبطة
        // أضفنا التحقق من merchant_id لضمان عرض منتجات هذا التاجر فقط
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

            // ج. إيجاد أقرب تاريخ انتهاء (أقل عدد أيام متبقية)
            // أضفنا تحقق إذا كانت الدفعات فارغة لإعطاء قيمة افتراضية آمنة (999 يوم)
         // ✅ الصحيح
$minDaysRemaining = 999;

if ($product->batchItems->count() > 0) {
    $minDaysRemaining = $product->batchItems->map(function($item) {
        if (!$item->batch || !$item->batch->expiry_date) return 999;
        $expiry = \Carbon\Carbon::parse($item->batch->expiry_date)->startOfDay();
        $today  = \Carbon\Carbon::now()->startOfDay();
        return (int) $today->diffInDays($expiry, false);
    })->min() ?? 999;  // ← ?? 999 يحمي من null
}

            // د. تحديد الحالة باستخدام الدالة الـ Static
            $status = BatchSetting::getStatusForDays($minDaysRemaining, $threshold);

            // هـ. إضافة الخصائص للمنتج
            $product->status = $status;
            $product->filterClass = "status-" . $status; 
            $product->bucket_type = $bucket;
            $product->days_left = $minDaysRemaining; // مفيد للعرض في الجدول
            
            
           
            $product->batchItems->each(function ($item) use ($threshold) {
    if (!$item->batch || !$item->batch->expiry_date) return;

    $expiry = \Carbon\Carbon::parse($item->batch->expiry_date)->startOfDay();
    $today  = \Carbon\Carbon::now()->startOfDay();
    $days   = $today->diffInDays($expiry, false);

    
// بعد ✅
$item->batch->status = match(true) {
    $days <= 0          => 'red',   // شامل اليوم نفسه
    $days <= $threshold => 'yellow',
    default             => 'green',
};
});


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