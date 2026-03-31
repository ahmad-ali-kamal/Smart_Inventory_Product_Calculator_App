<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\BatchSetting;
use App\Models\CategoryMapping;        // ✅ أضفنا هذا
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;     // ✅ أضفنا هذا

class BatchSettingController extends Controller
{
    /**
     * حفظ أو تحديث إعدادات المدد الزمنية (Buckets) + توزيع التصنيفات
     */
    public function store(Request $request)
    {
        $merchant = Auth::user();

        // 1. التحقق من الحقول — أضفنا category_mapping كـ optional
        $validated = $request->validate([
            'short_term_days'             => 'required|integer',
            'medium_term_days'            => 'required|integer',
            'long_term_days'              => 'required|integer',
            'auto_hide_expired'           => 'boolean',
            'enable_notifications'        => 'boolean',
            'auto_discounts'              => 'boolean',
            'auto_discount_percent'       => 'nullable|integer',
            'auto_discount_duration_days' => 'nullable|integer',
            // ✅ التصنيفات — اختيارية (nullable) لأن المستخدم قد لا يغيرها
            'category_mapping'            => 'nullable|array',
            'category_mapping.short'      => 'nullable|array',
            'category_mapping.medium'     => 'nullable|array',
            'category_mapping.long'       => 'nullable|array',
        ], [
            'short_term_days.required'  => 'مدة المنتجات قصيرة الأمد مطلوبة',
            'medium_term_days.required' => 'مدة المنتجات متوسطة الأمد مطلوبة',
            'long_term_days.required'   => 'مدة المنتجات طويلة الأمد مطلوبة',
        ]);

        // Process settings and category mappings in a single database transaction
        DB::transaction(function () use ($request, $merchant, $validated) {

            // 3. حفظ إعدادات الـ BatchSetting (بدون category_mapping — هي ليست عمود في الجدول)
            BatchSetting::updateOrCreate(
                ['merchant_id' => $merchant->id],
                collect($validated)->except('category_mapping')->toArray()
            );

            // Save category mappings to database if provided
            if ($request->has('category_mapping')) {
                // Delete old mappings and replace with new ones from the form
                CategoryMapping::where('merchant_id', $merchant->id)->delete();

                foreach ($request->category_mapping as $bucket => $categories) {
                    if (!is_array($categories)) continue;

                    foreach ($categories as $index => $catName) {
                        CategoryMapping::create([
                            'merchant_id'   => $merchant->id,
                            'category_name' => $catName,
                            'bucket'        => $bucket,
                            'sort_order'    => $index,
                        ]);
                    }
                }
            }

        });

        // Clear cache to ensure fresh data is loaded
        Cache::forget("inventory_dashboard_{$merchant->id}");

        return back()->with('success', 'تم حفظ الإعدادات وتوزيع التصنيفات بنجاح.');
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