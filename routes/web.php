<?php

use Inertia\Inertia;
use App\Http\Controllers\Auth\SallaOAuthController;

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
});

// الصفحة الرئيسية
Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

Route::get('/login', function () {
    return redirect()->route('inventory.login');
})->name('login');

// Calculator Login
Route::get('/calculator/login', function () {
    return Inertia::render('Auth/CalculatorLogin');
})->name('calculator.login');

Route::get('/calculator/dashboard', function () {
    return Inertia::render('Calculator/Dashboard');
});

// Inventory Login
Route::get('/inventory/login', function () {
    return Inertia::render('Auth/InventoryLogin');
})->name('inventory.login');

Route::get('/auth/salla', [SallaOAuthController::class, 'redirect'])->name('auth.salla');

Route::get('/auth/salla/callback', [SallaOAuthController::class, 'callback'])->name('auth.salla.callback');

Route::post('/logout', [SallaOAuthController::class, 'logout'])
    ->middleware('auth')
    ->name('logout');

Route::get('/auth/salla', [SallaOAuthController::class, 'redirect']);
Route::get('/auth/salla/callback', [SallaOAuthController::class, 'callback']);