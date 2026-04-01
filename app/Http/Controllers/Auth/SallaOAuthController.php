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
        // نتحقق من التطبيق المختار في الجلسة، والافتراضي هو حريص (management)
        $appType = session('salla_app_type', 'management'); 
        return config("services.salla_{$appType}");
    }

    /**
     * إعادة التوجيه لصفحة تسجيل الدخول في سلة
     * يمكن استدعاؤه كـ /auth/salla?app=calculator أو /auth/salla?app=management
     */
    public function redirect(Request $request)
    {
        // تحديد نوع التطبيق وحفظه في الجلسة ليعرفه الـ Callback لاحقاً
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
            // جلب الإعدادات بناءً على التطبيق الذي بدأ الطلب
            $config = $this->getAppConfig();

            $tokenData = $this->getAccessToken($request->code, $config);
            $merchantInfo = $this->getMerchantInfo($tokenData['access_token']);

            // حفظ التاجر وتفعيل الجووب للمزامنة
            $merchant = $this->saveOrUpdateMerchant($merchantInfo, $tokenData, $config);

            Auth::login($merchant);

            return redirect()->route('welcome')
                ->with('success', 'مرحباً بك ' . $merchant->name . ' 🎉.. تم ربط متجرك وجاري تحديث بياناتك!');

        } catch (\Exception $e) {
            Log::error('Salla OAuth Error: ' . $e->getMessage());
            return redirect()->route('login')->with('error', 'خطأ في الربط: ' . $e->getMessage());
        }
    }

    /**
     * تحديث بيانات التاجر وتفعيل الخدمة المناسبة
     */
    private function saveOrUpdateMerchant(array $info, array $tokenData, array $config): Merchant
    {
        $merchantData = $info['merchant'] ?? [];
        
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

        // تفعيل الخدمة بناءً على الـ Client ID المستخدم في عملية الدخول حالياً
        if ($config['client_id'] === env('SALLA_CALCULATOR_CLIENT_ID')) {
            $merchant->update(['has_calculator' => true]);
        } elseif ($config['client_id'] === env('SALLA_MANAGEMENT_CLIENT_ID')) {
            $merchant->update(['has_management' => true]);
        }

        // إطلاق الجووب للمزامنة
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
    // الدوال المحدثة لتقبل الإعدادات (Config)
    // ====================================================================

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