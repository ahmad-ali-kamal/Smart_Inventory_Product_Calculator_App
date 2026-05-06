<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\CategoryMapping;
use App\Models\BatchSetting;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CategoryMappingController extends Controller
{
    /**
     * عرض صفحة الإعدادات وتوزيع التصنيفات
     */
 public function index(Request $request)
{
    $merchant = Auth::user();

    $settings = BatchSetting::where('merchant_id', $merchant->id)->first() 
                ?? (object) BatchSetting::getDefaults();

    $mappings = CategoryMapping::where('merchant_id', $merchant->id)
        ->orderBy('sort_order')
        ->get()
        ->groupBy('bucket');

    $formattedMappings = [
        'short'  => $mappings->get('short',  collect())->pluck('category_name')->toArray(),
        'medium' => $mappings->get('medium', collect())->pluck('category_name')->toArray(),
        'long'   => $mappings->get('long',   collect())->pluck('category_name')->toArray(),
    ];

    $allMappedCategories = array_merge(
        $formattedMappings['short'],
        $formattedMappings['medium'],
        $formattedMappings['long']
    );

    // ✅ هنا كان الخطأ — بناء $unmappedCategories فعلياً
    $unmappedCategories = Product::where('merchant_id', $merchant->id)
        ->whereNotNull('category')
        ->distinct()
        ->pluck('category')
        ->filter(fn($cat) => !in_array($cat, $allMappedCategories))
        ->values()
        ->toArray();

    return view('inventory.settings', [
        'settings'            => $settings,
        'mappings'            => $formattedMappings,
        'allMappedCategories' => $allMappedCategories,
        'unmappedCategories'  => $unmappedCategories, // ✅ الآن معرّف صح
    ]);
}

    /**
     * 🚀 دالة الربط مع الـ JS: تحديث التصنيفات بالجملة بعد السحب والإفلات
     */
    public function reorder(Request $request)
    {
        $merchant = Auth::user();
        
        $request->validate([
            'category_mapping' => 'required|array',
            'category_mapping.short'  => 'nullable|array',
            'category_mapping.medium' => 'nullable|array',
            'category_mapping.long'   => 'nullable|array',
        ]);

        try {
            DB::transaction(function () use ($request, $merchant) {
                // مسح التوزيع القديم للتاجر لإعادة بنائه بناءً على الحالة الجديدة للواجهة
                CategoryMapping::where('merchant_id', $merchant->id)->delete();

                foreach ($request->category_mapping as $bucket => $categories) {
                    if (is_array($categories)) {
                        foreach ($categories as $index => $catName) {
                            CategoryMapping::create([
                                'merchant_id'   => $merchant->id,
                                'category_name' => $catName,
                                'bucket'        => $bucket,
                                'sort_order'    => $index,
                                // threshold_days أصبحت الآن تُقرأ ديناميكياً من BatchSetting في العرض
                            ]);
                        }
                    }
                }
            });

            return response()->json(['success' => true, 'message' => 'Category distribution updated!']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * نقل تصنيف واحد (تستخدم في العمليات السريعة)
     */
    public function move(Request $request)
    {
        $request->validate([
            'category_name' => 'required|string',
            'bucket'        => 'required|in:short,medium,long',
        ]);

        CategoryMapping::updateOrCreate(
            [
                'merchant_id'   => Auth::id(),
                'category_name' => $request->category_name
            ],
            [
                'bucket'     => $request->bucket,
                'sort_order' => 0
            ]
        );

        return response()->json(['success' => true]);
    }

    /**
     * تحديث أيام الإشعار المخصصة (إذا كنت لا تزال ترغب بدعمها)
     */
    public function updateThreshold(Request $request)
    {
        $request->validate([
            'bucket' => 'required|in:short,medium,long',
            'days'   => 'required|integer|min:1'
        ]);

        $merchant = Auth::user();
        
        // تحديث القيمة في BatchSetting لأنها المصدر الرئيسي الآن
        $column = $request->bucket . '_term_days';
        
        BatchSetting::updateOrCreate(
            ['merchant_id' => $merchant->id],
            [$column => $request->days]
        );

        return response()->json(['success' => true]);
    }

    /**
     * إضافة تصنيف جديد يدوياً
     */
    public function store(Request $request)
    {
        $request->validate([
            'category_name' => 'required|string|max:255',
            'bucket'        => 'required|in:short,medium,long',
        ]);

        CategoryMapping::create([
            'merchant_id'   => Auth::id(),
            'category_name' => $request->category_name,
            'bucket'        => $request->bucket,
            'sort_order'    => 99,
        ]);

        return back()->with('success', 'Category added successfully');
    }
}