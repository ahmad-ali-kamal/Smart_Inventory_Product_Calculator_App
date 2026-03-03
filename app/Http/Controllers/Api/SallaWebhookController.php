<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Merchant;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SallaWebhookController extends Controller
{
    /**
     * النقطة العمياء لاستقبال جميع تنبيهات سلة
     */
    public function handle(Request $request)
    {
        $event = $request->header('Salla-Event'); // نوع الحدث (مثلاً product.updated)
        $payload = $request->all();
        $merchantId = $payload['merchant'] ?? null;

        if (!$merchantId) {
            return response()->json(['message' => 'Merchant ID missing'], 400);
        }

        // البحث عن التاجر في قاعدتنا
        $merchant = Merchant::where('salla_merchant_id', $merchantId)->first();
        if (!$merchant) {
            return response()->json(['message' => 'Merchant not found'], 404);
        }

        Log::info("Webhook Received: {$event} for Merchant: {$merchant->name}");

        try {
            switch ($event) {
                case 'product.created':
                case 'product.updated':
                    $this->upsertProduct($merchant, $payload['data']);
                    break;

                case 'product.deleted':
                    $this->deleteProduct($merchant, $payload['data']['id']);
                    break;

                // يمكنك إضافة حالات أخرى مثل order.created لاحقاً
            }

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error("Webhook Error: " . $e->getMessage());
            return response()->json(['error' => 'Internal Server Error'], 500);
        }
    }

    /**
     * تحديث أو إنشاء المنتج بناءً على بيانات الويب هوك
     */
    private function upsertProduct(Merchant $merchant, array $p)
    {
        // استخراج التصنيف الرئيسي
        $categoryName = 'General';
        if (!empty($p['categories'])) {
            $mainCat = collect($p['categories'])->firstWhere('main', true) ?? $p['categories'][0];
            $categoryName = $mainCat['name'] ?? 'General';
        }

        // تحديث المنتج
        $product = Product::updateOrCreate(
            ['merchant_id' => $merchant->id, 'salla_product_id' => $p['id']],
            [
                'name'      => $p['name'],
                'price'     => $p['price']['amount'] ?? 0,
                'sku'       => $p['sku'] ?? null,
                'category'  => $categoryName,
                'status'    => $p['status'] ?? 'active',
                'quantity'  => $p['quantity'] ?? 0,
                'synced_at' => now(),
            ]
        );

        // تحديث الصور
        if (!empty($p['images'])) {
            // نمسح الصور القديمة للمنتج لنضيف الجديدة (لتجنب التكرار)
            $product->images()->delete(); 
            
            foreach ($p['images'] as $index => $imgData) {
                ProductImage::create([
                    'product_id' => $product->id,
                    'image_url'  => $imgData['url'],
                    'is_main'    => $imgData['main'] ?? false,
                    'sort_order' => $imgData['sort'] ?? $index,
                ]);
            }
        }
    }

    /**
     * حذف المنتج من النظام عند حذفه من سلة
     */
    private function deleteProduct(Merchant $merchant, $sallaProductId)
    {
        Product::where('merchant_id', $merchant->id)
               ->where('salla_product_id', $sallaProductId)
               ->delete();
        
        Log::info("Product Deleted: {$sallaProductId}");
    }
}