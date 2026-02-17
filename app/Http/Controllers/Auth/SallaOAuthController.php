<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Merchant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

// تأكد من وجود هذا الملف لاحقاً لجلب المنتجات
use App\Services\SallaApiService; 

class SallaOAuthController extends Controller
{
    /**
     * إعادة التوجيه لصفحة تسجيل الدخول في سلة
     */
    public function redirect()
    {
        // 1. إنشاء رمز عشوائي للتحقق من الأمان (CSRF Protection)
        $state = Str::random(40);
        session(['oauth_state' => $state]);

        // 2. بناء رابط التوجيه مع الباراميترات المطلوبة
        $query = http_build_query([
            'client_id'     => config('services.salla.client_id'),
            'redirect_uri'  => config('services.salla.callback_url'),
            'response_type' => 'code',
            'scope'         => 'offline_access', // لمنح صلاحية العمل في الخلفية
            'state'         => $state,
        ]);

        return redirect('https://accounts.salla.sa/oauth2/auth?' . $query);
    }

    /**
     * معالجة الـCallback القادم من سلة بعد تسجيل الدخول
     */
    public function callback(Request $request)
    {
        // 1. التحقق من تطابق الـ State (للحماية من هجمات CSRF)
        if ($request->state !== session('oauth_state')) {
            return redirect()->route('login')->with('error', 'انتهت صلاحية الجلسة، يرجى المحاولة مرة أخرى.');
        }

        // 2. التحقق من وجود كود التفويض
        if (!$request->has('code')) {
            return redirect()->route('login')->with('error', 'فشل تسجيل الدخول. لم يتم استلام كود التفويض من سلة.');
        }

        try {
            // الخطوة 1: استبدال الكود بـ Access Token
            $tokenData = $this->getAccessToken($request->code);

            // الخطوة 2: جلب معلومات التاجر من سلة
            $merchantInfo = $this->getMerchantInfo($tokenData['access_token']);

            // الخطوة 3: حفظ أو تحديث التاجر في قاعدة البيانات
            $merchant = $this->saveOrUpdateMerchant($merchantInfo, $tokenData);

            // الخطوة 4: تسجيل دخول التاجر في التطبيق
            Auth::login($merchant);

            // الخطوة 5: ✅ التوجيه لصفحة Welcome (الرئيسية) بدلاً من Dashboard
            return redirect()->route('welcome')
                ->with('success', 'مرحباً بك ' . $merchant->name . ' 🎉.. تم تسجيل الدخول بنجاح!');

        } catch (\Exception $e) {
            // تسجيل الخطأ في ملفات اللوج للرجوع إليه
            Log::error('Salla OAuth Login Error: ' . $e->getMessage());

            return redirect()->route('login')
                ->with('error', 'حدث خطأ أثناء الاتصال بسلة: ' . $e->getMessage());
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
    // Private Methods (دوال مساعدة خاصة)
    // ====================================================================

    /**
     * طلب Access Token من سلة
     */
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
            throw new \Exception('فشل استبدال الكود بالتوكن: ' . $response->body());
        }

        return $response->json();
    }

    /**
     * جلب بيانات التاجر من API سلة
     */
    private function getMerchantInfo(string $accessToken): array
    {
        $response = Http::withToken($accessToken)
            ->get('https://accounts.salla.sa/oauth2/user/info');

        if ($response->failed()) {
            throw new \Exception('فشل جلب بيانات المستخدم: ' . $response->body());
        }

        return $response->json()['data'];
    }

    /**
     * حفظ التاجر في قاعدة البيانات ومحاولة جلب المنتجات
     */
    private function saveOrUpdateMerchant(array $info, array $tokenData): Merchant
    {
        // تحديث أو إنشاء التاجر
        $merchant = Merchant::updateOrCreate(
            ['salla_merchant_id' => $info['merchant']['id']],
            [
                'name'             => $info['merchant']['name'] ?? 'تاجر سلة',
                'email'            => $info['merchant']['email'] ?? null,
                'mobile'           => $info['merchant']['mobile'] ?? null,
                'access_token'     => $tokenData['access_token'],
                'refresh_token'    => $tokenData['refresh_token'] ?? null,
                'token_expires_at' => now()->addSeconds($tokenData['expires_in'] ?? 3600),
                'store_info'       => $info,
            ]
        );

        /*
         * محاولة مزامنة المنتجات فوراً (اختياري)
         * نضعها داخل try-catch حتى لا يتوقف التطبيق إذا كان ملف السيرفس غير موجود
         */
        try {
            if (class_exists(SallaApiService::class)) {
                $sallaService = new SallaApiService($merchant);
                // تأكد أن دالة syncProducts موجودة في السيرفس
                if (method_exists($sallaService, 'syncProducts')) {
                    $sallaService->syncProducts();
                }
            }
        } catch (\Exception $e) {
            // نكتفي بتسجيل تحذير ونكمل تسجيل الدخول
            Log::warning('Product Sync Warning: ' . $e->getMessage());
        }

        return $merchant;
    }
}