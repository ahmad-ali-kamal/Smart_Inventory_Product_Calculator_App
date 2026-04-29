<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ApiProductController;
use App\Http\Controllers\Calculator\ProductCalculatorController;
//use App\Http\Controllers\SallaWebhookController;
use App\Http\Controllers\Api\InventoryApiController;
use App\Http\Controllers\Calculator\CalculatorSettingsController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| المسار الفعلي لهذه الروابط يبدأ بـ /api/
*/

// ====================================================================
// 1. مسارات الويب هوكس (عامة - لا تحتاج Auth)
// ====================================================================
/**
 * رابط استقبال بيانات سلة (المنتجات، المبيعات، إلخ)
 * الرابط في مركز الشركاء: https://yourdomain.com/api/webhooks/salla
 */
//Route::post('/webhooks/salla', [SallaWebhookController::class, 'handle']);


// ====================================================================
// 2. مسارات محمية (تتطلب تسجيل دخول Merchant عبر Sanctum)
// ====================================================================
Route::middleware('auth:sanctum')->group(function () {

Route::prefix('inventory')->group(function () {

        Route::get('/dashboard', [InventoryApiController::class, 'dashboard']);
        Route::get('/products', [InventoryApiController::class, 'products']);
        Route::post('/expiry/batch', [InventoryApiController::class, 'storeExpiry']);
        Route::get('/settings', [InventoryApiController::class, 'settings']);
        Route::put('/settings/batch', [InventoryApiController::class, 'updateSettings']);

    });

    // جلب معلومات المتجر الحالي (Quantix API User)
    Route::get('/user', function (Request $request) {
        return response()->json([
            'id'             => $request->user()->id,
            'store_name'     => $request->user()->name,
            'email'          => $request->user()->email,
            'has_calculator' => $request->user()->has_calculator,
            'has_management' => $request->user()->has_management,
        ]);
    });

    // إدارة المنتجات عبر الـ API
    Route::prefix('products')->group(function () {
        Route::get('/',             [ApiProductController::class, 'index']);   // عرض كل المنتجات
        Route::get('/{product_id}', [ApiProductController::class, 'show']);    // عرض منتج محدد
    });

    // إعدادات الحاسبة الذكية (المستشار)
    Route::prefix('calculator')->group(function () {
        Route::get('/settings/{product_id}', [ProductCalculatorController::class, 'getSettings']);
        Route::post('/settings/update',      [ProductCalculatorController::class, 'updateSettings']);
    });

   
});


// ====================================================================
// 3. مسارات الاختبار (Local Environment Only)
// ====================================================================
if (app()->environment('local')) {
    Route::get('/test-db-connection', function () {
        try {
            \DB::connection()->getPdo();
            return response()->json([
                'status' => 'success',
                'message' => 'تم الاتصال بقاعدة البيانات بنجاح! ✅'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'فشل الاتصال: ' . $e->getMessage()
            ], 500);
        }
    });
}