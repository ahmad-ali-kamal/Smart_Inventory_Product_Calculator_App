<?php

namespace App\Services;

use App\Models\Batch;
use App\Models\BatchItem;
use App\Models\BatchSetting;
use App\Models\Product;
use App\Models\ProductDiscount;
use Illuminate\Support\Facades\Log;

/**
 * BatchSyncService
 * ================
 * يُدير مزامنة الدفعات مع سلة مع معالجة كل السيناريوهات الأربعة:
 *
 * السيناريو 1: منتج عادي بدون خيارات → ينشئ خيار "بيانات الدفعة" مباشرة
 * السيناريو 2: منتج بخيارات موجودة (مقاس/لون) → يدمج مع قيمة الدفعة (Cartesian)
 * السيناريو 3: ربط الدفعة بـ Variant موجود مسبقاً يدوياً
 * السيناريو 4: Reconciliation دوري للكميات
 */
class BatchSyncService
{
    public function __construct(private SallaApiService $sallaApi)
    {
    }

    // =========================================================
    // نقطة الدخول — تكتشف السيناريو تلقائياً
    // =========================================================

    public function syncBatch(Batch $batch, Product $product, ?int $linkToVariantId = null): void
    {
        // السيناريو 3: التاجر اختار Variant موجود يدوياً
        if ($linkToVariantId) {
            $this->handleScenario3($batch, $product, $linkToVariantId);
            return;
        }

        // جلب بيانات المنتج من سلة
        $details = $this->sallaApi->getProductDetails($product->salla_product_id);

        if (!$details || !isset($details['data'])) {
            Log::error('[BatchSync] فشل جلب تفاصيل المنتج', [
                'product_id' => $product->salla_product_id,
            ]);
            return;
        }

        $options  = $details['data']['options']  ?? [];
        $variants = $details['data']['variants'] ?? [];

        $batchOption     = null;
        $merchantOptions = [];

        foreach ($options as $opt) {
            if (trim($opt['name'] ?? '') === SallaApiService::BATCH_OPTION_NAME) {
                $batchOption = $opt;
            } else {
                $merchantOptions[] = $opt;
            }
        }

        $expiryStr   = $batch->expiry_date ? $batch->expiry_date->format('Y-m-d') : now()->format('Y-m-d');
        $variantName = ($batch->batch_code ?? 'Batch') . ' - ' . $expiryStr;

        if (empty($merchantOptions)) {
            $this->handleScenario1($batch, $product, $batchOption, $variantName);
        } else {
            $this->handleScenario2($batch, $product, $merchantOptions, $batchOption, $variantName, $variants);
        }
    }

    // =========================================================
    // السيناريو 1: منتج بدون خيارات مسبقة
    // =========================================================

    private function handleScenario1(
        Batch $batch,
        Product $product,
        ?array $batchOption,
        string $variantName
    ): void {
        Log::info('[BatchSync] السيناريو 1 — منتج بدون خيارات', [
            'product_id' => $product->salla_product_id,
        ]);

        $res = null;
        if (!$batchOption) {
            $res = $this->sallaApi->createProductOption(
                $product->salla_product_id,
                SallaApiService::BATCH_OPTION_NAME,
                $variantName
            );
            $variantId = $res['data']['skus'][0]['id']
                      ?? $res['data'][0]['skus'][0]['id']
                      ?? null;
        } else {
            $res = $this->sallaApi->addValueToOption($batchOption['id'], $variantName);
            $variantId = $res['data']['skus'][0]['id']
                      ?? $res['data']['variant_id']
                      ?? null;
        }

        $this->saveBatchVariantAndSync($batch, $variantId ?? null, $res);
    }

    // =========================================================
    // السيناريو 2: منتج بخيارات موجودة → Cartesian Product
    // =========================================================

