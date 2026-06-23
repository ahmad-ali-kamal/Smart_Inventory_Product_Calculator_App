<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductMustashar extends Model
{
    use HasFactory;

    protected $table = 'product_mustashar';

    protected $fillable = [
        'product_id',
        'is_enabled',
        'dimension_count',      // 2 | 3
        'coverage_type',        // 'global' | 'custom'
        'coverage_per_unit',
        'waste_type',           // 'global' | 'custom'
        'waste_percentage',
    ];

    protected $casts = [
        'is_enabled'        => 'boolean',
        'dimension_count'   => 'integer',
        'coverage_per_unit' => 'decimal:2',
        'waste_percentage'  => 'decimal:2',
    ];

    // ── Type helpers ──────────────────────────────────────────────────────────

    public function coverageIsCustom(): bool
    {
        return $this->coverage_type === 'custom';
    }

    public function wasteIsCustom(): bool
    {
        return $this->waste_type === 'custom';
    }

    // ── Relationships ─────────────────────────────────────────────────────────

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    // ── State helpers ─────────────────────────────────────────────────────────

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

    public function scopeEnabled($query)
    {
        return $query->where('is_enabled', true);
    }

    public function scopeDisabled($query)
    {
        return $query->where('is_enabled', false);
    }
}