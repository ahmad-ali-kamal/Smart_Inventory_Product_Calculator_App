<?php

namespace App\Http\Controllers\Calculator;

use App\Http\Controllers\Controller;
use App\Models\CalculatorSetting;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CalculatorSettingsController extends Controller
{
    /**
     * عرض صفحة الإعدادات
     */
    public function index()
    {
        $merchant = Auth::user();
        
        // جلب الإعدادات الحالية إن وجدت لتعبئة الحقول بها
        $settings = CalculatorSetting::where('merchant_id', $merchant->id)->first();

        return view('calculator.settings', [
            'settings' => $settings,
        ]);
    }

    /**
     * حفظ أو تحديث الإعدادات (POST)
     */
    public function store(Request $request)
    {
        $merchant = Auth::user();

        // 1. التحقق من صحة البيانات
        $validated = $request->validate([
            'coverage_per_unit' => 'required|numeric|min:0.01', // التغطية (متر مربع للكرتون)
            'waste_percentage'  => 'required|numeric|min:0|max:50', // نسبة الهدر %
        ], [
            'coverage_per_unit.required' => 'حقل التغطية (Coverage) مطلوب.',
            'coverage_per_unit.numeric'  => 'يجب أن تكون التغطية رقماً.',
            'coverage_per_unit.min'      => 'يجب أن تكون قيمة التغطية أكبر من 0.',
            'waste_percentage.required'  => 'حقل نسبة الهدر مطلوب.',
            'waste_percentage.numeric'   => 'نسبة الهدر يجب أن تكون رقماً.',
            'waste_percentage.min'       => 'نسبة الهدر لا يمكن أن تكون سالبة.',
            'waste_percentage.max'       => 'نسبة الهدر لا يمكن أن تتجاوز %50',
        ]);

        // 2. الحفظ في قاعدة البيانات (Create Or Update)
        // يبحث عن إعدادات هذا التاجر، فإذا وجدها يحدثها، وإذا لم يجدها ينشئ جديدة
        CalculatorSetting::updateOrCreate(
            ['merchant_id' => $merchant->id], // شرط البحث
            [
                'coverage_per_unit' => $validated['coverage_per_unit'],
                'waste_percentage'  => $validated['waste_percentage'],
            ] // القيم الجديدة
        );

        // 3. التوجيه لصفحة الداشبورد
        // لأن المستخدم عادة يضبط الإعدادات ثم يريد استخدام الحاسبة
        return response()->json([
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
    $calculator = \App\Models\ProductCalculator::where('product_id', $product->id)
        ->where('is_enabled', 1)
        ->first();

    if (!$calculator) {
        return response()->json(['enabled' => false], 404)
            ->header('Access-Control-Allow-Origin', '*');
    }

    // 3. جلب إعدادات التاجر
    $settings = CalculatorSetting::where('merchant_id', $product->merchant_id)->first();

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

    $settings = CalculatorSetting::firstOrCreate(
        ['merchant_id' => $merchant->id],
        [
            'coverage_per_unit' => 8,
            'waste_percentage' => 10,
        ]
    );

    return response()->json([
        'coverage' => (float) $settings->coverage_per_unit,
        'waste' => (float) $settings->waste_percentage,
    ]);
}
}