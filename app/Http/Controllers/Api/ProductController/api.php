<?php

use App\Http\Controllers\Api\ProductController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ====================================================================
// Protected API Routes (تحتاج تسجيل دخول)
// ====================================================================
Route::middleware('auth:sanctum')->group(function () {

    // معلومات التاجر الحالي
    Route::get('/user', function (Request $request) {
        return response()->json([
            'id'         => $request->user()->id,
            'store_name' => $request->user()->store_name,
            'email'      => $request->user()->email,
        ]);
    });

    // Products API
    Route::prefix('products')->group(function () {
        Route::get('/',          [ProductController::class, 'index']);   // GET  /api/products
        Route::get('/{product}', [ProductController::class, 'show']);    // GET  /api/products/{id}
        Route::post('/sync',     [ProductController::class, 'sync']);    // POST /api/products/sync
    });
});

// ====================================================================
// للاختبار عبر Postman (بدون auth)
// ====================================================================
// فقط في بيئة التطوير!
if (app()->environment('local')) {
    Route::get('/test-products', function () {
        return \App\Http\Resources\ProductResource::collection(
            \App\Models\Product::with('mainImage')->take(5)->get()
        );
    });
}