<?php

use Inertia\Inertia;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\SallaOAuthController;
use App\Http\Controllers\Calculator\ProductCalculatorController;
use App\Http\Controllers\Calculator\CalculatorSettingsController;
use App\Http\Controllers\Api\InventoryApiController;
use App\Http\Controllers\Inventory\NotificationController;
use App\Http\Controllers\Inventory\DiscountController;


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

// --- تطبيق "مستشار" (Calculator App) ---
Route::prefix('mustashar')->middleware('auth')->group(function () {
    Route::get('/dashboard',    fn() => inertia('Mustashar/Dashboard'))->name('mustashar.dashboard');
    Route::get('/products',     fn() => inertia('Mustashar/Products'))->name('mustashar.products');
    Route::get('/settings',     fn() => inertia('Mustashar/Settings'))->name('mustashar.settings');
    Route::get('/instructions', fn() => inertia('Mustashar/Instructions'))->name('mustashar.instructions');

    Route::get('/api/products', [ProductCalculatorController::class, 'index']);
    Route::post('/api/products/{id}/toggle', [ProductCalculatorController::class, 'toggle']);
     Route::get('/api/calculator-settings', [CalculatorSettingsController::class, 'show']);
    Route::post('/api/calculator-settings', [CalculatorSettingsController::class, 'store']);
    Route::post('/api/products/sync', [InventoryApiController::class, 'syncProducts']);
});

// --- تطبيق "حريص" (Inventory App) ---
Route::prefix('harees')->middleware('auth')->group(function () {
    Route::get('/dashboard',    fn() => inertia('Harees/Dashboard'))->name('harees.dashboard');
    Route::get('/products',     fn() => inertia('Harees/Products'))->name('harees.products');
    Route::get('/settings',     fn() => inertia('Harees/Settings'))->name('harees.settings');
    Route::get('/instructions', fn() => inertia('Harees/Instructions'))->name('harees.instructions');

    // APIs البيانات الخاصة بواجهة حريص
    Route::prefix('api')->group(function () {
        Route::get('/products', [InventoryApiController::class, 'products']);
        Route::post('/products/sync', [InventoryApiController::class, 'syncProducts']);
        Route::get('/dashboard', [InventoryApiController::class, 'dashboard']);
        Route::get('/settings', [InventoryApiController::class, 'settings']);
        Route::put('/settings', [InventoryApiController::class, 'updateSettings']);
        Route::post('/products/{product}/discounts/apply', [DiscountController::class, 'apply']);
        
        // المسار المهم لجلب الخيارات في BatchModal.jsx
        Route::get('/products/{product_id}/options', [InventoryApiController::class, 'getProductOptions']);

        // إدارة تواريخ الانتهاء
        Route::post('/expiry', [InventoryApiController::class, 'storeExpiry']);
        Route::delete('/expiry/{id}', [InventoryApiController::class, 'destroyExpiry']);
        
        // التنبيهات
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    });
});