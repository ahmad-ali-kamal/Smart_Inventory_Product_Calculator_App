<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Merchant;
use App\Jobs\FetchProductsJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class SallaOAuthController extends Controller
{
    /**
     * تحديد أي تطبيق يتم استخدامه حالياً بناءً على الجلسة أو المعاملات
     */
    private function getAppConfig()
    {
        $appType = session('salla_app_type', 'management'); 
        return config("services.salla_{$appType}");
    }

    /**
     * إعادة التوجيه لصفحة تسجيل الدخول في سلة
     */
    public function redirect(Request $request)
    {
        $appType = $request->get('app', 'management'); 
        session(['salla_app_type' => $appType]);

        $config = config("services.salla_{$appType}");
        $state = Str::random(40);
        session(['oauth_state' => $state]);

        $query = http_build_query([
            'client_id'     => $config['client_id'],
            'redirect_uri'  => $config['redirect'],
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
            $config = $this->getAppConfig();

            $tokenData = $this->getAccessToken($request->code, $config);
            $merchantInfo = $this->getMerchantInfo($tokenData['access_token']);

            $merchant = $this->saveOrUpdateMerchant($merchantInfo, $tokenData, $config);

            Auth::login($merchant);

            return redirect(
    session('salla_app_type') === 'calculator'
        ? '/mustashar/dashboard'
        : '/harees/dashboard'
);
             

        } catch (\Exception $e) {
            Log::error('Salla OAuth Error: ' . $e->getMessage());
            return redirect()->route('login')->with('error', 'خطأ في الربط: ' . $e->getMessage());
        }
    }

    /**
     * تحديث بيانات التاجر وحفظ التوكنات
     */
    private function saveOrUpdateMerchant(array $info, array $tokenData, array $config): Merchant
    {
        $merchantData = $info['merchant'] ?? [];
        $appType = session('salla_app_type', 'management');
        
        // 1. تحديث بيانات التاجر الأساسية
        $merchant = Merchant::updateOrCreate(
            ['salla_merchant_id' => $merchantData['id']],
            [
                'name'       => $merchantData['name'] ?? 'تاجر سلة',
                'email'      => $merchantData['email'] ?? ($info['email'] ?? null),
                'mobile'     => $merchantData['mobile'] ?? null,
                'store_info' => $info,
            ]
        );

        // 2. تحديث بيانات التطبيق والتوكنات (التعامل مع العلاقة بشكل صحيح)
        // سيقوم بتحديث السجل إذا وجد نفس الـ app_name لهذا التاجر، أو إنشاء سجل جديد
        $merchant->sallaApps()->updateOrCreate(
            [
                'app_name' => $appType, 
            ],
            [
                'client_id'        => $config['client_id'],
                'access_token'     => $tokenData['access_token'],
                'refresh_token'    => $tokenData['refresh_token'] ?? null,
                'token_expires_at' => now()->addSeconds($tokenData['expires_in'] ?? 3600),
            ]
        );

        // 3. تحديث الأعلام (Flags)
        if ($appType === 'calculator') {
            $merchant->update(['has_calculator' => true]);
        } else {
            $merchant->update(['has_management' => true]);
        }

        FetchProductsJob::dispatch($merchant, 1);

        return $merchant;
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect()->route('welcome')->with('success', 'تم تسجيل الخروج.');
    }

    private function getAccessToken(string $code, array $config): array
    {
        $response = Http::asForm()->post('https://accounts.salla.sa/oauth2/token', [
            'grant_type'    => 'authorization_code',
            'client_id'     => $config['client_id'],
            'client_secret' => $config['client_secret'],
            'redirect_uri'  => $config['redirect'],
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