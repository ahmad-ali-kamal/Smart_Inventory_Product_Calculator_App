<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

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
        'synced_at',
        'metadata',
    ];

    protected $casts = [
        'synced_at' => 'datetime',
        'metadata' => 'array',
        'price' => 'decimal:2',
        'quantity' => 'integer',
    ];

    protected $appends = [
        'main_image_url',
        'overall_status',
        'has_expiry_data',
        'has_calculator_enabled',
    ];

    // Relationships
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

    public function batches(): BelongsToMany
    {
        return $this->belongsToMany(Batch::class, 'batch_items')
            ->using(BatchItem::class)
            ->withPivot(['quantity', 'sold_quantity', 'unit_cost'])
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

    public function calculator(): HasOne
    {
        return $this->hasOne(ProductCalculator::class);
    }

    public function activityLogs(): MorphMany
    {
        return $this->morphMany(ActivityLog::class, 'loggable');
    }

    public function categoryMapping(): BelongsTo
    {
        return $this->belongsTo(CategoryMapping::class, 'category', 'category_name')
            ->where('merchant_id', $this->merchant_id);
    }

    // Accessors
    public function getMainImageUrlAttribute(): ?string
    {
        return $this->mainImage?->image_url ?? $this->images()->first()?->image_url;
    }

    public function getOverallStatusAttribute(): ?string
    {
        // Get the most urgent batch status
        $batchItem = $this->batchItems()
            ->whereHas('batch')
            ->with('batch')
            ->get()
            ->sortBy(function ($item) {
                $order = ['red' => 1, 'yellow' => 2, 'green' => 3];
                return $order[$item->batch->status] ?? 99;
            })
            ->first();

        return $batchItem?->batch->status;
    }

    public function getHasExpiryDataAttribute(): bool
    {
        return $this->batchItems()->exists();
    }

    public function getHasCalculatorEnabledAttribute(): bool
    {
        return $this->calculator && $this->calculator->is_enabled;
    }

    // Helper Methods
    public function canApplyDiscount(): bool
    {
        return $this->overall_status === 'yellow';
    }

    public function isExpired(): bool
    {
        return $this->overall_status === 'red';
    }

    public function getActiveDiscount(): ?ProductDiscount
    {
        return $this->discounts()
            ->where('status', 'active')
            ->where('ends_at', '>', now())
            ->first();
    }

    public function getExpiringBatches(): HasMany
    {
        return $this->batchItems()
            ->whereHas('batch', function ($q) {
                $q->where('status', '!=', 'green');
            });
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeWithStatus($query, string $status)
    {
        return $query->whereHas('batchItems.batch', function ($q) use ($status) {
            $q->where('status', $status);
        });
    }

    public function scopeWithCalculatorEnabled($query)
    {
        return $query->whereHas('calculator', function ($q) {
            $q->where('is_enabled', true);
        });
    }

    public function scopeInCategory($query, string $category)
    {
        return $query->where('category', $category);
    }
}