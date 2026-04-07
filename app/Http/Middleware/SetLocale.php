<?php

namespace App\Http\Middleware;

use Closure; // 👈 لاحظ استخدمنا use هنا
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        // 1. التحقق إذا كان هناك لغة مخزنة في الـ Session
        if (Session::has('locale')) {
            $locale = Session::get('locale');

            // 2. تفعيل اللغة في نظام لارافل
            App::setLocale($locale);
        } else {
            // إذا لم توجد لغة، نعتمد العربية كافتراضية
            App::setLocale('ar');
        }

        return $next($request);
    }
}