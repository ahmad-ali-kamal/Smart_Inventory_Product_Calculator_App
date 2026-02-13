<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Batch extends Model
{
    use HasFactory;

    protected $fillable = [
        'merchant_id',
        'batch_code',
        'name',
        'manufactured_date',
        'expiry_date',
        'status',
        'days_until_expiry',
        'notes',
    ];

    protected $casts = [
        'manufactured_date' => 'date',
        'expiry_date' => 'date',
        'days_until_expiry' => 'integer',
    ];

    protected $appends = [
        'is_expired',
        'expiry_label',
        'total_quantity',
        'total_sold',
        'total_remaining',
    ];

    // Relationships
    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(BatchItem::class);
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'batch_items')
            ->using(BatchItem::class)
            ->withPivot(['quantity', 'sold_quantity', 'unit_cost'])
            ->withTimestamps();
    }

    public function discounts(): HasMany
    {
        return $this->hasMany(ProductDiscount::class);
    }

    public function activityLogs(): MorphMany
    {
        return $this->morphMany(ActivityLog::class, 'loggable');
    }

    // Boot
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($batch) {
            $batch->calculateDaysUntilExpiry();
            $batch->calculateStatus();
        });
    }

    // Accessors
    public function getIsExpiredAttribute(): bool
    {
        return $this->expiry_date < now()->startOfDay();
    }

    public function getExpiryLabelAttribute(): string
    {
        if ($this->is_expired) {
            return 'منتهي الصلاحية';
        }

        $days = $this->days_until_expiry;

        if ($days > 60) {
            return "باقي {$days} يوم";
        } elseif ($days > 15) {
            return "تحذير: باقي {$days} يوم";
        } else {
            return "خطر: باقي {$days} يوم فقط!";
        }
    }

    public function getTotalQuantityAttribute(): int
    {
        return $this->items()->sum('quantity');
    }

    public function getTotalSoldAttribute(): int
    {
        return $this->items()->sum('sold_quantity');
    }

    public function getTotalRemainingAttribute(): int
    {
        return $this->total_quantity - $this->total_sold;
    }

    // Methods
    public function calculateDaysUntilExpiry(): void
    {
        $this->days_until_expiry = Carbon::parse($this->expiry_date)
            ->diffInDays(now()->startOfDay(), false);
    }

    public function calculateStatus(): void
    {
        // Get merchant's batch settings
        $settings = $this->merchant->batchSettings;

        if (!$settings) {
            // Default thresholds
            $greenThreshold = 60;
            $yellowThreshold = 15;
        } else {
            $greenThreshold = $settings->green_threshold_days;
            $yellowThreshold = $settings->yellow_threshold_days;
        }

        $days = $this->days_until_expiry;

        if ($days < 0 || $this->is_expired) {
            $this->status = 'red';
        } elseif ($days <= $yellowThreshold) {
            $this->status = 'red';
        } elseif ($days <= $greenThreshold) {
            $this->status = 'yellow';
        } else {
            $this->status = 'green';
        }
    }

    public function canApplyDiscount(): bool
    {
        return $this->status === 'yellow';
    }

    public function needsDiscount(): bool
    {
        return $this->status === 'yellow' && 
               !$this->discounts()->where('status', 'active')->exists();
    }

    // Scopes
    public function scopeExpiring($query, int $days = 60)
    {
        return $query->where('days_until_expiry', '<=', $days)
            ->where('days_until_expiry', '>', 0);
    }

    public function scopeExpired($query)
    {
        return $query->where('status', 'red');
    }

    public function scopeWarning($query)
    {
        return $query->where('status', 'yellow');
    }

    public function scopeSafe($query)
    {
        return $query->where('status', 'green');
    }

    public function scopeForMerchant($query, int $merchantId)
    {
        return $query->where('merchant_id', $merchantId);
    }
}