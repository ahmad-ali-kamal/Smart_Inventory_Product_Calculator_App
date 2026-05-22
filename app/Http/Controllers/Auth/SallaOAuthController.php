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
    private array $validApps = ['mustashar', 'harees'];

    private function validateAppType(string $appType): string
    {
        return in_array($appType, $this->validApps, true) ? $appType : 'harees';
    }

    private function getAppConfig(?string $appType = null): ?array
    {
        $appType = $appType ?? session('salla_app_type', 'harees');
        $appType = $this->validateAppType($appType);
        return config("services.salla_{$appType}");
    }

    public function redirect(Request $request)
    {
        $appType = $this->validateAppType($request->get('app', 'harees'));
        session(['salla_app_type' => $appType]);

        $config = config("services.salla_{$appType}");

        if (!$config || !isset($config['client_id'], $config['redirect'])) {
            Log::error('Salla OAuth: Missing config for app type', [
                'appType' => $appType,
                'configKey' => "services.salla_{$appType}",
                'hasClientId' => isset($config['client_id']),
                'hasRedirect' => isset($config['redirect']),
            ]);
            $routeName = $appType === 'mustashar' ? 'mustashar.login' : 'harees.login';
            return redirect()->route($routeName)->with('error', 'خطأ في الإعدادات الداخلية، حاول مرة أخرى لاحقاً.');
        }

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
    $appType = $this->validateAppType(session('salla_app_type', 'harees'));
    $route = $appType === 'mustashar' ? 'mustashar.login' : 'harees.login';
    $dashboard = $appType === 'mustashar' ? '/mustashar/dashboard' : '/harees/dashboard';

    if ($request->state !== session('oauth_state')) {
        return redirect()->route($route)->with('error', 'انتهت صلاحية الجلسة، حاول مرة أخرى.');
    }

    if (!$request->has('code')) {
        return redirect()->route($route)->with('error', 'لم يتم الحصول على رمز التفويض.');
    }

    try {
        $config = $this->getAppConfig($appType);

        if (!$config) {
            Log::error('Salla OAuth callback: Missing config', ['appType' => $appType]);
            return redirect()->route($route)->with('error', 'خطأ في الإعدادات الداخلية.');
        }

        $tokenData = $this->getAccessToken($request->code, $config);
        $merchantInfo = $this->getMerchantInfo($tokenData['access_token']);
        $merchant = $this->saveOrUpdateMerchant($merchantInfo, $tokenData, $config);
        Auth::login($merchant);

        return redirect($dashboard);

    } catch (\Exception $e) {
        Log::error('Salla OAuth Error: ' . $e->getMessage(), [
            'appType' => $appType,
            'trace' => $e->getTraceAsString(),
        ]);
        return redirect()->route($route)->with('error', 'خطأ في الربط، حاول مرة أخرى.');
    }
}
    /**
     * تحديث بيانات التاجر وحفظ التوكنات
     */
    private function saveOrUpdateMerchant(array $info, array $tokenData, array $config): Merchant
    {
        $merchantData = $info['merchant'] ?? [];
        $appType = $this->validateAppType(session('salla_app_type', 'harees'));
        
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
        if ($appType === 'mustashar') {
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
        return redirect()->route('home')->with('success', 'logged out successfully');
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
    $response = Http::withToken($accessToken)
        ->get('https://api.salla.dev/admin/v2/oauth2/user/info');
    
    if ($response->failed()) {
        throw new \Exception('فشل جلب بيانات التاجر. Status: ' . $response->status() . ' Body: ' . $response->body());
    }
    
    return $response->json()['data'];
}
}