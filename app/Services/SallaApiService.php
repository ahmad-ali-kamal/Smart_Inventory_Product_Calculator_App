<?php

namespace App\Services;

use App\Models\Merchant;
use App\Models\SallaApp;
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

    /**
     * جلب بيانات المنتج والخيارات
     */
    public function getProductDetails(string $sallaProductId): ?array
    {
        return $this->get("/products/{$sallaProductId}");
    }

    /**
     * إنشاء خيار "الدفعات" للمنتج مع أول قيمة
     *
     * ملاحظات مهمة من الـ API:
     * - display_type يقبل فقط: "text" أو "image" — القيمة "dropdown" غير صالحة وترجع 422
     * - يجب عدم إرسال price داخل values لمنتج فيزيائي
     *   (السعر يُحدَّث لاحقاً عبر Update Variant)
     */
    public function createProductOption(string $sallaProductId, string $optionName, string $valueName): ?array
    {
        Log::info("[Harees] إنشاء خيار جديد للمنتج: {$sallaProductId}");
        return $this->post("/products/{$sallaProductId}/options", [
            'name'         => $optionName,
            'display_type' => 'text',   // ✅ القيم الصالحة: text | image (ليس dropdown)
            'required'     => false,
            'values'       => [
                [
                    'name'       => $valueName,
                    'is_default' => false,
                    // ❌ لا نُرسل price هنا — سلة ترفضه للمنتجات الفيزيائية
                    //    السعر يُعيَّن بعد الإنشاء عبر updateBatchVariant
                ],
            ],
        ]);
    }

    /**
     * إضافة قيمة لخيار موجود
     * المسار الصحيح: POST /products/options/{option}
     * (وليس /products/options/{option}/values)
     */
    public function addValueToOption(string $optionId, string $valueName): ?array
    {
        Log::info("[Harees] إضافة قيمة للدفعة للخيار ID: {$optionId}");
        return $this->post("/products/options/{$optionId}", [
            'name' => $valueName,
            // ❌ لا نُرسل price — يُحدَّث لاحقاً عبر updateBatchVariant
        ]);
    }

    /**
     * تحديث بيانات الـ Variant (الكمية والسعر)
     */
    public function updateBatchVariant(string $variantId, array $payload): ?array
    {
        return $this->put("/products/variants/{$variantId}", $payload);
    }

    /**
     * تحديث حالة المنتج (sale/hidden)
     */
    public function updateProductStatusOnly(string $sallaProductId, string $status): ?array
    {
        return $this->post("/products/{$sallaProductId}/status", ['status' => $status]);
    }

    // ====================================================================
    // Helpers
    // ====================================================================

    public function get(string $endpoint, array $params = []): ?array
    {
        $this->ensureTokenIsValid();
        $response = Http::withToken($this->sallaApp->access_token)->get($this->baseUrl . $endpoint, $params);
        return $this->handleResponse($response, 'GET', $endpoint);
    }

    public function post(string $endpoint, array $data = []): ?array
    {
        $this->ensureTokenIsValid();
        $response = Http::withToken($this->sallaApp->access_token)->post($this->baseUrl . $endpoint, $data);
        return $this->handleResponse($response, 'POST', $endpoint);
    }

    public function put(string $endpoint, array $data = []): ?array
    {
        $this->ensureTokenIsValid();
        $response = Http::withToken($this->sallaApp->access_token)->put($this->baseUrl . $endpoint, $data);
        return $this->handleResponse($response, 'PUT', $endpoint);
    }

    private function ensureTokenIsValid(): void
    {
        if ($this->sallaApp->isTokenExpired()) $this->refreshToken();
    }

    private function handleResponse($response, $method, $endpoint): ?array
    {
        if (!$response->successful()) {
            Log::error("Salla API Error", [
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
        $response = Http::asForm()->post('https://accounts.salla.sa/oauth2/token', [
            'grant_type'    => 'refresh_token',
            'client_id'     => env('SALLA_OAUTH_CLIENT_ID'),
            'client_secret' => env('SALLA_OAUTH_CLIENT_SECRET'),
            'refresh_token' => $this->sallaApp->refresh_token,
        ]);
        if ($response->successful()) {
            $this->sallaApp->update([
                'access_token'     => $response->json()['access_token'],
                'token_expires_at' => now()->addSeconds($response->json()['expires_in']),
            ]);
        }
    }
}