<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Merchant;
use App\Jobs\FetchProductsJob; // استيراد الجووب الجديد
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

            // حفظ التاجر وتفعيل الجووب للمزامنة في الخلفية
            $merchant = $this->saveOrUpdateMerchant($merchantInfo, $tokenData);

            Auth::login($merchant);

            return redirect()->route('welcome')
                ->with('success', 'مرحباً بك ' . $merchant->name . ' 🎉.. تم ربط متجرك وجاري تحديث بياناتك في الخلفية!');

        } catch (\Exception $e) {
            Log::error('Salla OAuth Error: ' . $e->getMessage());
            return redirect()->route('login')->with('error', 'خطأ في الربط: ' . $e->getMessage());
        }
    }

    /**
     * تحديث بيانات التاجر وتحديد نوع الخدمة وتفعيل المزامنة
     */
    private function saveOrUpdateMerchant(array $info, array $tokenData): Merchant
    {
        $merchantData = $info['merchant'] ?? [];
        $currentClientId = config('services.salla.client_id');
        
        $merchant = Merchant::updateOrCreate(
            ['salla_merchant_id' => $merchantData['id']],
            [
                'name'             => $merchantData['name'] ?? 'تاجر سلة',
                'email'            => $merchantData['email'] ?? ($info['email'] ?? null),
                'mobile'           => $merchantData['mobile'] ?? null,
                'access_token'     => $tokenData['access_token'],
                'refresh_token'    => $tokenData['refresh_token'] ?? null,
                'token_expires_at' => now()->addSeconds($tokenData['expires_in'] ?? 3600),
                'store_info'       => $info,
            ]
        );

        // 1. تفعيل الخدمة بناءً على الـ Client ID
        if ($currentClientId === env('SALLA_CALCULATOR_CLIENT_ID')) {
            $merchant->update(['has_calculator' => true]);
        } elseif ($currentClientId === env('SALLA_MANAGEMENT_CLIENT_ID')) {
            $merchant->update(['has_management' => true]);
        }

        // 2. 🔥 إطلاق الجووب في الخلفية (Background Thread)
        // يبدأ من الصفحة رقم 1، وإذا تعثر سيعيد المحاولة تلقائياً (Hold)
        FetchProductsJob::dispatch($merchant, 1);

        return $merchant;
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
    // الدوال الخاصة بجلب التوكن والبيانات
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
}