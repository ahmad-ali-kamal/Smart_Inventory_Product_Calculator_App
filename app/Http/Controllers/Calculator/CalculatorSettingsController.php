<?php

namespace App\Http\Controllers\Calculator;

use App\Http\Controllers\Controller;
use App\Models\CalculatorSetting;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CalculatorSettingsController extends Controller
{
    public function index()
    {
        $merchant = Auth::user();
        $settings = CalculatorSetting::where('merchant_id', $merchant->id)->first();

        return view('calculator.settings', ['settings' => $settings]);
    }

    public function store(Request $request)
    {
        $merchant = Auth::user();

        $validated = $request->validate([
            'waste_percentage' => 'required|numeric|min:0|max:100',
            'unit_type'        => 'required|in:m2,cm2,mm2',
            'min_input_area'   => 'nullable|numeric|min:0',
            'max_input_area'   => 'nullable|numeric|min:0',
        ]);

        CalculatorSetting::updateOrCreate(
            ['merchant_id' => $merchant->id],
            [
                'waste_percentage' => $validated['waste_percentage'],
                'unit_type'        => $validated['unit_type'],
                'min_input_area'   => $validated['min_input_area'] ?? null,
                'max_input_area'   => $validated['max_input_area'] ?? null,
            ]
        );

        return response()->json([
            'success'       => true,
            'waste'         => (float) $validated['waste_percentage'],
            'unit_type'     => $validated['unit_type'],
            'min_input_area' => $validated['min_input_area'] ?? null,
            'max_input_area' => $validated['max_input_area'] ?? null,
        ]);
    }

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

        $settings = CalculatorSetting::where('merchant_id', $product->merchant_id)->first();

        $unitType = $settings?->unit_type ?? 'm2';
        $coveragePerUnit = (float) ($calculator->coverage_per_unit ?? 1.0);
        $waste = (float) ($settings?->waste_percentage ?? 10);
        $minArea = (float) ($settings?->min_input_area ?? 0.01);
        $maxArea = (float) ($settings?->max_input_area ?? 999999);

        $unitPrice = (float) $product->price;

        return response()->json([
            'enabled' => true,
            'product' => [
                'id'    => (string) $product->salla_product_id,
                'name'  => (string) $product->name,
                'price' => [
                    'amount'   => $unitPrice,
                    'currency' => 'SAR',
                ],
            ],
            'calculator' => [
                'area_unit' => $unitType,
                'min_input_area' => $minArea,
                'max_input_area' => $maxArea,
                'selling_unit' => [
                    'type'              => 'box',
                    'coverage_per_unit' => $coveragePerUnit,
                    'rounding'          => 'ceil',
                    'min'               => 1,
                    'step'              => 1,
                    'decimals'          => 0,
                ],
                'waste_percentage' => $waste,
            ],
        ])->header('Access-Control-Allow-Origin', '*');
    }

    public function show()
    {
        $merchant = Auth::user();
        $settings = CalculatorSetting::where('merchant_id', $merchant->id)->first();

        if (!$settings) {
            return response()->json([
                'configured'    => false,
                'waste'         => null,
                'unit_type'     => null,
                'min_input_area' => null,
                'max_input_area' => null,
            ]);
        }

        return response()->json([
            'configured'    => true,
            'waste'         => (float) $settings->waste_percentage,
            'unit_type'     => $settings->unit_type,
            'min_input_area' => $settings->min_input_area ? (float) $settings->min_input_area : null,
            'max_input_area' => $settings->max_input_area ? (float) $settings->max_input_area : null,
        ]);
    }
}