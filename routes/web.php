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
// Mustashar Login بدون حماية
Route::get('/mustashar/login', fn() => inertia('Mustashar/Login'))
    ->name('mustashar.login');
  Route::get('/harees/login',      fn() => inertia('Harees/Login'))->name('harees.login');
Route::prefix('mustashar')->middleware('auth')->group(function () {
    Route::get('/instructions', fn() => inertia('Mustashar/Instructions'))->name('mustashar.instructions');
    Route::get('/dashboard', fn() => inertia('Mustashar/Dashboard'))->name('mustashar.dashboard');
    Route::get('/products', fn() => inertia('Mustashar/Products'))->name('mustashar.products');
    Route::get('/settings', fn() => inertia('Mustashar/Settings'))->name('mustashar.settings');

    // API للواجهة
    Route::get('/api/products', [ProductCalculatorController::class, 'index']);
    Route::post('/api/products/{id}/toggle', [ProductCalculatorController::class, 'toggle']);
    Route::get('/api/calculator-settings', [CalculatorSettingsController::class, 'show']);
    Route::post('/api/calculator-settings', [CalculatorSettingsController::class, 'store']);
});

// --- Harees (Inventory App) ---
Route::prefix('harees')->middleware('auth')->group(function () {
  
    Route::get('/instructions',   fn() => inertia('Harees/Instructions'))->name('harees.instructions');
    Route::get('/dashboard',   fn() => inertia('Harees/Dashboard'))->name('harees.dashboard');
    Route::get('/settings',   fn() => inertia('Harees/Settings'))->name('harees.settings');
    Route::get('/products',   fn() => inertia('Harees/Products'))->name('harees.products');

    Route::get('/api/products', [\App\Http\Controllers\Api\InventoryApiController::class, 'products']);
    Route::get('/api/dashboard', [\App\Http\Controllers\Api\InventoryApiController::class, 'dashboard']);

    Route::get('/api/settings', [\App\Http\Controllers\Api\InventoryApiController::class, 'settings']);
    Route::put('/api/settings', [\App\Http\Controllers\Api\InventoryApiController::class, 'updateSettings']);
    Route::put('/api/settings', [InventoryApiController::class, 'updateSettings']);
});

Route::get('/auth/salla', [SallaOAuthController::class, 'redirect'])->name('auth.salla');

Route::get('/auth/salla/callback', [SallaOAuthController::class, 'callback'])->name('auth.salla.callback');

Route::post('/logout', [SallaOAuthController::class, 'logout'])
    ->middleware('auth')
    ->name('logout');

Route::get('/auth/salla', [SallaOAuthController::class, 'redirect']);
Route::get('/auth/salla/callback', [SallaOAuthController::class, 'callback']);
