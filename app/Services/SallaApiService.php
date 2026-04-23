<?php

namespace App\Services;

use App\Models\Merchant;
use App\Models\SallaApp;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SallaApiService
{
    /**
     * الاسم الموحَّد لخيار الدفعات في سلة
     * استخدم هذا الـ Constant في كل مكان — لا تكتب النص مباشرةً
     */
    public const BATCH_OPTION_NAME = 'بيانات الدفعة';

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
    // Products API
    // ====================================================================

    /**
     * جلب بيانات المنتج مع options و variants
     */
    public function getProductDetails(string $sallaProductId): ?array
    {
        return $this->get("/products/{$sallaProductId}");
    }

    /**
     * تحديث بيانات المنتج العامة
     * PUT /products/{product}
     */
    public function updateProduct(string $sallaProductId, array $data): ?array
    {
        return $this->put("/products/{$sallaProductId}", $data);
    }

    /**
     * تحديث حالة المنتج (sale / hidden)
     * المسار الصحيح الوحيد: POST /products/{product}/status
     *
     * ⚠️  هذا الاسم هو الاسم الأساسي المستخدَم في CheckBatchExpiryJob
     */
    public function updateProductStatusOnly(string $sallaProductId, string $status): ?array
    {
        Log::info('[SallaApi] تحديث حالة المنتج', [
            'product_id' => $sallaProductId,
            'status'     => $status,
        ]);

        return $this->post("/products/{$sallaProductId}/status", [
            'status' => $status,
        ]);
    }

    /**
     * نفس الـ method باسم بديل لتوافق الأكواد القديمة التي تستدعي updateProductStatus()
     * إذا كان عندك أي ملف يستدعي ->updateProductStatus() لن يرمي خطأ
     */
    public function updateProductStatus(string $sallaProductId, string $status): ?array
    {
        return $this->updateProductStatusOnly($sallaProductId, $status);
    }

    // ====================================================================
    // Variants API
    // ====================================================================

    /**
     * تحديث بيانات الـ Variant (الكمية، السعر، SKU...)
     * PUT /products/variants/{variant}
     */
    public function updateBatchVariant(string $variantId, array $payload): ?array
    {
        return $this->put("/products/variants/{$variantId}", $payload);
    }

    /**
     * تخفيض كمية الـ Variant بعد البيع من سلة
     *
     * يُستدعى من:  SallaWebhookController عند استقبال حدث order.created
     *
     * @param string $variantId   — الـ salla_variant_id المحفوظ في الـ Batch
     * @param int    $soldQty     — الكمية المبيعة من الطلب
     * @param int    $currentQty  — الكمية الحالية في قاعدة بياناتنا
     */
    public function decrementVariantQuantity(string $variantId, int $soldQty, int $currentQty): ?array
    {
        $newQty = max(0, $currentQty - $soldQty);

        Log::info('[Variant] تخفيض الكمية بعد البيع', [
            'variant_id'   => $variantId,
            'sold'         => $soldQty,
            'current'      => $currentQty,
            'new_quantity' => $newQty,
        ]);

        return $this->put("/products/variants/{$variantId}", [
            'stock_quantity' => $newQty,
        ]);
    }

    /**
     * زيادة كمية الـ Variant عند تعديل التاجر للكمية
     *
     * يُستدعى من:  SallaWebhookController عند استقبال حدث product.quantity.updated
     *              أو من BatchController عند تحديث الكمية يدوياً
     *
     * @param string $variantId   — الـ salla_variant_id المحفوظ في الـ Batch
     * @param int    $newQty      — الكمية الجديدة الكاملة (وليس الفرق)
     */
    public function updateVariantQuantity(string $variantId, int $newQty): ?array
    {
        Log::info('[Variant] تحديث الكمية', [
            'variant_id'   => $variantId,
            'new_quantity' => $newQty,
        ]);

        return $this->put("/products/variants/{$variantId}", [
            'stock_quantity' => $newQty,
        ]);
    }

    // ====================================================================
    // Batch Option Management
    // ====================================================================

    /**
     * إنشاء خيار "بيانات الدفعة" للمنتج مع أول قيمة
     * POST /products/{product}/options
     *
     * ⚠️ قواعد سلة الصارمة:
     *   - display_type: "text" فقط (ليس dropdown أو غيره)
     *   - لا ترسل price داخل values للمنتجات الفيزيائية → 422
     */
    public function createProductOption(string $sallaProductId, string $optionName, string $valueName): ?array
    {
        Log::info('[SallaApi] إنشاء خيار جديد للمنتج', [
            'product_id'  => $sallaProductId,
            'option_name' => $optionName,
            'value_name'  => $valueName,
        ]);

        return $this->post("/products/{$sallaProductId}/options", [
            'name'         => $optionName,
            'display_type' => 'text',
            'required'     => false,
            'values'       => [
                [
                    'name'       => $valueName,
                    'is_default' => false,
                ],
            ],
        ]);
    }

    /**
     * إضافة قيمة لخيار موجود
     * POST /products/options/{option}    ← المسار الصحيح
     * (وليس /products/options/{option}/values)
     */
    public function addValueToOption(string $optionId, string $valueName): ?array
    {
        Log::info('[SallaApi] إضافة قيمة لخيار موجود', [
            'option_id'  => $optionId,
            'value_name' => $valueName,
        ]);

        return $this->post("/products/options/{$optionId}", [
            'name' => $valueName,
        ]);
    }

    // ====================================================================
    // HTTP Helpers
    // ====================================================================

    public function get(string $endpoint, array $params = []): ?array
    {
        $this->ensureTokenIsValid();
        $response = Http::withToken($this->sallaApp->access_token)
            ->get($this->baseUrl . $endpoint, $params);

        return $this->handleResponse($response, 'GET', $endpoint);
    }

    public function post(string $endpoint, array $data = []): ?array
    {
        $this->ensureTokenIsValid();
        $response = Http::withToken($this->sallaApp->access_token)
            ->post($this->baseUrl . $endpoint, $data);

        return $this->handleResponse($response, 'POST', $endpoint);
    }

    public function put(string $endpoint, array $data = []): ?array
    {
        $this->ensureTokenIsValid();
        $response = Http::withToken($this->sallaApp->access_token)
            ->put($this->baseUrl . $endpoint, $data);

        return $this->handleResponse($response, 'PUT', $endpoint);
    }

    private function ensureTokenIsValid(): void
    {
        if (!$this->sallaApp) {
            throw new \Exception('SallaApp not found for merchant');
        }

        if ($this->sallaApp->isTokenExpired()) {
            $this->refreshToken();
        }
    }

    private function handleResponse($response, string $method, string $endpoint): ?array
    {
        if (!$response->successful()) {
            Log::error('Salla API Error', [
                'method'   => $method,
                'endpoint' => $endpoint,
                'status'   => $response->status(),
                'body'     => $response->body(),
            ]);
            return null;
        }

        return $response->json();
    }

    private function refreshToken(): void
    {
        Log::info('[Token] تجديد Access Token');

        $response = Http::asForm()->post('https://accounts.salla.sa/oauth2/token', [
            'grant_type'    => 'refresh_token',
            'client_id'     => env('SALLA_OAUTH_CLIENT_ID'),
            'client_secret' => env('SALLA_OAUTH_CLIENT_SECRET'),
            'refresh_token' => $this->sallaApp->refresh_token,
        ]);

        if (!$response->successful()) {
            Log::error('[Token] فشل تجديد Token', ['body' => $response->body()]);
            throw new \Exception('Failed to refresh token');
        }

        $tokenData = $response->json();

        $this->sallaApp->update([
            'access_token'     => $tokenData['access_token'],
            'refresh_token'    => $tokenData['refresh_token'] ?? $this->sallaApp->refresh_token,
            'token_expires_at' => now()->addSeconds($tokenData['expires_in'] ?? 3600),
        ]);

        Log::info('[Token] ✅ تم تجديد Token بنجاح');
    }
}