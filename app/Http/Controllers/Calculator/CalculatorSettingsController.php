<?php

namespace App\Http\Controllers\Calculator;

use App\Http\Controllers\Controller;
use App\Models\CalculatorSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CalculatorSettingsController extends Controller
{
    /**
     * عرض صفحة الإعدادات
     */
    public function index(Request $request)
    {
        $merchant = $request->user();
        $settings = $merchant->calculatorSettings;

        return Inertia::render('Calculator/Settings', [
            'settings' => $settings ? [
                'coverage_per_unit' => $settings->coverage_per_unit,
                'waste_percentage' => $settings->waste_percentage,
            ] : null,
        ]);
    }

    /**
     * حفظ الإعدادات
     */
    public function store(Request $request)
    {
        $merchant = $request->user();

        $validated = $request->validate([
            'coverage_per_unit' => 'required|numeric|min:0.01',
            'waste_percentage' => 'required|numeric|min:0|max:100',
        ], [
            'coverage_per_unit.required' => 'التغطية لكل وحدة مطلوبة',
            'coverage_per_unit.min' => 'التغطية يجب أن تكون أكبر من 0',
            'waste_percentage.required' => 'نسبة الهدر مطلوبة',
            'waste_percentage.min' => 'نسبة الهدر يجب أن تكون 0 أو أكبر',
            'waste_percentage.max' => 'نسبة الهدر يجب أن تكون 100% أو أقل',
        ]);

        CalculatorSetting::updateOrCreate(
            ['merchant_id' => $merchant->id],
            $validated
        );

        return back()->with('success', 'تم حفظ الإعدادات بنجاح');
    }

    /**
     * تحديث الإعدادات
     */
    public function update(Request $request)
    {
        return $this->store($request);
    }
}