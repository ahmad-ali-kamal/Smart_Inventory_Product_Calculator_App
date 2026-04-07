<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;

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
| Quantix Web Routes
|--------------------------------------------------------------------------
*/

/* --- 1. الروابط العامة والواجهة الرئيسية (React/Inertia) --- */

// الصفحة الرئيسية للمشروع (تأكد من تمرير البيانات الأساسية لضمان عدم حدوث Null)
Route::get('/', function () {
    return Inertia::render('Home', [
        'locale' => session('locale', App::getLocale()),
        'auth' => [
            'user' => auth()->user() ? auth()->user()->only('id', 'name', 'email') : null,
        ],
    ]);
})->name('welcome');

// مسار تبديل اللغة (عربي/إنجليزي)
Route::get('language/{locale}', function ($locale) {
    if (in_array($locale, ['ar', 'en'])) {
        Session::put('locale', $locale);
        App::setLocale($locale);
    }
    return redirect()->back();
})->name('language.switch');

// رابط جلب إعدادات الحاسبة
Route::get('/calculator/settings/{salla_product_id}', [CalculatorSettingsController::class, 'getSettingsForStore']);

/* --- 2. روابط المصادقة (Salla OAuth) --- */
Route::middleware('guest')->group(function () {
    // صفحة اللوجن التقليدية (Blade)
    Route::get('/login', fn() => view('auth.login'))->name('login');
    Route::get('/auth/salla', [SallaOAuthController::class, 'redirect'])->name('auth.salla');
    Route::get('/auth/salla/callback', [SallaOAuthController::class, 'callback'])->name('auth.salla.callback');
});

Route::post('/logout', [SallaOAuthController::class, 'logout'])->name('logout')->middleware('auth');

/* --- 3. تطبيق حريص (إدارة المخزون) --- */
Route::middleware(['auth'])->prefix('inventory')->group(function () {
    
    // الداشبورد
    Route::get('/', [InventoryDashboardController::class, 'index'])->name('inventory.dashboard');

    // المنتجات
    Route::get('/products', [ProductListController::class, 'index'])->name('inventory.products.index');
    Route::get('/products/{product_id}', [ProductListController::class, 'show'])->name('inventory.products.show');
    Route::post('/products/sync', [ProductListController::class, 'sync'])->name('inventory.products.sync');

    // الإعدادات
    Route::get('/settings', [InventoryDashboardController::class, 'settings'])->name('inventory.settings');
    
    // حفظ الباتشات وتواريخ الانتهاء
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
    
    // مسار احتياطي لتاريخ الانتهاء
    Route::post('/products/{product}/expiry', [ProductExpiryController::class, 'store'])->name('inventory.expiry.store');

    // الإشعارات
    Route::get('/notifications', [App\Http\Controllers\Inventory\NotificationController::class, 'index'])->name('inventory.notifications');
    Route::post('/notifications/{id}/read', [App\Http\Controllers\Inventory\NotificationController::class, 'markAsRead'])->name('inventory.notifications.read');
    Route::post('/notifications/read-all', [App\Http\Controllers\Inventory\NotificationController::class, 'markAllAsRead'])->name('inventory.notifications.readAll');
});

/* --- 4. تطبيق المستشار (الآلة الحاسبة) --- */
Route::middleware(['auth'])->prefix('calculator')->name('calculator.')->group(function () {
    Route::get('/', [CalculatorDashboardController::class, 'index'])->name('dashboard');
    Route::get('/settings', [CalculatorSettingsController::class, 'index'])->name('settings');
    Route::get('/instructions', [CalculatorDashboardController::class, 'instructions'])->name('instructions');
    Route::post('/settings', [CalculatorSettingsController::class, 'store'])->name('settings.store');
    
    Route::get('/products', [ProductCalculatorController::class, 'index'])->name('products.index');
    Route::post('/products/{product}/toggle', [ProductCalculatorController::class, 'toggle'])->name('products.toggle');
    Route::post('/products/bulk-enable', [ProductCalculatorController::class, 'bulkEnable'])->name('products.bulk-enable');
});