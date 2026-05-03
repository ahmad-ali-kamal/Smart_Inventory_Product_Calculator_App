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

    // 1. Validate
    $validated = $request->validate([
        'short_term_days'             => 'required|integer|min:1',
        'medium_term_days'            => 'required|integer|min:1',
        'long_term_days'              => 'required|integer|min:1',
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

    // 2. Transaction
    DB::transaction(function () use ($request, $merchant, $validated) {

        // 3. Prepare data with correct boolean casting
        $dataToSave = collect($validated)
            ->except('category_mapping')
            ->toArray();

       $dataToSave['auto_hide_expired']    = $request->boolean('auto_hide_expired');
$dataToSave['enable_notifications'] = $request->boolean('enable_notifications');
$dataToSave['auto_discounts']       = $request->boolean('auto_discounts');

        // 4. Save settings (unchanged)
        BatchSetting::updateOrCreate(
            ['merchant_id' => $merchant->id],
            $dataToSave
        );

        // 5. Save Category Mappings — UPSERT, no destructive delete
        if ($request->has('category_mapping')) {

            $incomingMapping = $request->category_mapping;

            // Flatten to detect which categories were removed entirely
            $submittedNames = collect($incomingMapping)
                ->flatten()
                ->filter()
                ->values()
                ->toArray();

            // Delete only rows absent from the new submission
            CategoryMapping::where('merchant_id', $merchant->id)
                ->whereNotIn('category_name', $submittedNames)
                ->delete();

            // Update existing rows or create new ones — never touches the ID
            foreach ($incomingMapping as $bucket => $categories) {
                if (!is_array($categories)) continue;

                foreach ($categories as $index => $catName) {
                    CategoryMapping::updateOrCreate(
                        [
                            'merchant_id'   => $merchant->id,
                            'category_name' => $catName,
                        ],
                        [
                            'bucket'     => $bucket,
                            'sort_order' => $index,
                        ]
                    );
                }
            }
        }
    });

    Cache::forget("inventory_dashboard_{$merchant->id}");

    return response()->json([
    'success' => true,
    'message' => 'تم حفظ الإعدادات بنجاح.',
]);
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