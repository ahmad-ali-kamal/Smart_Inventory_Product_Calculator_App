<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Merchant;
use App\Models\Product;
use Illuminate\Support\Facades\Log;

class SallaWebhookController extends Controller
{
    /**
     * استقبال ومعالجة تنبيهات سلة
     */
    public function handle(Request $request)
    {
        $event = $request->header('x-salla-event') ?? $request->header('Salla-Event') ?? $request->json('event');
        $token = $request->header('Authorization'); 
        $merchantId = $request->json('merchant');
        $payload = $request->json('data');

        Log::info("--- Quantix Webhook Received --- Event: {$event}");

        // البحث عن التاجر
        $merchant = Merchant::where('salla_merchant_id', $merchantId)->first();
        if (!$merchant) {
            Log::error("Merchant {$merchantId} not found in Quantix.");
            return response()->json(['message' => 'Merchant not found'], 404);
        }

        // التحقق من التوكن
        if (!$this->isTokenValid($token)) {
            Log::error("Invalid Webhook Token for Merchant {$merchantId}");
            return response()->json(['message' => 'Unauthorized Token'], 401);
        }

        // توجيه الأحداث
        switch ($event) {
            case 'product.created':
            case 'product.updated':
            case 'product.status.updated': 
            case 'product.available':      
                $this->syncWebhookProduct($merchant, $payload);
                break;

            case 'order.created':
                $this->handleOrderCreated($merchant, $payload);
                break;
                
            default:
                Log::info("Event {$event} ignored.");
                break;
        }

        return response()->json(['success' => true]);
    }

    /**
     * التحقق من التوكن بناءً على الإعدادات
     */
    private function isTokenValid($token)
    {
        $cleanToken = str_replace('Bearer ', '', $token);
        return ($cleanToken === env('SALLA_MANAGEMENT_WEBHOOK_SECRET') || $cleanToken === env('SALLA_CALCULATOR_WEBHOOK_SECRET'));
    }

    /**
     * المزامنة الجراحية للمنتج (تمنع "بدون اسم" وتحمي حالة sale)
     */
    private function syncWebhookProduct($merchant, $p)
    {
        $product = Product::firstOrNew(['merchant_id' => $merchant->id, 'salla_product_id' => $p['id']]);

        // 1. تحديث جراحي للبيانات الأساسية فقط إذا كانت موجودة
        if (isset($p['name']) && !empty($p['name'])) {
            $product->name = $p['name'];
        }

        if (isset($p['price']['amount'])) {
            $product->price = $p['price']['amount'];
        }

        if (isset($p['quantity'])) {
            $product->quantity = $p['quantity'];
        }

        // 2. --- [ درع الحماية ضد حلقة الإخفاء ] ---
        if (isset($p['status'])) {
            // فحص الدفعات بناءً على التاريخ
            $hasValidBatches = $product->batchItems()->whereHas('batch', function ($query) {
                $query->where('expiry_date', '>=', now()->format('Y-m-d'));
            })->exists();

            // إذا سلة حاولت تخفيه (hidden) وعندنا دفعات صالحة -> نجبرها ترجع sale
            if ($hasValidBatches && $p['status'] === 'hidden') {
                Log::info("Shield Active: Ignoring 'hidden' for product {$p['id']} due to valid local batches.");
                $product->status = 'sale'; 
            } else {
                $product->status = $p['status'];
            }
        }

        // تحديث التصنيف
        if (!empty($p['categories'])) {
            $mainCat = collect($p['categories'])->firstWhere('main', true) ?? $p['categories'][0];
            $product->category = $mainCat['name'] ?? 'General';
        }

        $product->synced_at = now();
        $product->save();
        
        Log::info("Product {$p['id']} update finished. Status: {$product->status}");
    }

    /**
     * خصم الكمية عند الطلب
     */
    private function handleOrderCreated($merchant, $order)
    {
        if (!isset($order['items'])) return;

        foreach ($order['items'] as $item) {
            $product = Product::where('merchant_id', $merchant->id)
                             ->where('salla_product_id', $item['product']['id'])
                             ->first();

            if ($product) {
                $soldQty = $item['quantity'] ?? 0;
                $product->quantity = max(0, $product->quantity - $soldQty);
                $product->save();
                Log::info("Order Sale: Product {$product->id} quantity reduced by {$soldQty}.");
            }
        }
    }
}