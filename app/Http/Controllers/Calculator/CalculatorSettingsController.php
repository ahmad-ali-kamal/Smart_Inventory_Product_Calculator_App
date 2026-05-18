<?php

namespace App\Http\Controllers\Calculator;

use App\Http\Controllers\Controller;
use App\Models\CalculatorSetting;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CalculatorSettingsController extends Controller
{
    // ── GET /mustashar/api/calculator-settings ────────────────────────────────
    public function show()
    {
        $merchant = Auth::user();
        $settings = CalculatorSetting::where('merchant_id', $merchant->id)->first();

        if (!$settings) {
            return response()->json([
                'configured'      => false,
                'waste'           => null,
            ]);
        }

        return response()->json([
            'configured'      => true,
            'waste'           => (float) $settings->waste_percentage,
        ]);
    }

    // ── POST /mustashar/api/calculator-settings ───────────────────────────────
    public function store(Request $request)
    {
        $merchant = Auth::user();

        $validated = $request->validate([
            'waste_percentage' => 'required|numeric|min:0|max:50',
        ]);

        CalculatorSetting::updateOrCreate(
            ['merchant_id' => $merchant->id],
            [
                'waste_percentage' => $validated['waste_percentage'],
            ]
        );

        return response()->json([
            'success'    => true,
            'waste'      => (float) $validated['waste_percentage'],
            'configured' => true,
        ]);
    }

    // ── GET /api/calculator/settings/{salla_product_id}  (public — snippet) ──
    public function getSettingsForStore($salla_product_id)
    {
        $product = Product::where('salla_product_id', $salla_product_id)->first();

        if (!$product) {
            return response()->json(['enabled' => false], 404)
                ->header('Access-Control-Allow-Origin', '*');
        }

        $calculator = \App\Models\ProductCalculator::where('product_id', $product->id)
            ->where('is_enabled', 1)
            ->first();

        if (!$calculator) {
            return response()->json(['enabled' => false], 404)
                ->header('Access-Control-Allow-Origin', '*');
        }

        // Validate coverage_per_unit before using it
        $coveragePerUnit = (float) ($calculator->coverage_per_unit ?? 0);
        if ($coveragePerUnit < 0.01 || $coveragePerUnit > 200) {
            return response()->json(['enabled' => false, 'reason' => 'invalid_coverage'], 422)
                ->header('Access-Control-Allow-Origin', '*');
        }

        $settings    = CalculatorSetting::where('merchant_id', $product->merchant_id)->first();
        $wastePct    = (float) ($settings?->waste_percentage ?? 10);
        $unitPrice   = (float) $product->price;

        return response()->json([
            'enabled'           => true,
            'coverage_per_unit' => $coveragePerUnit,
            'waste_percentage'  => $wastePct,
            'unit_type'         => 'box',
            'product'           => [
                'id'    => (string) $product->salla_product_id,
                'name'  => (string) $product->name,
                'price' => [
                    'amount'   => $unitPrice,
                    'currency' => 'SAR',
                ],
            ],
        ])->header('Access-Control-Allow-Origin', '*');
    }
}