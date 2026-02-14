<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Merchant;
use App\Services\SallaApiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;

class AuthController extends Controller
{
    /**
     * عرض صفحة تسجيل الدخول
     */
    public function showLogin()
    {
        return Inertia::render('Auth/Login');
    }

    /**
     * تسجيل دخول التاجر بالإيميل
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'salla_merchant_id' => 'required|string',
        ]);

        // البحث عن التاجر
        $merchant = Merchant::where('email', $request->email)
            ->where('salla_merchant_id', $request->salla_merchant_id)
            ->first();

        if (!$merchant) {
            // إنشاء تاجر جديد
            $merchant = $this->createMerchant($request);
            
            // إرسال إيميل التحقق
            $this->sendVerificationEmail($merchant);

            return back()->with('info', 'تم إرسال رابط التحقق إلى بريدك الإلكتروني');
        }

        // التحقق من أن الإيميل مُفعّل
        if (!$merchant->isEmailVerified()) {
            // إعادة إرسال إيميل التحقق
            $merchant->generateVerificationToken();
            $this->sendVerificationEmail($merchant);

            return back()->with('info', 'يرجى تفعيل بريدك الإلكتروني. تم إرسال رابط التحقق مرة أخرى');
        }

        // تسجيل الدخول
        Auth::login($merchant);

        return redirect()->route('dashboard');
    }

    /**
     * التحقق من الإيميل
     */
    public function verifyEmail(Request $request, string $token)
    {
        $merchant = Merchant::where('verification_token', $token)->first();

        if (!$merchant) {
            return redirect()->route('login')
                ->with('error', 'رابط التحقق غير صحيح');
        }

        // تفعيل الحساب
        $merchant->markEmailAsVerified();

        // جلب بيانات المتجر من سلة
        try {
            $this->fetchMerchantData($merchant);
        } catch (\Exception $e) {
            // يمكن المتابعة حتى لو فشل جلب البيانات
            \Log::warning('Failed to fetch merchant data during verification', [
                'merchant_id' => $merchant->id,
                'error' => $e->getMessage(),
            ]);
        }

        // تسجيل الدخول
        Auth::login($merchant);

        return redirect()->route('dashboard')
            ->with('success', 'تم تفعيل حسابك بنجاح!');
    }

    /**
     * تسجيل الخروج
     */
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }

    /**
     * إعادة إرسال إيميل التحقق
     */
    public function resendVerification(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:merchants,email',
        ]);

        $merchant = Merchant::where('email', $request->email)->first();

        if ($merchant->isEmailVerified()) {
            return back()->with('info', 'حسابك مُفعّل بالفعل');
        }

        $merchant->generateVerificationToken();
        $this->sendVerificationEmail($merchant);

        return back()->with('success', 'تم إرسال رابط التحقق مرة أخرى');
    }

    /**
     * إنشاء تاجر جديد
     */
    protected function createMerchant(Request $request): Merchant
    {
        $merchant = Merchant::create([
            'salla_merchant_id' => $request->salla_merchant_id,
            'email' => $request->email,
            'store_name' => $request->store_name ?? 'متجر جديد',
            'is_active' => false,
        ]);

        $merchant->generateVerificationToken();

        return $merchant;
    }

    /**
     * إرسال إيميل التحقق
     */
    protected function sendVerificationEmail(Merchant $merchant): void
    {
        $verificationUrl = route('auth.verify-email', ['token' => $merchant->verification_token]);

        // TODO: إرسال الإيميل الفعلي
        // Mail::to($merchant->email)->send(new VerifyEmail($verificationUrl));
        
        // للتطوير: طباعة الرابط في الـLogs
        \Log::info('Verification Email', [
            'merchant_id' => $merchant->id,
            'email' => $merchant->email,
            'url' => $verificationUrl,
        ]);
    }

    /**
     * جلب بيانات التاجر من سلة
     */
    protected function fetchMerchantData(Merchant $merchant): void
    {
        // إذا لم يكن لدينا access token، نتخطى
        if (!$merchant->access_token) {
            return;
        }

        $sallaApi = SallaApiService::for($merchant);
        $storeInfo = $sallaApi->getStoreInfo();

        if ($storeInfo) {
            $merchant->update([
                'store_name' => $storeInfo['name'] ?? $merchant->store_name,
                'store_info' => $storeInfo,
            ]);
        }
    }
}