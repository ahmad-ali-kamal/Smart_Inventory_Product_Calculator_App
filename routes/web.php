<?php

use App\Http\Controllers\Auth\SallaOAuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Inventory\InventoryDashboardController;
use App\Http\Controllers\Inventory\ProductListController;
use App\Http\Controllers\Inventory\ProductExpiryController;
use App\Http\Controllers\Inventory\DiscountController;
use App\Http\Controllers\Calculator\CalculatorDashboardController;
use App\Http\Controllers\Calculator\CalculatorSettingsController;
use App\Http\Controllers\Calculator\ProductCalculatorController;
use App\Http\Controllers\Settings\CategoryMappingController;
use App\Http\Controllers\Settings\BatchSettingController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| Web Routes - Blade Templates + Salla OAuth
|--------------------------------------------------------------------------
*/



// ====================================================================
// صفحة الترحيب (Welcome Page)
// ====================================================================
Route::get('/welcome', function () {
    return view('welcome');
})->name('welcome');

Route::get('/', function () {
    return redirect()->route('welcome');
});

// ====================================================================
// Salla OAuth Authentication Routes
// ====================================================================
Route::middleware('guest')->group(function () {
    Route::get('/login', function () {
        return view('auth.login');
    })->name('login');
    
    Route::get('/auth/salla', [SallaOAuthController::class, 'redirect'])->name('auth.salla');
    Route::get('/auth/salla/callback', [SallaOAuthController::class, 'callback'])->name('auth.salla.callback');
});

// Logout
Route::post('/logout', [SallaOAuthController::class, 'logout'])->name('logout')->middleware('auth');

// ====================================================================
// Protected Routes (تحتاج تسجيل دخول)
// ====================================================================
Route::middleware(['auth'])->group(function () {
    
    // =======================================
    // Main Dashboard
    // =======================================
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('/dashboard/clear-cache', [DashboardController::class, 'clearCache'])->name('dashboard.clear-cache');
    
    // =======================================
    // Inventory Management Routes
    // =======================================
    Route::prefix('inventory')->name('inventory.')->group(function () {
        
        // Inventory Dashboard
        Route::get('/', [InventoryDashboardController::class, 'index'])->name('dashboard');
        Route::post('/clear-cache', [InventoryDashboardController::class, 'clearCache'])->name('clear-cache');
        
        // Product List
        Route::get('/products', [ProductListController::class, 'index'])->name('products.index');
        Route::post('/products/sync', [ProductListController::class, 'sync'])->name('products.sync');
        
        // Product Expiry (Batches)
        Route::post('/products/{product}/expiry', [ProductExpiryController::class, 'store'])->name('expiry.store');
        Route::put('/products/{product}/expiry', [ProductExpiryController::class, 'update'])->name('expiry.update');
        Route::delete('/products/{product}/expiry', [ProductExpiryController::class, 'destroy'])->name('expiry.destroy');
        Route::get('/products/{product}/batches', [ProductExpiryController::class, 'show'])->name('expiry.show');
        
        // Discounts
        Route::get('/products/{product}/discount/suggest', [DiscountController::class, 'suggest'])->name('discount.suggest');
        Route::post('/products/{product}/discount', [DiscountController::class, 'apply'])->name('discount.apply');
        Route::delete('/discounts/{discount}', [DiscountController::class, 'cancel'])->name('discount.cancel');
        
        // Product Actions
        Route::post('/products/{product}/hide', [DiscountController::class, 'hideProduct'])->name('product.hide');
        Route::post('/products/{product}/restock', [DiscountController::class, 'restock'])->name('product.restock');
    });
    
    // =======================================
    // Calculator Routes
    // =======================================
    Route::prefix('calculator')->name('calculator.')->group(function () {
        
        // Instructions (صفحة البداية)
        Route::get('/instructions', function () {
            return view('calculator.instructions');
        })->name('instructions');
        
        // Settings (الإعدادات)
        Route::get('/settings', [CalculatorSettingsController::class, 'index'])->name('settings');
        Route::post('/settings', [CalculatorSettingsController::class, 'store'])->name('settings.store');
        Route::put('/settings', [CalculatorSettingsController::class, 'update'])->name('settings.update');
        
        // Dashboard (الداشبورد)
        Route::get('/', [CalculatorDashboardController::class, 'index'])->name('dashboard');
        
        // Products (قائمة المنتجات)
        Route::get('/products', [ProductCalculatorController::class, 'index'])->name('products.index');
        Route::post('/products/{product}/enable', [ProductCalculatorController::class, 'enable'])->name('products.enable');
        Route::post('/products/{product}/disable', [ProductCalculatorController::class, 'disable'])->name('products.disable');
        Route::post('/products/{product}/toggle', [ProductCalculatorController::class, 'toggle'])->name('products.toggle');
        Route::post('/products/bulk-enable', [ProductCalculatorController::class, 'bulkEnable'])->name('products.bulk-enable');
    });
    
    // =======================================
    // Settings Routes
    // =======================================
    Route::prefix('settings')->name('settings.')->group(function () {
        
        // Category Mappings (تصنيف الفئات)
        Route::get('/categories', [CategoryMappingController::class, 'index'])->name('categories.index');
        Route::post('/categories', [CategoryMappingController::class, 'store'])->name('categories.store');
        Route::put('/categories/{mapping}', [CategoryMappingController::class, 'move'])->name('categories.move');
        Route::delete('/categories/{mapping}', [CategoryMappingController::class, 'destroy'])->name('categories.destroy');
        Route::post('/categories/reorder', [CategoryMappingController::class, 'reorder'])->name('categories.reorder');
        Route::put('/categories/{mapping}/threshold', [CategoryMappingController::class, 'updateThreshold'])->name('categories.threshold');
        Route::post('/categories/apply-defaults', [CategoryMappingController::class, 'applyDefaults'])->name('categories.apply-defaults');
        
        // Batch Settings (إعدادات التواريخ)
        Route::get('/batch', [BatchSettingController::class, 'index'])->name('batch.index');
        Route::post('/batch', [BatchSettingController::class, 'store'])->name('batch.store');
        Route::post('/batch/reset', [BatchSettingController::class, 'reset'])->name('batch.reset');
    });
});

// ====================================================================
// API Routes (للاستخدام في AJAX)
// ====================================================================
Route::middleware(['auth'])->prefix('api')->name('api.')->group(function () {
    
    // Product API
    Route::get('/products/{product}', function (App\Models\Product $product) {
        return response()->json($product->load(['mainImage', 'images', 'batchItems.batch']));
    })->name('products.show');
    
    // Batch API
    Route::get('/batches/{batch}', function (App\Models\Batch $batch) {
        return response()->json($batch->load(['items.product', 'discounts']));
    })->name('batches.show');
    
    // Category Mapping API
    Route::get('/category-mappings', function (Request $request) {
        return response()->json(
            App\Models\CategoryMapping::forMerchant($request->user()->id)->ordered()->get()
        );
    })->name('category-mappings.index');
});