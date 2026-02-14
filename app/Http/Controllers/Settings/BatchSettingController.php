<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\BatchSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BatchSettingController extends Controller
{
    /**
     * عرض صفحة إعدادات الدفعات
     */
    public function index(Request $request)
    {
        $merchant = $request->user();
        $settings = $merchant->batchSettings;

        return Inertia::render('Settings/BatchSettings', [
            'settings' => $settings ? [
                'green_threshold_days' => $settings->green_threshold_days,
                'yellow_threshold_days' => $settings->yellow_threshold_days,
                'red_threshold_days' => $settings->red_threshold_days,
                'auto_hide_expired' => $settings->auto_hide_expired,
                'enable_notifications' => $settings->enable_notifications,
            ] : BatchSetting::getDefaults(),
        ]);
    }

    /**
     * حفظ/تحديث الإعدادات
     */
    public function store(Request $request)
    {
        $merchant = $request->user();

        $validated = $request->validate([
            'green_threshold_days' => 'required|integer|min:1|max:365',
            'yellow_threshold_days' => 'required|integer|min:0|max:365',
            'red_threshold_days' => 'required|integer|min:0|max:365',
            'auto_hide_expired' => 'boolean',
            'enable_notifications' => 'boolean',
        ], [
            'green_threshold_days.required' => 'حد الحالة الخضراء مطلوب',
            'green_threshold_days.min' => 'الحد يجب أن يكون على الأقل يوم واحد',
            'yellow_threshold_days.required' => 'حد الحالة الصفراء مطلوب',
        ]);

        // التحقق من المنطقية: green > yellow > red
        if ($validated['green_threshold_days'] <= $validated['yellow_threshold_days']) {
            return back()->withErrors([
                'green_threshold_days' => 'حد الحالة الخضراء يجب أن يكون أكبر من حد الحالة الصفراء',
            ]);
        }

        BatchSetting::updateOrCreate(
            ['merchant_id' => $merchant->id],
            $validated
        );

        // إعادة حساب حالة جميع الدفعات
        $this->recalculateBatchStatuses($merchant);

        return back()->with('success', 'تم حفظ الإعدادات وتحديث حالة الدفعات');
    }

    /**
     * إعادة حساب حالة جميع الدفعات
     */
    protected function recalculateBatchStatuses($merchant): void
    {
        $batches = $merchant->batches;

        foreach ($batches as $batch) {
            $batch->calculateStatus();
            $batch->saveQuietly(); // بدون إطلاق events
        }
    }

    /**
     * إعادة تعيين الإعدادات للقيم الافتراضية
     */
    public function reset(Request $request)
    {
        $merchant = $request->user();

        BatchSetting::updateOrCreate(
            ['merchant_id' => $merchant->id],
            BatchSetting::getDefaults()
        );

        return back()->with('success', 'تم إعادة تعيين الإعدادات للقيم الافتراضية');
    }
}