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

    public function callback(Request $request)
    {
        if ($request->state !== session('oauth_state')) {
            return redirect()->route('login')->with('error', 'انتهت صلاحية الجلسة، حاول مرة أخرى.');
        }

        try {
            $tokenData = $this->getAccessToken($request->code);
            $merchantInfo = $this->getMerchantInfo($tokenData['access_token']);

            // حفظ التاجر وتحديث صلاحيات الخدمات (بدون مزامنة تلقائية)
            $merchant = $this->saveOrUpdateMerchant($merchantInfo, $tokenData);

            Auth::login($merchant);

            return redirect()->route('welcome')
                ->with('success', 'مرحباً بك ' . $merchant->name . ' 🎉.. تم ربط متجرك بنجاح!');

        } catch (\Exception $e) {
            Log::error('Salla OAuth Error: ' . $e->getMessage());
            return redirect()->route('login')->with('error', 'خطأ في الربط: ' . $e->getMessage());
        }
    }

    /**
     * تحديث بيانات التاجر وتحديد نوع التطبيق المثبت
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

        // تفعيل الخدمة بناءً على الـ Client ID المستخدم حالياً
        // افترضنا أنك وضعت الـ ID في ملف الـ .env
        if ($currentClientId === env('SALLA_CALCULATOR_CLIENT_ID')) {
            $merchant->update(['has_calculator' => true]);
        } elseif ($currentClientId === env('SALLA_MANAGEMENT_CLIENT_ID')) {
            $merchant->update(['has_management' => true]);
        }

        // ❌ تم إلغاء استدعاء fetchProductsFromSalla هنا للاعتماد على Webhooks
        return $merchant;
    }

    /**
     * جلب المنتجات بنظام الدفعات (Pagination Loop)
     * ملاحظة: يمكنك استدعاؤها يدوياً فقط عند الحاجة (Manual Sync)
     */
    private function fetchProductsFromSalla(Merchant $merchant)
    {
        $page = 1;
        $hasMorePages = true;

        try {
            while ($hasMorePages) {
                $response = Http::withToken($merchant->access_token)
                    ->get("https://api.salla.dev/admin/v2/products?page={$page}");

                if ($response->successful()) {
                    $data = $response->json();
                    $products = $data['data'] ?? [];

                    foreach ($products as $p) {
                        $this->syncSingleProduct($merchant, $p);
                    }

                    // التحقق من وجود صفحات تالية
                    $pagination = $data['pagination'] ?? [];
                    $totalPages = $pagination['total_pages'] ?? 1;

                    if ($page < $totalPages) {
                        $page++;
                    } else {
                        $hasMorePages = false;
                    }
                } else {
                    $hasMorePages = false;
                }
            }
        } catch (\Exception $e) {
            Log::error("خطأ في المزامنة المتعددة: " . $e->getMessage());
        }
    }

    /**
     * دالة مساعدة لمزامنة منتج واحد (تستخدمها المزامنة اليدوية أو الويب هوكس لاحقاً)
     */
    private function syncSingleProduct(Merchant $merchant, array $p)
    {
        // استخراج التصنيف
        $categoryName = 'General';
        if (!empty($p['categories'])) {
            $mainCat = collect($p['categories'])->firstWhere('main', true) ?? $p['categories'][0];
            $categoryName = $mainCat['name'] ?? 'General';
        }

        // تحديث المنتج
        $product = Product::updateOrCreate(
            ['merchant_id' => $merchant->id, 'salla_product_id' => $p['id']],
            [
                'name'     => $p['name'],
                'price'    => $p['price']['amount'] ?? 0,
                'sku'      => $p['sku'] ?? null,
                'category' => $categoryName,
                'status'   => $p['status'] ?? 'active',
                'quantity' => $p['quantity'] ?? 0,
            ]
        );

        // تحديث الصور
        if (!empty($p['images'])) {
            foreach ($p['images'] as $index => $imgData) {
                ProductImage::updateOrCreate(
                    ['product_id' => $product->id, 'image_url' => $imgData['url']],
                    [
                        'is_main'    => $imgData['main'] ?? false,
                        'sort_order' => $imgData['sort'] ?? $index,
                    ]
                );
            }
        }
    }

    // الـ Methods الأخرى (logout, manualSync, getAccessToken, getMerchantInfo) تبقى كما هي
}