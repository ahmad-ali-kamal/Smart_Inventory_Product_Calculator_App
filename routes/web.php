<?php

use Inertia\Inertia;

// الصفحة الرئيسية
Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

// Calculator Login
Route::get('/calculator/login', function () {
    return Inertia::render('Auth/CalculatorLogin');
})->name('calculator.login');

// Inventory Login
Route::get('/inventory/login', function () {
    return Inertia::render('Auth/InventoryLogin');
})->name('inventory.login');

Route::get('/instructions', fn() => inertia('Calculator/Instructions'));
Route::get('/dashboard',    fn() => inertia('Calculator/Dashboard'));
Route::get('/products',     fn() => inertia('Calculator/Products'));
Route::get('/settings',     fn() => inertia('Calculator/Settings'));
Route::redirect('/instructions', '/instructions');