    private function handleScenario2(
        Batch $batch,
        Product $product,
        array $merchantOptions,
        ?array $batchOption,
        string $variantName,
        array $existingVariants
    ): void {
        Log::info('[BatchSync] السيناريو 2 — منتج بخيارات موجودة (Cartesian)', [
            'product_id'      => $product->salla_product_id,
            'merchant_options' => count($merchantOptions),
        ]);

        $res = !$batchOption
            ? $this->sallaApi->createProductOption(
                $product->salla_product_id,
                SallaApiService::BATCH_OPTION_NAME,
                $variantName
            )
            : $this->sallaApi->addValueToOption($batchOption['id'], $variantName);

        if (!$res) {
            Log::error('[BatchSync] فشل إضافة قيمة الدفعة', ['product_id' => $product->salla_product_id]);
            return;
        }

        // جلب البيانات المحدَّثة
        $updated         = $this->sallaApi->getProductDetails($product->salla_product_id);
        $updatedOptions  = $updated['data']['options']  ?? [];
        $updatedVariants = $updated['data']['variants'] ?? [];

        // إيجاد قيمة الدفعة الجديدة
        $batchValueId = null;
        foreach ($updatedOptions as $opt) {
            if (trim($opt['name'] ?? '') === SallaApiService::BATCH_OPTION_NAME) {
                foreach ($opt['values'] ?? [] as $val) {
                    if (trim($val['name'] ?? '') === trim($variantName)) {
                        $batchValueId = $val['id'];
                        break 2;
                    }
                }
            }
        }

        if (!$batchValueId) {
            Log::error('[BatchSync] لم يُعثر على قيمة الدفعة بعد الإضافة', ['variant_name' => $variantName]);
            return;
        }

        $oldVariantIds    = collect($existingVariants)->pluck('id')->toArray();
        $newBatchVariants = array_values(array_filter(
            $updatedVariants,
            fn($v) => !in_array($v['id'], $oldVariantIds)
                   && in_array($batchValueId, $v['related_option_values'] ?? [])
        ));

        if (empty($newBatchVariants)) {
            Log::warning('[BatchSync] لم يُنشئ سلة Variants جديدة للسيناريو 2');
            return;
        }

        $variantCount  = count($newBatchVariants);
        $batchQty      = $this->getBatchQuantity($batch);
        $qtyPerVariant = (int) floor($batchQty / max(1, $variantCount));
        $remainder     = $batchQty - ($qtyPerVariant * $variantCount);

        $batch->update(['salla_variant_id' => (string) $newBatchVariants[0]['id']]);

        foreach ($newBatchVariants as $index => $variant) {
            $qty = $qtyPerVariant + ($index === 0 ? $remainder : 0);

            $this->sallaApi->updateBatchVariant((string) $variant['id'], [
                'sku'            => ($batch->batch_code ?? 'B-' . $batch->id) . '-' . ($index + 1),
                'stock_quantity' => $qty,
                'sale_price'     => $this->calcSalePrice($batch),
            ]);

            Log::info('[BatchSync] S2 Variant محدَّث', ['variant_id' => $variant['id'], 'qty' => $qty]);
        }

        Log::info('[BatchSync] ✅ السيناريو 2 اكتمل', ['batch_id' => $batch->id, 'count' => $variantCount]);
    }

    // =========================================================
    // السيناريو 3: ربط يدوي بـ Variant موجود
    // =========================================================

    private function handleScenario3(Batch $batch, Product $product, int $sallaVariantId): void
    {
        Log::info('[BatchSync] السيناريو 3 — ربط يدوي', [
            'batch_id'   => $batch->id,
            'variant_id' => $sallaVariantId,
        ]);

        $batch->update(['salla_variant_id' => (string) $sallaVariantId]);

        $this->sallaApi->updateBatchVariant((string) $sallaVariantId, [
            'sku'            => $batch->batch_code ?? 'B-' . $batch->id,
            'stock_quantity' => $this->getBatchQuantity($batch),
            'sale_price'     => $this->calcSalePrice($batch),
        ]);

        Log::info('[BatchSync] ✅ السيناريو 3 اكتمل', ['batch_id' => $batch->id]);
    }

    // =========================================================
    // السيناريو 4: Reconciliation دوري
    // =========================================================

