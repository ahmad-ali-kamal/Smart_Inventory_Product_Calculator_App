<?php

namespace App\Http\Controllers\Calculator;

use App\Http\Controllers\Controller;
use App\Models\CalculatorSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CalculatorSettingsController extends Controller
{
    /**
     * عرض صفحة الإعدادات
     */
    public function index()
    {
        $merchant = Auth::user();
        
        // جلب الإعدادات الحالية إن وجدت لتعبئة الحقول بها
        $settings = CalculatorSetting::where('merchant_id', $merchant->id)->first();

        return view('calculator.settings', [
            'settings' => $settings,
        ]);
    }

    /**
     * حفظ أو تحديث الإعدادات (POST)
     */
    public function store(Request $request)
    {
        $merchant = Auth::user();

        // 1. التحقق من صحة البيانات
        $validated = $request->validate([
            'coverage_per_unit' => 'required|numeric|min:0.01', // التغطية (متر مربع للكرتون)
            'waste_percentage'  => 'required|numeric|min:0|max:100', // نسبة الهدر %
        ], [
            'coverage_per_unit.required' => 'حقل التغطية (Coverage) مطلوب.',
            'coverage_per_unit.numeric'  => 'يجب أن تكون التغطية رقماً.',
            'coverage_per_unit.min'      => 'يجب أن تكون قيمة التغطية أكبر من 0.',
            'waste_percentage.required'  => 'حقل نسبة الهدر مطلوب.',
            'waste_percentage.numeric'   => 'نسبة الهدر يجب أن تكون رقماً.',
            'waste_percentage.min'       => 'نسبة الهدر لا يمكن أن تكون سالبة.',
            'waste_percentage.max'       => 'نسبة الهدر لا يمكن أن تتجاوز 100%.',
        ]);

        // 2. الحفظ في قاعدة البيانات (Create Or Update)
        // يبحث عن إعدادات هذا التاجر، فإذا وجدها يحدثها، وإذا لم يجدها ينشئ جديدة
        CalculatorSetting::updateOrCreate(
            ['merchant_id' => $merchant->id], // شرط البحث
            [
                'coverage_per_unit' => $validated['coverage_per_unit'],
                'waste_percentage'  => $validated['waste_percentage'],
            ] // القيم الجديدة
        );

        // 3. التوجيه لصفحة الداشبورد
        // لأن المستخدم عادة يضبط الإعدادات ثم يريد استخدام الحاسبة
        return redirect()->route('calculator.dashboard')
            ->with('success', 'تم حفظ إعدادات الحاسبة بنجاح! يمكنك الآن تفعيل المنتجات.');
    }
}