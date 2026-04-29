<?php

use Inertia\Inertia;
use App\Http\Controllers\Auth\SallaOAuthController;



Route::get('/login', function () {
    return redirect()->route('harees.login');
})->name('login');

// الصفحة الرئيسية
Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

// --- Mustashar (Calculator App) ---
Route::prefix('mustashar')->group(function () {
    Route::get('/login', fn() => inertia('Mustashar/Login'))->name('mustashar.login');
    Route::get('/instructions', fn() => inertia('Mustashar/Instructions'))->name('mustashar.instructions');
    Route::get('/dashboard',    fn() => inertia('Mustashar/Dashboard'))->name('mustashar.dashboard');
    Route::get('/products',     fn() => inertia('Mustashar/Products'))->name('mustashar.products');
    Route::get('/settings',     fn() => inertia('Mustashar/Settings'))->name('mustashar.settings');
});

// --- Harees (Inventory App) ---
Route::prefix('harees')->group(function () {
    Route::get('/login',      fn() => inertia('Harees/Login'))->name('harees.login');
    Route::get('/instructions',   fn() => inertia('Harees/Instructions'))->name('harees.instructions');
    Route::get('/dashboard',   fn() => inertia('Harees/Dashboard'))->name('harees.dashboard');
    Route::get('/settings',   fn() => inertia('Harees/Settings'))->name('harees.settings');
    Route::get('/products',   fn() => inertia('Harees/Products'))->name('harees.products');
});

Route::get('/auth/salla', [SallaOAuthController::class, 'redirect'])->name('auth.salla');

Route::get('/auth/salla/callback', [SallaOAuthController::class, 'callback'])->name('auth.salla.callback');

Route::post('/logout', [SallaOAuthController::class, 'logout'])
    ->middleware('auth')
    ->name('logout');

Route::get('/auth/salla', [SallaOAuthController::class, 'redirect']);
Route::get('/auth/salla/callback', [SallaOAuthController::class, 'callback']);
