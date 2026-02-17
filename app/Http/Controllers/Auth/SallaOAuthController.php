<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Merchant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SallaOAuthController extends Controller
{
    /**
     * توجيه التاجر إلى صفحة تسجيل الدخول في سلة (Authorize)
     */
    public function redirect()
    {
        // توليد State لمنع هجمات CSRF
        $state = Str::random(40);
        session(['oauth_state' => $state]);

        $params = [
            'client_id'     => config('services.salla.client_id'),
            'redirect_uri'  => config('services.salla.callback_url'),
            'response_type' => 'code',
            'scope' => 'offline_access', // 👈 اجعلها هكذا فقط للتجربة الآن
            'state'         => $state,
        ];

        $authUrl = 'https://accounts.salla.sa/oauth2/auth?' . http_build_query($params);

        return redirect($authUrl);
    }

    /**
     * معالجة الرد (Callback) القادم من سلة بعد موافقة التاجر
     */
    public function callback(Request $request)
    {
        // 1. التحقق من الـ State لضمان أمان الطلب
        if ($request->state !== session('oauth_state')) {
            return redirect()->route('login')->with('error', 'انتهت صلاحية الجلسة، يرجى المحاولة مرة أخرى.');
        }

        // 2. التحقق من وجود الكود
        if (!$request->has('code')) {
            return redirect()->route('login')->with('error', 'فشلت عملية المصادقة مع سلة.');
        }

        try {
            // 3. استبدال الـ Code بـ Access Token
            $tokenData = $this->getAccessToken($request->code);

            // 4. جلب معلومات التاجر والمتجر باستخدام التوكن الجديد
            $merchantInfo = $this->getMerchantInfo($tokenData['access_token']);

            // 5. إنشاء أو تحديث بيانات التاجر في قاعدة البيانات
            $merchant = $this->createOrUpdateMerchant($merchantInfo, $tokenData);

            // 6. تسجيل الدخول يدوياً للتاجر
            Auth::login($merchant);

            return redirect()->route('dashboard')
                ->with('success', 'تم تسجيل الدخول بنجاح! مرحباً بك في لوحة التحكم.');

        } catch (\Exception $e) {
            Log::error('Salla OAuth Error: ' . $e->getMessage());
            
            return redirect()->route('login')
                ->with('error', 'حدث خطأ أثناء الاتصال بسلة. يرجى المحاولة لاحقاً.');
        }
    }

    /**
     * طلب Access Token من خوادم سلة
     */
    protected function getAccessToken(string $code): array
    {
        $response = Http::asForm()->post('https://accounts.salla.sa/oauth2/token', [
            'grant_type'    => 'authorization_code',
            'client_id'     => config('services.salla.client_id'),
            'client_secret' => config('services.salla.client_secret'),
            'redirect_uri'  => config('services.salla.callback_url'),
            'code'          => $code,
        ]);

        if (!$response->successful()) {
            throw new \Exception('Failed to exchange code for token: ' . $response->body());
        }

        return $response->json();
    }

    /**
     * جلب تفاصيل التاجر من API سلة
     */
    protected function getMerchantInfo(string $accessToken): array
    {
        $response = Http::withToken($accessToken)
            ->get('https://accounts.salla.sa/oauth2/user/info');

        if (!$response->successful()) {
            throw new \Exception('Failed to fetch merchant info: ' . $response->body());
        }

        // استخراج البيانات من داخل مفتاح 'data' حسب توثيق سلة
        return $response->json()['data'];
    }

    /**
     * حفظ بيانات التاجر في قاعدة البيانات
     */
    protected function createOrUpdateMerchant(array $data, array $tokenData): Merchant
    {
        return Merchant::updateOrCreate(
            ['salla_merchant_id' => $data['merchant']['id']],
            [
                'store_name'       => $data['merchant']['name'] ?? 'متجر سلة',
                'email'            => $data['merchant']['email'],
                'access_token'     => $tokenData['access_token'],
                'refresh_token'    => $tokenData['refresh_token'],
                // تحويل expires_in (ثواني) إلى تاريخ وقت حقيقي
                'token_expires_at' => now()->addSeconds($tokenData['expires_in']),
                'store_info'       => $data,
                'is_active'        => true,
            ]
        );
    }

    /**
     * تسجيل الخروج وإبطال الجلسة
     */
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->with('success', 'تم تسجيل الخروج بنجاح.');
    }
}