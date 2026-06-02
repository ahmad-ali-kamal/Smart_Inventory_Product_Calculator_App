<?php

namespace App\Services;

use App\Models\Merchant;
use App\Models\SallaApp;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SallaApiService
{
    protected Merchant $merchant;
    protected string $baseUrl  = 'https://api.salla.dev/admin/v2';
    protected string $oauthUrl = 'https://accounts.salla.sa/oauth2/token';

    public const BATCH_OPTION_NAME = 'بيانات الدفعة';

    /**
     * أسماء التطبيقات المدعومة (الجديدة أولاً، القديمة كـ fallback)
     */
    private const APP_NAMES_NEW = ['harees', 'mustashar'];
    private const APP_NAMES_OLD = ['management', 'calculator'];

    /**
     * خريطة تحويل: الأسماء القديمة → أسماء config الصحيحة
     */
    private const APP_CONFIG_MAP = [
        'harees'     => 'salla_harees',
        'management' => 'salla_harees',
        'mustashar'  => 'salla_mustashar',
        'calculator' => 'salla_mustashar',
    ];

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

    /**
     * البحث عن تطبيق التاجر مع دعم الأسماء الجديدة والقديمة
     *
     * ترتيب الأولوية:
     * 1. harees  (الاسم الجديد لتطبيق حريص)
     * 2. management (الاسم القديم لتطبيق حريص)
     * 3. mustashar  (الاسم الجديد لتطبيق المستشار)
     * 4. calculator (الاسم القديم لتطبيق المستشار)
     * 5. أي تطبيق لديه access_token صالح
     *
     * يتم تسجيل كل محاولة في اللوق لسهولة التتبع.
     */
    protected function findSallaApp(): ?SallaApp
    {
        $merchantId = $this->merchant->id;

        // ── أولاً: البحث بالترتيب (جديد → قديم) ──
        $preferred = ['harees', 'management', 'mustashar', 'calculator'];

        foreach ($preferred as $appName) {
            $app = $this->merchant->sallaApps()
                ->where('app_name', $appName)
                ->first();

            Log::info('[TOKEN FETCH]', [
                'merchant_id'    => $merchantId,
                'searching'      => $appName,
                'found'          => $app ? $app->id : null,
                'has_token_raw'  => $app ? (!empty($app->getRawOriginal('access_token')) ? 'yes' : 'no') : 'no-app',
                'token_decrypted'=> $app ? (!empty($app->access_token) ? 'yes' : 'empty') : 'no-app',
            ]);

            if ($app && !empty($app->access_token)) {
                Log::info('[TOKEN SELECTED]', [
                    'merchant_id' => $merchantId,
                    'app_id'      => $app->id,
                    'app_name'    => $app->app_name,
                ]);
                return $app;
            }
        }

        // ── ثانياً: أي سجل لديه توكن (fallback) ──
        $app = $this->merchant->sallaApps()
            ->whereNotNull('access_token')
            ->first();

        Log::info('[TOKEN FETCH FALLBACK]', [
            'merchant_id'    => $merchantId,
            'app_found'      => $app?->id,
            'app_name'       => $app?->app_name,
            'token_decrypted'=> $app ? (!empty($app->access_token) ? 'yes' : 'empty') : 'no-app',
            'all_apps_count' => $this->merchant->sallaApps()->count(),
        ]);

        return $app;
    }

    protected function getAccessToken(): string
    {
        $sallaApp = $this->findSallaApp();

        if (!$sallaApp || empty($sallaApp->access_token)) {
            Log::error('[TOKEN MISSING]', [
                'merchant_id' => $this->merchant->id,
                'merchant_name' => $this->merchant->name,
                'all_apps'   => $this->merchant->sallaApps()->get(['id', 'app_name', 'access_token'])->toArray(),
            ]);
            throw new Exception("لم يتم العثور على access_token للتاجر {$this->merchant->id}");
        }

        return (string) $sallaApp->access_token;
    }

    protected function getRefreshToken(): string
    {
        $sallaApp = $this->findSallaApp();

        if (!$sallaApp) {
            Log::warning('[TOKEN REFRESH MISSING] لا يوجد تطبيق للتاجر', [
                'merchant_id' => $this->merchant->id,
            ]);
            return '';
        }

        $refreshToken = $sallaApp->refresh_token;

        Log::info('[TOKEN REFRESH CHECK]', [
            'merchant_id'   => $this->merchant->id,
            'app_id'        => $sallaApp->id,
            'app_name'      => $sallaApp->app_name,
            'has_refresh'   => !empty($refreshToken) ? 'yes' : 'no',
        ]);

        return (string) ($refreshToken ?? '');
    }

    protected function updateTokensInDb(string $accessToken, string $refreshToken, $expiresIn): void
    {
        $sallaApp = $this->findSallaApp();

        if ($sallaApp) {
            $updateData = [
                'access_token'  => $accessToken,
                'refresh_token' => $refreshToken,
            ];

            // expires_in → token_expires_at (الحقل الصحيح في جدول apps)
            if ($expiresIn !== null && $expiresIn !== '') {
                $updateData['token_expires_at'] = now()->addSeconds((int) $expiresIn);
            }

            $sallaApp->update($updateData);

            Log::info('[TOKEN UPDATED]', [
                'merchant_id'      => $this->merchant->id,
                'app_id'           => $sallaApp->id,
                'app_name'         => $sallaApp->app_name,
                'token_expires_at' => $updateData['token_expires_at'] ?? null,
            ]);
            return;
        }

        // Fallback: merchant table (قديم)
        Log::warning('[TOKEN UPDATE FALLBACK] لا يوجد سجل apps — تحديث merchant', [
            'merchant_id' => $this->merchant->id,
        ]);
        $this->merchant->update([
            'access_token'  => $accessToken,
            'refresh_token' => $refreshToken,
        ]);
    }

    protected function refreshAccessToken(): ?string
    {
        $refreshToken = $this->getRefreshToken();

        if ($refreshToken === '') {
            Log::error('[SallaApiService] لا يوجد Refresh Token للتاجر', [
                'merchant_id' => $this->merchant->id,
            ]);
            return null;
        }

        // ── استخدام client_id/client_secret الصحيح بناءً على app_name ──
        $sallaApp = $this->findSallaApp();
        $appName  = $sallaApp?->app_name;

        // الأسماء القديمة (management/calculator) → config الصحيح
        $configKey = $appName ? (self::APP_CONFIG_MAP[$appName] ?? "salla_{$appName}") : null;
        $config    = $configKey ? config("services.{$configKey}") : null;

        $clientId     = $config['client_id'] ?? env('SALLA_CLIENT_ID', config('services.salla.client_id'));
        $clientSecret = $config['client_secret'] ?? env('SALLA_CLIENT_SECRET', config('services.salla.client_secret'));

        Log::info('[TOKEN REFRESH REQUEST]', [
            'merchant_id'   => $this->merchant->id,
            'app_name'      => $appName,
            'client_id'     => $clientId ? substr($clientId, 0, 10) . '...' : 'MISSING',
            'has_secret'    => !empty($clientSecret) ? 'yes' : 'no',
        ]);

        $response = Http::asForm()->post($this->oauthUrl, [
            'grant_type'    => 'refresh_token',
            'refresh_token' => $refreshToken,
            'client_id'     => $clientId,
            'client_secret' => $clientSecret,
        ]);

        if ($response->successful()) {
            $data = $response->json() ?? [];
            if (!empty($data['access_token'])) {
                $this->updateTokensInDb(
                    (string) $data['access_token'],
                    (string) ($data['refresh_token'] ?? $refreshToken),
                    $data['expires_in'] ?? null
                );

                Log::info('[TOKEN REFRESH SUCCESS]', [
                    'merchant_id' => $this->merchant->id,
                    'app_name'    => $appName,
                ]);

                return (string) $data['access_token'];
            }
        }

        Log::error('[SallaApiService] فشل تجديد التوكن', [
            'merchant_id'   => $this->merchant->id,
            'app_name'      => $appName,
            'status'        => $response->status(),
            'body'          => $response->body(),
        ]);
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
     * ⚠️ الأهمية القصوى: نرسل ALL الحقول الموجودة حالياً من سلة
     * حتى لا تقوم سلة بتصفير أي قيمة غير مرسلة (خاصة stock_quantity).
     *
     * الترتيب:
     * 1. جلب بيانات الفاريينت الحالية من سلة
     * 2. بناء payload يحتوي على جميع القيم الحالية
     * 3. فقط override الحقول التي يريد المتصل تغييرها (sale_price, price)
     * 4. تجاهل stock_quantity من المتصل — نستخدم المخزون الحالي من سلة
     */
    public function updateBatchVariant(string $variantId, array $data): array
    {
        $variant = $this->getVariantDetails($variantId);
        $variantData = $variant['data'] ?? [];

        if (empty($variantData)) {
            throw new Exception("Variant {$variantId} غير موجود");
        }

        // ── استخراج القيم الحالية من سلة ────────────────
        $currentPrice   = (float) ($variantData['price']['amount'] ?? 0);
        $currentSku     = $variantData['sku'] ?? null;
        $currentStock   = (int) ($variantData['stock_quantity'] ?? 0);
        $currentSale    = (float) ($variantData['sale_price']['amount'] ?? 0);
        $currentBarcode = $variantData['barcode'] ?? null;
        $currentCost    = $variantData['cost_price']['amount'] ?? $variantData['cost_price'] ?? null;
        $currentWeight  = $variantData['weight'] ?? null;
        $currentMpn     = $variantData['mpn'] ?? null;
        $currentGtin    = $variantData['gtin'] ?? null;

        // ── بناء payload كامل ──────────────────────────
        // نستخدم القيم الحالية من سلة كـ default
        // ونسمح للمتصل بتغيير price + sale_price فقط
        $payload = [
            'price'          => $data['price'] ?? $currentPrice,
            'stock_quantity' => $currentStock,
            'sale_price'     => $currentSale,
        ];

        if ($currentSku) {
            $payload['sku'] = $currentSku;
        }
        if ($currentBarcode) {
            $payload['barcode'] = $currentBarcode;
        }
        if ($currentCost !== null) {
            $payload['cost_price'] = (float) $currentCost;
        }
        if ($currentWeight !== null) {
            $payload['weight'] = (int) $currentWeight;
        }
        if ($currentMpn !== null) {
            $payload['mpn'] = $currentMpn;
        }
        if ($currentGtin !== null) {
            $payload['gtin'] = $currentGtin;
        }

        // ── تطبيق sale_price المطلوب ──────────────────
        if (array_key_exists('sale_price', $data)) {
            $salePrice = $data['sale_price'];
            if ($salePrice === null || $salePrice === 0) {
                $payload['sale_price'] = 0;
            } elseif ($salePrice < ($data['price'] ?? $currentPrice)) {
                $payload['sale_price'] = $salePrice;
            } else {
                $payload['sale_price'] = 0;
            }
        }

        Log::info('[SALLA VARIANT UPDATE]', [
            'variant_id' => $variantId,
            'payload'    => $payload,
        ]);

        try {
            $response = $this->request('put', "products/variants/{$variantId}", $payload);

            Log::info('[SALLA VARIANT RESPONSE]', [
                'variant_id' => $variantId,
                'response'   => $response,
            ]);

            return $response;
        } catch (\Exception $e) {
            if (strpos($e->getMessage(), '422') !== false || strpos($e->getMessage(), 'invalid_fields') !== false) {
                Log::warning('[Variant Update] SKU مكرر - إعادة المحاولة بدون SKU');
                unset($payload['sku']);
                $response = $this->request('put', "products/variants/{$variantId}", $payload);

                Log::info('[SALLA VARIANT RESPONSE (no SKU)]', [
                    'variant_id' => $variantId,
                    'response'   => $response,
                ]);

                return $response;
            }
            throw $e;
        }
    }

    /**
     * تحديث كمية الـ Variant فقط (بدون تغيير السعر)
     * مع دعم الفروع عبر quantities
     */
    public function updateVariantQuantity(string $variantId, int $quantity, ?int $branchId = null, ?int $reasonId = null): array
    {
        $payload = [];

        // إذا كان هناك branch_id، نستخدم quantities
        if ($branchId) {
            $quantities = [
                'branch'    => (int) $branchId,
                'quantity'  => (int) $quantity,
            ];
            if ($reasonId) {
                $quantities['reason_id'] = (int) $reasonId;
            }
            $payload['quantities'] = [$quantities];
        } else {
            // تحديث الكمية العامة
            $payload['stock_quantity'] = (int) $quantity;
        }

        Log::info('[Variant Qty Update] payload:', $payload);

        return $this->request('put', "products/variants/{$variantId}", $payload);
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

    /**
     * تحديث سعر المنتج (للمنتجات بدون variants)
     * PUT /products/{product}
     *
     * ⚠️ نرسل price + sale_price فقط ولا نغير أي شيء آخر.
     * API سلة تحافظ على بقية الحقول عند إرسال حقول محددة.
     */
    public function updateProductPrice(string $sallaProductId, float $price, ?float $salePrice = null): array
    {
        $payload = [
            'price' => $price,
        ];

        if ($salePrice !== null) {
            $payload['sale_price'] = $salePrice;
        }

        Log::info('[SALLA PRODUCT PRICE UPDATE]', [
            'product_id' => $sallaProductId,
            'payload'    => $payload,
        ]);

        $response = $this->request('put', "products/{$sallaProductId}", $payload);

        Log::info('[SALLA PRODUCT PRICE RESPONSE]', [
            'product_id' => $sallaProductId,
            'response'   => $response,
        ]);

        return $response;
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

    /**
     * جلب تفاصيل خيار معين (مع القيم)
     * GET /products/options/{option}
     */
    public function getOptionDetails(string $optionId): array
    {
        return $this->request('get', "products/options/{$optionId}");
    }

    /**
     * جلب تفاصيل منتج واحد
     * GET /products/{product}
     */
    public function getProduct(string $sallaProductId): array
    {
        return $this->request('get', "products/{$sallaProductId}");
    }

    /**
     * جلب الفرع الافتراضي للمتجر
     * GET /branches
     */
    public function getDefaultBranch(): ?array
    {
        try {
            $response = $this->request('get', 'branches');
            $branches = $response['data'] ?? [];
            foreach ($branches as $branch) {
                if ($branch['is_default'] ?? false) {
                    return $branch;
                }
            }
            return $branches[0] ?? null;
        } catch (\Exception $e) {
            Log::warning('[GetDefaultBranch] Failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * تحديث كمية المنتج الرئيسي (للمنتجات بدون variants)
     * PUT /products/{product}
     */
    public function updateProductQuantity(string $sallaProductId, int $quantity): array
    {
        return $this->request('put', "products/{$sallaProductId}", [
            'quantity' => $quantity,
        ]);
    }
}