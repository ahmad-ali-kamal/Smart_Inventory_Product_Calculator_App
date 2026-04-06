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
        // 1. قراءة البيانات (سلة في وضع Token ترسل الحدث أحياناً داخل الـ JSON)
        $event = $request->header('x-salla-event') ?? $request->json('event');
        $token = $request->header('Authorization'); // التوكن السري من سلة
        $merchantId = $request->json('merchant');
        $payload = $request->json('data');

        Log::info("--- Webhook Fixed Strategy ---");
        Log::info("Event: " . ($event ?? 'NOT_FOUND'));
        Log::info("Merchant ID: " . ($merchantId ?? 'NULL'));

        // 2. البحث عن التاجر
        $merchant = Merchant::where('salla_merchant_id', $merchantId)->first();
        if (!$merchant) {
            Log::error("Merchant {$merchantId} not found.");
            return response()->json(['message' => 'Merchant not found'], 404);
        }

        // 3. التحقق من التوكن (مقارنة مباشرة بدلاً من HMAC)
        if (!$this->isTokenValid($token)) {
            Log::error("Invalid Webhook Token for Merchant {$merchantId}");
            return response()->json(['message' => 'Unauthorized Token'], 401);
        }

        // 4. المزامنة
        if (in_array($event, ['product.created', 'product.updated'])) {
            $this->syncWebhookProduct($merchant, $payload);
        }

        return response()->json(['success' => true]);
    }

    private function isTokenValid($token)
    {
        // مقارنة التوكن القادم مع الأسرار في الـ .env
        $managementSecret = env('SALLA_MANAGEMENT_WEBHOOK_SECRET');
        $calculatorSecret = env('SALLA_CALCULATOR_WEBHOOK_SECRET');

        return ($token === $managementSecret || $token === $calculatorSecret);
    }

    private function syncWebhookProduct($merchant, $p)
    {
        Product::updateOrCreate(
            ['merchant_id' => $merchant->id, 'salla_product_id' => $p['id']],
            [
                'name'      => $p['name'],
                'price'     => $p['price']['amount'] ?? 0,
                'quantity'  => $p['quantity'] ?? 0,
                'status'    => $p['status'] ?? 'active',
                'synced_at' => now(),
            ]
        );
        Log::info("Product {$p['id']} synced via Webhook!");
    }
}