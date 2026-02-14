<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\SallaApiService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductListController extends Controller
{
    /**
     * عرض قائمة المنتجات
     */
    public function index(Request $request)
    {
        $merchant = $request->user();

        $products = Product::where('merchant_id', $merchant->id)
            ->with([
                'mainImage',
                'images',
                'batchItems.batch',
                'calculator'
            ])
            ->orderBy('name')
            ->paginate(20)
            ->through(function ($product) {
                return [
                    'id' => $product->id,
                    'salla_product_id' => $product->salla_product_id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'price' => $product->price,
                    'quantity' => $product->quantity,
                    'category' => $product->category,
                    'main_image_url' => $product->main_image_url,
                    'images_count' => $product->images->count(),
                    'status' => $product->status,
                    'has_expiry_data' => $product->has_expiry_data,
                    'overall_status' => $product->overall_status,
                    'batches_count' => $product->batchItems->count(),
                    'has_calculator_enabled' => $product->has_calculator_enabled,
                ];
            });

        return Inertia::render('Inventory/ProductList', [
            'products' => $products,
        ]);
    }

    /**
     * مزامنة المنتجات من سلة
     */
    public function sync(Request $request)
    {
        $merchant = $request->user();

        try {
            $sallaApi = SallaApiService::for($merchant);
            $page = 1;
            $synced = 0;

            do {
                $sallaProducts = $sallaApi->getProducts($page);
                
                foreach ($sallaProducts as $sallaProduct) {
                    // إنشاء/تحديث المنتج
                    $product = Product::updateOrCreate(
                        [
                            'merchant_id' => $merchant->id,
                            'salla_product_id' => $sallaProduct['id'],
                        ],
                        [
                            'name' => $sallaProduct['name'],
                            'sku' => $sallaProduct['sku'] ?? null,
                            'price' => $sallaProduct['price'] ?? 0,
                            'quantity' => $sallaProduct['quantity'] ?? 0,
                            'category' => $sallaProduct['category']['name'] ?? null,
                            'status' => $sallaProduct['status'] ?? 'active',
                            'synced_at' => now(),
                            'metadata' => $sallaProduct,
                        ]
                    );

                    // مزامنة الصور
                    if (!empty($sallaProduct['images'])) {
                        $this->syncProductImages($product, $sallaProduct['images']);
                    }

                    $synced++;
                }

                $page++;
            } while (count($sallaProducts) > 0);

            // مسح الكاش
            Cache::forget("inventory_dashboard_{$merchant->id}");

            return back()->with('success', "تم مزامنة {$synced} منتج بنجاح");

        } catch (\Exception $e) {
            \Log::error('Product sync failed', [
                'merchant_id' => $merchant->id,
                'error' => $e->getMessage(),
            ]);

            return back()->with('error', 'فشلت عملية المزامنة: ' . $e->getMessage());
        }
    }

    /**
     * مزامنة صور المنتج
     */
    protected function syncProductImages(Product $product, array $images): void
    {
        // حذف الصور القديمة
        $product->images()->delete();

        // إضافة الصور الجديدة
        foreach ($images as $index => $imageData) {
            ProductImage::create([
                'product_id' => $product->id,
                'image_url' => $imageData['url'] ?? $imageData,
                'sort_order' => $index,
                'is_main' => $index === 0, // أول صورة هي الرئيسية
                'alt_text' => $product->name,
            ]);
        }
    }
}