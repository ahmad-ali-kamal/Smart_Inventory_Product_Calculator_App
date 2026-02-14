<?php

namespace App\Http\Controllers\Calculator;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCalculator;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductCalculatorController extends Controller
{
    /**
     * عرض صفحة إدارة المنتجات
     */
    public function index(Request $request)
    {
        $merchant = $request->user();

        if (!$merchant->hasCalculatorSettings()) {
            return redirect()->route('calculator.settings')
                ->with('info', 'يرجى إعداد الإعدادات العامة أولاً');
        }

        $products = Product::where('merchant_id', $merchant->id)
            ->with('calculator')
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'price' => $product->price,
                    'image_url' => $product->image_url,
                    'calculator_enabled' => $product->calculator && $product->calculator->is_enabled,
                ];
            });

        return Inertia::render('Calculator/ProductManagement', [
            'products' => $products,
            'settings' => [
                'coverage_per_unit' => $merchant->calculatorSettings->coverage_per_unit,
                'waste_percentage' => $merchant->calculatorSettings->waste_percentage,
            ],
        ]);
    }

    /**
     * تفعيل الآلة الحاسبة للمنتج
     */
    public function enable(Request $request, Product $product)
    {
        $this->authorize('update', $product);

        if (!$request->user()->hasCalculatorSettings()) {
            return back()->with('error', 'يرجى إعداد الإعدادات العامة أولاً');
        }

        $calculator = ProductCalculator::firstOrCreate(
            ['product_id' => $product->id],
            ['is_enabled' => false]
        );

        $calculator->enable();

        return back()->with('success', 'تم تفعيل الآلة الحاسبة للمنتج');
    }

    /**
     * إيقاف الآلة الحاسبة للمنتج
     */
    public function disable(Product $product)
    {
        $this->authorize('update', $product);

        $calculator = $product->calculator;

        if ($calculator) {
            $calculator->disable();
        }

        return back()->with('success', 'تم إيقاف الآلة الحاسبة للمنتج');
    }

    /**
     * تبديل حالة الآلة الحاسبة
     */
    public function toggle(Request $request, Product $product)
    {
        $this->authorize('update', $product);

        if (!$request->user()->hasCalculatorSettings()) {
            return response()->json([
                'message' => 'يرجى إعداد الإعدادات العامة أولاً',
            ], 400);
        }

        $calculator = ProductCalculator::firstOrCreate(
            ['product_id' => $product->id],
            ['is_enabled' => false]
        );

        $calculator->toggle();

        return response()->json([
            'success' => true,
            'is_enabled' => $calculator->is_enabled,
        ]);
    }

    /**
     * تفعيل جماعي
     */
    public function bulkEnable(Request $request)
    {
        $validated = $request->validate([
            'product_ids' => 'required|array|min:1',
            'product_ids.*' => 'exists:products,id',
        ]);

        if (!$request->user()->hasCalculatorSettings()) {
            return back()->with('error', 'يرجى إعداد الإعدادات العامة أولاً');
        }

        foreach ($validated['product_ids'] as $productId) {
            $product = Product::find($productId);
            
            if ($product && $product->merchant_id === $request->user()->id) {
                $calculator = ProductCalculator::firstOrCreate(
                    ['product_id' => $product->id],
                    ['is_enabled' => false]
                );

                $calculator->enable();
            }
        }

        return back()->with('success', 'تم تفعيل الآلة الحاسبة للمنتجات المحددة');
    }
}