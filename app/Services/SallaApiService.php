<?php

namespace App\Services;

use App\Models\Merchant;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SallaApiService
{
    protected Merchant $merchant;
    protected string $baseUrl  = 'https://api.salla.dev/admin/v2';
    protected string $oauthUrl = 'https://accounts.salla.sa/oauth2/token';

    public const BATCH_OPTION_NAME = 'بيانات الدفعة';

    public function __construct(Merchant $merchant)
    {
        $this->merchant = $merchant;
    }

    public static function for(Merchant $merchant): self
    {
        return new self($merchant);
    }

    // ================================================================
    // Token Management
    // ================================================================

    protected function getAccessToken(): string
    {
        $sallaApp = $this->merchant->sallaApp
            ?? $this->merchant->sallaApps()->where('app_name', 'management')->first();

        if (!$sallaApp || empty($sallaApp->access_token)) {
            throw new Exception("لم يتم العثور على access_token للتاجر {$this->merchant->id}");
        }

        return (string) $sallaApp->access_token;
    }

    protected function getRefreshToken(): string
    {
        $sallaApp = $this->merchant->sallaApp
            ?? $this->merchant->sallaApps()->where('app_name', 'management')->first();

        return (string) ($sallaApp->refresh_token ?? '');
    }

    protected function updateTokensInDb(string $accessToken, string $refreshToken, $expiresIn): void
    {
        $sallaApp = $this->merchant->sallaApp
            ?? $this->merchant->sallaApps()->where('app_name', 'management')->first();

        if ($sallaApp) {
            $sallaApp->update([
                'access_token'  => $accessToken,
                'refresh_token' => $refreshToken,
                'expires_in'    => $expiresIn,
            ]);
            return;
        }

        $this->merchant->update([
            'access_token'  => $accessToken,
            'refresh_token' => $refreshToken,
        ]);
    }

    protected function refreshAccessToken(): ?string
    {
        $refreshToken = $this->getRefreshToken();

        if ($refreshToken === '') {
            Log::error("[SallaApiService] لا يوجد Refresh Token للتاجر {$this->merchant->id}");
            return null;
        }

        $response = Http::asForm()->post($this->oauthUrl, [
            'grant_type'    => 'refresh_token',
            'refresh_token' => $refreshToken,
            'client_id'     => env('SALLA_CLIENT_ID',     config('services.salla.client_id')),
            'client_secret' => env('SALLA_CLIENT_SECRET', config('services.salla.client_secret')),
        ]);

        if ($response->successful()) {
            $data = $response->json() ?? [];
            if (!empty($data['access_token'])) {
                $this->updateTokensInDb(
                    (string) $data['access_token'],
                    (string) ($data['refresh_token'] ?? $refreshToken),
                    $data['expires_in'] ?? null
                );
                return (string) $data['access_token'];
            }
        }

        Log::error('[SallaApiService] فشل تجديد التوكن: ' . $response->body());
        return null;
    }

    // ================================================================
    // Core Request Engine — auto-refresh on 401
    // ================================================================

    protected function request(string $method, string $endpoint, array $data = []): array
    {
        $token = $this->getAccessToken();
        $url   = $this->baseUrl . '/' . ltrim($endpoint, '/');

        $response = Http::withToken($token)
            ->withHeaders(['Accept' => 'application/json', 'Content-Type' => 'application/json'])
            ->$method($url, $data);

        if ($response->status() === 401) {
            Log::warning("[SallaApiService] 401 للتاجر {$this->merchant->id} — جاري التجديد");
            $newToken = $this->refreshAccessToken();

            if (!$newToken) {
                throw new Exception("فشل تجديد التوكن للتاجر {$this->merchant->id}");
            }

            $response = Http::withToken($newToken)
                ->withHeaders(['Accept' => 'application/json', 'Content-Type' => 'application/json'])
                ->$method($url, $data);
        }

        if (!$response->successful()) {
            Log::error("[SallaApiService] خطأ ({$response->status()}): " . $response->body(), [
                'endpoint' => $endpoint,
                'method'   => strtoupper($method),
                'payload'  => $data,
            ]);
            throw new Exception("خطأ سلة [{$response->status()}]: " . $response->body());
        }

        return $response->json() ?? [];
    }

    // ================================================================
    // Products API
    // ================================================================

    public function getProductDetails(string $sallaProductId): array
    {
        return $this->request('get', "products/{$sallaProductId}");
    }

    public function getProductOptions(string $sallaProductId): array
    {
        $response = $this->getProductDetails($sallaProductId);
        return [
            'success' => $response['success'] ?? true,
            'data'    => $response['data']['options'] ?? [],
        ];
    }

    /**
     * جلب الـ Variants من endpoint منفصل (أكثر دقة)
     * GET /products/{product}/variants
     */
    public function getProductVariants(string $sallaProductId): array
    {
        $response = $this->request('get', "products/{$sallaProductId}/variants");
        return [
            'success' => $response['success'] ?? true,
            'data'    => $response['data'] ?? [],
        ];
    }

    public function updateProductStatusOnly(string $sallaProductId, string $status): array
    {
        return $this->request('post', "products/{$sallaProductId}/status", [
            'status' => $status,
        ]);
    }

    // ================================================================
    // Variants API
    // ================================================================

    /**
     * جلب تفاصيل Variant محدد
     * GET /products/variants/{variant}
     */
    public function getVariantDetails(string $variantId): array
    {
        return $this->request('get', "products/variants/{$variantId}");
    }

    /**
     * تحديث بيانات Variant موجود
     * PUT /products/variants/{variant}
     *
     * ✅ قواعد سلة الصارمة (من التوثيق):
     * - يجب إرسال جميع الحقول المطلوبة من الـ OpenAPI
     * - الحقول المطلوبة: sku, barcode, price, sale_price, cost_price, stock_quantity, weight, mpn, gtin
     */
    public function updateBatchVariant(string $variantId, array $data): array
    {
        if (!isset($data['sku'])) {
            throw new Exception('SKU مطلوب لتحديث الـvariant');
        }
        if (!isset($data['price'])) {
            throw new Exception('السعر الأصلي (price) مطلوب');
        }
        if (!isset($data['stock_quantity'])) {
            throw new Exception('الكمية (stock_quantity) مطلوبة');
        }

        // ✅ إرسال جميع الحقول المطلوبة حسب توثيق سلة
        $payload = [
            'sku'            => $data['sku'],
            'barcode'        => $data['barcode'] ?? null,
            'price'          => (float) $data['price'],
            'sale_price'     => isset($data['sale_price']) ? (float) $data['sale_price'] : null,
            'cost_price'     => (float) ($data['cost_price'] ?? $data['price'] ?? 0),
            'stock_quantity' => (int) $data['stock_quantity'],
            'weight'         => (int) ($data['weight'] ?? 0),
            'mpn'            => $data['mpn'] ?? null,
            'gtin'           => $data['gtin'] ?? null,
        ];

        Log::info('[Variant Update] ✅ إرسال ALL الحقول المطلوبة:', $payload);

        $response = $this->request('put', "products/variants/{$variantId}", $payload);

        Log::info('[Variant Update] ✅ الاستجابة:', $response);

        return $response;
    }

    /**
     * إنشاء Variant جديد للمنتج
     * POST /products/{product}/variants
     */
    public function createVariant(
        string $sallaProductId,
        array  $relatedValues,
        float  $price,
        int    $stockQuantity,
        string $sku = ''
    ): array {
        $payload = [
            'related_option_values' => $relatedValues,
            'price'                 => $price,
            'stock_quantity'        => $stockQuantity,
        ];

        if ($sku !== '') {
            $payload['sku'] = $sku;
        }

        return $this->request('post', "products/{$sallaProductId}/variants", $payload);
    }

    // ================================================================
    // Options API
    // ================================================================

    /**
     * إنشاء خيار جديد للمنتج مع قيمه
     * POST /products/{product}/options
     *
     * ✅ display_type: "text" فقط — "dropdown" يسبب 422
     */
    public function createProductOption(string $sallaProductId, string $name, array $valuesArray): array
    {
        return $this->request('post', "products/{$sallaProductId}/options", [
            'name'         => $name,
            'display_type' => 'text',
            'required'     => false,
            'values'       => array_values($valuesArray),
        ]);
    }

    /**
     * تحديث خيار موجود (القيم + الاسم)
     * PUT /products/options/{option}
     */
    public function updateProductOption(string $optionId, string $name, array $valuesArray): array
    {
        return $this->request('put', "products/options/{$optionId}", [
            'name'   => $name,
            'values' => array_values($valuesArray),
        ]);
    }

    /**
     * حذف خيار كامل من المنتج
     * DELETE /products/options/{option}
     */
    public function deleteProductOption(string $optionId): array
    {
        return $this->request('delete', "products/options/{$optionId}");
    }
}