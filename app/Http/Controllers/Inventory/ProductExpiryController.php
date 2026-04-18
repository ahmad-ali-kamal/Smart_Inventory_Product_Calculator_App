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
    /**
     * حفظ تاريخ الانتهاء للمنتج (دفعة واحدة أو متعددة)
     */
    public function store(Request $request)
    {
        // 1. جلب المنتج والتحقق من الصلاحية
        $productId = $request->product_id;
        $product = Product::findOrFail($productId);

        if ($product->merchant_id !== auth()->id()) {
            return $this->respondWithError('غير مصرح لك بتعديل هذا المنتج', 403);
        }

        // التحقق من مجموع الكميات
        if (!$request->same_expiry) {
            $totalRequested = collect($request->batches)->sum('quantity');
            if ($totalRequested > $product->quantity) {
                return $this->respondWithError(
                    "الكمية الإجمالية ({$totalRequested}) تتجاوز المتوفر في سلة ({$product->quantity})",
                    422
                );
            }
        }

        // 2. التحقق من البيانات المرسلة
        $request->validate([
            'same_expiry' => 'required|boolean',
            'single_batch' => 'required_if:same_expiry,true|array',
            'single_batch.expiry_date' => 'required_if:same_expiry,true|date|after_or_equal:today',
            'single_batch.batch_code' => 'nullable|string',
            'single_batch.manufactured_date' => 'nullable|date|before:single_batch.expiry_date',
            'batches' => 'required_if:same_expiry,false|array|min:1',
            'batches.*.quantity' => 'required_with:batches|integer|min:1',
            'batches.*.expiry_date' => 'required_with:batches|date|after_or_equal:today',
            'batches.*.batch_code' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $merchant = auth()->user();

            // 3. إدارة الأكواد القديمة ومسح الداتا القديمة
            $oldBatchCodes = $product->batchItems()
    ->with('batch')
    ->get()
    ->map(fn($item) => $item->batch?->batch_code)
    ->filter()
    ->values()
    ->toArray();

$savedBatchCode = null;

// في حالة same_expiry = true: حدّث إن وُجد، احذف الزائد، أنشئ إن لم يوجد
if ($request->same_expiry) {
    $existingItem = $product->batchItems()->with('batch')->first();

    if ($existingItem && $existingItem->batch) {
        // ── UPDATE: باتش موجود — حدّث فقط دون مس الـ ID ──
        $existingItem->batch->update([
            'expiry_date'       => $request->input('single_batch.expiry_date'),
            'manufactured_date' => $request->input('single_batch.manufactured_date'),
        ]);
        $existingItem->update(['quantity' => $product->quantity ?? 0]);
        $savedBatchCode = $existingItem->batch->batch_code;

        // احذف أي باتشات زائدة (لو كان فيه أكثر من باتش سابق)
        $extraIds = $product->batchItems()
            ->where('batch_id', '!=', $existingItem->batch_id)
            ->pluck('batch_id');
        if ($extraIds->isNotEmpty()) {
            $product->batchItems()->where('batch_id', '!=', $existingItem->batch_id)->delete();
            Batch::whereIn('id', $extraIds)->where('merchant_id', $merchant->id)->delete();
        }
    } else {
        // ── CREATE: لا يوجد باتش سابق ──
        $batchIds = $product->batchItems()->pluck('batch_id');
        $product->batchItems()->delete();
        Batch::whereIn('id', $batchIds)->delete();
    }
}

            // 4. إنشاء الدفعات الجديدة
            if ($request->same_expiry) {
    // إذا لم يتم التعديل أعلاه (لا يوجد باتش سابق) — أنشئ جديداً
    if (!$savedBatchCode) {
        $data = $request->input('single_batch', []);
        $data['batch_code'] = $oldBatchCodes[0] ?? ($data['batch_code'] ?? 'B-'.Str::upper(Str::random(6)));
        $this->createSingleBatch($merchant, $product, $data);
        $savedBatchCode = $data['batch_code'];
    }
} else {
    $inputBatches = $request->input('batches', []);

    // 1. IDs الواردة في الطلب (الموجودة فعلاً = تحديث، الفارغة = جديدة)
    $incomingIds = collect($inputBatches)
        ->pluck('id')
        ->filter()
        ->map(fn($id) => (int) $id)
        ->values()
        ->toArray();

    // 2. IDs الموجودة في DB للمنتج هذا
    $existingIds = $product->batchItems()
        ->pluck('batch_id')
        ->map(fn($id) => (int) $id)
        ->values()
        ->toArray();

    // 3. IDs التي يجب حذفها = موجودة في DB لكن غائبة عن الطلب
    $idsToDelete = array_diff($existingIds, $incomingIds);

    if (!empty($idsToDelete)) {
        $product->batchItems()->whereIn('batch_id', $idsToDelete)->delete();
        Batch::whereIn('id', $idsToDelete)
             ->where('merchant_id', $merchant->id)
             ->delete();
    }

    // 4. Update أو Create لكل باتش في الطلب
    foreach ($inputBatches as $b) {
        $batchId = !empty($b['id']) ? (int) $b['id'] : null;

        if ($batchId && in_array($batchId, $existingIds)) {
            // ── UPDATE: باتش موجود — حدّث فقط، لا تمس الـ ID ──
            $existingBatch = Batch::where('id', $batchId)
                ->where('merchant_id', $merchant->id)
                ->first();

            if ($existingBatch) {
                $existingBatch->update([
                    'expiry_date'       => $b['expiry_date'],
                    'manufactured_date' => $b['manufactured_date'] ?? null,
                ]);

                $product->batchItems()
                    ->where('batch_id', $existingBatch->id)
                    ->update([
                        'quantity'           => $b['quantity'],
                    ]);
            }
        } else {
            // ── CREATE: باتش جديد، بدون id أو id غير موجود في DB ──
            $b['batch_code'] = $b['batch_code'] ?? 'B-' . Str::upper(Str::random(6));
            $this->createMultipleBatches($merchant, $product, [$b]);
        }
    }
}

            DB::commit();

            // ⚡️ المزامنة الفورية مع سلة (تحديث الذاكرة أولاً)
            $this->handleAutoHide($product, $merchant);

            // 5. العمليات الختامية وتحديث الكاش
            $freshProduct = $product->fresh()->load('batchItems.batch');
            $worstStatus = 'green';
            foreach ($freshProduct->batchItems as $item) {
                $s = $item->batch?->status ?? 'green';
                if ($s === 'red') { $worstStatus = 'red'; break; }
                if ($s === 'yellow') { $worstStatus = 'yellow'; }
            }

            Cache::forget("inventory_dashboard_{$merchant->id}");

            // تسجيل النشاط
            ActivityLog::log($merchant->id, 'expiry_added', "تم تحديث تواريخ الانتهاء للمنتج: {$product->name}", $product);
$freshBatches = $request->same_expiry ? [] : $freshProduct->batchItems->map(fn($item) => [
    'id'         => $item->batch?->id,
    'batch_code' => $item->batch?->batch_code,
    'expiry_date'=> $item->batch?->expiry_date?->format('Y-m-d'),
    'qty'        => $item->quantity,
    'status'     => $item->batch?->status ?? 'green',
])->values()->toArray();
$savedBatchId = $request->same_expiry ? $freshProduct->batchItems->first()?->batch?->id : null;
           return $this->respondWithSuccess('تم حفظ تواريخ الانتهاء بنجاح', [
    'type' => $request->same_expiry ? 'single' : 'batch',
    'batch_code' => $savedBatchCode,
    'batch_id'   => $savedBatchId,
    'status' => $worstStatus,
    'quantity' => $product->quantity ?? 0,
    'batches'    => $freshBatches,
]);


        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Store Expiry Error: ' . $e->getMessage());
            return $this->respondWithError('حدث خطأ أثناء حفظ البيانات: ' . $e->getMessage());
        }
    }

    /**
     * تحديث حالة الظهور تلقائياً (sale أو hidden)
     */
    protected function handleAutoHide($product, $merchant)
    {
        try {
            // 🚀 إجبار لارافل على رؤية الباتشات التي تم إنشاؤها للتو في هذا الطلب
            $product->load('batchItems.batch');

            $setting = BatchSetting::where('merchant_id', $merchant->id)->first();
            
            if ($setting && $setting->auto_hide_expired) {
                // الفحص بناءً على تاريخ الانتهاء لضمان الدقة
                $hasValidBatches = $product->batchItems()->whereHas('batch', function ($query) {
                    $query->where('expiry_date', '>=', now()->format('Y-m-d'));
                })->exists();

                $sallaApi = \App\Services\SallaApiService::for($merchant);

                if (!$hasValidBatches) {
                    Log::info("[AutoHide] No valid batches for: {$product->name}. Hiding...");
                    $sallaApi->updateProductStatus($product->salla_product_id, ['status' => 'hidden']);
                    $product->status = 'hidden';
                } else {
                    Log::info("[AutoShow] Valid batches found. Updating to SALE...");
                    $sallaApi->updateProductStatus($product->salla_product_id, ['status' => 'sale']);
                    $product->status = 'sale'; 
                }
                
                $product->save();
                Log::info("[Sync Success] Status for {$product->name} is now: " . $product->status);
            }
        } catch (\Exception $e) {
            Log::error("AutoHide Error: " . $e->getMessage());
        }
    }

    protected function createSingleBatch($merchant, Product $product, array $data)
    {
        $batch = Batch::create([
            'merchant_id' => $merchant->id,
            'name' => $product->name,
            'batch_code' => $data['batch_code'],
            'expiry_date' => $data['expiry_date'],
            'manufactured_date' => $data['manufactured_date'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        BatchItem::create([
            'batch_id' => $batch->id,
            'product_id' => $product->id,
            'quantity' => $product->quantity ?? 0,
            'unit_cost' => $product->price ?? 0,
        ]);
    }

    protected function createMultipleBatches($merchant, Product $product, array $batches)
    {
        foreach ($batches as $data) {
            $batch = Batch::create([
                'merchant_id' => $merchant->id,
                'name' => $product->name,
                'batch_code' => $data['batch_code'] ?? 'B-'.Str::upper(Str::random(6)),
                'expiry_date' => $data['expiry_date'],
                'manufactured_date' => $data['manufactured_date'] ?? null,
            ]);

            BatchItem::create([
                'batch_id' => $batch->id,
                'product_id' => $product->id,
                'quantity' => $data['quantity'],
                //'remaining_quantity' => $data['quantity'],
                'unit_cost' => $product->price ?? 0,
            ]);
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
        Batch::whereIn('id', $batchIds)->delete();

        // إعادة الحالة الافتراضية
        $product->status = 'sale';
        $product->save();

        // مزامنة مع سلة
        $merchant = auth()->user();
        try {
            $sallaApi = \App\Services\SallaApiService::for($merchant);
            $sallaApi->updateProductStatus($product->salla_product_id, ['status' => 'sale']);
        } catch (\Exception $e) {
            Log::warning("Salla sync failed on reset: " . $e->getMessage());
        }

        DB::commit();
        Cache::forget("inventory_dashboard_" . $merchant->id);
        ActivityLog::log($merchant->id, 'expiry_deleted', "تم حذف تواريخ الانتهاء للمنتج: {$product->name}", $product);

        return $this->respondWithSuccess('تم حذف البيانات وإعادة المنتج للحالة الافتراضية', [
            'reset' => true,
        ]);

    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Destroy Expiry Error: ' . $e->getMessage());
        return $this->respondWithError('حدث خطأ أثناء الحذف: ' . $e->getMessage());
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