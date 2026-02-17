<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
    // Relations
    // ====================================================================

    public function merchant()
    {
        return $this->belongsTo(Merchant::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function mainImage()
    {
        return $this->hasOne(ProductImage::class)->where('is_main', true);
    }

    public function batches()
    {
        return $this->belongsToMany(Batch::class, 'batch_items')
            ->withPivot('quantity', 'sold_quantity', 'unit_cost')
            ->withTimestamps();
    }

    public function batchItems()
    {
        return $this->hasMany(BatchItem::class);
    }

    public function discounts()
    {
        return $this->hasMany(ProductDiscount::class);
    }

    public function calculator()
    {
        return $this->hasOne(ProductCalculator::class);
    }

    // ====================================================================
    // Scopes
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
    // Accessors
    // ====================================================================

    public function getMainImageUrlAttribute(): ?string
    {
        return $this->mainImage?->image_url;
    }

    public function getDescriptionAttribute(): ?string
    {
        return $this->metadata['description'] ?? null;
    }
}