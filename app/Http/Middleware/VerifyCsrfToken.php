<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * المسارات التي سيتم استثناؤها من فحص حماية الـ CSRF.
     *
     * @var array
     */
    protected $except = [
        // استثناء روابط الويبهوك الخاصة بسلة لتعمل مع الأنظمة الخارجية
        'api/webhooks/salla',
        'webhooks/salla',
    ];
}