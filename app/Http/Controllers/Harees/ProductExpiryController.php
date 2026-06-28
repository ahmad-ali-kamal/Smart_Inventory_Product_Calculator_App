<?php

namespace App\Http\Controllers\Harees;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Batch;
use App\Models\BatchSetting;
use App\Models\BatchDiscount;
use App\Models\BatchVariant;
use App\Models\ActivityLog;
use App\Jobs\CheckBatchExpiryJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class ProductExpiryController extends Controller
{
    public function store(Request $request)
    {
        $product = Product::findOrFail($request->product_id);

        if ($product->merchant_id !== auth()->id()) {
            return $this->respondWithError('غير مصرح لك بتعديل هذا المنتج', 403);
        }

        $request->validate([
            'expiry_date'               => 'required|date|after_or_equal:today',
            'total_qty'                 => 'required|integer|min:1',
            'variants'                  => 'nullable|array',
            'variants.*.variant_id'     => 'required_with:variants|integer',
            'variants.*.variant_qty'    => 'required_with:variants|integer|min:1',
        ]);

        DB::beginTransaction();
        try {
            $merchant = auth()->user();

            if ($product->batch) {
                $this->cleanupDiscountsOnBatchDeletion($product, collect([$product->batch->id]));
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
                            $originalVariantQtys[]   = ['variant_id' => $v['id'], 'qty' => (int) ($v['quantity'] ?? 0)];
                        }
                    }
                }
            }

            $batch = Batch::create([
                'merchant_id'           => $merchant->id,
                'product_id'            => $product->id,
                'expiry_date'           => $request->expiry_date,
                'total_qty'             => $request->total_qty,
                'batch_qty'             => $request->total_qty,
                'status'                => 'green',
                'original_price'        => $originalPrice,
                'original_qty'          => $originalQty,
                'original_variant_prices' => !empty($originalVariantPrices) ? $originalVariantPrices : null,
                'original_variant_qtys'   => !empty($originalVariantQtys) ? $originalVariantQtys : null,
            ]);

            $batch->calculateStatus();
            $batch->save();

            $variants = $request->input('variants', []);
            if (!empty($variants)) {
                $totalVariantQty = 0;
                foreach ($variants as $variant) {
                    BatchVariant::create([
                        'batch_id'   => $batch->id,
                        'variant_id' => $variant['variant_id'],
                        'total_qty'  => $variant['variant_qty'],
                        'batch_qty'  => $variant['variant_qty'],
                    ]);
                    $totalVariantQty += $variant['variant_qty'];
                }

                if ($totalVariantQty !== (int) $request->total_qty) {
                    DB::rollBack();
                    return $this->respondWithError(
                        "مجموع كميات الـ variants ({$totalVariantQty}) يجب أن يساوي الكمية الإجمالية ({$request->total_qty})",
                        422
                    );
                }
            }

            DB::commit();

            CheckBatchExpiryJob::dispatch()->afterCommit();

            $batch->sendExpiryNotificationIfNeeded();

            $this->handleAutoHide($product, $merchant);

            Cache::forget("harees_dashboard_{$merchant->id}");
            Cache::forget("harees_dashboard_api_{$merchant->id}");

            ActivityLog::log(
                $merchant->id, 'expiry_added',
                "تم إضافة تاريخ انتهاء للمنتج: {$product->name}", $product
            );

            return $this->respondWithSuccess('تم حفظ تاريخ الانتهاء بنجاح', [
                'batch_id'    => $batch->id,
                'expiry_date' => $batch->expiry_date->format('Y-m-d'),
                'status'      => $batch->status,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Store Expiry Error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return $this->respondWithError('حدث خطأ أثناء حفظ البيانات');
        }
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        if ($product->merchant_id !== auth()->id()) return abort(403);

        DB::beginTransaction();
        try {
            $merchant = auth()->user();
            $batch = $product->batch;

            if ($batch) {
                $this->cleanupDiscountsOnBatchDeletion($product, collect([$batch->id]));
                $this->restoreOriginalQuantity($batch, $product, $merchant);
                $batch->batchVariants()->delete();
                $batch->delete();
            }

            $product->status = 'sale';
            $product->save();

            try {
                $sallaApi = \App\Services\SallaApiService::for($merchant);
                $sallaApi->updateProductStatusOnly($product->salla_product_id, 'sale');
            } catch (\Exception $e) {
                Log::warning('Salla sync failed on reset: ' . $e->getMessage());
            }

            DB::commit();

            CheckBatchExpiryJob::dispatch()->afterCommit();
            Cache::forget("harees_dashboard_{$merchant->id}");
            Cache::forget("harees_dashboard_api_{$merchant->id}");

            ActivityLog::log($merchant->id, 'expiry_deleted',
                "تم حذف تاريخ الانتهاء للمنتج: {$product->name}", $product);

            return $this->respondWithSuccess('تم حذف البيانات وإعادة المنتج للحالة الافتراضية', ['reset' => true]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Destroy Expiry Error: ' . $e->getMessage());
            return $this->respondWithError('حدث خطأ أثناء الحذف');
        }
    }

    public function destroyBatch($batchId)
    {
        $batch = Batch::with('product')->findOrFail($batchId);
        if ($batch->merchant_id !== auth()->id()) return abort(403);

        $merchant = auth()->user();

        DB::beginTransaction();
        try {
            $product = $batch->product;

            $this->cleanupDiscountsOnBatchDeletion($product, collect([$batch->id]));
            $this->restoreOriginalQuantity($batch, $product, $merchant);

            $batch->batchVariants()->delete();
            $batch->delete();

            if ($product) {
                $product->status = 'sale';
                $product->save();

                try {
                    $sallaApi = \App\Services\SallaApiService::for($merchant);
                    $sallaApi->updateProductStatusOnly($product->salla_product_id, 'sale');
                } catch (\Exception $e) {
                    Log::warning("[DeleteBatch] فشل تحديث حالة المنتج: " . $e->getMessage());
                }
            }

            DB::commit();

            Cache::forget("harees_dashboard_api_{$merchant->id}");

            ActivityLog::log($merchant->id, 'batch_deleted',
                "تم حذف الدفعة للمنتج: {$product?->name}", $batch);

            return response()->json(['success' => true, 'message' => 'تم حذف الدفعة بنجاح']);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('[DeleteBatch] خطأ في حذف الدفعة: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'حدث خطأ أثناء حذف الدفعة'], 500);
        }
    }

    protected function handleAutoHide($product, $merchant): void
    {
        try {
            if (!$merchant || !$product || !$product->salla_product_id) return;

            $setting = BatchSetting::where('merchant_id', $merchant->id)->first();
            if (!$setting || !$setting->auto_hide_expired) return;

            $batch = $product->batch;
            $shouldHide = false;

            if (!$batch) {
                $shouldHide = true;
            } elseif ($batch->expiry_date) {
                $expiry  = \Carbon\Carbon::parse($batch->expiry_date)->startOfDay();
                $today   = \Carbon\Carbon::now()->startOfDay();
                $daysLeft = (int) $today->diffInDays($expiry, false);
                $beforeDays = (int) ($setting->auto_hide_before_expiry_days ?? 0);

                if ($daysLeft <= $beforeDays) {
                    $shouldHide = true;
                }
            }

            $sallaApi  = \App\Services\SallaApiService::for($merchant);
            $newStatus = $shouldHide ? 'hidden' : 'sale';

            $sallaApi->updateProductStatusOnly($product->salla_product_id, $newStatus);
            $product->status = $newStatus;
            $product->save();

            Log::info("[AutoHide] {$product->name} → {$newStatus}");

        } catch (\Exception $e) {
            Log::error('AutoHide Error: ' . $e->getMessage());
        }
    }

    protected function cleanupDiscountsOnBatchDeletion(?Product $product, $batchIds): void
    {
        if (!$product || $batchIds->isEmpty()) return;

        $discounts = BatchDiscount::whereIn('batch_id', $batchIds)->active()->get();
        if ($discounts->isEmpty()) return;

        try {
            $merchant = $product->merchant;
            if ($merchant && $product->salla_product_id) {
                $sallaApi = \App\Services\SallaApiService::for($merchant);

                foreach ($discounts as $discount) {
                    $batch = $discount->batch;
                    if (!$batch) continue;

                    $variantIds = $batch->batchVariants()->pluck('variant_id');

                    if ($variantIds->isNotEmpty()) {
                        foreach ($batch->batchVariants as $bv) {
                            $variantSku  = null;
                            $originalPrice = $batch->original_price;
                            $originalVariantPrices = $batch->original_variant_prices ?? [];

                            $matchedVariantPrice = null;
                            foreach ($originalVariantPrices as $ovp) {
                                if ((int) ($ovp['variant_id'] ?? 0) === (int) $bv->variant_id) {
                                    $matchedVariantPrice = (float) ($ovp['price'] ?? 0);
                                    break;
                                }
                            }

                            $restorePrice = $matchedVariantPrice ?: ($originalPrice ?: 0);

                            $sallaApi->updateBatchVariant($bv->variant_id, [
                                'price'      => $restorePrice,
                                'sale_price' => 0,
                            ]);
                        }
                    } else {
                        $restorePrice = (float) ($batch->original_price ?: ($product->price ?? 0));
                        $sallaApi->updateProductPrice($product->salla_product_id, $restorePrice, 0);
                    }

                    $discount->update(['status' => 'cancelled']);
                }
            }
        } catch (\Exception $e) {
            Log::warning("[Cleanup] فشل تنظيف الخصومات: " . $e->getMessage());
        }
    }

    protected function restoreOriginalQuantity(Batch $batch, ?Product $product, $merchant): void
    {
        if (!$product || !$merchant || !$product->salla_product_id) return;

        try {
            $sallaApi = \App\Services\SallaApiService::for($merchant);

            $originalQty = $batch->original_qty;
            $originalVariantQtys = $batch->original_variant_qtys ?? [];

            $hasVariants = $batch->batchVariants()->exists();

            if ($hasVariants && !empty($originalVariantQtys)) {
                foreach ($originalVariantQtys as $ovq) {
                    $variantId = $ovq['variant_id'] ?? null;
                    $qty = (int) ($ovq['qty'] ?? 0);
                    if ($variantId) {
                        $sallaApi->updateBatchVariant($variantId, [
                            'stock_quantity' => $qty,
                        ]);
                    }
                }
            } elseif ($originalQty !== null && $originalQty > 0) {
                $sallaApi->updateProductQuantity($product->salla_product_id, $originalQty);
            }

            Log::info("[RestoreQty] تم استعادة الكمية الأصلية للمنتج {$product->id}", [
                'original_qty' => $originalQty,
            ]);
        } catch (\Exception $e) {
            Log::warning("[RestoreQty] فشل استعادة الكمية: " . $e->getMessage());
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
