<?php

use App\Http\Controllers\WebhookController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CalculatorSettingsController;
use App\Http\Controllers\Api\CalculatorProductController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/
//
//Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
//    return $request->user();
//});

// settings
    Route::get('/settings', [CalculatorSettingsController::class, 'show']);
    Route::post('/settings', [CalculatorSettingsController::class, 'store']);
    Route::put('/settings', [CalculatorSettingsController::class, 'update']);

    
    // product control
    Route::post('/activate', [CalculatorProductController::class, 'activate']);
    Route::post('/deactivate', [CalculatorProductController::class, 'deactivate']);
    Route::post('/bulk-activate', [CalculatorProductController::class, 'bulkActivate']);

    
// Salla webhook
Route::post('/webhook', WebhookController::class)->name('webhook');
