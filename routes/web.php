<?php

use Inertia\Inertia;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\SallaOAuthController;
use App\Http\Controllers\Mustashar\ProductMustasharController;
use App\Http\Controllers\Mustashar\MustasharSettingsController;
use App\Http\Controllers\Api\HareesApiController;
use App\Http\Controllers\Api\SallaWebhookController;
use App\Http\Controllers\Harees\NotificationController;
use App\Http\Controllers\Harees\DiscountController;


// الصفحة الرئيسية (Welcome)
Route::get('/', fn() => Inertia::render('Welcome'))->name('home');

// إدارة الدخول
Route::get('/login', fn() => redirect()->route('harees.login'))->name('login');
Route::get('/mustashar/login', fn() => inertia('Mustashar/Login'))->name('mustashar.login');
Route::get('/harees/login', fn() => inertia('Harees/Login'))->name('harees.login');

// مسارات Salla OAuth
Route::get('/auth/salla', [SallaOAuthController::class, 'redirect'])->name('auth.salla');
Route::get('/auth/salla/callback', [SallaOAuthController::class, 'callback'])->name('auth.salla.callback');
Route::post('/logout', [SallaOAuthController::class, 'logout'])->middleware('auth')->name('logout');

// ─── Webhooks ───
Route::post('/webhooks/salla', [SallaWebhookController::class, 'handle'])->name('webhooks.salla');
Route::post('/api/webhooks/salla', [SallaWebhookController::class, 'handle'])->name('api.webhooks.salla');

// --- تطبيق "مستشار" (Calculator App) ---
Route::prefix('mustashar')->middleware('auth')->group(function () {
    Route::get('/dashboard',    fn() => inertia('Mustashar/Dashboard'))->name('mustashar.dashboard');
    Route::get('/products',     fn() => inertia('Mustashar/Products'))->name('mustashar.products');
    Route::get('/settings',     fn() => inertia('Mustashar/Settings'))->name('mustashar.settings');
    Route::get('/instructions', fn() => inertia('Mustashar/Instructions'))->name('mustashar.instructions');

    Route::get('/api/products', [ProductMustasharController::class, 'index']);
    Route::post('/api/products/sync', [HareesApiController::class, 'syncProducts']); 
    Route::post('/api/products/{id}/toggle', [ProductMustasharController::class, 'toggle']);
     Route::get('/api/calculator-settings', [MustasharSettingsController::class, 'show']);
    Route::post('/api/calculator-settings', [MustasharSettingsController::class, 'store']);
});

// --- تطبيق "حريص" (Inventory App) ---
Route::prefix('harees')->middleware('auth')->group(function () {
    Route::get('/dashboard',    fn() => inertia('Harees/Dashboard'))->name('harees.dashboard');
    Route::get('/products',     fn() => inertia('Harees/Products'))->name('harees.products');
    Route::get('/settings',     fn() => inertia('Harees/Settings'))->name('harees.settings');
    Route::get('/instructions', fn() => inertia('Harees/Instructions'))->name('harees.instructions');

    // APIs البيانات الخاصة بواجهة حريص
    Route::prefix('api')->group(function () {
        Route::get('/products', [HareesApiController::class, 'products']);
        Route::post('/products/sync', [HareesApiController::class, 'syncProducts']);
        Route::get('/dashboard', [HareesApiController::class, 'dashboard']);
        Route::get('/settings', [HareesApiController::class, 'settings']);
        Route::put('/settings', [HareesApiController::class, 'updateSettings']);
        Route::post('/products/{product}/discounts/apply', [DiscountController::class, 'apply']);
        Route::post('/discounts/{discount}/cancel', [DiscountController::class, 'cancel']);
        
        // المسار المهم لجلب الخيارات في BatchModal.jsx
        Route::get('/products/{product_id}/options', [HareesApiController::class, 'getProductOptions']);

        // جلب الفاريينت والتأكد من وجود خيارات
        Route::get('/products/{product_id}/variants', [HareesApiController::class, 'getProductVariants']);
        Route::get('/products/{product_id}/check-options', [HareesApiController::class, 'checkProductOptions']);

        // إدارة تواريخ الانتهاء
        Route::post('/expiry', [HareesApiController::class, 'storeExpiry']);
        Route::delete('/expiry/{id}', [HareesApiController::class, 'destroyExpiry']);
        
        // التنبيهات
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

        Route::post('/products/{product_id}/store-batch', [HareesApiController::class, 'storeBatch']);
        Route::put('/batch/{batch_id}', [HareesApiController::class, 'updateBatch']);
    });
});