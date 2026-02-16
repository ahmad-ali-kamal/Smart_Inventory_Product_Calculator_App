<?php

namespace App\Http\Controllers\Calculator;

use App\Http\Controllers\Controller;
use App\Models\CalculatorSetting;
use Illuminate\Http\Request;

class CalculatorSettingsController extends Controller
{
    /**
     * عرض صفحة الإعدادات
     */
    public function index(Request $request)
    {
        $merchant = $request->user();
        $settings = CalculatorSetting::where('merchant_id', $merchant->id)->first();

        return view('calculator.settings', [
            'settings' => $settings,
        ]);
    }

    /**
     * حفظ الإعدادات (POST)
     */
    public function store(Request $request)
    {
        $merchant = $request->user();

        $validated = $request->validate([
            'coverage_per_unit' => 'required|numeric|min:0.01',
            'waste_percentage' => 'required|numeric|min:0|max:100',
        ], [
            'coverage_per_unit.required' => 'التغطية لكل وحدة مطلوبة',
            'coverage_per_unit.numeric' => 'التغطية لكل وحدة يجب أن تكون رقم',
            'coverage_per_unit.min' => 'التغطية لكل وحدة يجب أن تكون أكبر من 0',
            'waste_percentage.required' => 'نسبة الهدر مطلوبة',
            'waste_percentage.numeric' => 'نسبة الهدر يجب أن تكون رقم',
            'waste_percentage.min' => 'نسبة الهدر يجب أن تكون 0 أو أكبر',
            'waste_percentage.max' => 'نسبة الهدر يجب أن تكون أقل من أو تساوي 100',
        ]);

        CalculatorSetting::updateOrCreate(
            ['merchant_id' => $merchant->id],
            [
                'coverage_per_unit' => $validated['coverage_per_unit'],
                'waste_percentage' => $validated['waste_percentage'],
            ]
        );

        return redirect()->route('calculator.dashboard')
            ->with('success', 'تم حفظ الإعدادات بنجاح');
    }

    /**
     * تحديث الإعدادات (PUT)
     */
    public function update(Request $request)
    {
        return $this->store($request);
    }
}