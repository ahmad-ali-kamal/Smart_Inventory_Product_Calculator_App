<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Merchant;
use App\Models\Product;
use Illuminate\Support\Facades\Log;

class SallaWebhookController extends Controller
{
    public function handle(Request $request)
    {
        // 1. قراءة البيانات (الحدث، التوكن، معرف التاجر، والبيانات)
        $event = $request->header('x-salla-event') ?? $request->json('event');
        $token = $request->header('Authorization'); 
        $merchantId = $request->json('merchant');
        $payload = $request->json('data');

        Log::info("--- Quantix Webhook Received ---");
        Log::info("Event: " . ($event ?? 'NOT_FOUND'));
        Log::info("Merchant ID: " . ($merchantId ?? 'NULL'));

        // 2. البحث عن التاجر في قاعدة بياناتنا
        $merchant = Merchant::where('salla_merchant_id', $merchantId)->first();
        if (!$merchant) {
            Log::error("Merchant {$merchantId} not found in Quantix.");
            return response()->json(['message' => 'Merchant not found'], 404);
        }

        // 3. التحقق من التوكن السري (الأمان)
        if (!$this->isTokenValid($token)) {
            Log::error("Invalid Webhook Token for Merchant {$merchantId}");
            return response()->json(['message' => 'Unauthorized Token'], 401);
        }

        // 4. توجيه الحدث للمعالجة الصحيحة
        switch ($event) {
            case 'product.created':
            case 'product.updated':
            case 'product.status.updated': // تم الإضافة بناءً على اللوق
            case 'product.available':      // تم الإضافة بناءً على اللوق
                // تحديث بيانات المنتج والكمية عند أي تعديل في سلة
                $this->syncWebhookProduct($merchant, $payload);
                break;

            case 'order.created':
                // خصم الكمية وتحدثها فور حدوث عملية بيع
                $this->handleOrderCreated($merchant, $payload);
                break;
                
            default:
                Log::info("Event {$event} ignored.");
                break;
        }

        return response()->json(['success' => true]);
    }

    /**
     * التحقق من التوكن السري بناءً على الإعدادات في الـ .env
     */
    private function isTokenValid($token)
    {
        $managementSecret = env('SALLA_MANAGEMENT_WEBHOOK_SECRET');
        $calculatorSecret = env('SALLA_CALCULATOR_WEBHOOK_SECRET');

        $cleanToken = str_replace('Bearer ', '', $token);

        return ($cleanToken === $managementSecret || $cleanToken === $calculatorSecret);
    }

    /**
     * تحديث أو إنشاء منتج بناءً على بيانات سلة
     */
    private function syncWebhookProduct($merchant, $p)
    {
        // إضافة لوق للتأكد من القيمة القادمة من سلة فعلياً
        $incomingQty = $p['quantity'] ?? 0;
        Log::info("Syncing Product: {$p['id']} | Incoming Qty from Salla: {$incomingQty}");

        Product::updateOrCreate(
            ['merchant_id' => $merchant->id, 'salla_product_id' => $p['id']],
            [
                'name'      => $p['name'] ?? 'بدون اسم',
                'price'     => $p['price']['amount'] ?? 0,
                'quantity'  => $incomingQty, // تحديث العدد هنا
                'status'    => $p['status'] ?? 'active',
                'synced_at' => now(),
            ]
        );
        
        Log::info("Product {$p['id']} quantity/data updated in DB via Webhook.");
    }

    /**
     * معالجة الطلب الجديد وخصم الكميات المباعة
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
                $newQuantity = max(0, $product->quantity - $soldQty);
                
                $product->update([
                    'quantity' => $newQuantity,
                    'synced_at' => now()
                ]);

                Log::info("Order Sale: Product {$product->id} quantity reduced by {$soldQty}. New total: {$newQuantity}");
            }
        }
    }
}