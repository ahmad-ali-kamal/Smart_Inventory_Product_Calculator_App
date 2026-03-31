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

/* --- 1. الروابط العامة --- */
Route::get('/', [DashboardController::class, 'index'])->name('welcome');
Route::get('/calculator/settings/{salla_product_id}', [CalculatorSettingsController::class, 'getSettingsForStore']);

Route::middleware('guest')->group(function () {
    Route::get('/login', fn() => view('auth.login'))->name('login');
    Route::get('/auth/salla', [SallaOAuthController::class, 'redirect'])->name('auth.salla');
    Route::get('/auth/salla/callback', [SallaOAuthController::class, 'callback'])->name('auth.salla.callback');
});
Route::post('/logout', [SallaOAuthController::class, 'logout'])->name('logout')->middleware('auth');

/* --- 2. تطبيق حريص (المخزون) - الحل الجذري --- */
Route::middleware(['auth'])->prefix('inventory')->group(function () {
    
    // الداشبورد
    Route::get('/', [InventoryDashboardController::class, 'index'])->name('inventory.dashboard');

    // المنتجات (تعريف المسار ليدعم inventory.products.index)
    Route::get('/products', [ProductListController::class, 'index'])->name('inventory.products.index');
    Route::get('/products/{product_id}', [ProductListController::class, 'show'])->name('inventory.products.show');
    Route::post('/products/sync', [ProductListController::class, 'sync'])->name('inventory.products.sync');

    // 🏆 الحل القاتل لمشكلة الإعدادات: تعريف المسار بالاسمين
    // هذا يرضي صفحة الإعدادات
    Route::get('/settings', [InventoryDashboardController::class, 'settings'])->name('inventory.settings');
    
    // روابط الحفظ والعمليات ( inventory.settings.batch.store )
    Route::prefix('settings')->name('inventory.settings.')->group(function () {
        Route::match(['POST', 'PUT'], '/batch', [BatchSettingController::class, 'store'])->name('batch.store');
        Route::post('/batch/reset', [BatchSettingController::class, 'reset'])->name('batch.reset');
        Route::get('/categories', [CategoryMappingController::class, 'index'])->name('categories.index');
        Route::post('/categories/reorder', [CategoryMappingController::class, 'reorder'])->name('categories.reorder');
        Route::post('/categories/move', [CategoryMappingController::class, 'move'])->name('categories.move');
    });

    // روابط إضافية
    Route::get('/instructions', [InventoryDashboardController::class, 'instructions'])->name('inventory.instructions');
    Route::post('/products/{product}/expiry', [ProductExpiryController::class, 'store'])->name('inventory.expiry.store');
    Route::post('/products/{product}/discount', [DiscountController::class, 'apply'])->name('inventory.discount.apply');
});

/* --- 3. تطبيق المستشار (الآلة الحاسبة) --- */
Route::middleware(['auth'])->prefix('calculator')->name('calculator.')->group(function () {
    Route::get('/', [CalculatorDashboardController::class, 'index'])->name('dashboard');
    Route::get('/settings', [CalculatorSettingsController::class, 'index'])->name('settings');
    Route::post('/settings', [CalculatorSettingsController::class, 'store'])->name('settings.store');
    Route::get('/products', [ProductCalculatorController::class, 'index'])->name('products.index');
    
    Route::get('/products', [ProductCalculatorController::class, 'index'])->name('products.index');
    Route::post('/products/{product}/toggle', [ProductCalculatorController::class, 'toggle'])->name('products.toggle');
    Route::post('/products/bulk-enable', [ProductCalculatorController::class, 'bulkEnable'])->name('products.bulk-enable');
});