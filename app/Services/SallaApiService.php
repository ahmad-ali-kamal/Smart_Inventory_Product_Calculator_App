<?php

namespace App\Services;

use App\Models\Merchant;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SallaApiService
{
    private Merchant $merchant;
    private string $baseUrl = 'https://api.salla.dev/admin/v2';

    public function __construct(Merchant $merchant)
    {
        $this->merchant = $merchant;
    }

    /**
     * Static helper - إنشاء instance بسهولة
     */
    public static function for(Merchant $merchant): self
    {
        return new self($merchant);
    }

    // ====================================================================
    // Products
    // ====================================================================

    /**
     * مزامنة جميع المنتجات من سلة وحفظها في قاعدة البيانات
     */
    public function syncProducts(): array
    {
        $synced = 0;
        $errors = 0;
        $page = 1;

        Log::info('بدء مزامنة المنتجات', ['merchant_id' => $this->merchant->id]);

        do {
            $response = $this->get('/products', ['page' => $page, 'per_page' => 50]);

            if (!$response) break;

            $products = $response['data'] ?? [];
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

        } while (
            !empty($products) &&
            $pagination &&
            $page <= ($pagination['totalPages'] ?? 1)
        );

        Log::info('انتهت مزامنة المنتجات', [
            'merchant_id' => $this->merchant->id,
            'synced'      => $synced,
            'errors'      => $errors,
        ]);

        // تحديث وقت آخر مزامنة
        $this->merchant->update(['synced_at' => now()]);

        return ['synced' => $synced, 'errors' => $errors];
    }

    /**
     * حفظ منتج واحد في قاعدة البيانات
     */
    private function saveProduct(array $data): Product
    {
        $product = Product::updateOrCreate(
            [
                'salla_product_id' => (string) $data['id'],
            ],
            [
                'merchant_id'   => $this->merchant->id,
                'name'          => $data['name'],
                'sku'           => $data['sku'] ?? null,
                'price'         => $data['price']['amount'] ?? 0,
                'quantity'      => $data['quantity'] ?? 0,
                'category'      => $data['category']['name'] ?? null,
                'status'        => $data['status'] ?? 'active',
                'metadata'      => [
                    'description'  => $data['description'] ?? null,
                    'url'          => $data['url'] ?? null,
                    'type'         => $data['type'] ?? null,
                    'sale_price'   => $data['sale_price']['amount'] ?? null,
                ],
                'synced_at'     => now(),
            ]
        );

        // حفظ الصور
        $this->syncProductImages($product, $data);

        return $product;
    }

    /**
     * حفظ صور المنتج
     */
    private function syncProductImages(Product $product, array $data): void
    {
        // حذف الصور القديمة
        $product->images()->delete();

        // حفظ الصورة الرئيسية
        if (!empty($data['main_image'])) {
            ProductImage::create([
                'product_id' => $product->id,
                'image_url'  => $data['main_image'],
                'is_main'    => true,
                'sort_order' => 0,
            ]);
        }

        // حفظ صور إضافية
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
    // Helper Methods
    // ====================================================================

    /**
     * إرسال GET request لـSalla API
     */
    public function get(string $endpoint, array $params = []): ?array
    {
        // تجديد التوكن إذا انتهت صلاحيته
        if ($this->merchant->isTokenExpired()) {
            $this->refreshToken();
        }

        $response = Http::withToken($this->merchant->access_token)
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

    /**
     * إرسال POST request لـSalla API
     */
    public function post(string $endpoint, array $data = []): ?array
    {
        if ($this->merchant->isTokenExpired()) {
            $this->refreshToken();
        }

        $response = Http::withToken($this->merchant->access_token)
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

    /**
     * تجديد الـAccess Token
     */
    private function refreshToken(): void
    {
        if (!$this->merchant->refresh_token) {
            throw new \Exception('لا يوجد Refresh Token');
        }

        $response = Http::asForm()->post('https://accounts.salla.sa/oauth2/token', [
            'grant_type'    => 'refresh_token',
            'client_id'     => env('SALLA_OAUTH_CLIENT_ID'),
            'client_secret' => env('SALLA_OAUTH_CLIENT_SECRET'),
            'refresh_token' => $this->merchant->refresh_token,
        ]);

        if (!$response->successful()) {
            throw new \Exception('فشل تجديد التوكن: ' . $response->body());
        }

        $tokenData = $response->json();

        $this->merchant->update([
            'access_token'     => $tokenData['access_token'],
            'refresh_token'    => $tokenData['refresh_token'] ?? $this->merchant->refresh_token,
            'token_expires_at' => now()->addSeconds($tokenData['expires_in'] ?? 3600),
        ]);

        Log::info('تم تجديد التوكن بنجاح', ['merchant_id' => $this->merchant->id]);
    }
}