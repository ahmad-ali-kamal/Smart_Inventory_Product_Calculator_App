<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Batch;
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
        $merchant = Auth::user();

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

        // العودة لملف الـ Blade مع تمرير البيانات
        return view('inventory.dashboard', [
            'stats'    => $data['stats'],
            'products' => $data['products']
        ]);
    }

    /**
     * صفحة الإعدادات
     */
    public function settings()
    {
        return view('inventory.settings');
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