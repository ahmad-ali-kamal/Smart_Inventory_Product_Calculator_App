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
    // coverage_type / waste_type = 'global' → inherit from mustashar_settings
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

        $mustashar = $product->mustashar;

        if (!$mustashar || !$mustashar->is_enabled) {
            return response()->json(['enabled' => false]);
        }

        $settings        = MustasharSetting::where('merchant_id', $merchant->id)->first();
        $coveragePerUnit = $this->resolveCoverage($mustashar, $settings);
        $waste           = $this->resolveWaste($mustashar, $settings);

        return response()->json([
            'enabled' => true,
            'product' => [
                'id'    => (string) $product->salla_product_id,
                'name'  => (string) $product->name,
                'price' => ['amount' => (float) $product->price, 'currency' => 'SAR'],
            ],
            'mustashar' => [
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
            ->with(['mustashar', 'mainImage'])
            ->orderBy('name')
            ->get()
            ->map(function ($product) use ($settings) {
                $mustashar = $product->mustashar;

                return [
                    'id'               => $product->id,
                    'salla_product_id' => $product->salla_product_id,
                    'name'             => $product->name,
                    'sku'              => $product->sku,
                    'price'            => (float) $product->price,
                    'quantity'         => $product->quantity,
                    'category'         => $product->category ?? 'Uncategorized',
                    'image'            => $product->image_url,
                    'active'           => (bool) optional($mustashar)->is_enabled,

                    'coverage_per_unit' => $this->resolveCoverage($mustashar, $settings),
                    'coverage_source'   => $this->coverageSource($mustashar, $settings),
                    'coverage_type'     => $mustashar?->coverage_type ?? 'global',

                    'waste_percentage'  => $this->resolveWaste($mustashar, $settings),
                    'waste_source'      => $this->wasteSource($mustashar, $settings),
                    'waste_type'        => $mustashar?->waste_type ?? 'global',
                ];
            });

        return response()->json(['data' => $products]);
    }

    public function toggle(Request $request, $id)
    {
        $merchant = Auth::user();

        try {
            $product    = Product::where('id', $id)->where('merchant_id', $merchant->id)->firstOrFail();
            $mustashar = ProductMustashar::firstOrCreate(['product_id' => $product->id]);

            $newState = $request->has('is_enabled')
                ? filter_var($request->is_enabled, FILTER_VALIDATE_BOOLEAN)
                : !$mustashar->is_enabled;

            $mustashar->is_enabled = $newState;
            $mustashar->save();

            if ($request->ajax() || $request->wantsJson()) {
                return response()->json([
                    'success'    => true,
                    'is_enabled' => (bool) $mustashar->is_enabled,
                    'message'    => $mustashar->is_enabled ? 'Qiasat activated' : 'Qiasat disabled',
                ]);
            }

            return back()->with('success', 'Status updated successfully');

        } catch (\Exception $e) {
            Log::error("Toggle Error for Product ID {$id}: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'حدث خطأ أثناء تحديث الحالة'], 500);
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

        $product  = Product::where('id', $id)->where('merchant_id', $merchant->id)->firstOrFail();
        $mustashar = ProductMustashar::firstOrCreate(['product_id' => $product->id]);

        if (!empty($validated['coverage_per_unit'])) {
            $mustashar->coverage_type     = 'custom';
            $mustashar->coverage_per_unit = (float) $validated['coverage_per_unit'];
        } else {
            $mustashar->coverage_type     = 'global';
            $mustashar->coverage_per_unit = null;
        }

        $mustashar->save();

        $settings = MustasharSetting::where('merchant_id', $merchant->id)->first();

        return response()->json([
            'success'           => true,
            'coverage_per_unit' => $this->resolveCoverage($mustashar, $settings),
            'coverage_source'   => $this->coverageSource($mustashar, $settings),
            'coverage_type'     => $mustashar->coverage_type,
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

        $product   = Product::where('id', $id)->where('merchant_id', $merchant->id)->firstOrFail();
        $mustashar = ProductMustashar::firstOrCreate(['product_id' => $product->id]);

        if (isset($validated['waste_percentage']) && $validated['waste_percentage'] !== null) {
            $mustashar->waste_type       = 'custom';
            $mustashar->waste_percentage = (float) $validated['waste_percentage'];
        } else {
            $mustashar->waste_type       = 'global';
            $mustashar->waste_percentage = null;
        }

        $mustashar->save();

        $settings    = MustasharSetting::where('merchant_id', $merchant->id)->first();
        $wasteSource = $this->wasteSource($mustashar, $settings);

        return response()->json([
            'success'          => true,
            'waste_percentage' => $this->resolveWaste($mustashar, $settings),
            'waste_source'     => $wasteSource,
            'waste_type'       => $mustashar->waste_type,
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