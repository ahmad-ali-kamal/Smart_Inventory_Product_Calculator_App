<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Illuminate\Support\Facades\App;

class HandleInertiaRequests extends Middleware
{
    /**
     * القالب الأساسي الذي يتم تحميله عند أول زيارة للموقع.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * تحديد نسخة الملفات الحالية (Assets Version).
     * مفيد جداً لإجبار المتصفح على تحديث الملفات عند عمل Build جديد.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * تعريف البيانات التي يتم مشاركتها تلقائياً مع كل مكونات الرياكت (Props).
     */
    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            // تمرير اللغة الحالية (ar أو en) لكي يعرف مشروع Quantix اتجاه الصفحة
            'locale' => function () {
                return App::getLocale();
            },
            
            // يمكنك مستقبلاً إضافة بيانات المستخدم أو رسائل التنبيه (Flash Messages) هنا
            'auth' => [
                'user' => $request->user(),
            ],
        ]);
    }
}