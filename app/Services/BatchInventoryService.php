<?php

namespace App\Services;

use App\Models\Batch;
use App\Models\Product;
use Illuminate\Support\Facades\Log;

class BatchInventoryService
{
    /**
     * استعادة الكميات المحجوزة من الدفعة عند حذفها أو وصولها للحالة الحمراء.
     *
     * مصدر الحقيقة هو كمية سلة الفعلية لحظة الاستعادة: سلة تنقص مخزونها بنفسها
     * عند كل طلب، وwebhooks المبيعات تحافظ على المزامنة المحلية (product.quantity
     * / batch_qty / variants_data). لذلك نقرأ كمية سلة أولاً ثم نُسقّف النتيجة.
     *
     * القاعدة:
     *  - إذا كانت الدفعة "حيّة" في سلة (سلة تعرض المخزون المحجوز — الوضع الأصفر):
     *      true_sales = total_qty - salla_current   (مشتقة من سلة نفسها → آمن حتى لو فات webhook)
     *      restore    = original_qty - true_sales   (إرجاع الأساس + المتبقي، دون إعادة إنشاء مباع)
     *      ثم سقف أمان: min(restore, mirror) — لا نتجاوز أبداً الكمية المحلية المزامنة
     *      مع سلة حتى لا نُعيد إنشاء كميات بيعت فعلياً.
     *  - إذا لم تكن الدفعة حيّة في سلة (لم تُخفِ المخزون — الوضع الأخضر):
     *      كمية سلة الحالية هي الصحيحة ولا نغيرها.
     *  - عند تعذّر قراءة سلة: نرجع للقاعدة المحلية
     *      restore = original_qty - (total_qty - batch_qty)
     *      مع بديل product.quantity / variants_data إن غاب original_qty.
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
        $sallaCurrent = null;
        try {
            $response = $sallaApi->getProduct($product->salla_product_id);
            $qty = $response['data']['quantity'] ?? null;
            if (is_numeric($qty)) {
                $sallaCurrent = (int) $qty;
            }
        } catch (\Throwable $e) {
            Log::warning('[BatchInventory] تعذر قراءة كمية المنتج من سلة: ' . $e->getMessage(), [
                'product_id' => $product->id,
            ]);
        }

        $restoreQty = self::computeRestoreQty(
            $sallaCurrent,
            (int) $batch->batch_qty,
            (int) $batch->total_qty,
            $batch->original_qty,
            (int) ($product->quantity ?? 0)
        );

        $sallaApi->updateProductQuantity($product->salla_product_id, $restoreQty);

        if ((int) $product->quantity !== $restoreQty) {
            $product->quantity = $restoreQty;
            $product->save();
        }

        Log::info('[BatchInventory] تم استعادة كمية المنتج', [
            'batch_id'     => $batch->id,
            'product_id'   => $product->id,
            'salla_current'=> $sallaCurrent,
            'original_qty' => $batch->original_qty,
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

            $sallaCurrent = null;
            try {
                $details = $sallaApi->getVariantDetails($variantId);
                $data = $details['data'] ?? [];
                if (!empty($data['unlimited_quantity'])) {
                    Log::info('[BatchInventory] تخطي variant لانهائي المخزون', [
                        'batch_id'   => $batch->id,
                        'variant_id' => $variantId,
                    ]);
                    continue;
                }
                $stock = $data['stock_quantity'] ?? null;
                if (is_numeric($stock)) {
                    $sallaCurrent = (int) $stock;
                }
            } catch (\Throwable $e) {
                Log::warning('[BatchInventory] تعذر قراءة كمية variant من سلة: ' . $e->getMessage(), [
                    'variant_id' => $variantId,
                ]);
            }

            $originalStock = $snapshotMap[$variantId] ?? null;

            $localCurrent = 0;
            foreach ($localData as $v) {
                if ((int) ($v['id'] ?? 0) === $variantId) {
                    $localCurrent = (int) ($v['stock_quantity'] ?? 0);
                    break;
                }
            }

            $restoreQty = self::computeRestoreQty(
                $sallaCurrent,
                (int) $bv->batch_qty,
                (int) $bv->total_qty,
                $originalStock,
                $localCurrent
            );

            $sallaApi->updateBatchVariant($variantId, ['stock_quantity' => $restoreQty]);

            foreach ($localData as $i => $v) {
                if ((int) ($v['id'] ?? 0) === $variantId) {
                    $localData[$i]['stock_quantity'] = $restoreQty;
                    break;
                }
            }

            Log::info('[BatchInventory] تم استعادة كمية variant', [
                'batch_id'      => $batch->id,
                'variant_id'    => $variantId,
                'salla_current' => $sallaCurrent,
                'original_qty'  => $originalStock,
                'restore_qty'   => $restoreQty,
            ]);
        }

        $product->variants_data = $localData;
        $product->save();
    }

    /**
     * حساب الكمية المراد كتابتها في سلة.
     *
     * @param int|null $sallaCurrent آخر كمية من سلة (null = تعذّر القراءة)
     * @param int      $batchQty   الكمية المتبقية من الدفعة (تنقص عبر webhooks المبيعات)
     * @param int      $totalQty   الكمية المحجوزة أصلاً
     * @param int|null $originalQty الكمية قبل إنشاء الدفعة (قد تكون null لبيانات قديمة)
     * @param int      $localCurrent الكمية المحلية المزامنة مع سلة (mirror)
     */
    private static function computeRestoreQty(
        ?int $sallaCurrent,
        int $batchQty,
        int $totalQty,
        ?int $originalQty,
        int $localCurrent
    ): int {
        if ($sallaCurrent !== null) {
            // هل المخزون المحجوز هو المعروض حالياً في سلة؟ (الوضع الأصفر)
            if ($sallaCurrent <= $batchQty) {
                $trueSales = max(0, $totalQty - $sallaCurrent);

                $target = ($originalQty !== null)
                    ? max(0, $originalQty - $trueSales)
                    : max(0, $localCurrent);

                // سقف أمان: لا نُعيد أبداً كميات تعتبرها المزامنة المحلية مباعة
                return min($target, max(0, $localCurrent));
            }

            // الوضع الأخضر: الدفعة لم تُخفِ المخزون، كمية سلة الحالية صحيحة
            return $sallaCurrent;
        }

        // تعذّر قراءة سلة → القاعدة المحلية (webhooks المبيعات هي المرجع)
        $sold = max(0, $totalQty - $batchQty);
        return ($originalQty !== null)
            ? max(0, $originalQty - $sold)
            : max(0, $localCurrent);
    }
}
