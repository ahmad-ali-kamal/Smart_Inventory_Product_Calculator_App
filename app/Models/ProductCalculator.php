<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductCalculator extends Model
{
    use HasFactory;

    protected $table = 'product_calculator';

    protected $fillable = [
        'product_id',
        'is_enabled',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
    ];

    // Relationships
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // Methods
    public function enable(): bool
    {
        $this->is_enabled = true;
        return $this->save();
    }

    public function disable(): bool
    {
        $this->is_enabled = false;
        return $this->save();
    }

    public function toggle(): bool
    {
        $this->is_enabled = !$this->is_enabled;
        return $this->save();
    }

    // Scopes
    public function scopeEnabled($query)
    {
        return $query->where('is_enabled', true);
    }

    public function scopeDisabled($query)
    {
        return $query->where('is_enabled', false);
    }
}