    public function reconcileQuantity(Batch $batch, Product $product, bool $autoFix = true): array
    {
        if (!$batch->salla_variant_id) {
            return ['status' => 'skip', 'reason' => 'no_variant_id'];
        }

        $details  = $this->sallaApi->getProductDetails($product->salla_product_id);
        $variants = $details['data']['variants'] ?? [];

        $sallaVariant = collect($variants)->firstWhere('id', (int) $batch->salla_variant_id);

        if (!$sallaVariant) {
            Log::warning('[Reconcile] Variant غير موجود في سلة', [
                'variant_id' => $batch->salla_variant_id,
                'batch_id'   => $batch->id,
            ]);
            return ['status' => 'missing_in_salla'];
        }

        $ourQty   = $this->getBatchQuantity($batch);
        $sallaQty = (int) ($sallaVariant['stock_quantity'] ?? 0);
        $diff     = abs($ourQty - $sallaQty);

        if ($diff === 0) {
            return ['status' => 'ok', 'qty' => $ourQty];
        }

        Log::info('[Reconcile] فرق في الكمية', [
            'batch_id'  => $batch->id,
            'our_qty'   => $ourQty,
            'salla_qty' => $sallaQty,
            'diff'      => $diff,
        ]);

        if (!$autoFix) {
            return ['status' => 'conflict', 'our_qty' => $ourQty, 'salla_qty' => $sallaQty, 'diff' => $diff];
        }

        // سلة أقل = بيع خارجي حدث → نُحدّث DB
        if ($sallaQty < $ourQty) {
            $batchItem = BatchItem::where('batch_id', $batch->id)->first();
            if ($batchItem) {
                $batchItem->update(['quantity' => $sallaQty]);
            }
        } else {
            // DB أعلى → نُحدّث سلة
            $this->sallaApi->updateBatchVariant((string) $batch->salla_variant_id, [
                'stock_quantity' => $ourQty,
            ]);
        }

        return ['status' => 'fixed', 'our_qty' => $ourQty, 'salla_qty' => $sallaQty];
    }

    // =========================================================
    // Helpers
    // =========================================================

    private function getBatchQuantity(Batch $batch): int
    {
        $item = BatchItem::where('batch_id', $batch->id)->first();
        return (int) ($item?->quantity ?? 0);
    }

    /**
     * حساب sale_price من BatchSetting التاجر
     * صفر = لا يوجد سعر مخفض في سلة
     */
    private function calcSalePrice(Batch $batch): float
    {
        if ($batch->status !== 'yellow') {
            return 0;
        }

        $setting = BatchSetting::where('merchant_id', $batch->merchant_id)->first();
        $pct     = $setting?->discount_auto
            ? $this->calcAutoDiscountPct($batch->days_until_expiry ?? 0, $setting)
            : (float) ($setting?->fixed_discount_percentage ?? 20);

        $batchItem = BatchItem::where('batch_id', $batch->id)->first();
        $price     = (float) ($batchItem?->unit_cost ?? $batch->merchant?->products()
            ->whereHas('batches', fn($q) => $q->where('id', $batch->id))
            ->first()?->price ?? 0);

        return round($price * (1 - $pct / 100), 2);
    }

    private function calcAutoDiscountPct(int $days, ?BatchSetting $setting): int
    {
        $threshold = (int) ($setting?->medium_term_days ?? 14);
        if ($days <= 3)                       return 50;
        if ($days <= 7)                       return 40;
        if ($days <= (int) ($threshold / 2))  return 30;
        return 20;
    }

    private function saveBatchVariantAndSync(Batch $batch, ?string $variantId, ?array $res): void
    {
        if (!$variantId) {
            Log::error('[BatchSync] ❌ لم يُعثر على variant_id', [
                'batch_id' => $batch->id,
                'response' => $res,
            ]);
            return;
        }

        $batch->update(['salla_variant_id' => $variantId]);
        Log::info('[BatchSync] ✅ variant_id محفوظ', ['variant_id' => $variantId]);

        $this->sallaApi->updateBatchVariant($variantId, [
            'sku'            => $batch->batch_code ?? 'B-' . $batch->id,
            'stock_quantity' => $this->getBatchQuantity($batch),
            'sale_price'     => $this->calcSalePrice($batch),
        ]);
    }
}