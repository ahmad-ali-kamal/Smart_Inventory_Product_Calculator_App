<?php

namespace App\Http\Controllers\Calculator;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCalculator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ProductCalculatorController extends Controller
{
    /**
     * جلب الإعدادات لمنتج معين (يستخدم عادة من قبل واجهة سلة أو API)
     */
    public function getSettings($product_id)
    {
        // البحث عن المنتج باستخدام salla_product_id
        $product = Product::where('salla_product_id', $product_id)->first();

        if (!$product) {
            return response()->json(['enabled' => false, 'message' => 'Product not found']);
        }

        // جلب إعدادات الحاسبة المرتبطة بالمنتج
        $calculator = $product->calculator; // نفترض وجود علاقة calculator في مودل Product

        if (!$calculator || !$calculator->is_enabled) {
            return response()->json(['enabled' => false]);
        }

        return response()->json([
            'enabled'  => true,
            'coverage' => $calculator->coverage ?? 0,
            'waste'    => $calculator->waste ?? 0
        ]);
    }

    /**
     * عرض قائمة المنتجات في لوحة تحكم المستشار
     */
    public function index(Request $request)
    {
        $merchant = Auth::user();

        // جلب المنتجات مع البحث إذا وجد
        $query = Product::where('merchant_id', $merchant->id)
                        ->with(['calculator']);

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $products = $query->orderBy('name')->paginate(20);

        return view('calculator.products', compact('products'));
    }

    /**
     * تفعيل/إيقاف الآلة الحاسبة (Toggle) عبر AJAX
     */
    public function toggle(Request $request, $id)
    {
        $merchant = Auth::user();

        try {
            // التحقق من ملكية المنتج
            $product = Product::where('id', $id)
                              ->where('merchant_id', $merchant->id)
                              ->firstOrFail();

            // تحديث أو إنشاء سجل الحاسبة
            $calculator = ProductCalculator::updateOrCreate(
                ['product_id' => $product->id],
                // إذا لم يكن موجوداً، سيتم إنشاؤه كـ true، إذا كان موجوداً سيتم عكس حالته الحالية
                ['is_enabled' => $request->has('is_enabled') ? $request->is_enabled : true]
            );

            // في حال كان الطلب هو Toggle بسيط (بدون تمرير حالة معينة)
            if (!$request->has('is_enabled')) {
                $calculator->is_enabled = !$calculator->is_enabled;
                $calculator->save();
            }

            if ($request->ajax()) {
                return response()->json([
                    'success'    => true,
                    'is_enabled' => (bool)$calculator->is_enabled,
                    'message'    => $calculator->is_enabled ? 'Al-Mustashar activated for this product' : 'Al-Mustashar disabled'
                ]);
            }

            return back()->with('success', 'Status updated successfully');

        } catch (\Exception $e) {
            Log::error("Toggle Error: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error processing request'], 500);
        }
    }

    /**
     * تفعيل الحاسبة لمجموعة منتجات مختارة (Bulk Enable)
     */
    public function bulkEnable(Request $request)
    {
        $merchant = Auth::user();

        $validated = $request->validate([
            'product_ids' => 'required|array',
            'product_ids.*' => 'exists:products,id',
        ]);

        // جلب المنتجات المملوكة فقط
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
                'message' => 'Activated for ' . $products->count() . ' products successfully.'
            ]);
        }

        return back()->with('success', 'Selected products activated.');
    }
}