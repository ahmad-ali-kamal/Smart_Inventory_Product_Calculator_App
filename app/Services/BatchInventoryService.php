<?php

namespace App\Services;

use App\Models\Batch;
use App\Models\Product;
use Illuminate\Support\Facades\Log;

class BatchInventoryService
{
    /**
     * استعادة الكميات المحجوزة من الدفعة إلى المخزون المتاح عند حذف الدفعة
     * أو وصولها للحالة الحمراء (انتهاء الصلاحية).
     *
     * قاعدة العمل:
     *   restore = original_qty - sold_during_batch
     *   sold_during_batch = total_qty - batch_qty
     *
     * لا تُعاد أبداً الكميات المباعة فعلياً (عمليات البيع هي الحدث الوحيد
     * الذي يُنقص المخزون نهائياً). عند غياب original_qty (بيانات قديمة)
     * يُستخدم المخزون المحلي الحالي للمنتج/الـ variant — وهو صافي من
     * عمليات البيع ولا يتأثر بخدمات الخصم التلقائي التي تكتب في سلة فقط.
     */
    public static function restoreBatchQuantities(Batch $batch): void
    {
        $product = $batch->product;
        if (!$product || !$product->salla_product_id) {
            Log::warning('[BatchInventory] تخطي استعادة الكميات — منتج غير مرتبط بسلة', ['batch_id' => $batch->id]);
            return;
        }

        $merchant = $batch->merchant;
        if (!$merchant) {
            Log::warning('[BatchInventory] تخطي استعادة الكميات — لا يوجد تاجر', ['batch_id' => $batch->id]);
            return;
        }

        try {
            $sallaApi = SallaApiService::for($merchant);

            if ($batch->batchVariants()->exists()) {
                self::restoreVariants($sallaApi, $batch, $product);
            } else {
                self::restoreProduct($sallaApi, $batch, $product);
            }
        } catch (\Throwable $e) {
            Log::error('[BatchInventory] فشل استعادة كميات الدفعة: ' . $e->getMessage(), [
                'batch_id' => $batch->id,
            ]);
        }
    }

    private static function restoreProduct(SallaApiService $sallaApi, Batch $batch, Product $product): void
    {
        $originalQty = $batch->original_qty;

        if ($originalQty !== null) {
            $sold       = max(0, (int) $batch->total_qty - (int) $batch->batch_qty);
            $restoreQty = max(0, (int) $originalQty - $sold);
        } else {
            $restoreQty = max(0, (int) ($product->quantity ?? 0));
        }

        $sallaApi->updateProductQuantity($product->salla_product_id, $restoreQty);

        if ((int) $product->quantity !== $restoreQty) {
            $product->quantity = $restoreQty;
            $product->save();
        }

        Log::info('[BatchInventory] تم استعادة كمية المنتج', [
            'batch_id'     => $batch->id,
            'product_id'   => $product->id,
            'original_qty' => $originalQty,
            'restore_qty'  => $restoreQty,
        ]);
    }

    private static function restoreVariants(SallaApiService $sallaApi, Batch $batch, Product $product): void
    {
        $snapshotMap = [];
        foreach (($batch->original_variant_qtys ?? []) as $ovq) {
            if (isset($ovq['variant_id'])) {
                $snapshotMap[(int) $ovq['variant_id']] = (int) ($ovq['qty'] ?? 0);
            }
        }

        $localData = $product->variants_data;
        $localData = is_string($localData) ? json_decode($localData, true) : $localData;
        $localData = is_array($localData) ? $localData : [];

        foreach ($batch->batchVariants as $bv) {
            $variantId = (int) $bv->variant_id;

            if (array_key_exists($variantId, $snapshotMap)) {
                $sold       = max(0, (int) $bv->total_qty - (int) $bv->batch_qty);
                $restoreQty = max(0, $snapshotMap[$variantId] - $sold);
            } else {
                $current = 0;
                foreach ($localData as $v) {
                    if ((int) ($v['id'] ?? 0) === $variantId) {
                        $current = (int) ($v['stock_quantity'] ?? 0);
                        break;
                    }
                }
                $restoreQty = max(0, $current);
            }

            $sallaApi->updateBatchVariant($variantId, ['stock_quantity' => $restoreQty]);

            foreach ($localData as $i => $v) {
                if ((int) ($v['id'] ?? 0) === $variantId) {
                    $localData[$i]['stock_quantity'] = $restoreQty;
                    break;
                }
            }

            Log::info('[BatchInventory] تم استعادة كمية variant', [
                'batch_id'    => $batch->id,
                'variant_id'  => $variantId,
                'restore_qty' => $restoreQty,
            ]);
        }

        $product->variants_data = $localData;
        $product->save();
    }
}
