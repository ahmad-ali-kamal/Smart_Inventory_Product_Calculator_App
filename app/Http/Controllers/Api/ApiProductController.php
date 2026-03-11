<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\SallaApiService;
use Illuminate\Http\Request;

class ProductController extends Controller
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
}