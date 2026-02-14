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
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Authentication Routes
Route::get('/login', [SallaOAuthController::class, 'login'])->name('login');
Route::get('/auth/salla', [SallaOAuthController::class, 'redirect'])->name('auth.salla.redirect');
Route::get('/auth/salla/callback', [SallaOAuthController::class, 'callback'])->name('auth.salla.callback');
Route::post('/logout', [SallaOAuthController::class, 'logout'])->name('logout');

// Protected Routes
Route::middleware(['auth'])->group(function () {
    
    // Main Dashboard
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    
    /*
    |--------------------------------------------------------------------------
    | Inventory Management Routes
    |--------------------------------------------------------------------------
    */
    Route::prefix('inventory')->name('inventory.')->group(function () {
        
        // Inventory Dashboard
        Route::get('/', [InventoryDashboardController::class, 'index'])->name('dashboard');
        
        // Product List
        Route::get('/products', [ProductListController::class, 'index'])->name('products.index');
        Route::post('/products/sync', [ProductListController::class, 'sync'])->name('products.sync');
        
        // Product Expiry
        Route::post('/products/{product}/expiry', [ProductExpiryController::class, 'store'])->name('expiry.store');
        Route::put('/products/{product}/expiry', [ProductExpiryController::class, 'update'])->name('expiry.update');
        Route::delete('/products/{product}/expiry', [ProductExpiryController::class, 'destroy'])->name('expiry.destroy');
        
        // Discounts
        Route::get('/products/{product}/discount/suggest', [DiscountController::class, 'suggest'])->name('discount.suggest');
        Route::post('/products/{product}/discount', [DiscountController::class, 'apply'])->name('discount.apply');
        Route::delete('/discounts/{discount}', [DiscountController::class, 'cancel'])->name('discount.cancel');
        
        // Product Actions
        Route::post('/products/{product}/hide', [DiscountController::class, 'hideProduct'])->name('product.hide');
        Route::post('/products/{product}/restock', [DiscountController::class, 'restock'])->name('product.restock');
    });
    
    /*
    |--------------------------------------------------------------------------
    | Calculator Routes
    |--------------------------------------------------------------------------
    */
    Route::prefix('calculator')->name('calculator.')->group(function () {
        
        // Calculator Dashboard
        Route::get('/', [CalculatorDashboardController::class, 'index'])->name('dashboard');
        
        // Settings
        Route::get('/settings', [CalculatorSettingsController::class, 'index'])->name('settings');
        Route::post('/settings', [CalculatorSettingsController::class, 'store'])->name('settings.store');
        Route::put('/settings', [CalculatorSettingsController::class, 'update'])->name('settings.update');
        
        // Product Management
        Route::get('/products', [ProductCalculatorController::class, 'index'])->name('products.index');
        Route::post('/products/{product}/enable', [ProductCalculatorController::class, 'enable'])->name('products.enable');
        Route::post('/products/{product}/disable', [ProductCalculatorController::class, 'disable'])->name('products.disable');
        Route::post('/products/{product}/toggle', [ProductCalculatorController::class, 'toggle'])->name('products.toggle');
        Route::post('/products/bulk-enable', [ProductCalculatorController::class, 'bulkEnable'])->name('products.bulk-enable');
    });
});