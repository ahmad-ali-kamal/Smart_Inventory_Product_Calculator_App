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

        // جلب إعدادات الحاسبة المرتبطة بالمنتج (نفترض وجود علاقة calculator في مودل Product)
        $calculator = $product->calculator; 

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
     * ✅ إصلاح: تفعيل/إيقاف الآلة الحاسبة (Toggle) بأسلوب آمن
     * حل مشكلة "Double Flip" التي تمنع التفعيل.
     */
    public function toggle(Request $request, $id)
    {
        $merchant = Auth::user();

        try {
            // 1. التحقق الصارم من ملكية المنتج
            $product = Product::where('id', $id)
                              ->where('merchant_id', $merchant->id)
                              ->firstOrFail();

            // 2. جلب السجل الحالي أو إنشاء واحد جديد إذا لم يوجد
            $calculator = ProductCalculator::firstOrCreate(['product_id' => $product->id]);

            // 3. تحديد الحالة الجديدة:
            // إذا تم تمرير حالة محددة من الواجهة نستخدمها، وإلا نعكس الحالة الحالية.
            if ($request->has('is_enabled')) {
                $newState = filter_var($request->is_enabled, FILTER_VALIDATE_BOOLEAN);
            } else {
                $newState = !$calculator->is_enabled;
            }

            // 4. حفظ الحالة الجديدة
            $calculator->is_enabled = $newState;
            $calculator->save();

            // 5. الرد لطلبات AJAX
            if ($request->ajax() || $request->wantsJson()) {
                return response()->json([
                    'success'    => true,
                    'is_enabled' => (bool)$calculator->is_enabled,
                    'message'    => $calculator->is_enabled ? 'Al-Mustashar activated' : 'Al-Mustashar disabled'
                ]);
            }

            // للطلبات العادية (تراجع)
            return back()->with('success', 'Status updated successfully');

        } catch (\Exception $e) {
            Log::error("Toggle Error for Product ID {$id}: " . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
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

        // جلب المنتجات المملوكة فقط لضمان الأمان
        $products = Product::where('merchant_id', $merchant->id)
                           ->whereIn('id', $validated['product_ids'])
                           ->get();

        foreach ($products as $product) {
            ProductCalculator::updateOrCreate(
                ['product_id' => $product->id],
                ['is_enabled' => true]
            );
        }

        if ($request->ajax() || $request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Activated for ' . $products->count() . ' products successfully.'
            ]);
        }

        return back()->with('success', 'Selected products activated.');
    }
}