<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CalculatorSetting;

class CalculatorSettingsController extends Controller
{
    public function show(Request $request)
    {
        $merchantId = $request->merchant_id;

        $settings = CalculatorSetting::where('merchant_id', $merchantId)->first();

        return response()->json($settings);
    }

    public function store(Request $request)
    {
        $request->validate([
            'merchant_id' => 'required',
            'coverage_per_unit' => 'required|numeric|min:0.01',
            'waste_percentage' => 'required|numeric|min:0',
        ]);

        $settings = CalculatorSetting::updateOrCreate(
            ['merchant_id' => $request->merchant_id],
            [
                'coverage_per_unit' => $request->coverage_per_unit,
                'waste_percentage' => $request->waste_percentage,
            ]
        );

        return response()->json([
            'message' => 'Calculator settings saved successfully',
            'data' => $settings
        ]);
    }

    public function update(Request $request)
    {
        return $this->store($request); // same logic
    }
}
