<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Batch;
use App\Models\BatchItem;
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

        // 3. التحقق من البيانات المرسلة
        $validated = $request->validate([
            'same_expiry' => 'required|boolean',
            
            // في حال تاريخ واحد
            'single_batch' => 'required_if:same_expiry,true|array',
            'single_batch.expiry_date' => 'required_if:same_expiry,true|date|after:today',
            'single_batch.batch_code' => 'nullable|string',
            'single_batch.manufactured_date' => 'nullable|date|before:single_batch.expiry_date',
            
            // في حال دفعات متعددة
            'batches' => 'required_if:same_expiry,false|array|min:1',
            'batches.*.quantity' => 'required_with:batches|integer|min:1',
            'batches.*.expiry_date' => 'required_with:batches|date|after:today',
            'batches.*.batch_code' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            $merchant = auth()->user();

            // 4. حذف الدفعات القديمة المرتبطة بهذا المنتج فقط (لتجنب التكرار عند التعديل)
            $product->batchItems()->delete();

            if ($request->same_expiry) {
                // حالة الدفعة الواحدة
                $this->createSingleBatch($merchant, $product, $request->single_batch);
            } else {
                // حالة الدفعات المتعددة
                $this->createMultipleBatches($merchant, $product, $request->batches);
            }

            DB::commit();

            // 5. مسح الكاش لتحديث الداشبورد
            Cache::forget("inventory_dashboard_{$merchant->id}");

            // 6. تسجيل النشاط
            ActivityLog::log(
                $merchant->id,
                'expiry_added',
                "تم تحديث تواريخ الانتهاء للمنتج: {$product->name}",
                $product
            );

            return $this->respondWithSuccess('تم حفظ تواريخ الانتهاء بنجاح', [
                'type' => $request->same_expiry ? 'single' : 'batch',
                'expiry_date' => $request->same_expiry ? $request->single_batch['expiry_date'] : null,
                'batches' => !$request->same_expiry ? $request->batches : []
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to save expiry: ' . $e->getMessage());
            return $this->respondWithError('حدث خطأ أثناء حفظ البيانات: ' . $e->getMessage());
        }
    }

    /**
     * إنشاء دفعة واحدة
     */
    protected function createSingleBatch($merchant, Product $product, array $data)
    {
        $batch = Batch::create([
            'merchant_id' => $merchant->id,
            'name'        => $product->name,
            'batch_code' => $data['batch_code'] ?? 'B-'.Str::upper(Str::random(6)),
            'expiry_date' => $data['expiry_date'],
            'manufactured_date' => $data['manufactured_date'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        BatchItem::create([
            'batch_id' => $batch->id,
            'product_id' => $product->id,
            'quantity' => $product->quantity ?? 0,
        ]);
    }

    /**
     * إنشاء دفعات متعددة
     */
    protected function createMultipleBatches($merchant, Product $product, array $batches)
    {
        foreach ($batches as $data) {
            $batch = Batch::create([
                'merchant_id' => $merchant->id,
                'name'        => $product->name,
                'batch_code' => $data['batch_code'] ?? 'B-'.Str::upper(Str::random(6)),
                'expiry_date' => $data['expiry_date'],
                'manufactured_date' => $data['manufactured_date'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);

            BatchItem::create([
                'batch_id' => $batch->id,
                'product_id' => $product->id,
                'quantity' => $data['quantity'],
            ]);
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

        $product->batchItems()->delete();
        Cache::forget("inventory_dashboard_" . auth()->id());

        return $this->respondWithSuccess('تم حذف تواريخ الانتهاء بنجاح');
    }
}