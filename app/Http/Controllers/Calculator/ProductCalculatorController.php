<?php

namespace App\Http\Controllers\Calculator;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCalculator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProductCalculatorController extends Controller
{
    /**
     * عرض قائمة المنتجات
     */
    public function index()
    {
        $merchant = Auth::user();

        // جلب المنتجات مع حالة الحاسبة (Eager Loading)
        $products = Product::where('merchant_id', $merchant->id)
            ->with(['calculator']) // تأكد أن العلاقة موجودة في مودل Product
            ->orderBy('name')
            ->paginate(20);

        return view('calculator.products', [
            'products' => $products,
        ]);
    }

    /**
     * تفعيل/إيقاف الآلة الحاسبة (Toggle)
     */
    public function toggle(Request $request, $id)
    {
        $merchant = Auth::user();

        // 1. التحقق من أن المنتج يتبع لهذا التاجر (بديل عن authorize)
        $product = Product::where('id', $id)->where('merchant_id', $merchant->id)->firstOrFail();

        // 2. البحث عن سجل الحاسبة أو إنشاؤه
        $calculator = ProductCalculator::firstOrNew(['product_id' => $product->id]);
        
        // 3. عكس الحالة (إذا كان مفعلاً يوقفه، والعكس)
        $calculator->is_enabled = !$calculator->is_enabled;
        $calculator->save();

        // 4. الرد (JSON لطلبات AJAX)
        if ($request->ajax()) {
            return response()->json([
                'success' => true,
                'is_enabled' => $calculator->is_enabled,
                'message' => $calculator->is_enabled ? 'تم تفعيل الحاسبة للمنتج' : 'تم إيقاف الحاسبة للمنتج',
            ]);
        }

        return back()->with('success', 'تم تحديث حالة المنتج بنجاح');
    }

    /**
     * تفعيل بالجملة (Bulk Enable)
     */
    public function bulkEnable(Request $request)
    {
        $merchant = Auth::user();

        // 1. التحقق من البيانات
        $validated = $request->validate([
            'product_ids' => 'required|array',
            'product_ids.*' => 'exists:products,id',
        ]);

        // 2. جلب المنتجات التي يملكها التاجر فقط من القائمة المرسلة
        $products = Product::where('merchant_id', $merchant->id)
            ->whereIn('id', $validated['product_ids'])
            ->get();

        // 3. تفعيل الحاسبة لها جميعاً
        foreach ($products as $product) {
            ProductCalculator::updateOrCreate(
                ['product_id' => $product->id],
                ['is_enabled' => true]
            );
        }

        if ($request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'تم تفعيل ' . $products->count() . ' منتج بنجاح',
            ]);
        }

        return back()->with('success', 'تم تفعيل المنتجات المختارة');
    }
}