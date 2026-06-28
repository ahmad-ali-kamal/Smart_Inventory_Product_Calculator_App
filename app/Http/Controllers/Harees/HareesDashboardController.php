<?php

namespace App\Http\Controllers\Harees;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Batch;
use App\Models\BatchSetting;
use App\Models\CategoryMapping;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;

class HareesDashboardController extends Controller
{
    /**
     * عرض داشبورد إدارة المخزون (متوافق مع Blade)
     */
    public function index(Request $request)
    {
        // 1. جلب التاجر الحالي
        $merchant = Auth::user();
        // 2. التحقق مما إذا كان لدى التاجر إعدادات محفوظة مسبقاً
        $settings = BatchSetting::where('merchant_id', $merchant->id)->first();
        // 3.توجيه ذكي: إذا لم تكن هناك إعدادات، اعرض صفحة التعليمات
        
        if (!$settings) {
         return inertia('Harees/Instructions');
     }



        // استخدام Cache لتحسين الأداء
        $cacheKey = "harees_dashboard_{$merchant->id}";
        $cacheDuration = now()->addMinutes(5);

        $data = Cache::remember($cacheKey, $cacheDuration, function () use ($merchant, $settings) {
            $statusCounts = [
                'green_batches'  => Batch::forMerchant($merchant->id)->safe()->count(),
                'yellow_batches' => Batch::forMerchant($merchant->id)->warning()->count(),
                'red_batches'    => Batch::forMerchant($merchant->id)->expired()->count(),
            ];

            // ✅ BatchSetting خارج الـ loop — بدل N+1 query لكل منتج
            $batchSettings = $settings;

            // 2. جلب المنتجات مع بياناتها (التي تملك دفعات فقط)
            $products = Product::where('merchant_id', $merchant->id)
                ->with([
                    'batch.discounts' => function ($q) {
                        $q->where('status', 'active');
                    }
                ])
                ->whereHas('batch')
                ->get()
                ->map(function ($product) use ($batchSettings) {
                    $batch = $product->batch;
                    if (!$batch) return null;

                    $hasActiveManualDiscount = collect($batch->discounts ?? [])
                        ->filter(fn($d) => $d->status === 'active')
                        ->isNotEmpty();

                    $hasActiveAutoDiscount = $batchSettings?->auto_discounts
                        && $batch->days_until_expiry !== null
                        && $batch->days_until_expiry <= ($batchSettings->auto_discount_duration_days ?? 7);

                    return (object) [
                        'id'                  => $product->id,
                        'name'                => $product->name,
                        'image_url'           => $product->image_url,
                        'status'              => $batch->status ?? 'green',
                        'expiry_date'         => $batch->expiry_date?->format('Y-m-d'),
                        'batches'             => collect([$batch]),
                        'has_active_discount' => $hasActiveManualDiscount || $hasActiveAutoDiscount,
                    ];
                })
                ->filter()
                ->sortBy(function ($p) {
                    $order = ['red' => 1, 'yellow' => 2, 'green' => 3];
                    return $order[$p->status] ?? 99;
                })
                ->values();

            return [
                'stats'    => $statusCounts,
                'products' => $products,
            ];
        });

        return inertia('Harees/Dashboard', [
            'stats'    => $data['stats'],
            'products' => $data['products'],
             'settings' => $settings,
        ]);
    }

    /**
     * صفحة الإعدادات وتوزيع التصنيفات
     */
    public function settings()
    {
        $merchant = Auth::user();
        
        // 1. جلب إعدادات المدد الزمنية (أو القيم الافتراضية)
        $settings = BatchSetting::where('merchant_id', $merchant->id)->first() 
                    ?? (object) BatchSetting::getDefaults();

        // 2. جلب كل التصنيفات الفريدة الموجودة في المنتجات المسحوبة من سلة
        $allCategories = Product::where('merchant_id', $merchant->id)
            ->whereNotNull('category')
            ->distinct()
            ->pluck('category')
            ->toArray();

        // Get current category mappings from database
        $existingMappings = CategoryMapping::where('merchant_id', $merchant->id)->get();

        // Organize mappings by bucket for the view
        $mappings = [
            'short'  => $existingMappings->where('bucket', 'short')->pluck('category_name')->toArray(),
            'medium' => $existingMappings->where('bucket', 'medium')->pluck('category_name')->toArray(),
            'long'   => $existingMappings->where('bucket', 'long')->pluck('category_name')->toArray(),
        ];

        // Get unmapped categories (new categories not yet assigned to a bucket)
        $mappedNames = $existingMappings->pluck('category_name')->toArray();
        $unmappedCategories = array_diff($allCategories, $mappedNames);

        return inertia('Harees/Settings', compact('settings', 'mappings', 'unmappedCategories'));
    }

    /**
     * صفحة التعليمات
     */
    public function instructions()
    {
        return inertia('Harees/Instructions');
    }

    /**
     * مسح الكاش وتحديث البيانات
     */
    public function clearCache()
    {
        $merchant = Auth::user();
        Cache::forget("harees_dashboard_{$merchant->id}");
        Cache::forget("harees_dashboard_api_{$merchant->id}");

        return back()->with('success', 'تم تحديث البيانات بنجاح');
    }
}