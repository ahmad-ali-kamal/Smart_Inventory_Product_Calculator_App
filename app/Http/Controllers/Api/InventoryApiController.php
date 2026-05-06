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
use App\Services\SallaApiService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class InventoryApiController extends Controller
{
    /**
     * بدء مزامنة المنتجات من سلة عبر Job خلفي
     */
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

    /**
     * بيانات لوحة التحكم (الإحصائيات والمنتجات الحرجة)
     */
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
                        'batches' => $product->batchItems->map(fn($item) => [
                            'id'          => $item->batch?->id,
                            'batch_code'  => $item->batch?->batch_code,
                            'expiry_date' => $item->batch?->expiry_date?->format('Y-m-d'),
                            'status'      => $item->batch?->status ?? 'green',
                        ]),
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

    /**
     * قائمة المنتجات مع تفاصيل الدفعات والمخزون
     */
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

    /**
     * جلب الخيارات: 
     * تم التعديل بناءً على طلبك - لا يتم سحب الخيارات من سلة. 
     * نكتفي بجلب الدفعات المحلية لعرضها في المودال.
     */
    public function getProductOptions(Request $request, $product_id)
    {
        $merchant = Auth::user();
        $product = Product::where('merchant_id', $merchant->id)->where('id', $product_id)->firstOrFail();

        try {
            $batches = BatchItem::where('product_id', $product->id)
                ->with('batch')
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->batch->id,
                        'batch_id' => $item->batch_id,
                        'batch_code' => $item->batch?->batch_code,
                        'expiry_date' => $item->batch?->expiry_date?->format('Y-m-d'),
                        'quantity' => $item->quantity,
                        'status' => $item->batch?->status ?? 'green',
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'batches' => $batches,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('[Get Batches Error] ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'فشل جلب الدفعات: ' . $e->getMessage()], 500);
        }
    }

    /**
     * إنشاء دفعة جديدة برقم الباتش والكمية، وتحديث سلة للباتشات الصفراء
     */
    public function storeBatch(Request $request, $product_id)
    {
        $merchant = Auth::user();
        $product = Product::where('merchant_id', $merchant->id)->where('id', $product_id)->firstOrFail();

        $request->validate([
            'expiry_date' => 'required|date',
            'quantity' => 'required|integer|min:1'
        ]);

        try {
            // 1. إنشاء الدفعة محلياً
            $batch = Batch::create([
                'merchant_id' => $merchant->id,
                'batch_code' => 'B-' . strtoupper(Str::random(6)),
                'expiry_date' => $request->expiry_date,
                'status' => 'green', // نعطيها مبدئياً أخضر
            ]);

            // حساب الحالة الفعلية (أخضر، أصفر، أحمر) بناءً على الإعدادات
            $batch->status = $batch->calculateStatus($request->expiry_date);
            $batch->save();

            BatchItem::create([
                'batch_id' => $batch->id,
                'product_id' => $product->id,
                'quantity' => $request->quantity
            ]);

            // 2. تحديث خيار سلة "بيانات الدفعة" بالباتشات الصفراء فقط
            $this->syncYellowBatchesToSalla($product, $merchant);

            return response()->json(['success' => true, 'message' => 'تم إنشاء الدفعة بنجاح']);
        } catch (\Exception $e) {
            Log::error('[Store Batch Error] ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'حدث خطأ: ' . $e->getMessage()], 500);
        }
    }

    /**
     * تحديث بيانات دفعة قديمة
     */
    public function updateBatch(Request $request, $batch_id)
    {
        $merchant = Auth::user();
        $batch = Batch::where('merchant_id', $merchant->id)->where('id', $batch_id)->firstOrFail();

        $request->validate([
            'batch_code' => 'required|string',
            'expiry_date' => 'required|date',
        ]);

        $batch->update([
            'batch_code' => $request->batch_code,
            'expiry_date' => $request->expiry_date,
            'status' => $batch->calculateStatus($request->expiry_date),
        ]);

        // نحدث سلة في حال تغيرت الحالة (ربما أصبح أصفر أو خرج من الأصفر)
        $batchItem = BatchItem::where('batch_id', $batch->id)->first();
        if ($batchItem) {
            $this->syncYellowBatchesToSalla($batchItem->product, $merchant);
        }

        return response()->json(['success' => true, 'message' => 'تم التحديث بنجاح']);
    }

    /**
     * دالة مساعدة لإنشاء/تحديث خيار "بيانات الدفعة" بالباتشات الصفراء فقط
     */
    private function syncYellowBatchesToSalla($product, $merchant)
    {
        if (!$product->salla_product_id) return;

        try {
            $sallaApi = SallaApiService::for($merchant);

            // جلب الدفعات الصفراء لهذا المنتج فقط
            $yellowBatches = BatchItem::where('product_id', $product->id)
                ->whereHas('batch', function($q) {
                    $q->where('status', 'yellow');
                })
                ->with('batch')
                ->get();

            if ($yellowBatches->isEmpty()) {
                return; // إذا لا توجد دفعات صفراء، لا نفعل شيئاً
            }

            // استخراج القيم التي سيتم إضافتها (تاريخ الانتهاء أو الكود)
            $valuesToAdd = $yellowBatches->map(function($bi) {
                return "ينتهي في: " . $bi->batch->expiry_date->format('Y-m-d') . " (الدفعة: " . $bi->batch->batch_code . ")";
            })->unique()->values()->toArray();

            // جلب خيارات سلة الحالية للتحقق من وجود "بيانات الدفعة"
            $optionsReq = $sallaApi->getProductOptions($product->salla_product_id);
            $sallaOptions = $optionsReq['data'] ?? [];

            $batchOption = collect($sallaOptions)->firstWhere('name', 'بيانات الدفعة');

            if (!$batchOption) {
                // الخيار غير موجود، ننشئه مع أول قيمة صفراء
                $firstValue = array_shift($valuesToAdd);
                $newOptionReq = $sallaApi->createProductOption($product->salla_product_id, 'بيانات الدفعة', $firstValue);
                $batchOptionId = $newOptionReq['data']['id'] ?? null;

                // إذا تبقى قيم أخرى، نضيفها
                if ($batchOptionId && !empty($valuesToAdd)) {
                    foreach ($valuesToAdd as $val) {
                        $sallaApi->addValueToOption($batchOptionId, $val);
                    }
                }
            } else {
                // الخيار موجود، نضيف القيم الجديدة التي لم تُضف بعد
                $existingValues = collect($batchOption['values'] ?? [])->pluck('name')->toArray();
                $batchOptionId = $batchOption['id'];

                foreach ($valuesToAdd as $val) {
                    if (!in_array($val, $existingValues)) {
                        $sallaApi->addValueToOption($batchOptionId, $val);
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('[Sync Yellow Batches Error] ' . $e->getMessage());
        }
    }

    public function storeExpiry(Request $request)
    {
        return app(ProductExpiryController::class)->store($request);
    }

    public function destroyExpiry($id)
    {
        return app(ProductExpiryController::class)->destroy($id);
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

        $allCategories = Product::where('merchant_id', $merchant->id)
            ->whereNotNull('category')
            ->where('category', '!=', '')
            ->distinct()
            ->pluck('category')
            ->values()
            ->toArray();

        $mappedCategories = collect($mappings)->flatten()->toArray();
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
            'auto_hide_expired' => 'nullable|boolean',
            'auto_discounts' => 'nullable|boolean',
            'enable_notifications' => 'nullable|boolean',
            'fixed_discount_percentage' => 'nullable|integer|min:1|max:90',
            'category_mapping' => 'nullable|array',
        ]);

        $settings = BatchSetting::updateOrCreate(
            ['merchant_id' => $merchant->id],
            [
                'short_term_days' => $validated['short_term_days'],
                'medium_term_days' => $validated['medium_term_days'],
                'long_term_days' => $validated['long_term_days'],
                'auto_hide_expired' => $request->boolean('auto_hide_expired'),
                'enable_notifications' => $request->boolean('enable_notifications'),
                'auto_discounts' => $request->boolean('auto_discounts'),
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

        return response()->json([
            'success' => true,
            'settings' => $settings,
        ]);
    }
}