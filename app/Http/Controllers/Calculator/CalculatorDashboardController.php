<?php

namespace App\Http\Controllers\Calculator;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CalculatorDashboardController extends Controller
{
    /**
     * عرض داشبورد الآلة الحاسبة
     */
    public function index(Request $request)
    {
        $merchant = $request->user();
        $hasSettings = $merchant->hasCalculatorSettings();

        // إذا لم يكن لديه إعدادات، عرض الحالة الفارغة
        if (!$hasSettings) {
            return Inertia::render('Calculator/Dashboard', [
                'hasSettings' => false,
                'stats' => null,
                'products' => [],
            ]);
        }

        // إحصائيات
        $stats = [
            'total_products' => $merchant->products()->count(),
            'enabled_products' => $merchant->products()
                ->withCalculatorEnabled()
                ->count(),
        ];

        // المنتجات المفعلة للآلة الحاسبة
        $products = Product::where('merchant_id', $merchant->id)
            ->withCalculatorEnabled()
            ->with('calculator')
            ->get()
            ->map(function ($product) use ($merchant) {
                $settings = $merchant->calculatorSettings;
                
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'image_url' => $product->image_url,
                    'price' => $product->price,
                    'is_enabled' => true,
                    'settings' => [
                        'coverage' => $settings->coverage_per_unit,
                        'waste' => $settings->waste_percentage,
                    ],
                ];
            });

        return Inertia::render('Calculator/Dashboard', [
            'hasSettings' => true,
            'stats' => $stats,
            'products' => $products,
        ]);
    }
}