<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes - Blade Templates
|--------------------------------------------------------------------------
*/

// ====================================================================
// صفحة الترحيب (Welcome Page)
// ====================================================================
Route::get('/welcome', function () {
    return view('welcome'); // ✅ Blade View
})->name('welcome');

Route::get('/', function () {
    return redirect()->route('welcome');
});

// ====================================================================
// Authentication Routes
// ====================================================================
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
});

// Email Verification (بدون auth middleware)
Route::get('/verify-email/{token}', [AuthController::class, 'verifyEmail'])->name('auth.verify-email');
Route::post('/resend-verification', [AuthController::class, 'resendVerification'])->name('auth.resend-verification');

// Logout
Route::post('/logout', [AuthController::class, 'logout'])->name('logout')->middleware('auth');

// ====================================================================
// Protected Routes (تحتاج تسجيل دخول وإيميل مُفعّل)
// ====================================================================
Route::middleware(['auth', 'verified'])->group(function () {
    
    // Main Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // باقي الـRoutes...
    // (يمكنك إضافة routes أخرى هنا)
    
});