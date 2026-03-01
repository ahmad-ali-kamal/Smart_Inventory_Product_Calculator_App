<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Merchant;
use App\Models\Product;
use App\Models\ProductImage;
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
            $tokenData = $this->getAccessToken($request->code);
            $merchantInfo = $this->getMerchantInfo($tokenData['access_token']);

            // حفظ التاجر وتفعيل المزامنة
            $merchant = $this->saveOrUpdateMerchant($merchantInfo, $tokenData);

            Auth::login($merchant);

            return redirect()->route('welcome')
                ->with('success', 'مرحباً بك ' . $merchant->name . ' 🎉.. تم تحديث بياناتك ومنتجاتك بنجاح!');

        } catch (\Exception $e) {
            Log::error('Salla OAuth Error: ' . $e->getMessage());
            return redirect()->route('login')->with('error', 'خطأ: ' . $e->getMessage());
        }
    }

    /**
     * المزامنة اليدوية (Manual Sync)
     */
    public function manualSync()
    {
        try {
            $merchant = Auth::user();
            if (!$merchant) return response()->json(['success' => false, 'message' => 'غير مصرح لك.'], 401);

            $this->fetchProductsFromSalla($merchant);

            return response()->json([
                'success' => true,
                'message' => 'تمت المزامنة بنجاح! تم تحديث التصنيفات والصور.'
            ]);
        } catch (\Exception $e) {
            Log::error("Manual Sync Error: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'خطأ في المزامنة: ' . $e->getMessage()], 500);
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
        return redirect()->route('welcome')->with('success', 'تم تسجيل الخروج بنجاح.');
    }

    // ====================================================================
    // الدوال الخاصة (Private Methods)
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

        if ($response->failed()) throw new \Exception('فشل الحصول على التوكن: ' . $response->body());
        return $response->json();
    }

    private function getMerchantInfo(string $accessToken): array
    {
        $response = Http::withToken($accessToken)->get('https://accounts.salla.sa/oauth2/user/info');
        if ($response->failed()) throw new \Exception('فشل جلب بيانات التاجر.');
        return $response->json()['data'];
    }

    private function saveOrUpdateMerchant(array $info, array $tokenData): Merchant
    {
        $merchantData = $info['merchant'] ?? [];
        
        // جلب الإيميل بدقة من الرد
        $email = $merchantData['email'] ?? ($info['email'] ?? null);

        $merchant = Merchant::updateOrCreate(
            ['salla_merchant_id' => $merchantData['id']],
            [
                'name'             => $merchantData['name'] ?? 'تاجر سلة',
                'email'            => $email,
                'mobile'           => $merchantData['mobile'] ?? null,
                'access_token'     => $tokenData['access_token'],
                'refresh_token'    => $tokenData['refresh_token'] ?? null,
                'token_expires_at' => now()->addSeconds($tokenData['expires_in'] ?? 3600),
                'store_info'       => $info,
            ]
        );

        $this->fetchProductsFromSalla($merchant);
        return $merchant;
    }

    /**
     * جلب المنتجات وصورها وتصنيفاتها
     */
    private function fetchProductsFromSalla(Merchant $merchant)
    {
        try {
            $response = Http::withToken($merchant->access_token)
                ->get('https://api.salla.dev/admin/v2/products');

            if ($response->successful()) {
                $products = $response->json()['data'] ?? [];
                
                Log::info("جاري مزامنة " . count($products) . " منتج للتاجر: " . $merchant->name);

                foreach ($products as $p) {
                    // 1. استخراج التصنيف الرئيسي بدقة
                    $categoryName = 'General';
                    if (!empty($p['categories']) && is_array($p['categories'])) {
                        $mainCat = collect($p['categories'])->firstWhere('main', true) ?? $p['categories'][0];
                        $categoryName = $mainCat['name'] ?? 'General';
                    }

                    // 2. حفظ/تحديث المنتج
                    $product = Product::updateOrCreate(
                        ['merchant_id' => $merchant->id, 'salla_product_id' => $p['id']],
                        [
                            'name'     => $p['name'],
                            'price'    => $p['price']['amount'] ?? 0,
                            'sku'      => $p['sku'] ?? null,
                            'category' => $categoryName, // تحديث التصنيف
                            'status'   => $p['status'] ?? 'active',
                            'quantity' => $p['quantity'] ?? 0,
                            'synced_at' => now(),
                        ]
                    );

                    // 3. مسح الصور القديمة قبل إضافة الجديدة لتجنب التكرار (اختياري ولكن أفضل)
                    // ProductImage::where('product_id', $product->id)->delete();

                    // 4. معالجة الصور (تأكد أن $p['images'] مصفوفة)
                    if (!empty($p['images']) && is_array($p['images'])) {
                        foreach ($p['images'] as $index => $imgData) {
                            ProductImage::updateOrCreate(
                                [
                                    'product_id' => $product->id,
                                    'image_url'  => $imgData['url'], 
                                ],
                                [
                                    'is_main'    => $imgData['main'] ?? ($index === 0),
                                    'sort_order' => $imgData['sort'] ?? $index,
                                    'alt_text'   => $imgData['alt'] ?? $p['name'],
                                ]
                            );
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error("خطأ في مزامنة المنتجات: " . $e->getMessage());
        }
    }
}