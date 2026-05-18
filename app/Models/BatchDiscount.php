<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Log;

class BatchDiscount extends Model
{
    use HasFactory;

    protected $fillable = [
        'batch_id',
        'discount_percentage',
        'starts_at',
        'ends_at',
        'status',
        'created_by',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'discount_percentage' => 'decimal:2',
    ];

    protected $appends = [
        'is_active',
        'is_expired',
        'formatted_percentage',
    ];

    public function batch(): BelongsTo
    {
        return $this->belongsTo(Batch::class, 'batch_id');
    }

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($discount) {
            $discount->updateStatus();
        });
    }

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

    public static function validateNoOverlap(Batch $batch, $startsAt, $endsAt, ?int $excludeId = null): bool
    {
        $query = self::where('batch_id', $batch->id)
            ->whereIn('status', ['active', 'scheduled'])
            ->where(function ($q) use ($startsAt, $endsAt) {
                $q->where(function ($q) use ($startsAt, $endsAt) {
                    $q->where('starts_at', '<', $endsAt)
                      ->where('ends_at', '>', $startsAt);
                });
            });

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return !$query->exists();
    }

    public static function getActiveForBatch(Batch $batch): ?self
    {
        return self::where('batch_id', $batch->id)
            ->active()
            ->first();
    }
}