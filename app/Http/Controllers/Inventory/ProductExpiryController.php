<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Batch;
use App\Models\BatchItem;
use App\Models\BatchSetting;
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
        ]);

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
                $existingItem = $product->batchItems()->with('batch')->first();

                if ($existingItem && $existingItem->batch) {
                    $existingItem->batch->update([
                        'expiry_date'       => $request->input('single_batch.expiry_date'),
                        'manufactured_date' => $request->input('single_batch.manufactured_date'),
                    ]);
                    $existingItem->update(['quantity' => $product->quantity ?? 0]);
                    $savedBatchCode = $existingItem->batch->batch_code;

                    $extraIds = $product->batchItems()
                        ->where('batch_id', '!=', $existingItem->batch_id)
                        ->pluck('batch_id');
                    if ($extraIds->isNotEmpty()) {
                        $product->batchItems()->where('batch_id', '!=', $existingItem->batch_id)->delete();
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

            if ($request->same_expiry) {
                if (!$savedBatchCode) {
                    $data               = $request->input('single_batch', []);
                    $data['batch_code'] = $oldBatchCodes[0] ?? ($data['batch_code'] ?? 'B-' . Str::upper(Str::random(6)));
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

        BatchItem::create([
            'batch_id'   => $batch->id,
            'product_id' => $product->id,
            'quantity'   => $product->quantity ?? 0,
            'unit_cost'  => $product->price ?? 0,
        ]);

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

            BatchItem::create([
                'batch_id'   => $batch->id,
                'product_id' => $product->id,
                'quantity'   => $data['quantity'],
                'unit_cost'  => $product->price ?? 0,
            ]);

            $created[] = $batch;
        }
        return $created;
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