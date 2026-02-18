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
        $settings = CalculatorSetting::where('merchant_id', $merchant->id)->first();

        // ⚠️ توجيه ذكي: إذا لم تكن هناك إعدادات، اعرض صفحة التعليمات
        if (!$settings) {
            return view('calculator.instructions');
        }

        // 3. حساب إحصائيات المنتجات
        $stats = [
            'total_products' => Product::where('merchant_id', $merchant->id)->count(),

            'enabled_products' => Product::where('merchant_id', $merchant->id)
                ->whereHas('calculator', function ($q) {
                    $q->where('is_enabled', true);
                })
                ->count(),

            'disabled_products' => Product::where('merchant_id', $merchant->id)
                ->whereDoesntHave('calculator', function ($q) {
                    $q->where('is_enabled', true);
                })
                ->count(),
        ];

        // 4. جلب المنتجات المفعّلة
        $enabledProducts = Product::where('merchant_id', $merchant->id)
            ->whereHas('calculator', fn($q) => $q->where('is_enabled', true))
            ->with(['calculator'])
            ->orderBy('name')
            ->get();

        // 5. عرض الداشبورد مع البيانات
        return view('calculator.dashboard', [
            'settings'        => $settings,
            'stats'           => $stats,
            'merchant'        => $merchant,
            'enabledProducts' => $enabledProducts,
        ]);
    }
}