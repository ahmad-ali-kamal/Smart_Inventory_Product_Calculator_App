<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Harees\ProductExpiryController;
use App\Models\Batch;
use App\Models\BatchVariant;
use App\Models\Product;
use App\Models\BatchSetting;
use App\Models\CategoryMapping;
use Illuminate\Http\Request;
use App\Jobs\FetchProductsJob;
use App\Jobs\CheckBatchExpiryJob;
use App\Jobs\ApplyAutoDiscountToPendingBatches;
use App\Services\SallaApiService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class HareesApiController extends Controller
{
    /**
     * بدء مزامنة المنتجات من سلة عبر Job خلفي
     */
    public function syncProducts(Request $request)
{
    $merchant = Auth::user();

    // تحديد مصدر الطلب (حريص أو مستشار)
    $source = str_contains($request->path(), 'mustashar') ? 'mustashar' : 'harees';

    // جلب عدد المنتجات قبل السينك
    $productsCount = Product::where('merchant_id', $merchant->id)->count();

    Log::info("🔄 [{$source}] Sync started", [
        'user_id'        => $merchant->id,
        'store_name'     => $merchant->name,
        'products_count' => $productsCount,
        'time'           => now()->toDateTimeString(),
    ]);

    FetchProductsJob::dispatch($merchant);

    Cache::forget("harees_dashboard_api_{$merchant->id}");

    Log::info("✅ [{$source}] Sync job dispatched successfully", [
        'user_id' => $merchant->id,
    ]);

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
                'message' => 'Harees settings are not configured yet',
                'stats' => [
                    'green_batches' => 0,
                    'yellow_batches' => 0,
                    'red_batches' => 0,
                ],
                'products' => [],
            ]);
        }

        $cacheKey = "harees_dashboard_api_{$merchant->id}";

        $data = Cache::remember($cacheKey, now()->addMinutes(5), function () use ($merchant) {
            $stats = [
                'green_batches'  => Batch::forMerchant($merchant->id)->safe()->count(),
                'yellow_batches' => Batch::forMerchant($merchant->id)->warning()->count(),
                'red_batches'    => Batch::forMerchant($merchant->id)->expired()->count(),
            ];

            $products = Product::where('merchant_id', $merchant->id)
                ->with(['batch.discounts' => function ($q) {
                    $q->where('status', 'active');
                }])
                ->whereHas('batch')
                ->get()
                ->map(function ($product) use ($merchant) {
                    $batch = $product->batch;
                    if (!$batch) return null;

                    $activeDiscount = collect($batch->discounts ?? [])
                        ->firstWhere('status', 'active');

                    $hasActiveManualDiscount = $batch->discounts
                        ? collect($batch->discounts)->filter(fn($d) => $d->status === 'active')->isNotEmpty()
                        : false;

                    $batchSettings = BatchSetting::where('merchant_id', $merchant->id)->first();
                    $hasActiveAutoDiscount = $batchSettings?->auto_discounts
                        && $batch->days_until_expiry !== null
                        && $batch->days_until_expiry <= ($batchSettings->auto_discount_duration_days ?? 7);

                    return [
                        'id' => $product->id,
                        'salla_product_id' => $product->salla_product_id,
                        'name' => $product->name,
                        'image_url' => $product->image_url,
                        'status' => $batch->status ?? 'green',
                        'expiry_date' => $batch->expiry_date?->format('Y-m-d'),
                        'batches' => [[
                            'id'                   => $batch->id,
                            'expiry_date'          => $batch->expiry_date?->format('Y-m-d'),
                            'status'               => $batch->status ?? 'green',
                            'discount_type'        => $batch->discount_type ?? 'pending',
                            'discount_percentage'  => $activeDiscount
                                ? (float) $activeDiscount->discount_percentage
                                : null,
                        ]],
                        'has_active_discount' => $hasActiveManualDiscount || $hasActiveAutoDiscount,
                    ];
                })
                ->filter()
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
            ->with(['images', 'batch.batchVariants'])
            ->orderBy('name')
            ->get()
            ->map(function ($product) use ($settings, $categoryMappings) {

                $bucket = $categoryMappings[$product->category] ?? 'medium';
                $thresholdKey = $bucket . '_term_days';
                $threshold = $settings->$thresholdKey ?? 14;

                $batch = $product->batch;

                $variantsData = $product->variants_data ?? [];
                $variants = $batch?->batchVariants->map(function ($bv) use ($variantsData) {
                    $variantInfo = collect($variantsData)->firstWhere('id', $bv->variant_id);
                    if (!$variantInfo || empty($variantInfo['name'] ?? '')) {
                        return null;
                    }
                    return [
                        'variant_id'         => $bv->variant_id,
                        'variant_qty'        => $bv->batch_qty,
                        'total_qty'          => $bv->total_qty,
                        'name'               => $variantInfo['name'],
                        'stock_quantity'     => $variantInfo['stock_quantity'] ?? 0,
                        'unlimited_quantity' => $variantInfo['unlimited_quantity'] ?? false,
                    ];
                })->filter()->values()->toArray() ?? [];

                $batches = $batch ? [[
                    'id'               => $batch->id,
                    'quantity'         => $batch->batch_qty ?? 0,
                    'status'           => $batch->status ?? 'green',
                    'expiry_date'      => $batch->expiry_date
                        ? \Carbon\Carbon::parse($batch->expiry_date)->format('Y-m-d')
                        : null,
                    'days_until_expiry' => $batch->days_until_expiry,
                    'threshold'        => $threshold,
                    'has_variants'     => count($variants) > 0,
                    'variants'        => $variants,
                ]] : [];

                $usedQty = $batch?->total_qty ?? 0;

                return [
                    'id' => $product->id,
                    'salla_product_id' => $product->salla_product_id,
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
            $batch = $product->batch;

            $batches = $batch ? [[
                'id'          => $batch->id,
                'expiry_date' => $batch->expiry_date?->format('Y-m-d'),
                'quantity'    => $batch->batch_qty ?? 0,
                'status'      => $batch->status ?? 'green',
            ]] : [];

            return response()->json([
                'success' => true,
                'data' => [
                    'batches' => $batches,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('[Get Batches Error] ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'فشل جلب الدفعات'], 500);
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
            'quantity'    => 'required|integer|min:1',
            'variants'    => 'nullable|array',
            'variants.*.variant_id' => 'required_with:variants|integer',
            'variants.*.variant_qty' => 'required_with:variants|integer|min:1',
        ]);

        try {
            // حذف الدفعة القديمة إن وجدت
            if ($product->batch) {
                $product->batch->batchVariants()->delete();
                $product->batch->delete();
            }

            $originalPrice = (float) ($product->price ?? 0);
            $originalQty   = (int) ($product->quantity ?? $product->dbQty ?? 0);

            $originalVariantPrices = [];
            $originalVariantQtys   = [];
            if ($product->variants_data) {
                $variantsData = is_string($product->variants_data) ? json_decode($product->variants_data, true) : $product->variants_data;
                if (is_array($variantsData)) {
                    foreach ($variantsData as $v) {
                        if (isset($v['id'])) {
                            $originalVariantPrices[] = ['variant_id' => $v['id'], 'price' => (float) ($v['price'] ?? 0)];
                            $originalVariantQtys[]   = ['variant_id' => $v['id'], 'qty' => (int) ($v['stock_quantity'] ?? 0)];
                        }
                    }
                }
            }

            $batch = Batch::create([
                'merchant_id'           => $merchant->id,
                'product_id'            => $product->id,
                'expiry_date'           => $request->expiry_date,
                'total_qty'             => $request->quantity,
                'batch_qty'             => $request->quantity,
                'status'                => 'green',
                'original_price'        => $originalPrice,
                'original_qty'          => $originalQty,
                'original_variant_prices' => !empty($originalVariantPrices) ? $originalVariantPrices : null,
                'original_variant_qtys'   => !empty($originalVariantQtys) ? $originalVariantQtys : null,
            ]);

            $batch->calculateStatus();
            $batch->save();

            // إنشاء الـ batch_variants إذا وجدت
            $variants = $request->input('variants', []);
            if (!empty($variants)) {
                foreach ($variants as $variant) {
                    BatchVariant::create([
                        'batch_id'   => $batch->id,
                        'variant_id' => $variant['variant_id'],
                        'total_qty'  => $variant['variant_qty'],
                        'batch_qty'  => $variant['variant_qty'],
                    ]);
                }
            }

            CheckBatchExpiryJob::dispatch()->afterCommit();

            return response()->json([
                'success' => true, 
                'message' => 'تم إنشاء الدفعة بنجاح',
                'batch_id' => $batch->id,
                'has_variants' => !empty($variants)
            ]);
        } catch (\Exception $e) {
            Log::error('[Store Batch Error] ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'حدث خطأ أثناء حفظ الدفعة'], 500);
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
            'expiry_date' => 'required|date',
            'total_qty'   => 'nullable|integer|min:1',
        ]);

        $batch->update([
            'expiry_date' => $request->expiry_date,
            'total_qty'   => $request->total_qty ?? $batch->total_qty,
            'batch_qty'   => $request->total_qty ?? $batch->batch_qty,
            'status'      => $batch->calculateStatus($request->expiry_date),
        ]);

        CheckBatchExpiryJob::dispatch()->afterCommit();

        return response()->json(['success' => true, 'message' => 'تم التحديث بنجاح']);
    }

    /**
     * جلب الفاريينت لمنتج — من variants_data أولاً، ومن سلة عند الحاجة
     */
    public function getProductVariants(Request $request, $product_id)
    {
        $merchant = Auth::user();
        $product = Product::where('merchant_id', $merchant->id)->where('id', $product_id)->firstOrFail();

        // ── الأولوية الأولى: variants_data المخزّن محلياً ──
        $localVariants = $product->variants_data ?? [];
        if (!empty($localVariants)) {
            return response()->json([
                'success' => true,
                'has_variants' => true,
                'variants' => $localVariants,
                'source' => 'local',
            ]);
        }

        // ── الثاني: جلب من سلة (فقط إذا local فارغ) ──
        if (!$product->salla_product_id) {
            return response()->json([
                'success' => false,
                'message' => 'المنتج غير مرتبط بسلة',
                'has_variants' => false
            ]);
        }

        try {
            $sallaApi = SallaApiService::for($merchant);
            $variantsResponse = $sallaApi->getProductVariants($product->salla_product_id);
            $variants = $variantsResponse['data'] ?? [];

            if (empty($variants)) {
                return response()->json([
                    'success' => true,
                    'has_variants' => false,
                    'variants' => [],
                ]);
            }

            // تجهيز البيانات بالشكل الموحّد مع أسماء الفاريينت
            $valueNames = $this->loadValueNamesFromProduct($sallaApi, $product->salla_product_id);
            $formattedVariants = $this->formatVariantsFromSalla($variants, $valueNames);

            Log::info('[VARIANTS BEFORE SAVE]', [
                'product_id' => $product->id,
                'salla_product_id' => $product->salla_product_id,
                'variants'   => $formattedVariants,
            ]);

            // حفظها محلياً للاستخدام المستقبلي
            $product->variants_data = $formattedVariants;
            $product->save();

            return response()->json([
                'success' => true,
                'has_variants' => count($formattedVariants) > 0,
                'variants' => $formattedVariants,
                'source' => 'salla',
            ]);
        } catch (\Exception $e) {
            Log::error('[Get Variants Error] ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'فشل جلب الفاريينت',
                'has_variants' => false
            ], 500);
        }
    }

    /**
     * السؤال للتاجر عن خيارات المنتج — من variants_data أولاً
     */
    public function checkProductOptions(Request $request, $product_id)
    {
        $merchant = Auth::user();
        $product = Product::where('merchant_id', $merchant->id)->where('id', $product_id)->firstOrFail();

        // استخدام variants_data المخزّن محلياً
        $localVariants = $product->variants_data ?? [];
        if (!empty($localVariants)) {
            return response()->json([
                'success' => true,
                'has_variants' => true,
                'variants_count' => count($localVariants),
                'source' => 'local',
            ]);
        }

        if (!$product->salla_product_id) {
            return response()->json([
                'success' => false,
                'message' => 'المنتج غير مرتبط بسلة',
                'has_variants' => false
            ]);
        }

        try {
            $sallaApi = SallaApiService::for($merchant);
            $variantsResponse = $sallaApi->getProductVariants($product->salla_product_id);
            $variants = $variantsResponse['data'] ?? [];
            $hasVariants = count($variants) > 0;

            // حفظ في local cache إذا وجدت (مع أسماء الفاريينت)
            if ($hasVariants) {
                $valueNames = $this->loadValueNamesFromProduct($sallaApi, $product->salla_product_id);
                $product->variants_data = $this->formatVariantsFromSalla($variants, $valueNames);
                $product->save();
            }

            return response()->json([
                'success' => true,
                'has_variants' => $hasVariants,
                'variants_count' => count($variants),
                'source' => 'salla',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'has_variants' => false,
                'message' => 'فشل التحقق'
            ], 500);
        }
    }

    /**
     * السؤال للتاجر عن خيارات المنتج (V2) — من variants_data أولاً
     */
    public function checkProductOptionsV2(Request $request, $product_id)
    {
        $merchant = Auth::user();
        $product = Product::where('merchant_id', $merchant->id)->where('id', $product_id)->firstOrFail();

        // استخدام variants_data المخزّن محلياً
        $localVariants = $product->variants_data ?? [];
        if (!empty($localVariants)) {
            return response()->json([
                'success' => true,
                'has_variants' => true,
                'variants_count' => count($localVariants),
                'source' => 'local',
            ]);
        }

        if (!$product->salla_product_id) {
            return response()->json([
                'success' => false,
                'message' => 'المنتج غير مرتبط بسلة',
                'has_options' => false
            ]);
        }

        try {
            $sallaApi = SallaApiService::for($merchant);
            $variantsResponse = $sallaApi->getProductVariants($product->salla_product_id);
            $variants = $variantsResponse['data'] ?? [];
            $hasVariants = count($variants) > 0;

            if ($hasVariants) {
                $valueNames = $this->loadValueNamesFromProduct($sallaApi, $product->salla_product_id);
                $product->variants_data = $this->formatVariantsFromSalla($variants, $valueNames);
                $product->save();
            }

            return response()->json([
                'success' => true,
                'has_variants' => $hasVariants,
                'variants_count' => count($variants),
                'source' => 'salla',
                'message' => $hasVariants 
                    ? 'المنتج لديه خيارات (' . count($variants) . ')'
                    : 'المنتج ليس له خيارات - هل تريد إضافتها؟'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'has_variants' => false,
                'message' => 'فشل التحقق'
            ], 500);
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

    public function destroyBatch($batchId)
    {
        return app(ProductExpiryController::class)->destroyBatch($batchId);
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
            'short_term_days'             => 'required|integer|min:1',
            'medium_term_days'            => 'required|integer|min:1',
            'long_term_days'              => 'required|integer|min:1',
            'auto_hide_expired'           => 'nullable|boolean',
            'auto_hide_before_expiry_days' => 'nullable|integer|min:0|max:365',
            'auto_discounts'              => 'nullable|boolean',
            'auto_discount_percent'       => 'nullable|integer|min:1|max:99', 
            'auto_discount_duration_days' => 'nullable|integer|min:1', 
            'category_mapping'            => 'nullable|array',
        ]);

        $settings = BatchSetting::updateOrCreate(
            ['merchant_id' => $merchant->id],
            [
                'short_term_days'             => $validated['short_term_days'],
                'medium_term_days'            => $validated['medium_term_days'],
                'long_term_days'              => $validated['long_term_days'],
                'auto_hide_expired'           => $request->boolean('auto_hide_expired'),
                'auto_hide_before_expiry_days' => $validated['auto_hide_before_expiry_days'] ?? null,
                'auto_discounts'              => $request->boolean('auto_discounts'),
                'auto_discount_percent'       => $validated['auto_discount_percent'] ?? null,       
                'auto_discount_duration_days' => $validated['auto_discount_duration_days'] ?? null, 
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

        // ✅ Non-Retroactive: عند تفعيل Auto Discount
        // نُشغل Job في الخلفية لتطبيق الخصم على الباتشات المعلقة فقط
        // هذا لا يؤثر على الباتشات التي تم خصمها سابقاً بأي شكل
        if ($request->boolean('auto_discounts')) {
            ApplyAutoDiscountToPendingBatches::dispatch($merchant->id)
                ->onQueue('default');
        }

        return response()->json([
            'success' => true,
            'settings' => $settings,
        ]);
    }

    /**
     * تنسيق بيانات الفاريينت القادمة من سلة إلى الشكل الموحّد
     *
     * ⚠️ مهم: API سلة لا ترجع اسم الفاريينت (name) في
     *    GET /products/{product}/variants
     * لذلك نبني الاسم من option value names (مثلاً "White / XL")
     *
     * @param array $variants    مصفوفة الفاريينت الخام من سلة
     * @param array $valueNames  [value_id => value_name] اختياري
     */
    private function formatVariantsFromSalla(array $variants, array $valueNames = []): array
    {
        return array_map(function ($v) use ($valueNames) {
            // بناء الاسم من option values (مثلاً "أبيض / XL")
            if (!empty($valueNames)) {
                $parts = [];
                foreach ($v['related_option_values'] ?? [] as $valueId) {
                    if (isset($valueNames[$valueId])) {
                        $parts[] = $valueNames[$valueId];
                    }
                }
                $name = implode(' / ', $parts);
            } else {
                $name = $v['name'] ?? null;
            }

            if (!$name) {
                $name = $v['sku'] ?? null;
            }

            return [
                'id'                   => $v['id'],
                'sku'                  => $v['sku'] ?? null,
                'name'                 => $name ?? '',
                'price'                => (float) ($v['price']['amount'] ?? 0),
                'sale_price'           => (float) ($v['sale_price']['amount'] ?? 0),
                'stock_quantity'       => (int) ($v['stock_quantity'] ?? 0),
                'unlimited_quantity'   => (bool) ($v['unlimited_quantity'] ?? false),
                'has_special_price'    => (bool) ($v['has_special_price'] ?? false),
                'status'               => (string) ($v['status'] ?? 'sale'),
                'related_option_values'=> $v['related_option_values'] ?? [],
                'updated_at'           => now()->toISOString(),
            ];
        }, $variants);
    }

    /**
     * بناء خريطة value_id → value_name من Product Details API
     * GET /products/{product} ترجع الخيارات مع قيمها مباشرة
     */
    private function loadValueNamesFromProduct(SallaApiService $sallaApi, string $sallaProductId): array
    {
        $valueNames = [];
        try {
            $productDetail = $sallaApi->getProductDetails($sallaProductId);
            $options = $productDetail['data']['options'] ?? [];
            foreach ($options as $option) {
                foreach ($option['values'] ?? [] as $value) {
                    $valueNames[$value['id']] = $value['name'];
                }
            }
        } catch (\Exception $e) {
            Log::warning('[loadValueNames] فشل جلب أسماء الخيارات', [
                'product_id' => $sallaProductId,
                'error'      => $e->getMessage(),
            ]);
        }
        return $valueNames;
    }
}