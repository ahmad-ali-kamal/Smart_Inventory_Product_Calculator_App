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
        'coverage_per_unit',
        'waste_percentage',
    ];

    protected $casts = [
        'coverage_per_unit' => 'decimal:2',
        'waste_percentage' => 'decimal:2',
    ];

    // Relationships
    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    // Methods
    public function calculateRequiredUnits(float $customerNeed): float
    {
        $withWaste = $customerNeed * (1 + ($this->waste_percentage / 100));
        return $withWaste / $this->coverage_per_unit;
    }

    public function calculateTotalCoverage(int $units): float
    {
        return $units * $this->coverage_per_unit;
    }

    public function calculateActualCoverage(int $units): float
    {
        $total = $this->calculateTotalCoverage($units);
        $waste = $total * ($this->waste_percentage / 100);
        return $total - $waste;
    }
}