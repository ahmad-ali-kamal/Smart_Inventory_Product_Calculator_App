<?php

namespace App\Jobs;

use App\Models\Batch;
use App\Models\Merchant;
use App\Models\Product;
use App\Models\BatchSetting;
use App\Services\SallaApiService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CheckBatchExpiryJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        Log::info('[Harees Engine] 🚀 تشغيل فحص تواريخ الصلاحية (آمن 100% - لا تلاعب بالكميات)');

        Merchant::all()->each(function ($merchant) {
            Log::info("[Merchant] معالجة تاجر: " . ($merchant->name ?? $merchant->id));

            try {
                $sallaApi = SallaApiService::for($merchant);

                // 1. معالجة الدفعات وتواريخها
                $batches = Batch::where('merchant_id', $merchant->id)
                    ->whereNotNull('expiry_date')
                    ->get();

                Log::info("[Merchant] عدد Batches: " . $batches->count());

                foreach ($batches as $batch) {
                    $oldStatus = $batch->status; 

                    $batch->calculateStatus();   
                    $batch->save();

                    // إرسال التنبيهات في حال تغيرت الحالة للأصفر أو الأحمر
                  if ($oldStatus !== $batch->status && in_array($batch->status, ['yellow', 'red'])) {
    
    // إنشاء فارينت إذا تحوّل لأصفر لأول مرة
    if ($batch->status === 'yellow' && empty($batch->getSallaVariantId())) {
        try {
            $batch->createSallaVariant();
        } catch (\Throwable $e) {
            Log::error("[Job] فشل إنشاء الفارينت للدفعة {$batch->id}: " . $e->getMessage());
        }
    }

    $merchant->notify(new \App\Notifications\BatchExpiryNotification(
        $batch,
        $batch->status
    ));
}

                    // التحقق من وجود المنتج المرتبط
                    $product = $batch->products()->first();
                    if (!$product) {
                        continue; 
                    }

                    // تطبيق التخفيض فقط إذا كان أصفر (دون إرسال أي بيانات تخص الـ stock_quantity)
                    if ($batch->getSallaVariantId() && $batch->status === 'yellow') {
                        try {
                          $product = $batch->products()->first();
if ($product) {
    $sallaApi->updateBatchVariant($batch->getSallaVariantId(), [
        'price'      => $product->regular_price ?? $product->price,
        'sale_price' => round(($product->regular_price ?? $product->price) * 0.85, 2),
    ]);
}
                        } catch (\Exception $e) {
                            Log::error("[Batch] فشل تحديث سعر الباتش الأصفر: " . $e->getMessage());
                        }
                    }
                }

                // 2. مزامنة ظهور المنتجات حسب الشروط الصارمة (إخفاء إذا كان كله أحمر)
                $this->reconcileVisibility($sallaApi, $merchant);

            } catch (\Throwable $e) {
                // التقاط أي خطأ وتجاوز التاجر الحالي
                Log::warning("[Merchant] تم تخطي التاجر " . ($merchant->name ?? $merchant->id) . " بسبب خطأ: " . $e->getMessage());
                return; 
            }
        });
    }

    private function reconcileVisibility(SallaApiService $sallaApi, Merchant $merchant): void
    {
        $allProducts = Product::where('merchant_id', $merchant->id)->get();
        
        $settings = BatchSetting::where('merchant_id', $merchant->id)->first();
        $autoHideExpired = $settings ? $settings->auto_hide_expired : false;

        foreach ($allProducts as $product) {
            $batches = $product->batchItems()->with('batch')->get()
                ->map(fn($i) => $i->batch)
                ->filter();

            if ($batches->isEmpty()) {
                if ($product->status === 'hidden' && $product->salla_product_id) {
                    $sallaApi->updateProductStatusOnly($product->salla_product_id, 'sale');
                    $product->update(['status' => 'sale']);
                }
                continue;
            }

            // هل جميع الدفعات حمراء؟
            $allBatchesRed = $batches->every(fn($b) => $b && $b->status === 'red');

            // يخفى فقط إذا كانت جميع الدفعات حمراء + إعداد الإخفاء مفعل
            if ($allBatchesRed && $autoHideExpired) {
                $newStatus = 'hidden';
            } else {
                $newStatus = 'sale'; 
            }

            if ($product->status !== $newStatus && $product->salla_product_id) {
                try {
                    $sallaApi->updateProductStatusOnly($product->salla_product_id, $newStatus);
                    $product->update(['status' => $newStatus]);
                    Log::info("[ReconcileVisibility] تغيير حالة المنتج {$product->id} إلى {$newStatus} بناءً على الدفعات.");
                } catch (\Exception $e) {
                    Log::error("[ReconcileVisibility] فشل تحديث حالة المنتج {$product->id}: " . $e->getMessage());
                }
            }
        }
    }
}