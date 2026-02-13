<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Merchant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class SallaOAuthController extends Controller
{
    /**
     * عرض صفحة تسجيل الدخول
     */
    public function login()
    {
        return Inertia::render('Auth/Login');
    }

    /**
     * توجيه المستخدم إلى صفحة تسجيل الدخول في سلة
     */
    public function redirect()
    {
        $params = http_build_query([
            'client_id' => config('salla.client_id'),
            'redirect_uri' => config('salla.redirect_uri'),
            'response_type' => 'code',
            'scope' => 'offline_access',
        ]);

        return redirect(config('salla.oauth_url') . '/authorize?' . $params);
    }

    /**
     * معالجة callback من سلة
     */
    public function callback(Request $request)
    {
        if (!$request->has('code')) {
            return redirect()->route('login')
                ->with('error', 'فشل تسجيل الدخول');
        }

        try {
            // الحصول على access token
            $response = Http::post(config('salla.oauth_url') . '/token', [
                'grant_type' => 'authorization_code',
                'client_id' => config('salla.client_id'),
                'client_secret' => config('salla.client_secret'),
                'redirect_uri' => config('salla.redirect_uri'),
                'code' => $request->code,
            ]);

            if ($response->failed()) {
                throw new \Exception('Failed to get access token');
            }

            $tokenData = $response->json();

            // الحصول على معلومات المتجر
            $storeResponse = Http::withToken($tokenData['access_token'])
                ->get(config('salla.api_url') . '/store/info');

            if ($storeResponse->failed()) {
                throw new \Exception('Failed to get store info');
            }

            $storeData = $storeResponse->json()['data'] ?? [];

            // إنشاء أو تحديث التاجر
            $merchant = Merchant::updateOrCreate(
                ['salla_merchant_id' => $storeData['id']],
                [
                    'store_name' => $storeData['name'] ?? 'Unknown Store',
                    'email' => $storeData['email'] ?? null,
                    'access_token' => $tokenData['access_token'],
                    'refresh_token' => $tokenData['refresh_token'],
                    'token_expires_at' => now()->addSeconds($tokenData['expires_in']),
                    'store_info' => $storeData,
                    'is_active' => true,
                ]
            );

            // تسجيل دخول التاجر
            Auth::guard('web')->loginUsingId($merchant->id);

            return redirect()->route('dashboard')
                ->with('success', 'تم تسجيل الدخول بنجاح');

        } catch (\Exception $e) {
            report($e);

            return redirect()->route('login')
                ->with('error', 'حدث خطأ أثناء تسجيل الدخول');
        }
    }

    /**
     * تسجيل الخروج
     */
    public function logout(Request $request)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}