<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductBatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'batch_number',
        'quantity',
        'expiry_date',
        'status',
        'days_until_expiry',
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'quantity' => 'integer',
        'days_until_expiry' => 'integer',
    ];

    protected $appends = [
        'is_expired',
        'expiry_label',
    ];

    // Relationships
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function discounts(): HasMany
    {
        return $this->hasMany(ProductDiscount::class, 'batch_id');
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
        return $this->expiry_date < now();
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

    // Methods
    public function calculateDaysUntilExpiry(): void
    {
        $this->days_until_expiry = Carbon::parse($this->expiry_date)
            ->diffInDays(now(), false);
    }

    public function calculateStatus(): void
    {
        $days = $this->days_until_expiry;

        if ($days < 0 || $this->is_expired) {
            $this->status = 'red';
        } elseif ($days <= 15) {
            $this->status = 'red';
        } elseif ($days <= 60) {
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
}