<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Inventory\ProductExpiryController;
use App\Models\Batch;
use App\Models\BatchItem;
use App\Models\Product;
use App\Models\BatchSetting;
use App\Models\CategoryMapping;
use Illuminate\Http\Request;
use App\Jobs\FetchProductsJob;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;



class InventoryApiController extends Controller
{
    public function syncProducts(Request $request)
{
    $merchant = Auth::user();

    FetchProductsJob::dispatch($merchant);

    Cache::forget("inventory_dashboard_api_{$merchant->id}");

    return response()->json([
        'success' => true,
        'message' => 'بدأت مزامنة المنتجات من سلة',
    ]);
}
    public function dashboard(Request $request)
    {
        $merchant = Auth::user();

        $settings = BatchSetting::where('merchant_id', $merchant->id)->first();

        if (!$settings) {
            return response()->json([
                'needs_setup' => true,
                'message' => 'Inventory settings are not configured yet',
                'stats' => [
                    'green_batches' => 0,
                    'yellow_batches' => 0,
                    'red_batches' => 0,
                ],
                'products' => [],
            ]);
        }

        $cacheKey = "inventory_dashboard_api_{$merchant->id}";

        $data = Cache::remember($cacheKey, now()->addMinutes(5), function () use ($merchant) {
            $stats = [
                'green_batches'  => Batch::forMerchant($merchant->id)->safe()->count(),
                'yellow_batches' => Batch::forMerchant($merchant->id)->warning()->count(),
                'red_batches'    => Batch::forMerchant($merchant->id)->expired()->count(),
            ];

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
                    $criticalBatchItem = $product->batchItems
                        ->sortBy(function ($item) {
                            $order = ['red' => 1, 'yellow' => 2, 'green' => 3];
                            return $order[$item->batch->status] ?? 99;
                        })
                        ->first();

                    return [
                        'id' => $product->id,
                        'name' => $product->name,
                        'image_url' => $product->image_url,
                        'status' => $criticalBatchItem?->batch->status ?? 'green',
                        'expiry_date' => $criticalBatchItem?->batch->expiry_date?->format('Y-m-d'),
                        'batches_count' => $product->batchItems->count(),
                        'has_active_discount' => $product->discounts->isNotEmpty(),
                    ];
                })
                ->sortBy(function ($product) {
                    $order = ['red' => 1, 'yellow' => 2, 'green' => 3];
                    return $order[$product['status']] ?? 99;
                })
                ->values();

            return [
                'needs_setup' => false,
                'stats' => $stats,
                'products' => $products,
            ];
        });

        return response()->json($data);
    }

    public function products(Request $request)
{
    $merchant = Auth::user();

    $settings = BatchSetting::where('merchant_id', $merchant->id)->first();

    if (!$settings) {
        $settings = (object) BatchSetting::getDefaults();
    }

    $categoryMappings = CategoryMapping::where('merchant_id', $merchant->id)
        ->pluck('bucket', 'category_name')
        ->toArray();

    $products = Product::where('merchant_id', $merchant->id)
        ->with(['images', 'batchItems.batch'])
        ->orderBy('name')
        ->get()
        ->map(function ($product) use ($settings, $categoryMappings) {

            $bucket = $categoryMappings[$product->category] ?? 'medium';
            $thresholdKey = $bucket . '_term_days';
            $threshold = $settings->$thresholdKey ?? 14;

            $batches = $product->batchItems->map(function ($item) use ($threshold) {
                $batch = $item->batch;

                if (!$batch) {
                    return null;
                }

                return [
                    'id' => $batch->id,
                    'batch_code' => $batch->batch_code,
                    'quantity' => $item->quantity,
                    'status' => $batch->status ?? 'green',
                    'expiry_date' => $batch->expiry_date
                        ? \Carbon\Carbon::parse($batch->expiry_date)->format('Y-m-d')
                        : null,
                    'days_until_expiry' => $batch->days_until_expiry,
                    'threshold' => $threshold,
                ];
            })->filter()->values();

            $usedQty = $product->batchItems->sum('quantity');

            return [
                'id' => $product->id,
                'name' => $product->name,
                'category' => $product->category,
                'bucket_type' => $bucket,
                'threshold' => $threshold,
                'quantity' => $product->quantity,
                'used_quantity' => $usedQty,
                'remaining_quantity' => max(0, $product->quantity - $usedQty),
                'price' => $product->price,
                'image_url' => $product->image_url,
                'batches' => $batches,
            ];
        })
        ->values();

    return response()->json([
        'products' => $products,
    ]);
}

    public function storeExpiry(Request $request)
{
    return app(ProductExpiryController::class)->store($request);
}

    public function settings()
{
    $merchant = Auth::user();

    $settings = BatchSetting::where('merchant_id', $merchant->id)->first();

    if (!$settings) {
        $settings = (object) BatchSetting::getDefaults();
    }

    $mappings = CategoryMapping::where('merchant_id', $merchant->id)
        ->get()
        ->groupBy('bucket')
        ->map(fn ($items) => $items->pluck('category_name')->values()->toArray())
        ->toArray();

    // كل تصنيفات منتجات المتجر
    $allCategories = Product::where('merchant_id', $merchant->id)
        ->whereNotNull('category')
        ->where('category', '!=', '')
        ->distinct()
        ->pluck('category')
        ->values()
        ->toArray();

    // التصنيفات اللي سبق توزيعها
    $mappedCategories = collect($mappings)->flatten()->toArray();

    // التصنيفات الجديدة غير الموزعة
    $unmappedCategories = array_values(array_diff($allCategories, $mappedCategories));

    return response()->json([
    'settings' => $settings,
    'category_mapping' => [
        'short' => $mappings['short'] ?? [],
        'medium' => $mappings['medium'] ?? [],
        'long' => $mappings['long'] ?? [],
    ],
    'unassigned_categories' => $unmappedCategories, 
]);
}
    public function updateSettings(Request $request)
    {
    $merchant = Auth::user();

    $validated = $request->validate([
        'short_term_days' => 'required|integer|min:1',
        'medium_term_days' => 'required|integer|min:1',
        'long_term_days' => 'required|integer|min:1',
        'discount_auto' => 'nullable|boolean',
        'fixed_discount_percentage' => 'nullable|integer|min:1|max:90',
        'category_mapping' => 'nullable|array',
    ]);

    $settings = BatchSetting::updateOrCreate(
        ['merchant_id' => $merchant->id],
        [
            'short_term_days' => $validated['short_term_days'],
            'medium_term_days' => $validated['medium_term_days'],
            'long_term_days' => $validated['long_term_days'],
            'discount_auto' => $validated['discount_auto'] ?? false,
            
        ]
    );

    if (isset($validated['category_mapping'])) {
        CategoryMapping::where('merchant_id', $merchant->id)->delete();

        foreach ($validated['category_mapping'] as $bucket => $categories) {
            foreach ($categories as $categoryName) {
                CategoryMapping::create([
                    'merchant_id' => $merchant->id,
                    'category_name' => $categoryName,
                    'bucket' => $bucket,
                ]);
            }
        }
    }

    /**
     * Reconcile stock between BatchItems and Product quantity (FIFO-lite)
     */
    public function reconcile(Request $request)
    {
        $merchant = Auth::user();
        $productId = $request->input('product_id');
        $query = Product::where('merchant_id', $merchant->id);
        if ($productId) {
            $query = $query->where('id', $productId);
        }
        $products = $query->get();

        $results = [];
        foreach ($products as $product) {
            $batchItems = $product->batchItems()->with('batch')->get();
            $batchTotal = $batchItems->sum('quantity');
            $diff = $product->quantity - $batchTotal;
            $changed = 0;
            if ($diff != 0) {
                if ($diff > 0) {
                    $newBatch = Batch::create([
                        'merchant_id' => $merchant->id,
                        'batch_code' => 'REC-'.now()->format('YmdHis'),
                        'name' => 'Reconciled Batch',
                        'status' => 'green',
                        'days_until_expiry' => 60,
                    ]);
                    BatchItem::create([
                        'batch_id' => $newBatch->id,
                        'product_id' => $product->id,
                        'quantity' => $diff,
                    ]);
                    $changed = $diff;
                } else {
                    $toRemove = -$diff;
                    foreach ($batchItems as $bi) {
                        if ($toRemove <= 0) break;
                        $rem = min($bi->quantity, $toRemove);
                        if ($rem > 0) {
                            $bi->quantity -= $rem;
                            $bi->save();
                            $toRemove -= $rem;
                            $changed += $rem;
                        }
                    }
                }
            }
            $newBatchTotal = $product->batchItems()->sum('quantity');
            $results[] = [
                'product_id' => $product->id,
                'adjusted_by' => $changed,
                'new_total_batch' => $newBatchTotal,
                'final_quantity' => $product->quantity,
            ];
        }

        return response()->json(['success' => true, 'results' => $results]);
    }

    return response()->json([
        'success' => true,
        'settings' => $settings,
    ]);
}
}
