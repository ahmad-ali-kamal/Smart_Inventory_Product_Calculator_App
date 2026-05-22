<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ApiProductController;
use App\Http\Controllers\Api\HareesApiController;
use App\Http\Controllers\Mustashar\ProductMustasharController;
use App\Http\Controllers\Mustashar\MustasharSettingsController;

/*
|--------------------------------------------------------------------------
| API Routes (Sanctum Protected)
|--------------------------------------------------------------------------
| المسار الفعلي لهذه الروابط يبدأ بـ /api/
*/
   Route::get('/mustashar/settings/{salla_product_id}',
    [MustasharSettingsController::class, 'getSettingsForStore']
);

Route::middleware('auth:sanctum')->group(function () {
 

    // --- 1. معلومات المستخدم الحالي ---
    Route::get('/user', function (Request $request) {
        return response()->json([
            'id'             => $request->user()->id,
            'store_name'     => $request->user()->name,
            'email'          => $request->user()->email,
            'has_calculator' => $request->user()->has_calculator,
            'has_management' => $request->user()->has_management,
        ]);
    });

    // --- 2. إدارة المخزون (Harees Core) ---
    Route::prefix('harees')->group(function () {
        Route::get('/dashboard', [HareesApiController::class, 'dashboard']);
        Route::get('/products', [HareesApiController::class, 'products']);
        
        // ── مسارات الدفعات الجديدة (بديل السيناريوهات القديمة) ──
        // إضافة دفعة جديدة بالكمية اليدوية والتاريخ
        Route::post('/products/{product_id}/store-batch', [HareesApiController::class, 'storeBatch']);
        // تعديل بيانات دفعة سابقة
        Route::put('/batch/{batch_id}', [HareesApiController::class, 'updateBatch']);

        Route::post('/expiry/batch', [HareesApiController::class, 'storeExpiry']);
        Route::get('/settings', [HareesApiController::class, 'settings']);
        Route::put('/settings/batch', [HareesApiController::class, 'updateSettings']);
        
        // جلب الفاريينت لمنتج من سلة
        Route::get('/products/{product_id}/variants', [HareesApiController::class, 'getProductVariants']);
        // السؤال للتاجر عن خيارات المنتج
        Route::get('/products/{product_id}/check-options', [HareesApiController::class, 'checkProductOptions']);
        
        // ملاحظة: تم حذف السيناريو 4 (reconcile) بالكامل بناءً على طلبك
    });

    // --- 3. محرك المنتجات (Product Routes) ---
    Route::prefix('products')->group(function () {
        Route::get('/', [ApiProductController::class, 'index']);
        Route::get('/{product}', [ApiProductController::class, 'show']);
        Route::get('/{product_id}/variants', [ApiProductController::class, 'variants']);
        Route::put('/variants/{variant}', [ApiProductController::class, 'updateVariant']);

        // ملاحظة: تم حذف (convert-to-variants, merge-batch, partial-update)
        // لأن الاعتماد أصبح 100% على (store-batch) وسلة مباشرة
    });

    // --- 4. إعدادات المستشار (Mustashar) ---
    Route::prefix('mustashar')->group(function () {
        Route::get('/settings/{product_id}', [ProductMustasharController::class, 'getSettings']);
        Route::post('/settings/update', [ProductMustasharController::class, 'updateSettings']);
    });
});

// ====================================================================
// مسارات الاختبار (Local Environment Only)
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