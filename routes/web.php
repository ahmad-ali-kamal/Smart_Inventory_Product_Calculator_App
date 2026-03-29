<?php

use Illuminate\Support\Facades\Route;

// استدعاء الكنترولرات
use App\Http\Controllers\Auth\SallaOAuthController;
use App\Http\Controllers\Calculator\CalculatorDashboardController;
use App\Http\Controllers\Calculator\CalculatorSettingsController;
use App\Http\Controllers\Calculator\ProductCalculatorController;
use App\Http\Controllers\Inventory\InventoryDashboardController;
use App\Http\Controllers\Inventory\ProductListController;
use App\Http\Controllers\Inventory\ProductExpiryController;
use App\Http\Controllers\Inventory\DiscountController;
use App\Http\Controllers\Settings\CategoryMappingController;
use App\Http\Controllers\Settings\BatchSettingController;
use App\Http\Controllers\DashboardController;

/*
|--------------------------------------------------------------------------
| 1. Public & Core Routes
|--------------------------------------------------------------------------
*/

// الرابط الرئيسي: يقوم بالتوجيه الذكي بناءً على التطبيقات المثبتة
Route::get('/', [DashboardController::class, 'index'])->name('welcome');

// خاص بحسابات سلة (API للآلة الحاسبة)
Route::get('/calculator/settings/{salla_product_id}', [CalculatorSettingsController::class, 'getSettingsForStore']);

/*
|--------------------------------------------------------------------------
| 2. Salla OAuth Authentication
|--------------------------------------------------------------------------
*/
Route::middleware('guest')->group(function () {
    Route::get('/login', fn() => view('auth.login'))->name('login');
    Route::get('/auth/salla', [SallaOAuthController::class, 'redirect'])->name('auth.salla');
    Route::get('/auth/salla/callback', [SallaOAuthController::class, 'callback'])->name('auth.salla.callback');
});

Route::post('/logout', [SallaOAuthController::class, 'logout'])->name('logout')->middleware('auth');

/*
|--------------------------------------------------------------------------
| 3. Protected Dashboard & Apps (Authenticated)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth'])->group(function () {

    // التوجيه المركزي (Dashboard Redirector)
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // تفاصيل المنتج
    Route::get('/products/{product_id}', [ProductListController::class, 'show'])->name('products.show');

    // ── Al-Mustashar (The Smart Calculator) ──
    Route::prefix('calculator')->name('calculator.')->group(function () {
        Route::get('/', [CalculatorDashboardController::class, 'index'])->name('dashboard');
        Route::get('/settings', [CalculatorSettingsController::class, 'index'])->name('settings');
        Route::post('/settings', [CalculatorSettingsController::class, 'store'])->name('settings.store');
        
        Route::get('/products', [ProductCalculatorController::class, 'index'])->name('products.index');
        Route::post('/products/{id}/toggle', [ProductCalculatorController::class, 'toggle'])->name('products.toggle');
        Route::post('/products/bulk-enable', [ProductCalculatorController::class, 'bulkEnable'])->name('products.bulk-enable');
    });

    // ── Harees (Inventory & Expiry Management) ──
    Route::prefix('inventory')->name('inventory.')->group(function () {
        // الصفحات الأساسية
        Route::get('/', [InventoryDashboardController::class, 'index'])->name('dashboard'); // dashboard.blade.php
        Route::get('/products', [ProductListController::class, 'index'])->name('products.index'); // products.blade.php
        Route::get('/settings', [InventoryDashboardController::class, 'settings'])->name('settings'); // settings.blade.php
        Route::get('/instructions', [InventoryDashboardController::class, 'instructions'])->name('instructions'); // instructions.blade.php
        
        // المزامنة اليدوية
        Route::post('/products/sync', [ProductListController::class, 'sync'])->name('products.sync');
        
        // إدارة الأكسباير (تستخدم للنماذج dateform)
        Route::post('/products/{product}/expiry', [ProductExpiryController::class, 'store'])->name('expiry.store');
        Route::put('/products/{product}/expiry', [ProductExpiryController::class, 'update'])->name('expiry.update');
        Route::delete('/products/{product}/expiry', [ProductExpiryController::class, 'destroy'])->name('expiry.destroy');
        
        // نظام الخصومات (تستخدم للنماذج discountform)
        Route::get('/products/{product}/discount/suggest', [DiscountController::class, 'suggest'])->name('discount.suggest');
        Route::post('/products/{product}/discount', [DiscountController::class, 'apply'])->name('discount.apply');
        Route::delete('/discounts/{discount}', [DiscountController::class, 'cancel'])->name('discount.cancel');
    });

    // ── Global App Settings ──
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/categories', [CategoryMappingController::class, 'index'])->name('categories.index');
        Route::post('/categories', [CategoryMappingController::class, 'store'])->name('categories.store');
        Route::post('/batch', [BatchSettingController::class, 'store'])->name('batch.store');
    });
});

/*
|--------------------------------------------------------------------------
| 4. Development & Testing (Local Only)
|--------------------------------------------------------------------------
*/
if (app()->environment('local')) {
    Route::prefix('test')->group(function () {
        Route::get('/expiry-settings', fn() => view('inventory.settings'));
        Route::get('/expiry-dashboard', fn() => view('inventory.dashboard'));
        Route::get('/discount-test', function () {
            return view('inventory.dashboard', [
                'stats' => ['green_batches' => 3, 'yellow_batches' => 2, 'red_batches' => 1],
                'products' => collect([
                    (object)['id' => 1, 'name' => 'Test Product', 'status' => 'active', 'expiry_date' => now()->addDays(10)->format('Y-m-d')],
                ]),
            ]);
        })->name('discount.test');
    });
}