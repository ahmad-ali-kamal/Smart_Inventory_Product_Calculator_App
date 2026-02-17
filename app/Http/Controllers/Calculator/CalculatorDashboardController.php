<?php

namespace App\Http\Controllers\Calculator;

use App\Http\Controllers\Controller;
use App\Models\CalculatorSetting;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CalculatorDashboardController extends Controller
{
    /**
     * عرض Dashboard الآلة الحاسبة
     */
    public function index()
    {
        // 1. جلب التاجر الحالي
        $merchant = Auth::user();

        // 2. التحقق مما إذا كان لدى التاجر إعدادات محفوظة مسبقاً
        // نفترض أن العلاقة calculatorSettings موجودة في مودل Merchant
        // أو نستعلم مباشرة
        $settings = CalculatorSetting::where('merchant_id', $merchant->id)->first();

        // ⚠️ توجيه ذكي: إذا لم تكن هناك إعدادات، اعرض صفحة التعليمات بدلاً من الداشبورد الفارغة
        if (!$settings) {
            return view('calculator.instructions');
        }

        // 3. حساب إحصائيات المنتجات (فقط إذا كانت هناك إعدادات)
        $stats = [
            // إجمالي المنتجات
            'total_products' => Product::where('merchant_id', $merchant->id)->count(),
            
            // المنتجات المفعلة في الحاسبة
            'enabled_products' => Product::where('merchant_id', $merchant->id)
                ->whereHas('calculator', function ($q) {
                    $q->where('is_enabled', true);
                })
                ->count(),
                
            // المنتجات غير المفعلة
            'disabled_products' => Product::where('merchant_id', $merchant->id)
                ->whereDoesntHave('calculator', function ($q) {
                    $q->where('is_enabled', true);
                })
                ->count(),
        ];

        // 4. عرض الداشبورد مع البيانات
        return view('calculator.dashboard', [
            'settings' => $settings,
            'stats' => $stats,
            'merchant' => $merchant
        ]);
    }
}