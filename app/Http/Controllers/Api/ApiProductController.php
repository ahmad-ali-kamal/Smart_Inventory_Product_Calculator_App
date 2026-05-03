<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\BatchItem;
use App\Models\Batch;
use App\Models\Product;
use Illuminate\Support\Str;
use App\Services\SallaApiService;
use Illuminate\Http\Request;

class ApiProductController extends Controller
{
    /**
     * عرض جميع المنتجات من قاعدة البيانات
     */
    public function index(Request $request)
    {
        $merchant = $request->user();

        $products = Product::forMerchant($merchant->id)
            ->with(['mainImage'])
            ->when($request->category, fn($q) => $q->where('category', $request->category))
            ->when($request->status,   fn($q) => $q->where('status', $request->status))
            ->when($request->search,   fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->orderBy('name')
            ->paginate(20);

        return ProductResource::collection($products);
    }

    /**
     * عرض منتج واحد
     */
    public function show(Request $request, Product $product)
    {
        // التحقق من أن المنتج يتبع للتاجر
        if ($product->merchant_id !== $request->user()->id) {
            return response()->json(['message' => 'غير مصرح'], 403);
        }

        return new ProductResource($product->load(['images', 'batchItems.batch']));
    }

    /**
     * List Variants for a Product
     */
    public function variants(Request $request, $product_id)
    {
        $merchant = $request->user();
        $product = Product::where('merchant_id', $merchant->id)
            ->where('id', $product_id)
            ->firstOrFail();

        $variants = $product->batchItems()->with('batch')->get()->map(function ($bi) use ($product) {
            $price = $product->price ?? 0;
            return [
                'id' => $bi->id,
                'price' => ['amount' => (float) $price, 'currency' => 'SAR'],
                'regular_price' => ['amount' => 0, 'currency' => 'SAR'],
                'sale_price' => ['amount' => 0, 'currency' => 'SAR'],
                'stock_quantity' => (int) $bi->quantity,
                'barcode' => $bi->batch?->batch_code ?? '',
                'sku' => $bi->batch?->batch_code ?? $product->sku,
                'related_option_values' => [],
                'weight' => 0,
                'weight_type' => '',
                'weight_label' => '',
            ];
        })->values();

        $pagination = [
            'count' => $variants->count(),
            'total' => $variants->count(),
            'perPage' => 60,
            'currentPage' => 1,
            'totalPages' => 1,
            'links' => [],
        ];

        return response()->json([
            'status' => 200,
            'success' => true,
            'data' => $variants,
            'pagination' => $pagination,
        ]);
    }

    /**
     * Update a Product Variant
     */
    public function updateVariant(Request $request, $variant)
    {
        $merchant = $request->user();
        $variantItem = BatchItem::findOrFail($variant);
        $product = $variantItem->product;
        if ($product->merchant_id !== $merchant->id) {
            return response()->json(['success' => false, 'error' => 'Unauthorized'], 403);
        }

        $payload = $request->only(['sku','barcode','price','sale_price','cost_price','stock_quantity','weight','weight_type','mpn','gtin','quantities']);

        // Update product basic fields if provided
        if (!empty($payload['sku'])) {
            $product->sku = $payload['sku'];
            $product->save();
        }
        if (!empty($payload['price']) && is_array($payload['price']) && isset($payload['price']['amount'])) {
            $product->price = $payload['price']['amount'];
            $product->save();
        }
        // Update variant stock for this batch item
        if (isset($payload['stock_quantity'])) {
            $variantItem->quantity = (int) $payload['stock_quantity'];
            $variantItem->save();
        }

        // Multi-branch quantities (optional)
        if (isset($payload['quantities']) && is_array($payload['quantities'])) {
            foreach ($payload['quantities'] as $q) {
                $branch = $q['branch'] ?? null;
                $qty = $q['quantity'] ?? null;
                if (!$branch || $qty === null) continue;
                $bi = BatchItem::where('batch_id', $branch)
                    ->where('product_id', $product->id)
                    ->first();
                if ($bi) {
                    $bi->quantity = (int) $qty;
                    $bi->save();
                }
            }
        }

        $updated = $variantItem->load('batch')->toArray();
        return response()->json(['success' => true, 'data' => $updated]);
    }

    /**
     * مزامنة المنتجات من سلة يدوياً
     */
    public function sync(Request $request)
    {
        $merchant = $request->user();

        try {
            $service = SallaApiService::for($merchant);
            $result = $service->syncProducts();

            return response()->json([
                'success' => true,
                'message' => "تمت المزامنة بنجاح",
                'synced'  => $result['synced'],
                'errors'  => $result['errors'],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشلت المزامنة: ' . $e->getMessage(),
            ], 500);
        }
    }


    /** Create a new Variant for a Product (Scenario 1) */
    public function createVariant(Request $request, $product_id)
    {
        $merchant = $request->user();
        $product = Product::where('merchant_id', $merchant->id)->where('id', $product_id)->firstOrFail();

        $expiryDate = $request->input('expiry_date');
        $qty = (int) ($request->input('stock_quantity') ?? 0);

        $batch = Batch::create([
            'merchant_id' => $merchant->id,
            'batch_code' => 'B-'.Str::random(6),
            'name' => 'Generated Batch',
            'status' => 'green',
            'days_until_expiry' => 30,
            'expiry_date' => $expiryDate ? \Carbon\Carbon::parse($expiryDate) : null,
        ]);

        $bi = BatchItem::create(['batch_id'=>$batch->id, 'product_id'=>$product->id, 'quantity'=>$qty]);

        return response()->json(['success'=>true,'variant'=>[ 'id'=>$bi->id, 'batch_id'=>$batch->id, 'quantity'=>$bi->quantity]]);
    }
}
