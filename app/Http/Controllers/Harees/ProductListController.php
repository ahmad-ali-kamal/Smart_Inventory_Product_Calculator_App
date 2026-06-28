<?php

namespace App\Http\Controllers\Harees;

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
            ->with(['images', 'batch'])
            ->orderBy('name')
            ->paginate(15);

        // 4. معالجة كل منتج لتحديد حالته (Status) وكلاس الفلتر
        $products->getCollection()->transform(function ($product) use ($merchant, $settings, $categoryMappings) {
            
            // أ. تحديد نوع الـ Bucket للمنتج (الافتراضي medium إذا لم يصنف بعد)
            $bucket = $categoryMappings[$product->category] ?? 'medium';
            
            // ب. جلب أيام الإشعار الخاصة بهذا الـ Bucket من الإعدادات
            $thresholdKey = $bucket . '_term_days';
            $threshold = $settings->$thresholdKey ?? 14;

            // ج. إيجاد تاريخ انتهاء الدفعة الوحيدة للمنتج
            $batch = $product->batch;
            $minDaysRemaining = 999;

            if ($batch && $batch->expiry_date) {
                $expiry = \Carbon\Carbon::parse($batch->expiry_date)->startOfDay();
                $today  = \Carbon\Carbon::now()->startOfDay();
                $minDaysRemaining = (int) $today->diffInDays($expiry, false);

                // د. تحديد حالة الدفعة
                $batch->status = match(true) {
                    $minDaysRemaining <= 0           => 'red',
                    $minDaysRemaining <= $threshold  => 'yellow',
                    default                          => 'green',
                };
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

        return inertia('Harees/Products', compact('products', 'settings'));
    }

    /**
     * مزامنة المنتجات من سلة في الخلفية
     */
    public function sync(Request $request)
    {
        $merchant = Auth::user();

        try {
            FetchProductsJob::dispatch($merchant);
            Cache::forget("harees_dashboard_{$merchant->id}");
            return back()->with('success', 'بدأت المزامنة في الخلفية. ستظهر المنتجات هنا فور اكتمال السحب من سلة.');
        } catch (\Exception $e) {
            Log::error('Product sync failed for merchant ' . $merchant->id . ': ' . $e->getMessage());
            return back()->with('error', 'فشل بدء المزامنة');
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
            ->with(['batch', 'images'])
            ->firstOrFail();

        return inertia('Harees/Show', compact('product'));
    }
}