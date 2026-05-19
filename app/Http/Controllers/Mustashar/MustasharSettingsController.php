<?php

namespace App\Http\Controllers\Mustashar;

use App\Http\Controllers\Controller;
use App\Models\MustasharSetting;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MustasharSettingsController extends Controller
{
    // ── GET /mustashar/api/calculator-settings ────────────────────────────────
    public function show()
    {
        $merchant = Auth::user();
        $settings = CalculatorSetting::where('merchant_id', $merchant->id)->first();
        
        // جلب الإعدادات الحالية إن وجدت لتعبئة الحقول بها
        $settings = MustasharSetting::where('merchant_id', $merchant->id)->first();

        if (!$settings) {
            return response()->json([
                'configured'      => false,
                'waste'           => null,
            ]);
        }

        return response()->json([
            'configured'      => true,
            'waste'           => (float) $settings->waste_percentage,
        ]);
    }

    // ── POST /mustashar/api/calculator-settings ───────────────────────────────
    public function store(Request $request)
    {
        $merchant = Auth::user();

        $validated = $request->validate([
            'waste_percentage' => 'required|numeric|min:0|max:50',
        ]);

<<<<<<< HEAD:app/Http/Controllers/Calculator/CalculatorSettingsController.php
        CalculatorSetting::updateOrCreate(
            ['merchant_id' => $merchant->id],
=======
        // 2. الحفظ في قاعدة البيانات (Create Or Update)
        // يبحث عن إعدادات هذا التاجر، فإذا وجدها يحدثها، وإذا لم يجدها ينشئ جديدة
        MustasharSetting::updateOrCreate(
            ['merchant_id' => $merchant->id], // شرط البحث
>>>>>>> Fixing_errors:app/Http/Controllers/Mustashar/MustasharSettingsController.php
            [
                'waste_percentage' => $validated['waste_percentage'],
            ]
        );

        return response()->json([
<<<<<<< HEAD:app/Http/Controllers/Calculator/CalculatorSettingsController.php
            'success'    => true,
            'waste'      => (float) $validated['waste_percentage'],
            'configured' => true,
=======
    'success' => true,
    'coverage' => (float) $validated['coverage_per_unit'],
    'waste' => (float) $validated['waste_percentage'],
]);
    }
    /**
 * API عام: يُستدعى من سنيبت سلة
 * يتحقق إذا المنتج مفعّل عليه الحاسبة ويرجع إعداداتها
 */
public function  getSettingsForStore($salla_product_id)
{
    // 1. ابحث عن المنتج بـ salla_product_id
    $product = Product::where('salla_product_id', $salla_product_id)->first();

    if (!$product) {
        return response()->json(['enabled' => false], 404)
            ->header('Access-Control-Allow-Origin', '*');
    }

    // 2. تحقق إذا مفعّل في product_calculator
    $calculator = \App\Models\ProductMustashar::where('product_id', $product->id)
        ->where('is_enabled', 1)
        ->first();

    if (!$calculator) {
        return response()->json(['enabled' => false], 404)
            ->header('Access-Control-Allow-Origin', '*');
    }

    // 3. جلب إعدادات التاجر
    $settings = MustasharSetting::where('merchant_id', $product->merchant_id)->first();

    // 4. Overrides per product (optional) via metadata
    // This allows different products to have different coverage/unit types without schema changes.
    $metaCalc = is_array($product->metadata) ? ($product->metadata['calculator'] ?? null) : null;

    $unitType = is_array($metaCalc) && !empty($metaCalc['unit_type'])
        ? (string) $metaCalc['unit_type']
        : 'box'; // box|meter

    $coveragePerUnit = is_array($metaCalc) && isset($metaCalc['coverage_per_unit'])
        ? (float) $metaCalc['coverage_per_unit']
        : ($settings ? (float) $settings->coverage_per_unit : 2.56);

    $waste = is_array($metaCalc) && isset($metaCalc['waste_percentage'])
        ? (float) $metaCalc['waste_percentage']
        : ($settings ? (float) $settings->waste_percentage : 10);

    // price: use synced Salla product price (amount)
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
            // dimensions → area
            'area_unit' => 'm2',

            // area → selling units
            'selling_unit' => [
                'type'              => $unitType,        // box|meter
                'coverage_per_unit'  => $coveragePerUnit, // m2 per box OR 1 if meter pricing
                'rounding'           => $unitType === 'box' ? 'ceil' : 'none',
                'min'                => 1,
                'step'               => $unitType === 'box' ? 1 : 0.01,
                'decimals'           => $unitType === 'box' ? 0 : 2,
            ],

            // waste handling
            'waste_percentage' => $waste,
        ],
    ])->header('Access-Control-Allow-Origin', '*');
}

public function show()
{
    $merchant = Auth::user();

    // ✅ firstWhere instead of firstOrCreate — never auto-creates a record
    // Returns null if the merchant hasn't configured settings yet
    $settings = MustasharSetting::where('merchant_id', $merchant->id)->first();

    // ✅ Return a flag the frontend can trust — not defaults that look real
    if (!$settings) {
        return response()->json([
            'configured' => false,
            'coverage'   => null,
            'waste'      => null,
>>>>>>> Fixing_errors:app/Http/Controllers/Mustashar/MustasharSettingsController.php
        ]);
    }

    // ── GET /api/calculator/settings/{salla_product_id}  (public — snippet) ──
    public function getSettingsForStore($salla_product_id)
    {
        $product = Product::where('salla_product_id', $salla_product_id)->first();

        if (!$product) {
            return response()->json(['enabled' => false], 404)
                ->header('Access-Control-Allow-Origin', '*');
        }

        $calculator = \App\Models\ProductCalculator::where('product_id', $product->id)
            ->where('is_enabled', 1)
            ->first();

        if (!$calculator) {
            return response()->json(['enabled' => false], 404)
                ->header('Access-Control-Allow-Origin', '*');
        }

        // Validate coverage_per_unit before using it
        $coveragePerUnit = (float) ($calculator->coverage_per_unit ?? 0);
        if ($coveragePerUnit < 0.01 || $coveragePerUnit > 200) {
            return response()->json(['enabled' => false, 'reason' => 'invalid_coverage'], 422)
                ->header('Access-Control-Allow-Origin', '*');
        }

        $settings    = CalculatorSetting::where('merchant_id', $product->merchant_id)->first();
        $wastePct    = (float) ($settings?->waste_percentage ?? 10);
        $unitPrice   = (float) $product->price;

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