<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Jobs\FetchProductsJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class ProductListController extends Controller
{
    /**
     * عرض قائمة المنتجات في تطبيق حريص
     */
    public function index(Request $request)
    {
        $merchant = Auth::user();

        // جلب المنتجات مع العلاقات اللازمة للعرض
        $products = Product::where('merchant_id', $merchant->id)
            ->with([
                'images',
                'batchItems.batch',
                'calculator'
            ])
            ->orderBy('name')
            ->paginate(15); // تقسيم الصفحات لسرعة التحميل

        // العودة لملف الـ Blade
        return view('inventory.products', compact('products'));
    }

    /**
     * مزامنة المنتجات من سلة (باستخدام الجووب لضمان الاستقرار)
     */
    public function sync(Request $request)
    {
        $merchant = Auth::user();

        try {
            // تشغيل عملية المزامنة في الخلفية (Background Thread)
            // هذا يمنع تعليق الصفحة ويضمن سحب كل المنتجات
            FetchProductsJob::dispatch($merchant);

            // مسح الكاش لضمان ظهور البيانات الجديدة بعد انتهاء الجووب
            Cache::forget("inventory_dashboard_{$merchant->id}");

            return back()->with('success', 'بدأت عملية المزامنة في الخلفية، ستظهر المنتجات خلال دقائق.');

        } catch (\Exception $e) {
            \Log::error('Product sync dispatch failed', [
                'merchant_id' => $merchant->id,
                'error' => $e->getMessage(),
            ]);

            return back()->with('error', 'عذراً، تعذر بدء المزامنة: ' . $e->getMessage());
        }
    }

    /**
     * عرض تفاصيل منتج معين
     */
    public function show($id)
    {
        $merchant = Auth::user();
        
        $product = Product::where('id', $id)
            ->where('merchant_id', $merchant->id)
            ->with(['batchItems.batch', 'images'])
            ->firstOrFail();

        return view('inventory.show', compact('product'));
    }
}