<?php

use Inertia\Inertia;
use App\Http\Controllers\Auth\SallaOAuthController;
use App\Http\Controllers\Calculator\ProductCalculatorController;
use App\Http\Controllers\Calculator\CalculatorSettingsController;
use App\Http\Controllers\Api\InventoryApiController;



Route::get('/login', function () {
    return redirect()->route('harees.login');
})->name('login');

// الصفحة الرئيسية
Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

// --- Mustashar (Calculator App) ---
Route::get('/mustashar/login', fn() => inertia('Mustashar/Login'))
    ->name('mustashar.login');
Route::get('/harees/login', fn() => inertia('Harees/Login'))->name('harees.login');

Route::prefix('mustashar')->middleware('auth')->group(function () {
    Route::get('/instructions', fn() => inertia('Mustashar/Instructions'))->name('mustashar.instructions');
    Route::get('/dashboard',    fn() => inertia('Mustashar/Dashboard'))->name('mustashar.dashboard');
    Route::get('/products',     fn() => inertia('Mustashar/Products'))->name('mustashar.products');
    Route::get('/settings',     fn() => inertia('Mustashar/Settings'))->name('mustashar.settings');

    Route::get('/api/products',              [ProductCalculatorController::class, 'index']);
    Route::post('/api/products/{id}/toggle', [ProductCalculatorController::class, 'toggle']);
    Route::get('/api/calculator-settings',   [CalculatorSettingsController::class, 'show']);
    Route::post('/api/calculator-settings',  [CalculatorSettingsController::class, 'store']);
});

// --- Harees (Inventory App) ---
Route::prefix('harees')->middleware('auth')->group(function () {

    Route::get('/instructions', fn() => inertia('Harees/Instructions'))->name('harees.instructions');
    Route::get('/dashboard',    fn() => inertia('Harees/Dashboard'))->name('harees.dashboard');
    Route::get('/settings',     fn() => inertia('Harees/Settings'))->name('harees.settings');
    Route::get('/products',     fn() => inertia('Harees/Products'))->name('harees.products');

    // Products API
    Route::get('/api/products',       [InventoryApiController::class, 'products']);
    Route::post('/api/products/sync', [InventoryApiController::class, 'syncProducts']);

    // Dashboard API
    Route::get('/api/dashboard', [InventoryApiController::class, 'dashboard']);

    // Settings API
    Route::get('/api/settings', [InventoryApiController::class, 'settings']);
    Route::put('/api/settings',  [InventoryApiController::class, 'updateSettings']);

    // ── Expiry API ──────────────────────────────────────────────────
    // POST  /harees/api/expiry          → حفظ / تحديث تواريخ الانتهاء
    // DELETE /harees/api/expiry/{id}    → حذف كل باتشات المنتج وإعادته لـ sale
    Route::post('/api/expiry',         [InventoryApiController::class, 'storeExpiry']);
    Route::delete('/api/expiry/{id}',  [InventoryApiController::class, 'destroyExpiry']);
});

Route::get('/auth/salla',          [SallaOAuthController::class, 'redirect'])->name('auth.salla');
Route::get('/auth/salla/callback', [SallaOAuthController::class, 'callback'])->name('auth.salla.callback');

Route::post('/logout', [SallaOAuthController::class, 'logout'])
    ->middleware('auth')
    ->name('logout');