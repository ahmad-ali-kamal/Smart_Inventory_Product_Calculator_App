<?php

namespace App\Policies;

use App\Models\Merchant;
use App\Models\CategoryMapping;

class CategoryMappingPolicy
{
    /**
     * التحقق من أن التاجر يمتلك التصنيف (للعرض)
     */
    public function view(Merchant $merchant, CategoryMapping $mapping): bool
    {
        return $mapping->merchant_id === $merchant->id;
    }

    /**
     * التحقق من أن التاجر يمتلك التصنيف (للتحديث)
     */
    public function update(Merchant $merchant, CategoryMapping $mapping): bool
    {
        return $mapping->merchant_id === $merchant->id;
    }

    /**
     * التحقق من أن التاجر يمتلك التصنيف (للحذف)
     */
    public function delete(Merchant $merchant, CategoryMapping $mapping): bool
    {
        return $mapping->merchant_id === $merchant->id;
    }

    /**
     * التحقق من أن التاجر يستطيع إنشاء تصنيفات
     */
    public function create(Merchant $merchant): bool
    {
        return $merchant->is_active && $merchant->isEmailVerified();
    }
}