<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ApiProductController;
use App\Http\Controllers\Calculator\ProductCalculatorController;
use App\Http\Controllers\SallaWebhookController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ====================================================================
// 1. مسارات الويب هوكس (عامة - لا تحتاج Auth)
// ====================================================================
// ملاحظة: وضعناها هنا لكي تستطيع "سلة" إرسال البيانات دون الحاجة لتوكن تسجيل دخول
Route::post('/webhooks/salla', [SallaWebhookController::class, 'handle']);


// ====================================================================
// 2. مسارات محمية (تتطلب تسجيل دخول Merchant عبر Sanctum)
// ====================================================================
Route::middleware('auth:sanctum')->group(function () {

    // معلومات المتجر الحالي
    Route::get('/user', function (Request $request) {
        return response()->json([
            'id'             => $request->user()->id,
            'store_name'     => $request->user()->name,
            'email'          => $request->user()->email,
            'has_calculator' => $request->user()->has_calculator,
            'has_management' => $request->user()->has_management,
        ]);
    });

    // إدارة المنتجات
    Route::prefix('products')->group(function () {
        Route::get('/',             [ApiProductController::class, 'index']);   // عرض الكل
        Route::get('/{product_id}', [ApiProductController::class, 'show']);    // عرض منتج محدد
    });

    // إعدادات الحاسبة الذكية
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
            return response()->json(['message' => 'تم الاتصال بقاعدة البيانات بنجاح! ✅']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'فشل الاتصال: ' . $e->getMessage()], 500);
        }
    });
}