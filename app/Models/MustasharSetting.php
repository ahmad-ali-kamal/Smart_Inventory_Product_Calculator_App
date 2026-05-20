<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MustasharSetting extends Model
{
    use HasFactory;

    protected $table = 'calculator_settings';

    protected $fillable = [
        'merchant_id',
        'waste_percentage',
        'coverage_per_unit',
        'unit_type',
        // min_input_area / max_input_area removed — dropped in migration
    ];

    protected $casts = [
        'waste_percentage'  => 'decimal:2',
        'coverage_per_unit' => 'decimal:2',
    ];

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    public function calculateRequiredUnits(float $customerNeed, float $coveragePerUnit): float
    {
        $withWaste = $customerNeed * (1 + ($this->waste_percentage / 100));
        return $withWaste / $coveragePerUnit;
    }
}