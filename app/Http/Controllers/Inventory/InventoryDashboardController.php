<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Batch;
use App\Models\BatchSetting;
use App\Models\CategoryMapping;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;

class InventoryDashboardController extends Controller
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
         return view('inventory.instructions');
     }



        // استخدام Cache لتحسين الأداء
        $cacheKey = "inventory_dashboard_{$merchant->id}";
        $cacheDuration = now()->addMinutes(5);

        $data = Cache::remember($cacheKey, $cacheDuration, function () use ($merchant) {
            // 1. إحصائيات الحالة (الألوان)
            $statusCounts = [
                'green_batches'  => Batch::forMerchant($merchant->id)->safe()->count(),
                'yellow_batches' => Batch::forMerchant($merchant->id)->warning()->count(),
                'red_batches'    => Batch::forMerchant($merchant->id)->expired()->count(),
            ];

            // 2. جلب المنتجات مع بياناتها (التي تملك دفعات فقط)
            $products = Product::where('merchant_id', $merchant->id)
                ->with([
                    'batchItems.batch' => function ($q) {
                        $q->orderBy('days_until_expiry');
                    },
                    'discounts' => function ($q) {
                        $q->where('status', 'active');
                    }
                ])
                ->whereHas('batchItems')
                ->get()
                ->map(function ($product) {
                    // تحديد الدفعة الأكثر خطورة (الأقرب للانتهاء)
                    $criticalBatchItem = $product->batchItems
                        ->sortBy(function ($item) {
                            $order = ['red' => 1, 'yellow' => 2, 'green' => 3];
                            return $order[$item->batch->status] ?? 99;
                        })
                        ->first();

                    // تحويل المنتج إلى كائن (Object) ليسهل التعامل معه في الـ Blade
                    return (object) [
                        'id'                 => $product->id,
                        'name'               => $product->name,
                         'image_url'          => $product->image_url, // ✅ أضف هذا
                        'status'             => $criticalBatchItem?->batch->status ?? 'green',
                        'expiry_date'        => $criticalBatchItem?->batch->expiry_date?->format('Y-m-d'),
                        'batches'            => $product->batchItems, // لإظهار عدد الدفعات
                        'has_active_discount'=> $product->discounts->isNotEmpty(),
                    ];
                })
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

        return view('inventory.dashboard', [
            'stats'    => $data['stats'],
            'products' => $data['products']
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

        return view('inventory.settings', compact('settings', 'mappings', 'unmappedCategories'));
    }

    /**
     * صفحة التعليمات
     */
    public function instructions()
    {
        return view('inventory.instructions');
    }

    /**
     * مسح الكاش وتحديث البيانات
     */
    public function clearCache()
    {
        $merchant = Auth::user();
        Cache::forget("inventory_dashboard_{$merchant->id}");

        return back()->with('success', 'تم تحديث البيانات بنجاح');
    }
}