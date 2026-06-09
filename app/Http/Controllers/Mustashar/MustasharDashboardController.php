<?php

namespace App\Http\Controllers\Mustashar;

use App\Http\Controllers\Controller;
use App\Models\MustasharSetting;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MustasharDashboardController extends Controller
{
    public function index()
    {
        $merchant = Auth::user();

        $settings = MustasharSetting::where('merchant_id', $merchant->id)->first();

        if (!$settings) {
            return inertia('Mustashar/Instructions');
        }

        $productsQuery = Product::where('merchant_id', $merchant->id);
        $stats = [
            'total_products'   => $productsQuery->count(),
            'enabled_products'  => (clone $productsQuery)
                ->whereHas('mustashar', fn($q) => $q->where('is_enabled', true))
                ->count(),
            'disabled_products' => (clone $productsQuery)
                ->whereDoesntHave('mustashar', fn($q) => $q->where('is_enabled', true))
                ->count(),
        ];

        $enabledProducts = Product::where('merchant_id', $merchant->id)
            ->whereHas('mustashar', fn($q) => $q->where('is_enabled', true))
            ->with(['mustashar'])
            ->orderBy('name')
            ->get();

        return inertia('Mustashar/Dashboard', [
            'settings'        => $settings,
            'stats'           => $stats,
            'merchant'        => $merchant,
            'enabledProducts' => $enabledProducts,
        ]);
    }

    public function instructions()
    {
        return inertia('Mustashar/Instructions');
    }
}