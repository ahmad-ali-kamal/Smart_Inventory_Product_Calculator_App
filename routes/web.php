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
// 🧪 TEMP - UI Testing Only - Remove before merge
// ====================================================================
Route::prefix('ui-test')->name('calculator.')->group(function () {

    Route::get('/instructions', function () {
        return view('calculator.instructions');
    })->name('instructions');

    Route::get('/settings', function () {
        return view('calculator.settings');
    })->name('settings');

    Route::get('/dashboard', function () {
        return view('calculator.dashboard', [
            'hasSettings' => true,
            'stats' => [
                'total_products'   => 8,
                'enabled_products' => 3,
            ],
            'products' => collect([]),
        ]);
    })->name('dashboard');

    Route::get('/products', function () {
        return view('calculator.products');
    })->name('products');

});

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