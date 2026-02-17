<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\SallaOAuthController;

// استدعاء الكنترولرات
use App\Http\Controllers\Calculator\CalculatorDashboardController;
use App\Http\Controllers\Calculator\CalculatorSettingsController;
use App\Http\Controllers\Calculator\ProductCalculatorController;
use App\Http\Controllers\Inventory\InventoryDashboardController;
use App\Http\Controllers\Inventory\ProductListController;
use App\Http\Controllers\Inventory\ProductExpiryController;
use App\Http\Controllers\Inventory\DiscountController;
use App\Http\Controllers\Settings\CategoryMappingController;
use App\Http\Controllers\Settings\BatchSettingController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// ✅ 1. الصفحة الرئيسية دائماً هي Welcome (سواء زائر أو مسجل)
Route::get('/', function () {
    return view('welcome');
})->name('welcome');

// ✅ 2. صفحة تسجيل الدخول (فقط للزائر)
Route::get('/login', function () {
    return auth()->check() ? redirect()->route('welcome') : view('auth.login');
})->name('login')->middleware('guest');


// ✅ 3. راوتات المصادقة (OAuth)
Route::get('/auth/salla', [SallaOAuthController::class, 'redirect'])->name('auth.salla');
Route::get('/auth/salla/callback', [SallaOAuthController::class, 'callback'])->name('auth.salla.callback');
Route::post('/logout', [SallaOAuthController::class, 'logout'])->name('logout')->middleware('auth');


// ✅ 4. الخدمات المحمية (تتطلب تسجيل دخول)
Route::middleware(['auth'])->group(function () {

    // راوت وهمي للداشبورد (يوجه للرئيسية)
    Route::get('/dashboard', fn() => redirect()->route('welcome'))->name('dashboard');

    // الحاسبة
    Route::prefix('calculator')->name('calculator.')->group(function () {
        Route::get('/', [CalculatorDashboardController::class, 'index'])->name('dashboard');
        Route::get('/settings', [CalculatorSettingsController::class, 'index'])->name('settings');
        Route::post('/settings', [CalculatorSettingsController::class, 'store'])->name('settings.store');
        Route::get('/products', [ProductCalculatorController::class, 'index'])->name('products.index');
        Route::post('/products/{product}/toggle', [ProductCalculatorController::class, 'toggle'])->name('products.toggle');
        Route::post('/products/bulk-enable', [ProductCalculatorController::class, 'bulkEnable'])->name('products.bulk-enable');
    });

    // المخزون
    Route::prefix('inventory')->name('inventory.')->group(function () {
        Route::get('/', [InventoryDashboardController::class, 'index'])->name('dashboard');
        Route::get('/products', [ProductListController::class, 'index'])->name('products.index');
        Route::post('/products/sync', [ProductListController::class, 'sync'])->name('products.sync');
        Route::post('/products/{product}/expiry', [ProductExpiryController::class, 'store'])->name('expiry.store');
        Route::put('/products/{product}/expiry', [ProductExpiryController::class, 'update'])->name('expiry.update');
        Route::delete('/products/{product}/expiry', [ProductExpiryController::class, 'destroy'])->name('expiry.destroy');
        Route::get('/products/{product}/discount/suggest', [DiscountController::class, 'suggest'])->name('discount.suggest');
        Route::post('/products/{product}/discount', [DiscountController::class, 'apply'])->name('discount.apply');
        Route::delete('/discounts/{discount}', [DiscountController::class, 'cancel'])->name('discount.cancel');
    });

    // الإعدادات
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/categories', [CategoryMappingController::class, 'index'])->name('categories.index');
        Route::post('/categories', [CategoryMappingController::class, 'store'])->name('categories.store');
        Route::post('/batch', [BatchSettingController::class, 'store'])->name('batch.store');
    });
});