<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Http;
use App\Models\Merchant;
use App\Models\Product;

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
| 1. المسارات العامة (Public Routes)
|--------------------------------------------------------------------------
*/

Route::get('/', [DashboardController::class, 'index'])->name('welcome');

// خاص بحسابات سلة (API)
Route::get('/calculator/settings/{salla_product_id}', [CalculatorSettingsController::class, 'getSettingsForStore']);

/*
|--------------------------------------------------------------------------
| 2. مسارات المصادقة (Salla OAuth)
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
| 3. الخدمات المحمية (Authenticated Routes)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth'])->group(function () {

    // 🚀 مسار الحل الصارم: تشغيل المزامنة يدوياً لمعرفة الخطأ الحقيقي
    Route::get('/force-fetch', function () {
        $merchant = auth()->user();
        
        echo "<h2>Debugging Sync for: {$merchant->name}</h2>";
        echo "Store ID: {$merchant->salla_merchant_id}<br>";
        echo "Token Status: " . ($merchant->access_token ? "Exists" : "MISSING") . "<br><hr>";

        try {
            // طلب مباشر لسلة بدون Jobs
            $response = Http::withToken($merchant->access_token)
                ->get("https://api.salla.dev/admin/v2/products");

            if ($response->failed()) {
                echo "<h3 style='color:red'>API Error Found!</h3>";
                echo "Status: " . $response->status() . "<br>";
                echo "Response: <pre>" . json_encode($response->json(), JSON_PRETTY_PRINT) . "</pre>";
                return;
            }

            $data = $response->json();
            $products = $data['data'] ?? [];
            echo "<h3 style='color:green'>Success! API returned " . count($products) . " products.</h3>";

            foreach ($products as $p) {
                Product::updateOrCreate(
                    ['merchant_id' => $merchant->id, 'salla_product_id' => $p['id']],
                    [
                        'name'     => $p['name'],
                        'price'    => $p['price']['amount'] ?? 0,
                        'sku'      => $p['sku'] ?? null,
                        'status'   => $p['status'] ?? 'active',
                        'quantity' => $p['quantity'] ?? 0,
                    ]
                );
                echo "Synced Product: " . $p['name'] . "<br>";
            }

            echo "<br><hr><b>Check DBeaver now. If products are there, the issue was only in the Queue Worker!</b>";

        } catch (\Exception $e) {
            echo "<h3 style='color:red'>Critical PHP Error:</h3>" . $e->getMessage();
        }
    });

    // الداشبورد العام
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // مسار عرض تفاصيل منتج معين
    Route::get('/products/{product_id}', [ProductListController::class, 'show'])->name('products.show');

    // ── تطبيق المستشار (الآلة الحاسبة) ──
    Route::prefix('calculator')->name('calculator.')->group(function () {
        Route::get('/', [CalculatorDashboardController::class, 'index'])->name('dashboard');
        Route::get('/settings', [CalculatorSettingsController::class, 'index'])->name('settings');
        Route::post('/settings', [CalculatorSettingsController::class, 'store'])->name('settings.store');
        
        Route::get('/products', [ProductCalculatorController::class, 'index'])->name('products.index');
        Route::post('/products/{product}/toggle', [ProductCalculatorController::class, 'toggle'])->name('products.toggle');
        Route::post('/products/bulk-enable', [ProductCalculatorController::class, 'bulkEnable'])->name('products.bulk-enable');
    });

    // ── تطبيق حريص (إدارة المخزون) ──
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

    // ── الإعدادات (Settings) ──
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/categories', [CategoryMappingController::class, 'index'])->name('categories.index');
        Route::post('/categories', [CategoryMappingController::class, 'store'])->name('categories.store');
        Route::post('/batch', [BatchSettingController::class, 'store'])->name('batch.store');
    });
});

/*
|--------------------------------------------------------------------------
| 4. مسارات الاختبار (Testing Routes)
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
                    (object)['id' => 1, 'name' => 'Milk', 'status' => 'yellow', 'expiry_date' => now()->addDays(5)->format('Y-m-d')],
                ]),
            ]);
        })->name('discount.test');
    });
}