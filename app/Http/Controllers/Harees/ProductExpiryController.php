<?php

namespace App\Http\Controllers\Harees;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Batch;
use App\Models\BatchItem;
use App\Models\BatchSetting;
use App\Models\BatchDiscount;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class ProductExpiryController extends Controller
{
    public function store(Request $request)
    {
        $productId = $request->product_id;
        $product   = Product::findOrFail($productId);

        if ($product->merchant_id !== auth()->id()) {
            return $this->respondWithError('غير مصرح لك بتعديل هذا المنتج', 403);
        }

        if (!$request->same_expiry) {
            $totalRequested = collect($request->batches)->sum('quantity');
            if ($totalRequested > $product->quantity) {
                return $this->respondWithError(
                    "الكمية الإجمالية ({$totalRequested}) تتجاوز المتوفر في سلة ({$product->quantity})",
                    422
                );
            }
        }

        $request->validate([
            'same_expiry'                    => 'required|boolean',
            'single_batch'                   => 'required_if:same_expiry,true|array',
            'single_batch.expiry_date'       => 'required_if:same_expiry,true|date|after_or_equal:today',
            'single_batch.batch_code'        => 'nullable|string',
            'single_batch.manufactured_date' => 'nullable|date|before:single_batch.expiry_date',
            'batches'                        => 'required_if:same_expiry,false|array|min:1',
            'batches.*.quantity'             => 'required_with:batches|integer|min:1',
            'batches.*.expiry_date'          => 'required_with:batches|date|after_or_equal:today',
            'batches.*.batch_code'           => 'nullable|string',
            'variants'                       => 'nullable|array',
            'variants.*.salla_variant_id'    => 'required_with:variants|integer',
            'variants.*.variant_quantity'    => 'required_with:variants|integer|min:1',
            'batch_variants'                => 'nullable|array',
            'batch_variants.*.batch_id'     => 'nullable|integer',
            'batch_variants.*.variants'     => 'nullable|array',
            'batch_variants.*.variants.*.salla_variant_id' => 'integer',
            'batch_variants.*.variants.*.variant_quantity' => 'integer|min:0',
        ]);

        // ✅ Server-side variant validation - مطابق لـ ExpiryModal.jsx
        $this->validateVariants($request, $product);

        DB::beginTransaction();
        try {
            $merchant = auth()->user();

            $oldBatchCodes = $product->batchItems()
                ->with('batch')
                ->get()
                ->map(fn($item) => $item->batch?->batch_code)
                ->filter()
                ->values()
                ->toArray();

            $savedBatchCode = null;

            // ─── إدارة الباتشات القديمة ───────────────────────────────
            if ($request->same_expiry) {
                $existingItems = $product->batchItems()->with('batch')->get();
                $existingItem = $existingItems->first();

                if ($existingItem && $existingItem->batch) {
                    $existingItem->batch->update([
                        'expiry_date'       => $request->input('single_batch.expiry_date'),
                        'manufactured_date' => $request->input('single_batch.manufactured_date'),
                    ]);
                    
                    $savedBatchCode = $existingItem->batch->batch_code;

                    // حذف الـ batch_items القديمة المرتبطة بهذا الـ batch
                    $product->batchItems()->where('batch_id', $existingItem->batch_id)->delete();
                    
                    // إنشاء batch_items جديدة مع الـ variants
                    $variants = $request->input('variants', []);
                    if (!empty($variants)) {
                        foreach ($variants as $variant) {
                            BatchItem::create([
                                'batch_id'         => $existingItem->batch_id,
                                'product_id'       => $product->id,
                                'quantity'         => $variant['variant_quantity'] ?? ($product->quantity ?? 0),
                                'unit_cost'        => $product->price ?? 0,
                                'salla_variant_id' => $variant['salla_variant_id'] ?? null,
                                'variant_quantity' => $variant['variant_quantity'] ?? null,
                            ]);
                        }
                    } else {
                        BatchItem::create([
                            'batch_id'   => $existingItem->batch_id,
                            'product_id' => $product->id,
                            'quantity'   => $product->quantity ?? 0,
                            'unit_cost'  => $product->price ?? 0,
                        ]);
                    }

                    // حذف أي batch_items قديمة لم تُحدث
                    $extraIds = $existingItems
                        ->where('batch_id', '!=', $existingItem->batch_id)
                        ->pluck('batch_id')
                        ->unique()
                        ->values()
                        ->toArray();
                    if (!empty($extraIds)) {
                        $product->batchItems()->whereIn('batch_id', $extraIds)->delete();
                        Batch::whereIn('id', $extraIds)->where('merchant_id', $merchant->id)->delete();
                    }
                } else {
                    $batchIds = $product->batchItems()->pluck('batch_id');
                    $product->batchItems()->delete();
                    Batch::whereIn('id', $batchIds)->delete();
                }
            }

            // ─── إنشاء الباتشات الجديدة ───────────────────────────────
            // ✅ نتتبع الباتشات الجديدة لإرسال الـ notification بعد ربطها بالمنتج
            $newlyCreatedBatches = [];

            Log::info('[ExpiryStore] Request data:', [
                'same_expiry' => $request->same_expiry,
                'variants' => $request->input('variants'),
                'single_batch' => $request->input('single_batch'),
            ]);
            
            if ($request->same_expiry) {
                if (!$savedBatchCode) {
                    $data               = $request->input('single_batch', []);
                    $data['batch_code'] = $oldBatchCodes[0] ?? ($data['batch_code'] ?? 'B-' . Str::upper(Str::random(6)));
                    $data['variants']   = $request->input('variants', []);
                    
                    Log::info('[ExpiryStore] Creating batch with variants:', $data['variants']);
                    
                    $newBatch           = $this->createSingleBatch($merchant, $product, $data);
                    $savedBatchCode     = $data['batch_code'];
                    if ($newBatch) $newlyCreatedBatches[] = $newBatch;
                }
            } else {
                $inputBatches = $request->input('batches', []);

                $incomingIds = collect($inputBatches)
                    ->pluck('id')->filter()
                    ->map(fn($id) => (int) $id)->values()->toArray();

                $existingIds = $product->batchItems()
                    ->pluck('batch_id')
                    ->map(fn($id) => (int) $id)->values()->toArray();

                $idsToDelete = array_diff($existingIds, $incomingIds);
                if (!empty($idsToDelete)) {
                    $product->batchItems()->whereIn('batch_id', $idsToDelete)->delete();
                    Batch::whereIn('id', $idsToDelete)->where('merchant_id', $merchant->id)->delete();
                }

                foreach ($inputBatches as $b) {
                    $batchId = !empty($b['id']) ? (int) $b['id'] : null;

                    if ($batchId && in_array($batchId, $existingIds)) {
                        $existingBatch = Batch::where('id', $batchId)
                            ->where('merchant_id', $merchant->id)->first();

                        if ($existingBatch) {
                            $existingBatch->update([
                                'expiry_date'       => $b['expiry_date'],
                                'manufactured_date' => $b['manufactured_date'] ?? null,
                            ]);
                            $product->batchItems()
                                ->where('batch_id', $existingBatch->id)
                                ->update(['quantity' => $b['quantity']]);
                        }
                    } else {
                        $b['batch_code'] = $b['batch_code'] ?? 'B-' . Str::upper(Str::random(6));
                        $batchVariants = $request->input('batch_variants', []);
                        $batchVariantData = collect($batchVariants)->firstWhere('batch_id', $b['id'] ?? null);
                        $b['variants'] = $batchVariantData['variants'] ?? [];
                        $createdBatches  = $this->createMultipleBatches($merchant, $product, [$b]);
                        $newlyCreatedBatches = array_merge($newlyCreatedBatches, $createdBatches);
                    }
                }
            }

            DB::commit();

            // ✅ الآن BatchItem موجود — نُرسل الـ notifications بأمان
            foreach ($newlyCreatedBatches as $newBatch) {
                $newBatch->sendExpiryNotificationIfNeeded();
            }

            $this->handleAutoHide($product, $merchant);

            $freshProduct = $product->fresh()->load('batchItems.batch');
            $worstStatus  = 'green';
            foreach ($freshProduct->batchItems as $item) {
                $s = $item->batch?->status ?? 'green';
                if ($s === 'red')    { $worstStatus = 'red'; break; }
                if ($s === 'yellow') { $worstStatus = 'yellow'; }
            }

            Cache::forget("inventory_dashboard_{$merchant->id}");
            Cache::forget("inventory_dashboard_api_{$merchant->id}");
            ActivityLog::log(
                $merchant->id, 'expiry_added',
                "تم تحديث تواريخ الانتهاء للمنتج: {$product->name}", $product
            );

            $freshBatches = $request->same_expiry ? [] : $freshProduct->batchItems->map(fn($item) => [
                'id'          => $item->batch?->id,
                'batch_code'  => $item->batch?->batch_code,
                'expiry_date' => $item->batch?->expiry_date?->format('Y-m-d'),
                'qty'         => $item->quantity,
                'status'      => $item->batch?->status ?? 'green',
            ])->values()->toArray();

            $savedBatchId = $request->same_expiry
                ? $freshProduct->batchItems->first()?->batch?->id
                : null;

            return $this->respondWithSuccess('تم حفظ تواريخ الانتهاء بنجاح', [
                'type'       => $request->same_expiry ? 'single' : 'batch',
                'batch_code' => $savedBatchCode,
                'batch_id'   => $savedBatchId,
                'expiry_date' => $request->same_expiry
        ? ($freshProduct->batchItems->first()?->batch?->expiry_date?->format('Y-m-d'))
        : null,
                'status'     => $worstStatus,
                'quantity'   => $product->quantity ?? 0,
                'batches'    => $freshBatches,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Store Expiry Error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return $this->respondWithError('حدث خطأ أثناء حفظ البيانات: ' . $e->getMessage());
        }
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        if ($product->merchant_id !== auth()->id()) return abort(403);

        DB::beginTransaction();
        try {
            $batchIds = $product->batchItems()->pluck('batch_id');
            
            // ✅ تنظيف الخصومات المرتبطة بالـ batches قبل الحذف
            $this->cleanupDiscountsOnBatchDeletion($product, $batchIds);
            
            $product->batchItems()->delete();
            Batch::whereIn('id', $batchIds)->where('merchant_id', auth()->id())->delete();

            $product->status = 'sale';
            $product->save();

            $merchant = auth()->user();
            try {
                $sallaApi = \App\Services\SallaApiService::for($merchant);
                $sallaApi->updateProductStatusOnly($product->salla_product_id, 'sale');
            } catch (\Exception $e) {
                Log::warning('Salla sync failed on reset: ' . $e->getMessage());
            }

            DB::commit();
           Cache::forget("inventory_dashboard_{$merchant->id}");
           Cache::forget("inventory_dashboard_api_{$merchant->id}");
            ActivityLog::log($merchant->id, 'expiry_deleted',
                "تم حذف تواريخ الانتهاء للمنتج: {$product->name}", $product);

            return $this->respondWithSuccess('تم حذف البيانات وإعادة المنتج للحالة الافتراضية', ['reset' => true]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Destroy Expiry Error: ' . $e->getMessage());
            return $this->respondWithError('حدث خطأ أثناء الحذف: ' . $e->getMessage());
        }
    }

    protected function handleAutoHide($product, $merchant): void
    {
        try {
            $product->load('batchItems.batch');

            if (!$merchant || !$product || !$product->salla_product_id) return;

            $setting = BatchSetting::where('merchant_id', $merchant->id)->first();
            if (!$setting || !$setting->auto_hide_expired) return;

            $hasValidBatches = $product->batchItems()->whereHas('batch', function ($q) {
                $q->where('expiry_date', '>=', now()->format('Y-m-d'));
            })->exists();

            $sallaApi  = \App\Services\SallaApiService::for($merchant);
            $newStatus = $hasValidBatches ? 'sale' : 'hidden';

            $sallaApi->updateProductStatusOnly($product->salla_product_id, $newStatus);
            $product->status = $newStatus;
            $product->save();

            Log::info("[AutoHide] {$product->name} → {$newStatus}");
        } catch (\Exception $e) {
            Log::error('AutoHide Error: ' . $e->getMessage());
        }
    }

    // =========================================================
    // Helpers — يُرجعان الـ Batch المُنشأ لإرسال الـ notification لاحقاً
    // =========================================================

    protected function createSingleBatch($merchant, Product $product, array $data): ?Batch
    {
        $batch = Batch::create([
            'merchant_id'       => $merchant->id,
            'name'              => $product->name,
            'batch_code'        => $data['batch_code'],
            'expiry_date'       => $data['expiry_date'],
            'manufactured_date' => $data['manufactured_date'] ?? null,
            'notes'             => $data['notes'] ?? null,
        ]);

        $variants = $data['variants'] ?? [];
        
        Log::info('[CreateSingleBatch] Received variants:', $variants);
        
        if (!empty($variants)) {
            foreach ($variants as $variant) {
                BatchItem::create([
                    'batch_id'         => $batch->id,
                    'product_id'       => $product->id,
                    'quantity'         => $variant['variant_quantity'] ?? ($product->quantity ?? 0),
                    'unit_cost'        => $product->price ?? 0,
                    'salla_variant_id' => $variant['salla_variant_id'] ?? null,
                    'variant_quantity' => $variant['variant_quantity'] ?? null,
                ]);
            }
        } else {
            BatchItem::create([
                'batch_id'   => $batch->id,
                'product_id' => $product->id,
                'quantity'   => $product->quantity ?? 0,
                'unit_cost'  => $product->price ?? 0,
            ]);
        }

        return $batch;
    }

    /**
     * @return Batch[]
     */
    protected function createMultipleBatches($merchant, Product $product, array $batches): array
    {
        $created = [];
        foreach ($batches as $data) {
            $batch = Batch::create([
                'merchant_id'       => $merchant->id,
                'name'              => $product->name,
                'batch_code'        => $data['batch_code'] ?? 'B-' . Str::upper(Str::random(6)),
                'expiry_date'       => $data['expiry_date'],
                'manufactured_date' => $data['manufactured_date'] ?? null,
            ]);

            $variants = $data['variants'] ?? [];
            
            if (!empty($variants)) {
                foreach ($variants as $variant) {
                    $variantId = $variant['salla_variant_id'] ?? null;
                    
                    BatchItem::updateOrCreate(
                        [
                            'batch_id'         => $batch->id,
                            'product_id'       => $product->id,
                            'salla_variant_id' => $variantId,
                        ],
                        [
                            'quantity'         => $variant['variant_quantity'] ?? ($data['quantity'] ?? 0),
                            'unit_cost'        => $product->price ?? 0,
                            'variant_quantity' => $variant['variant_quantity'] ?? null,
                        ]
                    );
                }
            } else {
                BatchItem::updateOrCreate(
                    [
                        'batch_id'   => $batch->id,
                        'product_id' => $product->id,
                    ],
                    [
                        'quantity'   => $data['quantity'] ?? 0,
                        'unit_cost'  => $product->price ?? 0,
                    ]
                );
            }

            $created[] = $batch;
        }
        return $created;
    }

    /**
     * تنظيف الخصومات عند حذف الباتشات
     */
    protected function cleanupDiscountsOnBatchDeletion(Product $product, $batchIds): void
    {
        if ($batchIds->isEmpty()) return;

        // جلب الخصومات النشطة للـ batches المحذوفة
        $discounts = BatchDiscount::whereIn('batch_id', $batchIds)
            ->active()
            ->get();

        if ($discounts->isEmpty()) return;

        try {
            $merchant = $product->merchant;
            if ($merchant && $product->salla_product_id) {
                $sallaApi = \App\Services\SallaApiService::for($merchant);

                foreach ($discounts as $discount) {
                    $batchItem = $discount->batch?->batchItems->first();
                    $variantId = $batchItem?->salla_variant_id;

                    if ($variantId) {
                        try {
                            $variantDetails = $sallaApi->getVariantDetails($variantId);
                            $variantData = $variantDetails['data'] ?? [];
                            $currentSku = $variantData['sku'] ?? null;
                            $currentPrice = (float) ($variantData['price']['amount'] ?? 0);
                            $batchItemQty = (int) ($batchItem?->quantity ?? 0);

                            if ($currentSku) {
                                $sallaApi->updateBatchVariant($variantId, [
                                    'sku'            => $currentSku,
                                    'price'          => $currentPrice,
                                    'stock_quantity' => $batchItemQty,
                                    'sale_price'     => 0,
                                ]);
                                Log::info("[Cleanup] إزالة sale_price من variant {$variantId}");
                            }
                        } catch (\Exception $e) {
                            Log::warning("[Cleanup] فشل إزالة sale_price: " . $e->getMessage());
                        }
                    }

                    $discount->update(['status' => 'cancelled']);
                }
            }
        } catch (\Exception $e) {
            Log::warning("[Cleanup] فشل تنظيف الخصومات: " . $e->getMessage());
        }
    }

    /**
     * Server-side validation للـ variants - مطابق لـ ExpiryModal.jsx
     */
    protected function validateVariants(Request $request, Product $product): void
    {
        // ✅ الحصول على variants_data من المنتج (الـ cache المحلي)
        $variantsData = $product->variants_data ?? [];
        
        // إنشاء خريطة للـ stock quantity
        $stockMap = [];
        foreach ($variantsData as $v) {
            $stockMap[$v['id']] = [
                'stock_quantity' => $v['stock_quantity'] ?? 0,
                'unlimited_quantity' => $v['unlimited_quantity'] ?? false,
            ];
        }

        // ─── same_expiry: التحقق من variants ───
        if ($request->same_expiry) {
            $variants = $request->input('variants', []);
            if (!empty($variants)) {
                $totalVariantQty = collect($variants)->sum('variant_quantity');
                
                // يجب أن يساوي product.quantity في وضع same_expiry
                if ($totalVariantQty !== (int) $product->quantity) {
                    throw new \InvalidArgumentException(
                        "مجموع كميات الـ variants ({$totalVariantQty}) يجب أن يساوي الكمية الإجمالية للمنتج ({$product->quantity})"
                    );
                }

                // التحقق من stock
                foreach ($variants as $variant) {
                    $variantId = $variant['salla_variant_id'] ?? null;
                    $qty = $variant['variant_quantity'] ?? 0;
                    if (!$variantId) continue;
                    
                    $stock = $stockMap[$variantId] ?? null;
                    if ($stock && !$stock['unlimited_quantity'] && $qty > $stock['stock_quantity']) {
                        throw new \InvalidArgumentException(
                            "كمية الـ variant تتجاوز المخزون المتوفر ({$stock['stock_quantity']})"
                        );
                    }
                }
            }
        }

        // ─── multi-batch: التحقق من كل batch ───
        $batches = $request->input('batches', []);
        $batchVariants = $request->input('batch_variants', []);

        foreach ($batches as $idx => $batch) {
            $batchQty = (int) ($batch['quantity'] ?? 0);
            $batchId = $batch['id'] ?? null;
            
            // البحث عن variants لهذا الـ batch
            $linkedVariants = collect($batchVariants)
                ->firstWhere('batch_id', $batchId);
            
            if ($linkedVariants && !empty($linkedVariants['variants'])) {
                $totalVariantQty = collect($linkedVariants['variants'])
                    ->sum('variant_quantity');

                // يجب أن يساوي quantity الـ batch
                if ($totalVariantQty !== $batchQty) {
                    throw new \InvalidArgumentException(
                        "Batch " . ($idx + 1) . ": مجموع كميات الـ variants ({$totalVariantQty}) يجب أن يساوي كمية الـ batch ({$batchQty})"
                    );
                }

                // التحقق من stock لكل variant
                foreach ($linkedVariants['variants'] as $variant) {
                    $variantId = $variant['salla_variant_id'] ?? null;
                    $qty = $variant['variant_quantity'] ?? 0;
                    if (!$variantId || $qty <= 0) continue;
                    
                    $stock = $stockMap[$variantId] ?? null;
                    if ($stock && !$stock['unlimited_quantity'] && $qty > $stock['stock_quantity']) {
                        throw new \InvalidArgumentException(
                            "كمية الـ variant تتجاوز المخزون المتوفر ({$stock['stock_quantity']})"
                        );
                    }
                }
            }
        }

        // ─── التحقق الإجمالي: مجموع كل الدفعات لا يتجاوز product.quantity ───
        if (!$request->same_expiry) {
            $totalBatchesQty = collect($batches)->sum('quantity');
            if ($totalBatchesQty > (int) $product->quantity) {
                throw new \InvalidArgumentException(
                    "الكمية الإجمالية ({$totalBatchesQty}) تتجاوز المخزون المتوفر ({$product->quantity})"
                );
            }
        }
    }

    protected function respondWithSuccess($message, $data = [])
    {
        return response()->json(array_merge(['success' => true, 'message' => $message], $data));
    }

    protected function respondWithError($message, $code = 500)
    {
        return response()->json(['success' => false, 'message' => $message], $code);
    }
}