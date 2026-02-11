<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    use HasFactory;

    const UPDATED_AT = null;

    protected $fillable = [
        'merchant_id',
        'product_id',
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

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // Static Methods
    public static function log(
        int $merchantId,
        string $action,
        string $description,
        ?int $productId = null,
        ?array $metadata = null
    ): self {
        return self::create([
            'merchant_id' => $merchantId,
            'product_id' => $productId,
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

    public function scopeForProduct($query, int $productId)
    {
        return $query->where('product_id', $productId);
    }

    public function scopeByAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }
}