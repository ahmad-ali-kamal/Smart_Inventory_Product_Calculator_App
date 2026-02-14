<?php

namespace App\Http\Controllers;

use App\Models\Merchant;
use App\Models\Product;
use App\Models\Batch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * عرض الصفحة الرئيسية (Dashboard)
     */
    public function index(Request $request)
    {
        $merchant = $request->user();

        // استخدام الكاش لتسريع العمليات
        $cacheKey = "dashboard_stats_{$merchant->id}";
        $cacheDuration = now()->addMinutes(5); // 5 دقائق

        $stats = Cache::remember($cacheKey, $cacheDuration, function () use ($merchant) {
            return [
                // إحصائيات المنتجات
                'products' => [
                    'total' => $merchant->products()->count(),
                    'active' => $merchant->products()->active()->count(),
                    'synced' => $merchant->products()
                        ->whereNotNull('synced_at')
                        ->count(),
                ],

                // إحصائيات المخزون
                'inventory' => [
                    'green' => $merchant->batches()->safe()->count(),
                    'yellow' => $merchant->batches()->warning()->count(),
                    'red' => $merchant->batches()->expired()->count(),
                    'total_batches' => $merchant->batches()->count(),
                ],

                // إحصائيات الآلة الحاسبة
                'calculator' => [
                    'has_settings' => $merchant->hasCalculatorSettings(),
                    'enabled_products' => $merchant->products()
                        ->withCalculatorEnabled()
                        ->count(),
                ],

                // إحصائيات إضافية
                'settings' => [
                    'has_batch_settings' => $merchant->hasBatchSettings(),
                    'has_calculator_settings' => $merchant->hasCalculatorSettings(),
                ],
            ];
        });

        // آخر النشاطات (بدون كاش لأنها ديناميكية)
        $recentActivities = $merchant->activityLogs()
            ->with('loggable')
            ->latest()
            ->take(10)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'description' => $log->description,
                    'created_at' => $log->created_at->diffForHumans(),
                    'loggable_type' => class_basename($log->loggable_type),
                ];
            });

        return Inertia::render('Dashboard', [
            'merchant' => $merchant->only(['id', 'store_name', 'email']),
            'stats' => $stats,
            'recentActivities' => $recentActivities,
        ]);
    }

    /**
     * مسح الكاش للتاجر
     */
    public function clearCache(Request $request)
    {
        $merchant = $request->user();
        $cacheKey = "dashboard_stats_{$merchant->id}";

        Cache::forget($cacheKey);

        return back()->with('success', 'تم مسح الكاش بنجاح');
    }
}