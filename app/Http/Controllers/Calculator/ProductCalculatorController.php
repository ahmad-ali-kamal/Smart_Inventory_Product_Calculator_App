<?php

namespace App\Http\Controllers\Calculator;

use App\Http\Controllers\Controller;
use App\Models\CalculatorSetting;
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
        $merchant = Auth::user();

        // البحث عن المنتج باستخدام salla_product_id + التحقق من الملكية
        $product = Product::where('merchant_id', $merchant->id)
            ->where('salla_product_id', (string) $product_id)
            ->first();

        if (!$product) {
            return response()->json(['enabled' => false, 'message' => 'Product not found']);
        }

        // تحقق من التفعيل
        $calculator = $product->calculator;

        if (!$calculator || !$calculator->is_enabled) {
            return response()->json(['enabled' => false]);
        }

        // جلب إعدادات التاجر
        $settings = CalculatorSetting::where('merchant_id', $merchant->id)->first();

        // Overrides per product (optional) via metadata
        $metaCalc = is_array($product->metadata) ? ($product->metadata['calculator'] ?? null) : null;
        $unitType = is_array($metaCalc) && !empty($metaCalc['unit_type'])
            ? (string) $metaCalc['unit_type']
            : 'box';

        $coveragePerUnit = is_array($metaCalc) && isset($metaCalc['coverage_per_unit'])
            ? (float) $metaCalc['coverage_per_unit']
            : ($settings ? (float) $settings->coverage_per_unit : 2.56);

        $waste = is_array($metaCalc) && isset($metaCalc['waste_percentage'])
            ? (float) $metaCalc['waste_percentage']
            : ($settings ? (float) $settings->waste_percentage : 10);

        $unitPrice = (float) $product->price;

        return response()->json([
            'enabled' => true,
            'product' => [
                'id'    => (string) $product->salla_product_id,
                'name'  => (string) $product->name,
                'price' => [
                    'amount'   => $unitPrice,
                    'currency' => 'SAR',
                ],
            ],
            'calculator' => [
                'area_unit' => 'm2',
                'selling_unit' => [
                    'type'             => $unitType,
                    'coverage_per_unit' => $coveragePerUnit,
                    'rounding'          => $unitType === 'box' ? 'ceil' : 'none',
                    'min'               => 1,
                    'step'              => $unitType === 'box' ? 1 : 0.01,
                    'decimals'          => $unitType === 'box' ? 0 : 2,
                ],
                'waste_percentage' => $waste,
            ],
        ]);
    }

    /**
     * تحديث إعدادات منتج واحد (Overrides) عبر API
     * يستخدم لتحديد: نوع الوحدة (box|meter) + تغطية الصندوق + هدر
     */
    public function updateSettings(Request $request)
    {
        $merchant = Auth::user();

        $validated = $request->validate([
            'salla_product_id'   => 'required|string',
            'unit_type'          => 'nullable|in:box,meter',
            'coverage_per_unit'  => 'nullable|numeric|min:0.000001',
            'waste_percentage'   => 'nullable|numeric|min:0|max:100',
        ]);

        $product = Product::where('merchant_id', $merchant->id)
            ->where('salla_product_id', $validated['salla_product_id'])
            ->firstOrFail();

        $metadata = is_array($product->metadata) ? $product->metadata : [];
        $metadata['calculator'] = is_array($metadata['calculator'] ?? null) ? $metadata['calculator'] : [];

        if (array_key_exists('unit_type', $validated) && $validated['unit_type'] !== null) {
            $metadata['calculator']['unit_type'] = $validated['unit_type'];
        }
        if (array_key_exists('coverage_per_unit', $validated) && $validated['coverage_per_unit'] !== null) {
            $metadata['calculator']['coverage_per_unit'] = (float) $validated['coverage_per_unit'];
        }
        if (array_key_exists('waste_percentage', $validated) && $validated['waste_percentage'] !== null) {
            $metadata['calculator']['waste_percentage'] = (float) $validated['waste_percentage'];
        }

        $product->metadata = $metadata;
        $product->save();

        return response()->json([
            'success' => true,
            'message' => 'Calculator settings updated.',
            'calculator' => $metadata['calculator'],
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