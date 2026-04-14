<?php

namespace App\Services;

use App\Models\Merchant;
use App\Models\SallaApp;
use App\Models\Product;
use App\Models\ProductImage;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SallaApiService
{
    private Merchant $merchant;
    private ?SallaApp $sallaApp = null;
    private string $baseUrl = 'https://api.salla.dev/admin/v2';

    public function __construct(Merchant $merchant)
    {
        $this->merchant = $merchant;
        $this->sallaApp = SallaApp::where('merchant_id', $merchant->id)
            ->where('app_name', 'management')
            ->first();
    }

    public static function for(Merchant $merchant): self
    {
        return new self($merchant);
    }

    // ====================================================================
    // Products
    // ====================================================================

    public function syncProducts(): array
    {
        $synced = 0;
        $errors = 0;
        $page = 1;

        Log::info('بدء مزامنة المنتجات', ['merchant_id' => $this->merchant->id]);

        do {
            $response = $this->get('/products', ['page' => $page, 'per_page' => 50]);
            if (!$response) break;

            $products   = $response['data'] ?? [];
            $pagination = $response['pagination'] ?? null;

            foreach ($products as $productData) {
                try {
                    $this->saveProduct($productData);
                    $synced++;
                } catch (\Exception $e) {
                    $errors++;
                    Log::error('خطأ في حفظ منتج', [
                        'product_id' => $productData['id'] ?? 'unknown',
                        'error'      => $e->getMessage(),
                    ]);
                }
            }

            $page++;

        } while (!empty($products) && $pagination && $page <= ($pagination['totalPages'] ?? 1));

        Log::info('انتهت مزامنة المنتجات', [
            'merchant_id' => $this->merchant->id,
            'synced'      => $synced,
            'errors'      => $errors,
        ]);

        $this->merchant->update(['synced_at' => now()]);

        return ['synced' => $synced, 'errors' => $errors];
    }

    /**
     * تحديث بيانات أو حالة المنتج في سلة
     * تم إضافة Log هنا لتصوير البيانات قبل إرسالها لسلة
     */
    public function updateProductStatus(string $sallaProductId, array $data): ?array
    {
        Log::info("إرسال تحديث حالة لمنتج سلة: {$sallaProductId}", ['payload' => $data]);
        return $this->put("/products/{$sallaProductId}", $data);
    }

    /**
     * حفظ المنتج مع حماية الاسم من الضياع أثناء المزامنة
     */
    private function saveProduct(array $data): Product
    {
        // نستخدم updateOrCreate ولكن نتأكد أن الاسم لا يتم تصفيره
        $product = Product::updateOrCreate(
            ['salla_product_id' => (string) $data['id']],
            [
                'merchant_id' => $this->merchant->id,
                'name'        => $data['name'] ?? 'بدون اسم', // حماية للاسم
                'sku'         => $data['sku'] ?? null,
                'price'       => $data['price']['amount'] ?? 0,
                'quantity'    => $data['quantity'] ?? 0,
                'category'    => $data['category']['name'] ?? null,
                'status'      => $data['status'] ?? 'active',
                'metadata'    => [
                    'description' => $data['description'] ?? null,
                    'url'         => $data['url'] ?? null,
                    'type'        => $data['type'] ?? null,
                    'sale_price'  => $data['sale_price']['amount'] ?? null,
                ],
                'synced_at' => now(),
            ]
        );

        $this->syncProductImages($product, $data);
        return $product;
    }

    private function syncProductImages(Product $product, array $data): void
    {
        $product->images()->delete();

        if (!empty($data['main_image'])) {
            ProductImage::create([
                'product_id' => $product->id,
                'image_url'  => $data['main_image'],
                'is_main'    => true,
                'sort_order' => 0,
            ]);
        }

        if (!empty($data['images'])) {
            foreach ($data['images'] as $index => $image) {
                ProductImage::create([
                    'product_id' => $product->id,
                    'image_url'  => is_string($image) ? $image : ($image['url'] ?? ''),
                    'is_main'    => false,
                    'sort_order' => $index + 1,
                ]);
            }
        }
    }

    // ====================================================================
    // Special Offers
    // ====================================================================

    public function applySpecialPrice(
    string $sallaProductId,
    string $startsAt,
    string $endsAt,
    int $discountPercent
): array {
    if ($this->sallaApp->isTokenExpired()) {
        $this->refreshToken();
    }

    $payload = [
        'name'            => 'خصم - ' . $sallaProductId,
        'offer_type'      => 'percentage',
        'applied_to'      => 'product',
        'applied_channel' => 'browser_and_application',
        'start_date'      => Carbon::parse($startsAt)->format('Y-m-d H:i:s'),
        'expiry_date'     => Carbon::parse($endsAt)->format('Y-m-d H:i:s'),
        'is_active'       => true,
        'buy' => [
            'type'     => 'product',
            'products' => [(int) $sallaProductId],
            'quantity' => 1,
        ],
        'get' => [
            'type'            => 'product',
            'products'        => [(int) $sallaProductId],
            'quantity'        => 1,
            'discount_type'   => 'percentage',
            'discount_amount' => $discountPercent,
        ],
    ];

    // ← استخدم HTTP مباشرة بدل post() عشان نقرأ الـ body حتى لو 404
    $response = Http::withToken($this->sallaApp->access_token)
        ->post($this->baseUrl . '/specialoffers', $payload);

    $body = $response->json();

    Log::info('Salla specialoffers raw response', [
        'status' => $response->status(),
        'body'   => $body,
    ]);

    // سلة تنشئ العرض حتى لو رجعت 404، نتحقق من البيانات
    if (!empty($body['data']['id'])) {
        return $body['data'];
    }

    // إذا نجح بـ 2xx
    if ($response->successful() && ($body['success'] ?? false)) {
        return $body['data'];
    }

    throw new \Exception("فشل إنشاء العرض: " . json_encode($body));
}
public function removeSpecialPrice(string $offerId): void
{
    $this->delete('/specialoffers/' . $offerId);
}

public function delete(string $endpoint): ?array
{
    if (!$this->sallaApp || $this->sallaApp->isTokenExpired()) {
        $this->refreshToken();
    }

    $response = Http::withToken($this->sallaApp->access_token)
        ->delete($this->baseUrl . $endpoint);

    return $response->successful() ? $response->json() : null;
}

public function hideProduct(string $sallaProductId): void
{
    $result = $this->post('/products/' . $sallaProductId, ['status' => 'hidden']);

    if (!$result) {
        throw new \Exception("فشل إخفاء المنتج: {$sallaProductId}");
    }
}
    // ====================================================================
    // Helper Methods
    // ====================================================================

    public function get(string $endpoint, array $params = []): ?array
    {
        if (!$this->sallaApp) {
            Log::error('SallaApp not found for merchant', ['merchant_id' => $this->merchant->id]);
            return null;
        }

        if ($this->sallaApp->isTokenExpired()) {
            $this->refreshToken();
        }

        $response = Http::withToken($this->sallaApp->access_token)
            ->get($this->baseUrl . $endpoint, $params);

        if (!$response->successful()) {
            Log::error('Salla API Error', [
                'endpoint'    => $endpoint,
                'status'      => $response->status(),
                'body'        => $response->body(),
                'merchant_id' => $this->merchant->id,
            ]);
            return null;
        }

        return $response->json();
    }

    public function post(string $endpoint, array $data = []): ?array
    {
        if (!$this->sallaApp) {
            Log::error('SallaApp not found for merchant', ['merchant_id' => $this->merchant->id]);
            return null;
        }

        if ($this->sallaApp->isTokenExpired()) {
            $this->refreshToken();
        }

        $response = Http::withToken($this->sallaApp->access_token)
            ->post($this->baseUrl . $endpoint, $data);

        if (!$response->successful()) {
            Log::error('Salla API POST Error', [
                'endpoint'    => $endpoint,
                'status'      => $response->status(),
                'body'        => $response->body(),
                'merchant_id' => $this->merchant->id,
            ]);
            return null;
        }

        return $response->json();
    }

    public function put(string $endpoint, array $data = []): ?array
    {
        if (!$this->sallaApp) {
            Log::error('SallaApp not found for merchant', ['merchant_id' => $this->merchant->id]);
            return null;
        }

        if ($this->sallaApp->isTokenExpired()) {
            $this->refreshToken();
        }

        $response = Http::withToken($this->sallaApp->access_token)
            ->put($this->baseUrl . $endpoint, $data);

        if (!$response->successful()) {
            Log::error('Salla API PUT Error', [
                'endpoint'    => $endpoint,
                'status'      => $response->status(),
                'body'        => $response->body(),
                'merchant_id' => $this->merchant->id,
            ]);
            return null;
        }

        return $response->json();
    }

    private function refreshToken(): void
    {
        if (!$this->sallaApp->refresh_token) {
            throw new \Exception('لا يوجد Refresh Token');
        }

        $response = Http::asForm()->post('https://accounts.salla.sa/oauth2/token', [
            'grant_type'    => 'refresh_token',
            'client_id'     => env('SALLA_OAUTH_CLIENT_ID'),
            'client_secret' => env('SALLA_OAUTH_CLIENT_SECRET'),
            'refresh_token' => $this->sallaApp->refresh_token,
        ]);

        if (!$response->successful()) {
            throw new \Exception('فشل تجديد التوكن: ' . $response->body());
        }

        $tokenData = $response->json();

        $this->sallaApp->update([
            'access_token'     => $tokenData['access_token'],
            'refresh_token'    => $tokenData['refresh_token'] ?? $this->sallaApp->refresh_token,
            'token_expires_at' => now()->addSeconds($tokenData['expires_in'] ?? 3600),
        ]);

        Log::info('تم تجديد التوكن بنجاح', ['merchant_id' => $this->merchant->id]);
    }
}