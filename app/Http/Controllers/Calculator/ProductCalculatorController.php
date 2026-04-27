<?php

namespace App\Http\Controllers\Calculator;

use App\Http\Controllers\Controller;
use App\Models\CalculatorSetting;
use App\Models\Product;
use App\Models\ProductCalculator;
use App\Jobs\FetchProductsJob;
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

        $product = Product::where('merchant_id', $merchant->id)
            ->where('salla_product_id', (string) $product_id)
            ->first();

        if (!$product) {
            return response()->json([
                'enabled' => false,
                'success' => false,
                'message' => "We couldn't find this product in your store. Please refresh and try again.",
            ], 404);
        }

        $calculator = $product->calculator;

        if (!$calculator || !$calculator->is_enabled) {
            return response()->json(['enabled' => false]);
        }

        $settings = CalculatorSetting::where('merchant_id', $merchant->id)->first();

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
                    'type'              => $unitType,
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
            'message' => 'Calculator settings saved successfully.',
            'calculator' => $metadata['calculator'],
        ]);
    }

    /**
     * عرض قائمة المنتجات في لوحة تحكم المستشار
     */
    public function index(Request $request)
    {
        $merchant = Auth::user();

        $query = Product::where('merchant_id', $merchant->id)
                        ->with(['calculator']);

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // Server-side filter by activation status
        if ($request->filled('filter')) {
            if ($request->filter === 'active') {
                $query->whereHas('calculator', fn($q) => $q->where('is_enabled', true));
            } elseif ($request->filter === 'inactive') {
                $query->where(function ($q) {
                    $q->whereDoesntHave('calculator')
                      ->orWhereHas('calculator', fn($inner) => $inner->where('is_enabled', false));
                });
            }
        }

        $products = $query->orderBy('name')->paginate(20)->withQueryString();

        return view('calculator.products', compact('products'));
    }

    /**
     * مزامنة المنتجات من سلة — يُطلق FetchProductsJob في الخلفية
     */
    public function sync(Request $request)
    {
        $merchant = Auth::user();

        try {
            FetchProductsJob::dispatch($merchant);

            if ($request->ajax() || $request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Sync started. Products will appear shortly.',
                ]);
            }

            return back()->with('success', 'Sync started. Products will appear shortly.');

        } catch (\Exception $e) {
            Log::error('Calculator sync failed for merchant ' . $merchant->id . ': ' . $e->getMessage());

            if ($request->ajax() || $request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => "We're having trouble syncing. Please try again shortly.",
                ], 500);
            }

            return back()->with('error', 'Sync failed. Please try again.');
        }
    }

    /**
     * تفعيل/إيقاف الآلة الحاسبة (Toggle)
     */
    public function toggle(Request $request, $id)
    {
        $merchant = Auth::user();

        try {
            $product = Product::where('id', $id)
                              ->where('merchant_id', $merchant->id)
                              ->firstOrFail();

            $calculator = ProductCalculator::firstOrCreate(['product_id' => $product->id]);

            if ($request->has('is_enabled')) {
                $newState = filter_var($request->is_enabled, FILTER_VALIDATE_BOOLEAN);
            } else {
                $newState = !$calculator->is_enabled;
            }

            $calculator->is_enabled = $newState;
            $calculator->save();

            if ($request->ajax() || $request->wantsJson()) {
                return response()->json([
                    'success'    => true,
                    'is_enabled' => (bool) $calculator->is_enabled,
                    'message'    => $calculator->is_enabled
                        ? 'Calculator enabled for this product.'
                        : 'Calculator disabled for this product.',
                ]);
            }

            return back()->with('success', 'Product settings updated.');

        } catch (\Exception $e) {
            Log::error("Toggle Error for Product ID {$id}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => "We're having trouble saving your changes. Please try again shortly.",
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
            'product_ids'   => 'required|array',
            'product_ids.*' => 'exists:products,id',
        ]);

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
                'message' => 'Calculator enabled for ' . $products->count() . ' product(s).',
            ]);
        }

        return back()->with('success', 'Selected products updated.');
    }
}
