<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Merchant;
use App\Services\SallaApiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class SallaOAuthController extends Controller
{
    /**
     * إعادة التوجيه لصفحة تسجيل الدخول في سلة
     */
    public function redirect()
    {
        $params = [
            'client_id' => config('salla.client_id'),
            'redirect_uri' => config('salla.redirect_uri'),
            'response_type' => 'code',
            'scope' => 'offline_access',
            'state' => Str::random(40),
        ];

        session(['oauth_state' => $params['state']]);

        $query = http_build_query($params);
        $authUrl = config('salla.authorization_url') . '?' . $query;

        return redirect($authUrl);
    }

    /**
     * معالجة Callback من سلة
     */
    public function callback(Request $request)
    {
        // التحقق من الـstate
        if ($request->state !== session('oauth_state')) {
            return redirect()->route('login')
                ->with('error', 'Invalid state parameter');
        }

        // التحقق من وجود الـcode
        if (!$request->has('code')) {
            return redirect()->route('login')
                ->with('error', 'Authorization failed');
        }

        try {
            // الحصول على Access Token
            $tokenData = $this->getAccessToken($request->code);

            // الحصول على معلومات التاجر من سلة
            $merchantData = $this->getMerchantInfo($tokenData['access_token']);

            // إنشاء أو تحديث التاجر
            $merchant = $this->createOrUpdateMerchant($merchantData, $tokenData);

            // تسجيل الدخول
            Auth::login($merchant);

            return redirect()->route('dashboard')
                ->with('success', 'مرحباً بك في Salla Merchant App!');

        } catch (\Exception $e) {
            \Log::error('OAuth callback failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->route('login')
                ->with('error', 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.');
        }
    }

    /**
     * الحصول على Access Token من سلة
     */
    protected function getAccessToken(string $code): array
    {
        $response = \Http::asForm()->post(config('salla.token_url'), [
            'grant_type' => 'authorization_code',
            'client_id' => config('salla.client_id'),
            'client_secret' => config('salla.client_secret'),
            'redirect_uri' => config('salla.redirect_uri'),
            'code' => $code,
        ]);

        if (!$response->successful()) {
            throw new \Exception('Failed to get access token: ' . $response->body());
        }

        return $response->json();
    }

    /**
     * الحصول على معلومات التاجر من سلة
     */
    protected function getMerchantInfo(string $accessToken): array
    {
        $response = \Http::withToken($accessToken)
            ->get(config('salla.api_url') . '/oauth2/user/info');

        if (!$response->successful()) {
            throw new \Exception('Failed to get merchant info: ' . $response->body());
        }

        return $response->json()['data'];
    }

    /**
     * إنشاء أو تحديث التاجر
     */
    protected function createOrUpdateMerchant(array $merchantData, array $tokenData): Merchant
    {
        return Merchant::updateOrCreate(
            [
                'salla_merchant_id' => $merchantData['merchant']['id'],
            ],
            [
                'email' => $merchantData['merchant']['email'],
                'store_name' => $merchantData['merchant']['name'] ?? 'متجر جديد',
                'access_token' => $tokenData['access_token'],
                'refresh_token' => $tokenData['refresh_token'],
                'token_expires_at' => now()->addSeconds($tokenData['expires_in']),
                'store_info' => $merchantData,
                'is_active' => true,
            ]
        );
    }

    /**
     * تسجيل الخروج
     */
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')
            ->with('success', 'تم تسجيل الخروج بنجاح');
    }
}