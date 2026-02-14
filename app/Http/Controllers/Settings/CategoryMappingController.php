<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\CategoryMapping;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryMappingController extends Controller
{
    /**
     * عرض صفحة تصنيف الأقسام
     */
    public function index(Request $request)
    {
        $merchant = $request->user();

        // جلب التصنيفات الحالية
        $mappings = CategoryMapping::forMerchant($merchant->id)
            ->ordered()
            ->get()
            ->groupBy('expiry_bucket')
            ->map(function ($items) {
                return $items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'category_name' => $item->category_name,
                        'expiry_bucket' => $item->expiry_bucket,
                        'threshold_days' => $item->threshold_days,
                        'custom_threshold_days' => $item->custom_threshold_days,
                        'products_count' => $item->products()->count(),
                    ];
                });
            });

        // التأكد من وجود جميع البuckets
        $buckets = [
            'short' => $mappings->get('short', collect()),
            'medium' => $mappings->get('medium', collect()),
            'long' => $mappings->get('long', collect()),
        ];

        return Inertia::render('Settings/CategoryMapping', [
            'buckets' => $buckets,
            'defaultCategories' => CategoryMapping::getDefaultCategories(),
        ]);
    }

    /**
     * نقل فئة بين البuckets
     */
    public function move(Request $request, CategoryMapping $mapping)
    {
        $this->authorize('update', $mapping);

        $request->validate([
            'expiry_bucket' => 'required|in:short,medium,long',
            'sort_order' => 'nullable|integer',
        ]);

        $mapping->update([
            'expiry_bucket' => $request->expiry_bucket,
            'sort_order' => $request->sort_order ?? $mapping->sort_order,
        ]);

        return back()->with('success', 'تم تحديث التصنيف');
    }

    /**
     * تحديث الترتيب بالجملة (Drag & Drop)
     */
    public function reorder(Request $request)
    {
        $request->validate([
            'mappings' => 'required|array',
            'mappings.*.id' => 'required|exists:category_mappings,id',
            'mappings.*.expiry_bucket' => 'required|in:short,medium,long',
            'mappings.*.sort_order' => 'required|integer',
        ]);

        foreach ($request->mappings as $data) {
            CategoryMapping::where('id', $data['id'])
                ->where('merchant_id', $request->user()->id)
                ->update([
                    'expiry_bucket' => $data['expiry_bucket'],
                    'sort_order' => $data['sort_order'],
                ]);
        }

        return back()->with('success', 'تم حفظ الترتيب الجديد');
    }

    /**
     * تحديث Threshold مخصص
     */
    public function updateThreshold(Request $request, CategoryMapping $mapping)
    {
        $this->authorize('update', $mapping);

        $request->validate([
            'custom_threshold_days' => 'nullable|integer|min:1|max:365',
        ]);

        $mapping->update([
            'custom_threshold_days' => $request->custom_threshold_days,
        ]);

        return back()->with('success', 'تم تحديث المدة المخصصة');
    }

    /**
     * إضافة فئة جديدة
     */
    public function store(Request $request)
    {
        $request->validate([
            'category_name' => 'required|string|max:255',
            'expiry_bucket' => 'required|in:short,medium,long',
            'custom_threshold_days' => 'nullable|integer|min:1|max:365',
        ]);

        CategoryMapping::create([
            'merchant_id' => $request->user()->id,
            'category_name' => $request->category_name,
            'expiry_bucket' => $request->expiry_bucket,
            'custom_threshold_days' => $request->custom_threshold_days,
            'sort_order' => CategoryMapping::forMerchant($request->user()->id)->max('sort_order') + 1,
        ]);

        return back()->with('success', 'تمت إضافة الفئة');
    }

    /**
     * حذف فئة
     */
    public function destroy(CategoryMapping $mapping)
    {
        $this->authorize('delete', $mapping);

        $mapping->delete();

        return back()->with('success', 'تم حذف الفئة');
    }

    /**
     * تطبيق التصنيفات الافتراضية
     */
    public function applyDefaults(Request $request)
    {
        $merchant = $request->user();

        foreach (CategoryMapping::getDefaultCategories() as $index => $category) {
            CategoryMapping::updateOrCreate(
                [
                    'merchant_id' => $merchant->id,
                    'category_name' => $category['name'],
                ],
                [
                    'expiry_bucket' => $category['bucket'],
                    'sort_order' => $index,
                ]
            );
        }

        return back()->with('success', 'تم تطبيق التصنيفات الافتراضية');
    }
}