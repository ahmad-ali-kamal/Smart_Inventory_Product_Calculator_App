<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Batch;
use App\Models\BatchItem;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductExpiryController extends Controller
{
    /**
     * حفظ تاريخ الانتهاء للمنتج (دفعة واحدة أو متعددة)
     */
    public function store(Request $request, Product $product)
    {
        $this->authorize('update', $product);

        $validated = $request->validate([
            'same_expiry' => 'required|boolean',
            
            // للدفعة الواحدة
            'single_batch' => 'required_if:same_expiry,true',
            'single_batch.batch_code' => 'required_with:single_batch|string|unique:batches,batch_code',
            'single_batch.expiry_date' => 'required_with:single_batch|date|after:today',
            'single_batch.manufactured_date' => 'nullable|date|before:single_batch.expiry_date',
            'single_batch.notes' => 'nullable|string',
            
            // للدفعات المتعددة
            'batches' => 'required_if:same_expiry,false|array|min:1',
            'batches.*.batch_code' => 'required_with:batches|string|distinct',
            'batches.*.quantity' => 'required_with:batches|integer|min:1',
            'batches.*.expiry_date' => 'required_with:batches|date|after:today',
            'batches.*.manufactured_date' => 'nullable|date|before_or_equal:batches.*.expiry_date',
            'batches.*.notes' => 'nullable|string',
        ], [
            'single_batch.expiry_date.after' => 'تاريخ الانتهاء يجب أن يكون في المستقبل',
            'batches.*.expiry_date.after' => 'تاريخ انتهاء الدفعة يجب أن يكون في المستقبل',
            'batches.*.quantity.min' => 'الكمية يجب أن تكون على الأقل 1',
            'batches.*.batch_code.distinct' => 'كود الدفعة يجب أن يكون فريد',
        ]);

        try {
            $merchant = $request->user();

            if ($validated['same_expiry']) {
                // دفعة واحدة للكمية كاملة
                $this->createSingleBatch($merchant, $product, $validated['single_batch']);
            } else {
                // دفعات متعددة
                $this->createMultipleBatches($merchant, $product, $validated['batches']);
            }

            // مسح الكاش
            \Cache::forget("inventory_dashboard_{$merchant->id}");

            // تسجيل النشاط
            ActivityLog::log(
                $merchant->id,
                'expiry_added',
                "تم إضافة تاريخ انتهاء للمنتج: {$product->name}",
                $product
            );

            return back()->with('success', 'تم حفظ تواريخ الانتهاء بنجاح');

        } catch (\Exception $e) {
            \Log::error('Failed to save expiry dates', [
                'product_id' => $product->id,
                'error' => $e->getMessage(),
            ]);

            return back()->with('error', 'حدث خطأ أثناء الحفظ');
        }
    }

    /**
     * إنشاء دفعة واحدة
     */
    protected function createSingleBatch($merchant, Product $product, array $batchData): void
    {
        // إنشاء الدفعة
        $batch = Batch::create([
            'merchant_id' => $merchant->id,
            'batch_code' => $batchData['batch_code'],
            'expiry_date' => $batchData['expiry_date'],
            'manufactured_date' => $batchData['manufactured_date'] ?? null,
            'notes' => $batchData['notes'] ?? null,
        ]);

        // ربط المنتج بالدفعة
        BatchItem::create([
            'batch_id' => $batch->id,
            'product_id' => $product->id,
            'quantity' => $product->quantity, // الكمية الكاملة
        ]);
    }

    /**
     * إنشاء دفعات متعددة
     */
    protected function createMultipleBatches($merchant, Product $product, array $batchesData): void
    {
        foreach ($batchesData as $batchData) {
            // التحقق من عدم تكرار الـbatch_code
            $existingBatch = Batch::where('batch_code', $batchData['batch_code'])->first();

            if ($existingBatch) {
                // إذا كانت الدفعة موجودة، نضيف المنتج لها فقط
                BatchItem::updateOrCreate(
                    [
                        'batch_id' => $existingBatch->id,
                        'product_id' => $product->id,
                    ],
                    [
                        'quantity' => $batchData['quantity'],
                    ]
                );
            } else {
                // إنشاء دفعة جديدة
                $batch = Batch::create([
                    'merchant_id' => $merchant->id,
                    'batch_code' => $batchData['batch_code'],
                    'expiry_date' => $batchData['expiry_date'],
                    'manufactured_date' => $batchData['manufactured_date'] ?? null,
                    'notes' => $batchData['notes'] ?? null,
                ]);

                // ربط المنتج بالدفعة
                BatchItem::create([
                    'batch_id' => $batch->id,
                    'product_id' => $product->id,
                    'quantity' => $batchData['quantity'],
                ]);
            }
        }
    }

    /**
     * تحديث تاريخ الانتهاء
     */
    public function update(Request $request, Product $product)
    {
        // حذف جميع الدفعات القديمة لهذا المنتج
        $product->batchItems()->delete();

        // إعادة الإنشاء
        return $this->store($request, $product);
    }

    /**
     * حذف تاريخ الانتهاء (حذف ربط المنتج من الدفعات)
     */
    public function destroy(Product $product)
    {
        $this->authorize('update', $product);

        $product->batchItems()->delete();

        ActivityLog::log(
            auth()->id(),
            'expiry_removed',
            "تم حذف تواريخ الانتهاء للمنتج: {$product->name}",
            $product
        );

        return back()->with('success', 'تم حذف تواريخ الانتهاء');
    }

    /**
     * عرض تفاصيل الدفعات لمنتج معين
     */
    public function show(Product $product)
    {
        $this->authorize('view', $product);

        $batches = $product->batchItems()
            ->with('batch')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'batch_code' => $item->batch->batch_code,
                    'quantity' => $item->quantity,
                    'sold_quantity' => $item->sold_quantity,
                    'remaining_quantity' => $item->remaining_quantity,
                    'expiry_date' => $item->batch->expiry_date->format('Y-m-d'),
                    'manufactured_date' => $item->batch->manufactured_date?->format('Y-m-d'),
                    'status' => $item->batch->status,
                    'days_until_expiry' => $item->batch->days_until_expiry,
                    'notes' => $item->batch->notes,
                ];
            });

        return response()->json([
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'total_quantity' => $product->quantity,
            ],
            'batches' => $batches,
        ]);
    }
}