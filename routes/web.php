<?php

use Inertia\Inertia;

// الصفحة الرئيسية
Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

Route::get('/login', function () {
    return redirect()->route('inventory.login');
})->name('login');

// Calculator Login
Route::get('/calculator/login', function () {
    return Inertia::render('Auth/CalculatorLogin');
})->name('calculator.login');

// Inventory Login
Route::get('/inventory/login', function () {
    return Inertia::render('Auth/InventoryLogin');
})->name('inventory.login');