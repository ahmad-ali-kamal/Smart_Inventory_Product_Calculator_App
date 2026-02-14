<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Batch;
use App\Models\BatchItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class InventoryDashboardController extends Controller
{
    /**
     * عرض داشبورد إدارة المخزون
     */
    public function index(Request $request)
    {
        $merchant = $request->user();

        // استخدام Cache
        $cacheKey = "inventory_dashboard_{$merchant->id}";
        $cacheDuration = now()->addMinutes(5);

        $data = Cache::remember($cacheKey, $cacheDuration, function () use ($merchant) {
            // إحصائيات الحالة من الدفعات
            $statusCounts = [
                'green' => Batch::forMerchant($merchant->id)->safe()->count(),
                'yellow' => Batch::forMerchant($merchant->id)->warning()->count(),
                'red' => Batch::forMerchant($merchant->id)->expired()->count(),
            ];

            // المنتجات مع بياناتها
            $products = Product::where('merchant_id', $merchant->id)
                ->with([
                    'batchItems.batch' => function ($q) {
                        $q->orderBy('days_until_expiry');
                    },
                    'mainImage',
                    'discounts' => function ($q) {
                        $q->where('status', 'active');
                    }
                ])
                ->whereHas('batchItems')
                ->get()
                ->map(function ($product) {
                    // الحصول على أسوأ حالة (أقرب للانتهاء)
                    $criticalBatch = $product->batchItems
                        ->sortBy(function ($item) {
                            $order = ['red' => 1, 'yellow' => 2, 'green' => 3];
                            return $order[$item->batch->status] ?? 99;
                        })
                        ->first();

                    return [
                        'id' => $product->id,
                        'name' => $product->name,
                        'sku' => $product->sku,
                        'price' => $product->price,
                        'image_url' => $product->main_image_url,
                        'status' => $criticalBatch?->batch->status,
                        'days_until_expiry' => $criticalBatch?->batch->days_until_expiry,
                        'expiry_date' => $criticalBatch?->batch->expiry_date?->format('Y-m-d'),
                        'batch_code' => $criticalBatch?->batch->batch_code,
                        'batches_count' => $product->batchItems->count(),
                        'total_quantity' => $product->batchItems->sum('quantity'),
                        'total_remaining' => $product->batchItems->sum('remaining_quantity'),
                        'can_apply_discount' => $criticalBatch?->batch->status === 'yellow',
                        'has_active_discount' => $product->discounts->isNotEmpty(),
                    ];
                })
                ->sortBy(function ($product) {
                    $order = ['red' => 1, 'yellow' => 2, 'green' => 3];
                    return $order[$product['status']] ?? 99;
                })
                ->values();

            return [
                'statusCounts' => $statusCounts,
                'products' => $products,
            ];
        });

        return Inertia::render('Inventory/Dashboard', [
            'statusCounts' => $data['statusCounts'],
            'products' => $data['products'],
            'hasProducts' => $data['products']->isNotEmpty(),
        ]);
    }

    /**
     * مسح الكاش
     */
    public function clearCache(Request $request)
    {
        $merchant = $request->user();
        Cache::forget("inventory_dashboard_{$merchant->id}");

        return back()->with('success', 'تم تحديث البيانات');
    }
}