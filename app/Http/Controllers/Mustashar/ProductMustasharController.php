<?php

namespace App\Http\Controllers\Mustashar;

use App\Http\Controllers\Controller;
use App\Models\MustasharSetting;
use App\Models\Product;
use App\Models\ProductMustashar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ProductMustasharController extends Controller
{
    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers — resolution using explicit type flags
    //
    // coverage_type / waste_type = 'custom' → use product's own value
    // coverage_type / waste_type = 'global' → inherit from calculator_settings
    // ─────────────────────────────────────────────────────────────────────────

    private function resolveCoverage(?ProductMustashar $calc, ?MustasharSetting $settings): ?float
    {
        if ($calc?->coverage_type === 'custom' && !empty($calc->coverage_per_unit)) {
            return (float) $calc->coverage_per_unit;
        }

        if ($settings && !empty($settings->coverage_per_unit)) {
            return (float) $settings->coverage_per_unit;
        }

        return null;
    }

    /** @return 'product'|'global'|'none' */
    private function coverageSource(?ProductMustashar $calc, ?MustasharSetting $settings): string
    {
        if ($calc?->coverage_type === 'custom' && !empty($calc->coverage_per_unit)) return 'product';
        if ($settings && !empty($settings->coverage_per_unit))                       return 'global';
        return 'none';
    }

    private function resolveWaste(?ProductMustashar $calc, ?MustasharSetting $settings): ?float
    {
        if ($calc?->waste_type === 'custom' && $calc->waste_percentage !== null) {
            return (float) $calc->waste_percentage;
        }

        if ($settings && $settings->waste_percentage !== null) {
            return (float) $settings->waste_percentage;
        }

        return null; // nothing configured anywhere
    }

    /** @return 'product'|'global'|'default' */
    private function wasteSource(?ProductMustashar $calc, ?MustasharSetting $settings): string
    {
        if ($calc?->waste_type === 'custom' && $calc->waste_percentage !== null) return 'product';
        if ($settings && $settings->waste_percentage !== null)                    return 'global';
        return 'default';
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────

    public function getSettings($product_id)
    {
        $merchant = Auth::user();

        $product = Product::where('merchant_id', $merchant->id)
            ->where('salla_product_id', (string) $product_id)
            ->first();

        if (!$product) {
            return response()->json(['enabled' => false, 'message' => 'Product not found']);
        }

        $calculator = $product->calculator;

        if (!$calculator || !$calculator->is_enabled) {
            return response()->json(['enabled' => false]);
        }

        $settings        = MustasharSetting::where('merchant_id', $merchant->id)->first();
        $coveragePerUnit = $this->resolveCoverage($calculator, $settings);
        $waste           = $this->resolveWaste($calculator, $settings);

        return response()->json([
            'enabled' => true,
            'product' => [
                'id'    => (string) $product->salla_product_id,
                'name'  => (string) $product->name,
                'price' => ['amount' => (float) $product->price, 'currency' => 'SAR'],
            ],
            'calculator' => [
                'area_unit'    => 'm2',
                'selling_unit' => [
                    'type'              => 'box',
                    'coverage_per_unit' => $coveragePerUnit,
                    'rounding'          => 'ceil',
                    'min'               => 1,
                    'step'              => 1,
                    'decimals'          => 0,
                ],
                'waste_percentage' => $waste,
            ],
        ]);
    }

    public function index(Request $request)
    {
        $merchant = Auth::user();
        $settings = MustasharSetting::where('merchant_id', $merchant->id)->first();

        $products = Product::where('merchant_id', $merchant->id)
            ->with(['calculator', 'mainImage'])
            ->orderBy('name')
            ->get()
            ->map(function ($product) use ($settings) {
                $calc = $product->calculator;

                return [
                    'id'               => $product->id,
                    'salla_product_id' => $product->salla_product_id,
                    'name'             => $product->name,
                    'sku'              => $product->sku,
                    'price'            => (float) $product->price,
                    'quantity'         => $product->quantity,
                    'category'         => $product->category ?? 'Uncategorized',
                    'image'            => $product->image_url,
                    'active'           => (bool) optional($calc)->is_enabled,

                    'coverage_per_unit' => $this->resolveCoverage($calc, $settings),
                    'coverage_source'   => $this->coverageSource($calc, $settings),
                    'coverage_type'     => $calc?->coverage_type ?? 'global',

                    'waste_percentage'  => $this->resolveWaste($calc, $settings),
                    'waste_source'      => $this->wasteSource($calc, $settings),
                    'waste_type'        => $calc?->waste_type ?? 'global',
                ];
            });

        return response()->json(['data' => $products]);
    }

    public function toggle(Request $request, $id)
    {
        $merchant = Auth::user();

        try {
            $product    = Product::where('id', $id)->where('merchant_id', $merchant->id)->firstOrFail();
            $calculator = ProductMustashar::firstOrCreate(['product_id' => $product->id]);

            $newState = $request->has('is_enabled')
                ? filter_var($request->is_enabled, FILTER_VALIDATE_BOOLEAN)
                : !$calculator->is_enabled;

            $calculator->is_enabled = $newState;
            $calculator->save();

            if ($request->ajax() || $request->wantsJson()) {
                return response()->json([
                    'success'    => true,
                    'is_enabled' => (bool) $calculator->is_enabled,
                    'message'    => $calculator->is_enabled ? 'Al-Mustashar activated' : 'Al-Mustashar disabled',
                ]);
            }

            return back()->with('success', 'Status updated successfully');

        } catch (\Exception $e) {
            Log::error("Toggle Error for Product ID {$id}: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    /**
     * تحديث Coverage لمنتج — يضبط coverage_type='custom' ويحفظ القيمة.
     * إرسال null يعيد المنتج لـ coverage_type='global'.
     */
    public function updateCoverage(Request $request, $id)
    {
        $merchant = Auth::user();

        $validated = $request->validate([
            'coverage_per_unit' => 'nullable|numeric|min:0.01|max:200',
        ]);

        $product    = Product::where('id', $id)->where('merchant_id', $merchant->id)->firstOrFail();
        $calculator = ProductMustashar::firstOrCreate(['product_id' => $product->id]);

        if (!empty($validated['coverage_per_unit'])) {
            $calculator->coverage_type     = 'custom';
            $calculator->coverage_per_unit = (float) $validated['coverage_per_unit'];
        } else {
            // null = العودة للعام
            $calculator->coverage_type     = 'global';
            $calculator->coverage_per_unit = null;
        }

        $calculator->save();

        $settings = MustasharSetting::where('merchant_id', $merchant->id)->first();

        return response()->json([
            'success'           => true,
            'coverage_per_unit' => $this->resolveCoverage($calculator, $settings),
            'coverage_source'   => $this->coverageSource($calculator, $settings),
            'coverage_type'     => $calculator->coverage_type,
        ]);
    }

    /**
     * تحديث Waste لمنتج — يضبط waste_type='custom' ويحفظ القيمة.
     * إرسال null يعيد المنتج لـ waste_type='global'.
     */
    public function updateWaste(Request $request, $id)
    {
        $merchant = Auth::user();

        $validated = $request->validate([
            'waste_percentage' => 'nullable|numeric|min:0|max:50',
        ]);

        $product    = Product::where('id', $id)->where('merchant_id', $merchant->id)->firstOrFail();
        $calculator = ProductMustashar::firstOrCreate(['product_id' => $product->id]);

        if (isset($validated['waste_percentage']) && $validated['waste_percentage'] !== null) {
            $calculator->waste_type       = 'custom';
            $calculator->waste_percentage = (float) $validated['waste_percentage'];
        } else {
            $calculator->waste_type       = 'global';
            $calculator->waste_percentage = null;
        }

        $calculator->save();

        $settings    = MustasharSetting::where('merchant_id', $merchant->id)->first();
        $wasteSource = $this->wasteSource($calculator, $settings);

        return response()->json([
            'success'          => true,
            'waste_percentage' => $this->resolveWaste($calculator, $settings),
            'waste_source'     => $wasteSource,
            'waste_type'       => $calculator->waste_type,
        ]);
    }

    public function bulkEnable(Request $request)
    {
        $merchant  = Auth::user();
        $validated = $request->validate([
            'product_ids'   => 'required|array',
            'product_ids.*' => 'exists:products,id',
        ]);

        $products = Product::where('merchant_id', $merchant->id)
                           ->whereIn('id', $validated['product_ids'])
                           ->get();

        foreach ($products as $product) {
            ProductMustashar::updateOrCreate(
                ['product_id' => $product->id],
                ['is_enabled' => true]
            );
        }

        if ($request->ajax() || $request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Activated for ' . $products->count() . ' products successfully.',
            ]);
        }

        return back()->with('success', 'Selected products activated.');
    }
}