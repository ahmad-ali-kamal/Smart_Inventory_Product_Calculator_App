<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ActivityLog extends Model
{
    use HasFactory;

    const UPDATED_AT = null;

    protected $fillable = [
        'merchant_id',
        'loggable_type',
        'loggable_id',
        'action',
        'description',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    // Relationships
    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    public function loggable(): MorphTo
    {
        return $this->morphTo();
    }

    // Static Methods
    public static function log(
        int $merchantId,
        string $action,
        string $description,
        ?Model $loggable = null,
        ?array $metadata = null
    ): self {
        return self::create([
            'merchant_id' => $merchantId,
            'loggable_type' => $loggable ? get_class($loggable) : null,
            'loggable_id' => $loggable?->id,
            'action' => $action,
            'description' => $description,
            'metadata' => $metadata,
        ]);
    }

    // Scopes
    public function scopeForMerchant($query, int $merchantId)
    {
        return $query->where('merchant_id', $merchantId);
    }

    public function scopeByAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    public function scopeForModel($query, Model $model)
    {
        return $query->where('loggable_type', get_class($model))
            ->where('loggable_id', $model->id);
    }
}