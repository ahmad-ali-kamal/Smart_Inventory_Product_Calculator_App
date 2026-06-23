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
        $hasMustashar  = (bool) $merchant->has_calculator; // تطبيق المستشار
        $hasHarees     = (bool) $merchant->has_management; // تطبيق حريص

        // الحالة الأولى: يملك التطبيقين معاً (عرض صفحة الاختيار)
        if ($hasMustashar && $hasHarees) {
            return view('welcome', [
                'merchant' => $merchant,
                'showSelector' => true
            ]);
        }

        // الحالة الثانية: يملك تطبيق المستشار فقط
        if ($hasMustashar) {
            return redirect()->route('qiasat.dashboard');
        }

        // الحالة الثالثة: يملك تطبيق حريص فقط
        if ($hasHarees) {
            return redirect()->route('harees.dashboard');
        }

        // حالة احتياطية: التاجر مسجل ولكن لم يتم تفعيل أي تطبيق له بعد
        return view('welcome', [
            'merchant' => $merchant,
            'showSelector' => false
        ]);
    }

    /**
     * دالة لعرض صفحة عرض منتج محدد
     */
    public function showProduct($product_id)
    {
        $merchant = Auth::user();
        $product = $merchant->products()->where('salla_product_id', $product_id)->firstOrFail();

        return view('harees.product_details', compact('product'));
    }
}