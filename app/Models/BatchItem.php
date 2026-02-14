<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BatchItem extends Pivot
{
    protected $table = 'batch_items';
    public $incrementing = true;

    protected $fillable = [
        'batch_id',
        'product_id',
        'quantity',
        'unit_cost',
        'sold_quantity',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'sold_quantity' => 'integer',
        'unit_cost' => 'decimal:2',
    ];

    protected $appends = [
        'remaining_quantity',
    ];

    // Relationships
    public function batch(): BelongsTo
    {
        return $this->belongsTo(Batch::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // Accessors
    public function getRemainingQuantityAttribute(): int
    {
        return $this->quantity - $this->sold_quantity;
    }

    // Methods
    public function recordSale(int $quantity): bool
    {
        if ($this->remaining_quantity < $quantity) {
            return false;
        }

        $this->sold_quantity += $quantity;
        return $this->save();
    }

    public function hasStock(): bool
    {
        return $this->remaining_quantity > 0;
    }

    public function isSoldOut(): bool
    {
        return $this->remaining_quantity <= 0;
    }

    // Scopes
    public function scopeInStock($query)
    {
        return $query->whereRaw('sold_quantity < quantity');
    }

    public function scopeSoldOut($query)
    {
        return $query->whereRaw('sold_quantity >= quantity');
    }
}