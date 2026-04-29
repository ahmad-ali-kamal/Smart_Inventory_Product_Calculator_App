<?php

use Inertia\Inertia;
use App\Http\Controllers\Auth\SallaOAuthController;



Route::get('/login', function () {
    return redirect()->route('inventory.login');
})->name('login');

// الصفحة الرئيسية
Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

// --- تطبيق المستشار (Calculator App) ---
Route::prefix('mustashar')->group(function () {
    Route::get('/login', fn() => inertia('Auth/CalculatorLogin'))->name('calculator.login');
    Route::get('/instructions', fn() => inertia('Calculator/Instructions'))->name('calculator.instructions');
    Route::get('/dashboard',    fn() => inertia('Calculator/Dashboard'))->name('calculator.dashboard');
    Route::get('/products',     fn() => inertia('Calculator/Products'))->name('calculator.products');
    Route::get('/settings',     fn() => inertia('Calculator/Settings'))->name('calculator.settings');
});

// --- تطبيق حريص (Inventory App) ---
Route::prefix('harees')->group(function () {
    Route::get('/login',      fn() => inertia('Auth/InventoryLogin'))->name('inventory.login');
    Route::get('/dashboard',   fn() => inertia('Inventory/Dashboard'))->name('inventory.dashboard');
    Route::get('/settings',   fn() => inertia('Inventory/Settings'))->name('inventory.settings');
    Route::get('/instructions',   fn() => inertia('Inventory/Instructions'))->name('inventory.instructions');
    Route::get('/products',   fn() => inertia('Inventory/Products'))->name('inventory.products');
    // أضيفي أي روابط إضافية لـ "حريص" هنا
});

Route::get('/auth/salla', [SallaOAuthController::class, 'redirect'])->name('auth.salla');

Route::get('/auth/salla/callback', [SallaOAuthController::class, 'callback'])->name('auth.salla.callback');

Route::post('/logout', [SallaOAuthController::class, 'logout'])
    ->middleware('auth')
    ->name('logout');

Route::get('/auth/salla', [SallaOAuthController::class, 'redirect']);
Route::get('/auth/salla/callback', [SallaOAuthController::class, 'callback']);
