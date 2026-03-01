<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'merchant_id',
        'salla_product_id',
        'name',
        'sku',
        'price',
        'quantity',
        'category',
        'status',
        'metadata',
        'synced_at',
    ];

    protected $casts = [
        'price'     => 'decimal:2',
        'quantity'  => 'integer',
        'metadata'  => 'array',
        'synced_at' => 'datetime',
    ];

    // ====================================================================
    // العلاقات (Relations)
    // ====================================================================

    /**
     * المنتج ينتمي لتاجر واحد
     */
    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    /**
     * المنتج لديه عدة صور (مرتبة حسب sort_order)
     */
    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    /**
     * جلب الصورة الأساسية للمنتج
     */
    public function mainImage(): HasOne
    {
        return $this->hasOne(ProductImage::class)->where('is_main', true);
    }

    /**
     * علاقة الحاسبة الذكية (لتحديد هل المنتج مفعل في الحاسبة أم لا)
     */
    public function calculator(): HasOne
    {
        return $this->hasOne(ProductCalculator::class);
    }

    /**
     * علاقات المخزون والباتشات (Inventory System)
     */
    public function batches(): BelongsToMany
    {
        return $this->belongsToMany(Batch::class, 'batch_items')
            ->withPivot('quantity', 'sold_quantity', 'unit_cost')
            ->withTimestamps();
    }

    public function batchItems(): HasMany
    {
        return $this->hasMany(BatchItem::class);
    }

    /**
     * الخصومات المرتبطة بهذا المنتج
     */
    public function discounts(): HasMany
    {
        return $this->hasMany(ProductDiscount::class);
    }

    // ====================================================================
    // نطاقات البحث (Scopes)
    // ====================================================================

    public function scopeForMerchant($query, int $merchantId)
    {
        return $query->where('merchant_id', $merchantId);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    // ====================================================================
    // الموصلات (Accessors & Mutators)
    // ====================================================================

    /**
     * جلب رابط الصورة الأساسية مباشرة أو صورة افتراضية
     * الاستخدام: $product->image_url
     */
    public function getImageUrlAttribute(): string
    {
        return $this->mainImage?->image_url ?? asset('images/placeholder-product.png');
    }

    /**
     * جلب الوصف من بيانات الـ Metadata
     */
    public function getDescriptionAttribute(): ?string
    {
        return $this->metadata['description'] ?? null;
    }

    /**
     * عرض السعر مع العملة بشكل منسق
     */
    public function getFormattedPriceAttribute(): string
    {
        return number_format($this->price, 2) . ' ر.س';
    }
}