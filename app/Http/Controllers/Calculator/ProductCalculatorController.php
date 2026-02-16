<?php

namespace App\Http\Controllers\Calculator;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCalculator;
use Illuminate\Http\Request;

class ProductCalculatorController extends Controller
{
    /**
     * عرض قائمة المنتجات
     */
    public function index(Request $request)
    {
        $merchant = $request->user();

        $products = Product::where('merchant_id', $merchant->id)
            ->with(['calculator', 'mainImage'])
            ->orderBy('name')
            ->paginate(20);

        return view('calculator.products', [
            'products' => $products,
        ]);
    }

    /**
     * تفعيل الآلة الحاسبة لمنتج
     */
    public function enable(Request $request, Product $product)
    {
        $this->authorize('update', $product);

        ProductCalculator::updateOrCreate(
            ['product_id' => $product->id],
            ['is_enabled' => true]
        );

        if ($request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'تم تفعيل الآلة الحاسبة',
            ]);
        }

        return back()->with('success', 'تم تفعيل الآلة الحاسبة للمنتج');
    }

    /**
     * إيقاف الآلة الحاسبة لمنتج
     */
    public function disable(Request $request, Product $product)
    {
        $this->authorize('update', $product);

        ProductCalculator::updateOrCreate(
            ['product_id' => $product->id],
            ['is_enabled' => false]
        );

        if ($request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'تم إيقاف الآلة الحاسبة',
            ]);
        }

        return back()->with('success', 'تم إيقاف الآلة الحاسبة للمنتج');
    }

    /**
     * Toggle الآلة الحاسبة لمنتج
     */
    public function toggle(Request $request, Product $product)
    {
        $this->authorize('update', $product);

        $calculator = ProductCalculator::where('product_id', $product->id)->first();

        if ($calculator) {
            $calculator->is_enabled = !$calculator->is_enabled;
            $calculator->save();
        } else {
            ProductCalculator::create([
                'product_id' => $product->id,
                'is_enabled' => true,
            ]);
        }

        $isEnabled = $calculator ? $calculator->is_enabled : true;

        if ($request->ajax()) {
            return response()->json([
                'success' => true,
                'is_enabled' => $isEnabled,
                'message' => $isEnabled ? 'تم التفعيل' : 'تم الإيقاف',
            ]);
        }

        return back()->with('success', $isEnabled ? 'تم التفعيل' : 'تم الإيقاف');
    }

    /**
     * تفعيل بالجملة
     */
    public function bulkEnable(Request $request)
    {
        $validated = $request->validate([
            'product_ids' => 'required|array',
            'product_ids.*' => 'exists:products,id',
        ]);

        $merchant = $request->user();

        // التحقق من أن المنتجات تنتمي للتاجر
        $products = Product::where('merchant_id', $merchant->id)
            ->whereIn('id', $validated['product_ids'])
            ->get();

        foreach ($products as $product) {
            ProductCalculator::updateOrCreate(
                ['product_id' => $product->id],
                ['is_enabled' => true]
            );
        }

        if ($request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'تم تفعيل ' . $products->count() . ' منتج',
            ]);
        }

        return back()->with('success', 'تم تفعيل ' . $products->count() . ' منتج');
    }
}