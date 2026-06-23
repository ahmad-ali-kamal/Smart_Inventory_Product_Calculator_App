<?php

namespace App\Http\Controllers\Mustashar;

use App\Http\Controllers\Controller;
use App\Models\MustasharSetting;
use App\Models\Product;
use App\Models\ProductMustashar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MustasharSettingsController extends Controller
{
    // ── GET /mustashar/api/mustashar-settings ────────────────────────────────
    public function show()
    {
        $merchant = Auth::user();
        $settings = MustasharSetting::where('merchant_id', $merchant->id)->first();

        if (!$settings) {
            return response()->json([
                'configured' => false,
                'coverage'   => null,
                'waste'      => null,
            ]);
        }

        return response()->json([
            'configured' => true,
            'coverage'   => $settings->coverage_per_unit !== null
                                ? (float) $settings->coverage_per_unit
                                : null,
            'waste'      => (float) $settings->waste_percentage,
        ]);
    }

    // ── POST /mustashar/api/mustashar-settings ───────────────────────────────
    public function store(Request $request)
    {
        $merchant = Auth::user();

        $validated = $request->validate([
            'waste_percentage'  => 'required|numeric|min:0|max:100',
            'coverage_per_unit' => 'required|numeric|min:0.01',
        ]);

        MustasharSetting::updateOrCreate(
            ['merchant_id' => $merchant->id],
            [
                'waste_percentage'  => $validated['waste_percentage'],
                'coverage_per_unit' => $validated['coverage_per_unit'],
            ]
        );

        return response()->json([
            'success'    => true,
            'coverage'   => (float) $validated['coverage_per_unit'],
            'waste'      => (float) $validated['waste_percentage'],
            'configured' => true,
        ]);
    }

    // ── GET /api/mustashar/settings/{salla_product_id}  (public — snippet) ──
    public function getSettingsForStore($salla_product_id)
    {
        $product = Product::where('salla_product_id', $salla_product_id)->first();

        if (!$product) {
            return response()->json(['enabled' => false], 404)
                ->header('Access-Control-Allow-Origin', '*');
        }

        $mustashar = ProductMustashar::where('product_id', $product->id)
            ->where('is_enabled', 1)
            ->first();

        if (!$mustashar) {
            return response()->json(['enabled' => false], 404)
                ->header('Access-Control-Allow-Origin', '*');
        }

        $settings = MustasharSetting::where('merchant_id', $product->merchant_id)->first();

        // ── Coverage resolution (type flag + fallback) ────────────────────────
        $coveragePerUnit = null;

        if ($mustashar->coverage_type === 'custom' && !empty($mustashar->coverage_per_unit)) {
            $coveragePerUnit = (float) $mustashar->coverage_per_unit;
        } elseif ($settings && !empty($settings->coverage_per_unit)) {
            $coveragePerUnit = (float) $settings->coverage_per_unit;
        }

        // Guard: widget must not render without a valid coverage value
        if ($coveragePerUnit === null || $coveragePerUnit < 0.01) {
            return response()->json(['enabled' => false, 'reason' => 'coverage_not_configured'], 422)
                ->header('Access-Control-Allow-Origin', '*');
        }

        // ── Waste resolution (type flag + fallback) ───────────────────────────
        $wastePct = ($mustashar->waste_type === 'custom' && $mustashar->waste_percentage !== null)
            ? (float) $mustashar->waste_percentage
            : ($settings?->waste_percentage !== null ? (float) $settings->waste_percentage : null);

        // Guard: widget must not render without a valid waste value
        if ($wastePct === null) {
            return response()->json(['enabled' => false, 'reason' => 'waste_not_configured'], 422)
                ->header('Access-Control-Allow-Origin', '*');
        }

        $unitPrice = (float) $product->price;

        return response()->json([
            'enabled'           => true,
            'coverage_per_unit' => $coveragePerUnit,
            'waste_percentage'  => $wastePct,
            'unit_type'         => 'box',
            'product'           => [
                'id'    => (string) $product->salla_product_id,
                'name'  => (string) $product->name,
                'price' => [
                    'amount'   => $unitPrice,
                    'currency' => 'SAR',
                ],
            ],
        ])->header('Access-Control-Allow-Origin', '*');
    }
}