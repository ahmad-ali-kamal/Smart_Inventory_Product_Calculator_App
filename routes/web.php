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
use App\Http\Controllers\Inventory\NotificationController;

/* --- 1. الروابط العامة --- */
Route::get('/', [DashboardController::class, 'index'])->name('welcome');
Route::get('/calculator/settings/{salla_product_id}', [CalculatorSettingsController::class, 'getSettingsForStore']);

Route::middleware('guest')->group(function () {
    Route::get('/login', fn() => view('auth.login'))->name('login');
    Route::get('/auth/salla', [SallaOAuthController::class, 'redirect'])->name('auth.salla');
    Route::get('/auth/salla/callback', [SallaOAuthController::class, 'callback'])->name('auth.salla.callback');
});

Route::post('/logout', [SallaOAuthController::class, 'logout'])->name('logout')->middleware('auth');

/* --- 2. تطبيق حريص (المخزون) --- */
Route::middleware(['auth'])->prefix('inventory')->group(function () {
    
    // الداشبورد
    Route::get('/', [InventoryDashboardController::class, 'index'])->name('inventory.dashboard');
    
    // المنتجات
    Route::get('/products', [ProductListController::class, 'index'])->name('inventory.products.index');
    Route::get('/products/{product_id}', [ProductListController::class, 'show'])->name('inventory.products.show');
    Route::post('/products/sync', [ProductListController::class, 'sync'])->name('inventory.products.sync');

    // الإعدادات
    Route::get('/settings', [InventoryDashboardController::class, 'settings'])->name('inventory.settings');
    
    // 🏆 الحل النهائي لخطأ الـ 404: تعريف الرابط الذي يطلبه الـ JavaScript
    // هذا الرابط سيستقبل طلبات الحفظ (تاريخ واحد أو دفعات متعددة)
    Route::post('/expiry/batch', [ProductExpiryController::class, 'store'])->name('inventory.expiry.batch');

    // روابط إعدادات التصنيفات والمدد
    Route::prefix('settings')->name('inventory.settings.')->group(function () {
        Route::match(['POST', 'PUT'], '/batch', [BatchSettingController::class, 'store'])->name('batch.store');
        Route::post('/batch/reset', [BatchSettingController::class, 'reset'])->name('batch.reset');
        Route::get('/categories', [CategoryMappingController::class, 'index'])->name('categories.index');
        Route::post('/categories/reorder', [CategoryMappingController::class, 'reorder'])->name('categories.reorder');
        Route::post('/categories/move', [CategoryMappingController::class, 'move'])->name('categories.move');
    });

    // روابط إضافية (تعليمات، خصومات)
    Route::get('/instructions', [InventoryDashboardController::class, 'instructions'])->name('inventory.instructions');
    Route::post('/products/{product}/discount', [DiscountController::class, 'apply'])->name('inventory.discount.apply');

     // الإشعارات
Route::get('/notifications', [NotificationController::class, 'index'])->name('inventory.notifications');
Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('inventory.notifications.read');
Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('inventory.notifications.readAll');
  
    
    // مسار احتياطي في حال كان الـ JS يرسل المعرف في الرابط
    Route::post('/products/{product}/expiry', [ProductExpiryController::class, 'store'])->name('inventory.expiry.store');
    Route::delete('/products/{product}/expiry', [ProductExpiryController::class, 'destroy'])->name('inventory.expiry.destroy');
});

/* --- 3. تطبيق المستشار (الآلة الحاسبة) --- */
Route::middleware(['auth'])->prefix('calculator')->name('calculator.')->group(function () {
    Route::get('/', [CalculatorDashboardController::class, 'index'])->name('dashboard');
    Route::get('/settings', [CalculatorSettingsController::class, 'index'])->name('settings');
    Route::get('/instructions', [CalculatorDashboardController::class, 'instructions'])->name('instructions');
    Route::post('/settings', [CalculatorSettingsController::class, 'store'])->name('settings.store');
    
    Route::get('/products', [ProductCalculatorController::class, 'index'])->name('products.index');
    Route::post('/products/sync', [ProductCalculatorController::class, 'sync'])->name('products.sync');
    Route::post('/products/{product}/toggle', [ProductCalculatorController::class, 'toggle'])->name('products.toggle');
    Route::post('/products/bulk-enable', [ProductCalculatorController::class, 'bulkEnable'])->name('products.bulk-enable');
});