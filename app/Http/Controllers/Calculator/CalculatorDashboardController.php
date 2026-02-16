<?php

namespace App\Http\Controllers\Calculator;

use App\Http\Controllers\Controller;
use App\Models\CalculatorSetting;
use App\Models\Product;
use Illuminate\Http\Request;

class CalculatorDashboardController extends Controller
{
    /**
     * عرض Dashboard الآلة الحاسبة
     */
    public function index(Request $request)
    {
        $merchant = $request->user();

        // الحصول على الإعدادات
        $settings = CalculatorSetting::where('merchant_id', $merchant->id)->first();

        // إحصائيات المنتجات
        $stats = [
            'total_products' => Product::where('merchant_id', $merchant->id)->count(),
            'enabled_products' => Product::where('merchant_id', $merchant->id)
                ->whereHas('calculator', function ($q) {
                    $q->where('is_enabled', true);
                })
                ->count(),
            'disabled_products' => Product::where('merchant_id', $merchant->id)
                ->whereHas('calculator', function ($q) {
                    $q->where('is_enabled', false);
                })
                ->orWhereDoesntHave('calculator')
                ->count(),
        ];

        return view('calculator.dashboard', [
            'settings' => $settings,
            'stats' => $stats,
            'hasSettings' => !is_null($settings),
        ]);
    }
}