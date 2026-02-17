<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Merchant;
use App\Models\Product; // تأكد من استدعاء مودل المنتج
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class SallaOAuthController extends Controller
{
    /**
     * إعادة التوجيه لصفحة تسجيل الدخول في سلة
     */
    public function redirect()
    {
        $state = Str::random(40);
        session(['oauth_state' => $state]);

        $query = http_build_query([
            'client_id'     => config('services.salla.client_id'),
            'redirect_uri'  => config('services.salla.callback_url'),
            'response_type' => 'code',
            'scope'         => 'offline_access', 
            'state'         => $state,
        ]);

        return redirect('https://accounts.salla.sa/oauth2/auth?' . $query);
    }

    /**
     * معالجة الـCallback وجلب التوكن ومعلومات التاجر
     */
    public function callback(Request $request)
    {
        if ($request->state !== session('oauth_state')) {
            return redirect()->route('login')->with('error', 'انتهت صلاحية الجلسة، حاول مرة أخرى.');
        }

        if (!$request->has('code')) {
            return redirect()->route('login')->with('error', 'لم يتم الحصول على رمز التفويض.');
        }

        try {
            // 1. الحصول على Access Token
            $tokenData = $this->getAccessToken($request->code);

            // 2. جلب معلومات التاجر (التعديل لضمان جلب الإيميل)
            $merchantInfo = $this->getMerchantInfo($tokenData['access_token']);

            // 3. حفظ التاجر وجلب منتجاته
            $merchant = $this->saveOrUpdateMerchant($merchantInfo, $tokenData);

            // 4. تسجيل الدخول
            Auth::login($merchant);

            return redirect()->route('welcome')
                ->with('success', 'مرحباً بك ' . $merchant->name . ' 🎉.. تم تحديث بياناتك ومنتجاتك!');

        } catch (\Exception $e) {
            Log::error('Salla OAuth Error: ' . $e->getMessage());
            return redirect()->route('login')->with('error', 'خطأ: ' . $e->getMessage());
        }
    }

    /**
     * تسجيل الخروج
     */
    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect()->route('welcome')->with('success', 'تم تسجيل الخروج.');
    }

    // ====================================================================
    // Private Methods
    // ====================================================================

    private function getAccessToken(string $code): array
    {
        $response = Http::asForm()->post('https://accounts.salla.sa/oauth2/token', [
            'grant_type'    => 'authorization_code',
            'client_id'     => config('services.salla.client_id'),
            'client_secret' => config('services.salla.client_secret'),
            'redirect_uri'  => config('services.salla.callback_url'),
            'code'          => $code,
        ]);

        if ($response->failed()) {
            throw new \Exception('فشل استبدال التوكن: ' . $response->body());
        }

        return $response->json();
    }

    private function getMerchantInfo(string $accessToken): array
    {
        // استخدام الهيدر المعتمد في سلة
        $response = Http::withToken($accessToken)
            ->get('https://accounts.salla.sa/oauth2/user/info');

        if ($response->failed()) {
            throw new \Exception('فشل جلب بيانات التاجر.');
        }

        return $response->json()['data'];
    }

    private function saveOrUpdateMerchant(array $info, array $tokenData): Merchant
    {
        // استخراج البيانات من مصفوفة merchant كما تأتي من سلة
        $merchantData = $info['merchant'] ?? [];

        $merchant = Merchant::updateOrCreate(
            ['salla_merchant_id' => $merchantData['id']],
            [
                'name'             => $merchantData['name'] ?? 'تاجر سلة',
                'email'            => $merchantData['email'] ?? ($info['email'] ?? null), // محاولة جلب الإيميل من أكثر من مسار
                'mobile'           => $merchantData['mobile'] ?? null,
                'access_token'     => $tokenData['access_token'],
                'refresh_token'    => $tokenData['refresh_token'] ?? null,
                'token_expires_at' => now()->addSeconds($tokenData['expires_in'] ?? 3600),
                'store_info'       => $info,
            ]
        );

        // ✅ جلب المنتجات فوراً بعد نجاح تسجيل الدخول
        $this->fetchProductsFromSalla($merchant);

        return $merchant;
    }

    /**
     * جلب المنتجات باستخدام Salla Admin API v2
     */
    private function fetchProductsFromSalla(Merchant $merchant)
    {
        try {
            // استدعاء Endpoint المنتجات (Get Products)
            $response = Http::withToken($merchant->access_token)
                ->get('https://api.salla.dev/admin/v2/products');

            if ($response->successful()) {
                $products = $response->json()['data'] ?? [];

                foreach ($products as $p) {
                    Product::updateOrCreate(
                        [
                            'merchant_id'      => $merchant->id,
                            'salla_product_id' => $p['id'],
                        ],
                        [
                            'name'  => $p['name'],
                            'price' => $p['price']['amount'] ?? 0,
                            'sku'   => $p['sku'] ?? null,
                            // يمكن إضافة حقول أخرى مثل الصورة: 'image' => $p['main_image'] ?? null
                        ]
                    );
                }
                Log::info("Success: Fetched " . count($products) . " products for " . $merchant->name);
            }
        } catch (\Exception $e) {
            Log::error("Product Fetch Error: " . $e->getMessage());
        }
    }
}