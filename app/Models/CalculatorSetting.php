<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CalculatorSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'merchant_id',
        'waste_percentage',
        'unit_type',
        'min_input_area',
        'max_input_area',
    ];

    protected $casts = [
        'waste_percentage' => 'decimal:2',
        'min_input_area' => 'decimal:4',
        'max_input_area' => 'decimal:4',
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

    public function calculateTotalCoverage(int $units, float $coveragePerUnit): float
    {
        return $units * $coveragePerUnit;
    }

    public function calculateActualCoverage(int $units, float $coveragePerUnit): float
    {
        $total = $this->calculateTotalCoverage($units, $coveragePerUnit);
        $waste = $total * ($this->waste_percentage / 100);
        return $total - $waste;
    }

    public function getAreaLimits(): array
    {
        return [
            'min' => (float) ($this->min_input_area ?? 0.01),
            'max' => (float) ($this->max_input_area ?? 999999),
        ];
    }

    public function isValidArea(float $area): bool
    {
        $limits = $this->getAreaLimits();
        return $area >= $limits['min'] && $area <= $limits['max'];
    }
}