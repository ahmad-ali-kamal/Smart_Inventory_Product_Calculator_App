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

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function mainImage(): HasOne
    {
        return $this->hasOne(ProductImage::class)->where('is_main', true);
    }

    public function calculator(): HasOne
    {
        return $this->hasOne(ProductCalculator::class);
    }

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

    public function discounts(): HasMany
    {
        return $this->hasMany(ProductDiscount::class);
    }

    // ====================================================================
    // القانون الذكي (The Logic)
    // ====================================================================

    /**
     * جلب الحد الأدنى للتنبيه (Threshold) بناءً على نوع التصنيف
     * القانون: Category -> CategoryMapping -> TermType -> BatchSettings
     */
    public function getCategoryThreshold(): int
    {
        // 1. البحث عن خريطة التصنيف لهذا المنتج وللبائع الحالي
        // نفترض أن العمود 'category' في المنتج يطابق 'category_name' في الخريطة
        $mapping = CategoryMapping::where('merchant_id', $this->merchant_id)
            ->where('category_name', $this->category)
            ->first();

        // 2. جلب إعدادات المدد العامة للبائع
        $settings = BatchSetting::where('merchant_id', $this->merchant_id)->first();

        // 3. إذا لم توجد خريطة أو إعدادات، نرجع القيمة الافتراضية (مثلاً 14 يوم)
        if (!$mapping || !$settings) {
            return $settings->medium_term_days ?? 14;
        }

        // 4. تحديد الأيام بناءً على النوع المربوط (Short, Medium, Long)
        switch ($mapping->bucket) {
    case 'short':  return $settings->short_term_days;
    case 'long':   return $settings->long_term_days;
    case 'medium':
    default:       return $settings->medium_term_days;
}
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

    public function getImageUrlAttribute(): string
    {
        return $this->mainImage?->image_url ?? asset('images/placeholder-product.png');
    }

    public function getDescriptionAttribute(): ?string
    {
        return $this->metadata['description'] ?? null;
    }

    public function getFormattedPriceAttribute(): string
    {
        return number_format($this->price, 2) . ' ر.س';
    }
}