<?php

namespace App\Services;

use App\Models\Merchant;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class SallaApiService
{
    protected Merchant $merchant;
    protected string $baseUrl = 'https://api.salla.dev/admin/v2';
    protected string $oauthUrl = 'https://accounts.salla.sa/oauth2/token';

    public function __construct(Merchant $merchant)
    {
        $this->merchant = $merchant;
    }

    public static function for(Merchant $merchant): self
    {
        return new self($merchant);
    }

    // ==============================================================================
    // 1. نظام إدارة وتجديد التوكن (Refresh Token Handling)
    // ==============================================================================

    /**
     * جلب التوكن الحالي من قاعدة البيانات
     */
    protected function getAccessToken(): string
    {
        // بناءً على رسائل الخطأ السابقة، التوكن محفوظ في علاقة sallaApps
        $sallaApp = $this->merchant->sallaApp ?? $this->merchant->sallaApps()->where('app_name', 'management')->first();
        
        if (!$sallaApp || empty($sallaApp->access_token)) {
            throw new Exception("SallaApp or access_token not found for merchant {$this->merchant->id}");
        }
        
        return $sallaApp->access_token;
    }

    /**
     * جلب الريفريش توكن من قاعدة البيانات
     */
    protected function getRefreshToken(): string
    {
        $sallaApp = $this->merchant->sallaApp ?? $this->merchant->sallaApps()->where('app_name', 'management')->first();
        return $sallaApp->refresh_token ?? '';
    }

    /**
     * تحديث التوكنات الجديدة في قاعدة البيانات بعد التجديد
     */
    protected function updateTokensInDb($accessToken, $refreshToken, $expiresIn): void
    {
        $sallaApp = $this->merchant->sallaApp ?? $this->merchant->sallaApps()->where('app_name', 'management')->first();
        
        if ($sallaApp) {
            $sallaApp->update([
                'access_token'  => $accessToken,
                'refresh_token' => $refreshToken,
                'expires_in'    => $expiresIn,
            ]);
        } else {
            // كخيار احتياطي في حال كان مخزناً في جدول التاجر نفسه
            $this->merchant->update([
                'access_token'  => $accessToken,
                'refresh_token' => $refreshToken,
            ]);
        }
    }

    /**
     * دالة التجديد الفعلي بالتخاطب مع سلة
     */
    protected function refreshAccessToken(): ?string
    {
        $refreshToken = $this->getRefreshToken();

        if (empty($refreshToken)) {
            Log::error("[SallaApiService] لا يوجد Refresh Token متاح للتاجر {$this->merchant->id}");
            return null;
        }

        $response = Http::asForm()->post($this->oauthUrl, [
            'grant_type'    => 'refresh_token',
            'refresh_token' => $refreshToken,
            'client_id'     => env('SALLA_CLIENT_ID', config('services.salla.client_id')),
            'client_secret' => env('SALLA_CLIENT_SECRET', config('services.salla.client_secret')),
        ]);

        if ($response->successful()) {
            $data = $response->json();
            $this->updateTokensInDb($data['access_token'], $data['refresh_token'], $data['expires_in'] ?? null);
            return $data['access_token'];
        }

        Log::error("[SallaApiService] فشل الاتصال برابط التجديد: " . $response->body());
        return null;
    }

    // ==============================================================================
    // 2. المحرك الأساسي للطلبات (Interceptor)
    // ==============================================================================

    /**
     * يرسل الطلب، وإذا واجه 401، يقوم بتجديد التوكن وإعادة المحاولة تلقائياً
     */
    protected function request(string $method, string $endpoint, array $data = [])
    {
        $token = $this->getAccessToken();
        $url = $this->baseUrl . $endpoint;

        $response = Http::withToken($token)
            ->withHeaders([
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])
            ->$method($url, $data);

        // إذا كان التوكن منتهي الصلاحية (التعامل مع الرفريش توكن)
        if ($response->status() === 401) {
            Log::warning("[SallaApiService] انتهت صلاحية التوكن للتاجر {$this->merchant->id} (401). جاري محاولة التجديد...");

            $newToken = $this->refreshAccessToken();

            if ($newToken) {
                Log::info("[SallaApiService] تم تجديد التوكن بنجاح. سيتم إعادة المحاولة للطلب الأصلي...");
                
                // إعادة إرسال الطلب الأصلي بالتوكن الجديد
                $retryResponse = Http::withToken($newToken)
                    ->withHeaders([
                        'Accept' => 'application/json',
                        'Content-Type' => 'application/json',
                    ])
                    ->$method($url, $data);

                if (!$retryResponse->successful()) {
                    Log::error("[SallaApiService] فشل الطلب حتى بعد تجديد التوكن: " . $retryResponse->body());
                    throw new Exception("فشل الطلب بعد تجديد التوكن: " . $retryResponse->body());
                }

                return $retryResponse->json();
            } else {
                throw new Exception("انتهى التوكن وفشلت عملية التجديد (Refresh Token) للتاجر {$this->merchant->id}");
            }
        }

        // معالجة باقي أنواع الأخطاء (غير الـ 401)
        if (!$response->successful()) {
            Log::error("[SallaApiService] خطأ سلة ({$response->status()}): " . $response->body());
            throw new Exception("خطأ في الاتصال بسلة: " . $response->body());
        }

        return $response->json();
    }

    // ==============================================================================
    // 3. دوال التخاطب مع سلة (Endpoints) - متبقية كما هي تماماً بدون تغيير
    // ==============================================================================

    public function getProductDetails($salla_product_id)
    {
        return $this->request('get', "/products/{$salla_product_id}");
    }

    public function getProductOptions($salla_product_id)
    {
        return $this->request('get', "/products/{$salla_product_id}/options");
    }

    public function getProductVariants($salla_product_id)
    {
        return $this->request('get', "/products/{$salla_product_id}/variants");
    }

    public function updateBatchVariant($variant_id, array $data)
    {
        return $this->request('put', "/products/variants/{$variant_id}", $data);
    }

    public function updateProductStatusOnly($product_id, $status)
    {
        return $this->request('put', "/products/{$product_id}/status", ['status' => $status]);
    }

    public function createProductOption($product_id, $name, $value)
    {
        return $this->request('post', "/products/{$product_id}/options", [
            'name' => $name,
            'values' => [
                ['name' => $value]
            ]
        ]);
    }

    public function addValueToOption($product_id, $option_id, $value)
{
    return $this->request('post', "/products/{$product_id}/options/{$option_id}/values", [
        'name' => $value
    ]);
}
   public function deleteOption($option_id)
{
    return $this->request('delete', "/products/options/{$option_id}");
}
}