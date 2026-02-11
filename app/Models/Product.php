<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

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
        'image_url',
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
        'overall_status',
        'has_expiry_data',
        'has_calculator_enabled',
    ];

    // Relationships
    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    public function batches(): HasMany
    {
        return $this->hasMany(ProductBatch::class);
    }

    public function discounts(): HasMany
    {
        return $this->hasMany(ProductDiscount::class);
    }

    public function calculator(): HasOne
    {
        return $this->hasOne(ProductCalculator::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeWithStatus($query, string $status)
    {
        return $query->whereHas('batches', function ($q) use ($status) {
            $q->where('status', $status);
        });
    }

    public function scopeWithCalculatorEnabled($query)
    {
        return $query->whereHas('calculator', function ($q) {
            $q->where('is_enabled', true);
        });
    }

    // Accessors
    public function getOverallStatusAttribute(): ?string
    {
        $batch = $this->batches()->orderBy('days_until_expiry')->first();
        return $batch?->status;
    }

    public function getHasExpiryDataAttribute(): bool
    {
        return $this->batches()->exists();
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
}