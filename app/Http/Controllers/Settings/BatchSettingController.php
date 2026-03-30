<?php

namespace App\Http\Controllers\Settings; // ✅ صح // تأكد من مطابقة المسار لمجلداتك

use App\Http\Controllers\Controller;
use App\Models\BatchSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class BatchSettingController extends Controller
{
    /**
     * حفظ أو تحديث إعدادات المدد الزمنية (Buckets)
     */
    public function store(Request $request)
    {
        $merchant = Auth::user();

        // 1. التحقق من الحقول الجديدة (Short, Medium, Long)
        $validated = $request->validate([
            'short_term_days'      => 'required|integer|min:1|max:365',
            'medium_term_days'     => 'required|integer|min:1|max:365',
            'long_term_days'       => 'required|integer|min:1|max:365',
            'auto_hide_expired'    => 'boolean',
            'enable_notifications' => 'boolean',
        ], [
            'short_term_days.required'  => 'مدة المنتجات قصيرة الأمد مطلوبة',
            'medium_term_days.required' => 'مدة المنتجات متوسطة الأمد مطلوبة',
            'long_term_days.required'   => 'مدة المنتجات طويلة الأمد مطلوبة',
        ]);

        // 2. الحفظ باستخدام النظام الجديد
        BatchSetting::updateOrCreate(
            ['merchant_id' => $merchant->id],
            $validated
        );

        // 3. مسح الكاش لضمان ظهور الألوان الجديدة فوراً في الداشبورد والمنتجات
        Cache::forget("inventory_dashboard_{$merchant->id}");

        // ملاحظة: تم حذف دالة recalculateBatchStatuses لأننا الآن نحسب الحالة 
        // "ديناميكياً" في العرض بناءً على هذه الإعدادات، فلا داعي لتحديث كل الصفوف في الداتابيز.

        return back()->with('success', 'تم حفظ إعدادات "حريص" بنجاح وتحديث نظام التنبيهات.');
    }

    /**
     * إعادة تعيين الإعدادات للقيم الافتراضية
     */
    public function reset()
    {
        $merchant = Auth::user();

        BatchSetting::updateOrCreate(
            ['merchant_id' => $merchant->id],
            BatchSetting::getDefaults()
        );

        Cache::forget("inventory_dashboard_{$merchant->id}");

        return back()->with('success', 'تمت إعادة الإعدادات لقيم "حريص" القياسية.');
    }
}