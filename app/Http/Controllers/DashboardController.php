<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    /**
     * النقطة المركزية للتوجيه الذكي
     */
    public function index(Request $request)
    {
        // جلب بيانات التاجر المسجل حالياً
        $merchant = Auth::user();

        // 1. إذا لم يكن هناك تسجيل دخول، اظهر صفحة الترحيب العامة
        if (!$merchant) {
            return view('welcome');
        }

        // 2. التوجيه بناءً على التطبيقات المثبتة
        $hasCalculator = (bool) $merchant->has_calculator; // تطبيق المستشار
        $hasManagement = (bool) $merchant->has_management; // تطبيق حريص

        // الحالة الأولى: يملك التطبيقين معاً (عرض صفحة الاختيار)
        if ($hasCalculator && $hasManagement) {
            return view('welcome', [
                'merchant' => $merchant,
                'showSelector' => true
            ]);
        }

        // الحالة الثانية: يملك تطبيق المستشار (الآلة الحاسبة) فقط
        if ($hasCalculator) {
            return redirect()->route('calculator.dashboard');
        }

        // الحالة الثالثة: يملك تطبيق حريص (إدارة المخزون) فقط
        if ($hasManagement) {
            return redirect()->route('inventory.dashboard');
        }

        // حالة احتياطية: التاجر مسجل ولكن لم يتم تفعيل أي تطبيق له بعد
        return view('welcome', [
            'merchant' => $merchant,
            'showSelector' => false
        ]);
    }

    /**
     * دالة لعرض صفحة عرض منتج محدد (التي طلبناها في ملف الويب)
     */
    public function showProduct($product_id)
    {
        $merchant = Auth::user();
        $product = $merchant->products()->where('salla_product_id', $product_id)->firstOrFail();

        return view('inventory.product_details', compact('product'));
    }
}