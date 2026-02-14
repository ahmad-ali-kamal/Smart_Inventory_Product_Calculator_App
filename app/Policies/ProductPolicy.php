<?php

namespace App\Policies;

use App\Models\Merchant;
use App\Models\Product;

class ProductPolicy
{
    /**
     * التحقق من أن التاجر يمتلك المنتج (للعرض)
     */
    public function view(Merchant $merchant, Product $product): bool
    {
        return $product->merchant_id === $merchant->id;
    }

    /**
     * التحقق من أن التاجر يمتلك المنتج (للتحديث)
     */
    public function update(Merchant $merchant, Product $product): bool
    {
        return $product->merchant_id === $merchant->id;
    }

    /**
     * التحقق من أن التاجر يمتلك المنتج (للحذف)
     */
    public function delete(Merchant $merchant, Product $product): bool
    {
        return $product->merchant_id === $merchant->id;
    }

    /**
     * التحقق من أن التاجر يستطيع إنشاء منتجات
     */
    public function create(Merchant $merchant): bool
    {
        return $merchant->is_active && $merchant->isEmailVerified();
    }
}