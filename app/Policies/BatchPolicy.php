<?php

namespace App\Policies;

use App\Models\Merchant;
use App\Models\Batch;

class BatchPolicy
{
    /**
     * التحقق من أن التاجر يمتلك الدفعة (للعرض)
     */
    public function view(Merchant $merchant, Batch $batch): bool
    {
        return $batch->merchant_id === $merchant->id;
    }

    /**
     * التحقق من أن التاجر يمتلك الدفعة (للتحديث)
     */
    public function update(Merchant $merchant, Batch $batch): bool
    {
        return $batch->merchant_id === $merchant->id;
    }

    /**
     * التحقق من أن التاجر يمتلك الدفعة (للحذف)
     */
    public function delete(Merchant $merchant, Batch $batch): bool
    {
        return $batch->merchant_id === $merchant->id;
    }

    /**
     * التحقق من أن التاجر يستطيع إنشاء دفعات
     */
    public function create(Merchant $merchant): bool
    {
        return $merchant->is_active && $merchant->isEmailVerified();
    }
}