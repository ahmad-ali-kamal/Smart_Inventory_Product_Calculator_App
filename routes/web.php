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
| 1. مسارات الاختبار (Testing Routes) - للمعاينة فقط
|--------------------------------------------------------------------------
*/
Route::prefix('test')->group(function () {
    Route::get('/expiry-settings', fn() => view('inventory.settings'));
    Route::get('/expiry-dashboard', fn() => view('inventory.dashboard'));
    Route::get('/expiry-instructions', fn() => view('inventory.instructions'));
    Route::get('/expiry-products', fn() => view('inventory.products'));
    
    Route::get('/discount-test', function () {
        return view('inventory.dashboard', [
            'stats' => ['green_batches' => 3, 'yellow_batches' => 2, 'red_batches' => 1],
            'products' => collect([
                (object)['id' => 1, 'name' => 'Milk', 'status' => 'yellow', 'expiry_date' => now()->addDays(5)->format('Y-m-d')],
                (object)['id' => 2, 'name' => 'Yogurt', 'status' => 'yellow', 'expiry_date' => now()->addDays(3)->format('Y-m-d')],
            ]),
        ]);
    })->name('discount.test');
});

/*
|--------------------------------------------------------------------------
| 2. المسارات العامة (Public Routes)
|--------------------------------------------------------------------------
*/
Route::get('/', function () {
    return view('welcome');
})->name('welcome');

// خاص بحسابات سلة (يجب أن يكون عاماً للـ API)
Route::get('/calculator/settings/{salla_product_id}', [CalculatorSettingsController::class, 'getSettingsForStore']);

/*
|--------------------------------------------------------------------------
| 3. مسارات المصادقة (Salla OAuth)
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
| 4. الخدمات المحمية (Authenticated Routes)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth'])->group(function () {

    // تحويل تلقائي للـ Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // مسار عرض تفاصيل منتج معين (الذي طلبته)
    Route::get('/products/{product_id}', [ProductListController::class, 'show'])->name('products.show');

    // ── قسم الحاسبة (Calculator) ──
    Route::prefix('calculator')->name('calculator.')->group(function () {
        Route::get('/', [CalculatorDashboardController::class, 'index'])->name('dashboard');
        Route::get('/settings', [CalculatorSettingsController::class, 'index'])->name('settings');
        Route::post('/settings', [CalculatorSettingsController::class, 'store'])->name('settings.store');
        
        Route::get('/products', [ProductCalculatorController::class, 'index'])->name('products.index');
        Route::post('/products/{product}/toggle', [ProductCalculatorController::class, 'toggle'])->name('products.toggle');
        Route::post('/products/bulk-enable', [ProductCalculatorController::class, 'bulkEnable'])->name('products.bulk-enable');
    });

    // ── قسم المخزون (Inventory) ──
    Route::prefix('inventory')->name('inventory.')->group(function () {
        Route::get('/', [InventoryDashboardController::class, 'index'])->name('dashboard');
        Route::get('/products', [ProductListController::class, 'index'])->name('products.index');
        
        // المزامنة أصبحت عبر الـ Webhooks ولكن نترك هذا للمزامنة اليدوية الضرورية
        Route::post('/products/sync', [ProductListController::class, 'sync'])->name('products.sync');
        
        // إدارة تواريخ الانتهاء
        Route::post('/products/{product}/expiry', [ProductExpiryController::class, 'store'])->name('expiry.store');
        Route::put('/products/{product}/expiry', [ProductExpiryController::class, 'update'])->name('expiry.update');
        Route::delete('/products/{product}/expiry', [ProductExpiryController::class, 'destroy'])->name('expiry.destroy');
        
        // الخصومات الذكية
        Route::get('/products/{product}/discount/suggest', [DiscountController::class, 'suggest'])->name('discount.suggest');
        Route::post('/products/{product}/discount', [DiscountController::class, 'apply'])->name('discount.apply');
        Route::delete('/discounts/{discount}', [DiscountController::class, 'cancel'])->name('discount.cancel');
    });

    // ── الإعدادات (Settings) ──
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/categories', [CategoryMappingController::class, 'index'])->name('categories.index');
        Route::post('/categories', [CategoryMappingController::class, 'store'])->name('categories.store');
        Route::post('/batch', [BatchSettingController::class, 'store'])->name('batch.store');
    });
});