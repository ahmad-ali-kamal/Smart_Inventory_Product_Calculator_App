<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductDiscount extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'batch_id',
        'discount_percentage',
        'starts_at',
        'ends_at',
        'status',
        'is_ai_suggested',
        'applied_to_salla',
        'salla_special_price_id',
        'ai_reasoning',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'discount_percentage' => 'decimal:2',
        'is_ai_suggested' => 'boolean',
        'applied_to_salla' => 'boolean',
    ];

    protected $appends = [
        'is_active',
        'is_expired',
        'formatted_percentage',
    ];

    // Relationships
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(ProductBatch::class, 'batch_id');
    }

    // Boot
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($discount) {
            $discount->updateStatus();
        });
    }

    // Accessors
    public function getIsActiveAttribute(): bool
    {
        return $this->status === 'active' &&
               $this->starts_at <= now() &&
               $this->ends_at > now();
    }

    public function getIsExpiredAttribute(): bool
    {
        return $this->ends_at && $this->ends_at < now();
    }

    public function getFormattedPercentageAttribute(): string
    {
        return $this->discount_percentage . '%';
    }

    // Methods
    public function updateStatus(): void
    {
        if ($this->is_expired) {
            $this->status = 'expired';
        } elseif ($this->starts_at <= now() && $this->ends_at > now()) {
            $this->status = 'active';
        } elseif ($this->starts_at > now()) {
            $this->status = 'scheduled';
        }
    }

    public function cancel(): bool
    {
        $this->status = 'cancelled';
        return $this->save();
    }

    public function activate(): bool
    {
        if ($this->starts_at > now()) {
            return false;
        }

        $this->status = 'active';
        return $this->save();
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active')
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>', now());
    }

    public function scopeScheduled($query)
    {
        return $query->where('status', 'scheduled')
            ->where('starts_at', '>', now());
    }

    public function scopeExpired($query)
    {
        return $query->where('status', 'expired')
            ->orWhere(function ($q) {
                $q->where('ends_at', '<', now());
            });
    }

    public function scopeAiSuggested($query)
    {
        return $query->where('is_ai_suggested', true);
    }

    public function scopeAppliedToSalla($query)
    {
        return $query->where('applied_to_salla', true);
    }
}