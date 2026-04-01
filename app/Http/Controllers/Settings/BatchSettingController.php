<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\BatchSetting;
use App\Models\CategoryMapping;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class BatchSettingController extends Controller
{
    /**
     * حفظ أو تحديث إعدادات المدد الزمنية (Buckets) + توزيع التصنيفات
     */
    public function store(Request $request)
    {
        $merchant = Auth::user();

        // 1. Validate أولاً
        $validated = $request->validate([
            'short_term_days'             => 'required|integer',
            'medium_term_days'            => 'required|integer',
            'long_term_days'              => 'required|integer',
            'auto_hide_expired'           => 'nullable|boolean',
            'enable_notifications'        => 'nullable|boolean',
            'auto_discounts'              => 'nullable|boolean',
            'auto_discount_percent'       => 'nullable|integer',
            'auto_discount_duration_days' => 'nullable|integer',
            'category_mapping'            => 'nullable|array',
            'category_mapping.short'      => 'nullable|array',
            'category_mapping.medium'     => 'nullable|array',
            'category_mapping.long'       => 'nullable|array',
        ]);

        // 2. Transaction بعد الـ validate
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

        Cache::forget("inventory_dashboard_{$merchant->id}");

        return back()->with('success', 'تم حفظ الإعدادات بنجاح.');
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

        return back()->with('success', 'تمت إعادة الإعدادات للقيم الافتراضية.');
    }
}