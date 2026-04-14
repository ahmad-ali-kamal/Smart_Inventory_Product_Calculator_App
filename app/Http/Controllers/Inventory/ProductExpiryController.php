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

            $batchIds = $product->batchItems()->pluck('batch_id');
            $product->batchItems()->delete();
            Batch::whereIn('id', $batchIds)->delete();

            $savedBatchCode = null;

            // 4. إنشاء الدفعات الجديدة
            if ($request->same_expiry) {
                $data = $request->input('single_batch', []);
                $data['batch_code'] = $oldBatchCodes[0] ?? ($data['batch_code'] ?? 'B-'.Str::upper(Str::random(6)));
                $this->createSingleBatch($merchant, $product, $data);
                $savedBatchCode = $data['batch_code'];
            } else {
                $inputBatches = $request->input('batches', []);
                foreach ($inputBatches as $i => $b) {
                    $b['batch_code'] = $oldBatchCodes[$i] ?? ($b['batch_code'] ?? 'B-'.Str::upper(Str::random(6)));
                    $this->createMultipleBatches($merchant, $product, [$b]);
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

            return $this->respondWithSuccess('تم حفظ تواريخ الانتهاء بنجاح', [
                'type' => $request->same_expiry ? 'single' : 'batch',
                'batch_code' => $savedBatchCode,
                'status' => $worstStatus,
                'quantity' => $product->quantity ?? 0,
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
            'remaining_quantity' => $product->quantity ?? 0,
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
                'remaining_quantity' => $data['quantity'],
                'unit_cost' => $product->price ?? 0,
            ]);
        }
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        if ($product->merchant_id !== auth()->id()) return abort(403);

        $batchIds = $product->batchItems()->pluck('batch_id');
        $product->batchItems()->delete();
        Batch::whereIn('id', $batchIds)->delete();
        
        Cache::forget("inventory_dashboard_" . auth()->id());
        return $this->respondWithSuccess('تم حذف تواريخ الانتهاء بنجاح');
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