<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Batch;
use App\Models\BatchItem;
use App\Models\BatchSetting; // إضافة الموديل هنا
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
        // 1. جلب المنتج من معرف المنتج المرسل في الطلب
        $productId = $request->product_id;
        $product = Product::findOrFail($productId);

        // 2. التحقق من الصلاحية (أن المنتج يخص التاجر المسجل دخوله)
        if ($product->merchant_id !== auth()->id()) {
            return $this->respondWithError('غير مصرح لك بتعديل هذا المنتج', 403);
        }

        // التحقق من أن مجموع الكميات لا يتجاوز كمية المنتج في سلة
        if (!$request->same_expiry) {
            $totalRequested = collect($request->batches)->sum('quantity');
            if ($totalRequested > $product->quantity) {
                return $this->respondWithError(
                    "Total batch quantity ({$totalRequested}) exceeds product quantity ({$product->quantity})",
                    422
                );
            }
        }

        // 3. التحقق من البيانات المرسلة
        $validated = $request->validate([
            'same_expiry' => 'required|boolean',
            
            // في حال تاريخ واحد
            'single_batch' => 'required_if:same_expiry,true|array',
            'single_batch.expiry_date' => 'required_if:same_expiry,true|date|after_or_equal:today',
            'single_batch.batch_code' => 'nullable|string',
            'single_batch.manufactured_date' => 'nullable|date|before:single_batch.expiry_date',
            
            // في حال دفعات متعددة
            'batches' => 'required_if:same_expiry,false|array|min:1',
            'batches.*.quantity' => 'required_with:batches|integer|min:1',
            'batches.*.expiry_date'    => 'required_with:batches|date|after_or_equal:today',
            'batches.*.batch_code' => 'nullable|string',
        ]);

        // استخدام Transaction لضمان أن الباتش وعناصره يُعاملون كعملية واحدة
        DB::beginTransaction();

        try {
            $merchant = auth()->user();

            // 4. حفظ أكواد الباتشات القديمة قبل الحذف
            $oldBatchCodes = $product->batchItems()
                ->with('batch')
                ->get()
                ->map(fn($item) => $item->batch?->batch_code)
                ->filter()
                ->values()
                ->toArray();

            $oldSingleCode = $oldBatchCodes[0] ?? null;

            // مسح البيانات القديمة لضمان عدم حدوث تداخل في الـ IDs
            $batchIds = $product->batchItems()->pluck('batch_id');
            $product->batchItems()->delete();
            Batch::whereIn('id', $batchIds)->delete();

            if ($request->same_expiry) {
                $data = $request->single_batch;
                $data['batch_code'] = $oldSingleCode ?? $data['batch_code'] ?? 'B-'.Str::upper(Str::random(6));
                $this->createSingleBatch($merchant, $product, $data);
                $savedBatchCode = $data['batch_code'];
            } else {
                $batches = $request->batches;
                foreach ($batches as $i => $b) {
                    $batches[$i]['batch_code'] = $oldBatchCodes[$i] ?? $b['batch_code'] ?? null;
                }
                $this->createMultipleBatches($merchant, $product, $batches);
                $savedBatchCode = null;
            }

            // تنفيذ الحفظ النهائي في قاعدة البيانات
            DB::commit();

            // ⚡️ التعديل الجديد: تشغيل منطق الإخفاء التلقائي بعد الـ Commit لضمان توفر البيانات
            $this->handleAutoHide($product, $merchant);

            // 5. العمليات ما بعد الحفظ (تحديث الكاش والرد)
            $freshProduct = $product->fresh()->load('batchItems.batch');

            $worstStatus = 'green';
            foreach ($freshProduct->batchItems as $item) {
                $s = $item->batch?->status;
                if ($s === 'red') { $worstStatus = 'red'; break; }
                if ($s === 'yellow') { $worstStatus = 'yellow'; }
            }

            Cache::forget("inventory_dashboard_{$merchant->id}");

            ActivityLog::log(
                $merchant->id,
                'expiry_added',
                "تم تحديث تواريخ الانتهاء للمنتج: {$product->name}",
                $product
            );

            return $this->respondWithSuccess('تم حفظ تواريخ الانتهاء بنجاح', [
                'type'        => $request->same_expiry ? 'single' : 'batch',
                'expiry_date' => $request->same_expiry ? $request->single_batch['expiry_date'] : null,
                'batch_code'  => $savedBatchCode,
                'status'      => $worstStatus,
                'quantity'    => $product->quantity ?? 0,
                'batches'     => !$request->same_expiry ? $freshProduct->batchItems()->with('batch')->get()->map(fn($item) => [
                    'batch_code' => $item->batch?->batch_code,
                    'qty'        => $item->quantity,
                    'expiry'     => $item->batch?->expiry_date?->format('Y-m-d'),
                    'status'     => $item->batch?->status,
                    'label'      => $item->batch?->batch_code,
                ])->toArray() : []
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to save expiry: ' . $e->getMessage());
            return $this->respondWithError('حدث خطأ أثناء حفظ البيانات: ' . $e->getMessage());
        }
    }

    /**
     * فحص وإخفاء المنتج تلقائياً في سلة إذا انتهت كل الدفعات
     */
    protected function handleAutoHide($product, $merchant)
    {
        try {
            $setting = BatchSetting::where('merchant_id', $merchant->id)->first();
            
            if ($setting && $setting->auto_hide_expired) {
                // فحص هل توجد أي دفعات صالحة (خضراء أو صفراء) لهذا المنتج؟
                $hasValidBatches = $product->batchItems()->whereHas('batch', function ($query) {
                    $query->whereIn('status', ['green', 'yellow']);
                })->exists();

                if (!$hasValidBatches) {
                    Log::info("[AutoHide] No valid batches found for product: {$product->name}. Hiding in Salla...");
                    
                    $sallaApi = \App\Services\SallaApiService::for($merchant);
                    $sallaApi->updateProductStatus($product->salla_product_id, ['status' => 'hidden']);
                    
                    Log::info("[AutoHide Success] Product {$product->name} is now hidden in Salla.");
                } else {
                    Log::info("[AutoHide] Product {$product->name} still has valid batches. No action needed.");
                }
            }
        } catch (\Exception $e) {
            Log::error("[AutoHide Error] Failed to process auto-hide for product {$product->id}: " . $e->getMessage());
        }
    }

    /**
     * إنشاء دفعة واحدة بربط صريح
     */
    protected function createSingleBatch($merchant, Product $product, array $data)
    {
        $batch = Batch::create([
            'merchant_id'       => $merchant->id,
            'name'              => $product->name,
            'batch_code'        => $data['batch_code'] ?? 'B-'.Str::upper(Str::random(6)),
            'expiry_date'       => $data['expiry_date'],
            'manufactured_date' => $data['manufactured_date'] ?? null,
            'notes'             => $data['notes'] ?? null,
        ]);

        BatchItem::create([
            'batch_id'           => $batch->id,
            'product_id'         => $product->id,
            'quantity'           => $product->quantity ?? 0,
            'unit_cost'          => $product->price ?? 0,
            'remaining_quantity' => $product->quantity ?? 0,
        ]);
        
        Log::info("Created Single BatchItem linked to Batch ID: " . $batch->id);
    }

    /**
     * إنشاء دفعات متعددة بربط صريح
     */
    protected function createMultipleBatches($merchant, Product $product, array $batches)
    {
        foreach ($batches as $data) {
            $batch = Batch::create([
                'merchant_id'       => $merchant->id,
                'name'              => $product->name,
                'batch_code'        => $data['batch_code'] ?? 'B-'.Str::upper(Str::random(6)),
                'expiry_date'       => $data['expiry_date'],
                'manufactured_date' => $data['manufactured_date'] ?? null,
                'notes'             => $data['notes'] ?? null,
            ]);

            BatchItem::create([
                'batch_id'           => $batch->id,
                'product_id'         => $product->id,
                'quantity'           => $data['quantity'],
                'unit_cost'          => $product->price ?? 0,
                'remaining_quantity' => $data['quantity'],
            ]);
            
            Log::info("Created Multi BatchItem linked to Batch ID: " . $batch->id);
        }
    }

    /**
     * رد ذكي (يدعم AJAX و Standard Requests)
     */
    protected function respondWithSuccess($message, $data = [])
    {
        if (request()->ajax() || request()->wantsJson()) {
            return response()->json(array_merge(['success' => true, 'message' => $message], $data));
        }
        return back()->with('success', $message);
    }

    protected function respondWithError($message, $code = 500)
    {
        if (request()->ajax() || request()->wantsJson()) {
            return response()->json(['success' => false, 'message' => $message], $code);
        }
        return back()->with('error', $message);
    }

    /**
     * حذف تاريخ الانتهاء
     */
    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        
        if ($product->merchant_id !== auth()->id()) {
            return abort(403);
        }

        $batchIds = $product->batchItems()->pluck('batch_id');
        $product->batchItems()->delete();
        Batch::whereIn('id', $batchIds)->delete();
        
        Cache::forget("inventory_dashboard_" . auth()->id());

        return $this->respondWithSuccess('تم حذف تواريخ الانتهاء بنجاح');
    }
}