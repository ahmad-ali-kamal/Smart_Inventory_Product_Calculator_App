<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule; // استيراد الـ Schedule ضروري جداً

/*
|--------------------------------------------------------------------------
| Console Routes
|--------------------------------------------------------------------------
|
| This file is where you may define all of your Closure based console
| commands. Each Closure is bound to a command instance allowing a
| simple approach to interacting with each command's IO methods.
|
*/

// أمر الإلهام الافتراضي في لارافل
Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/**
 * جدولة تحديث حالات الباتشات والأيام المتبقية (Quantix Scheduler)
 * سيتم تنفيذ هذا الأمر تلقائياً كل يوم الساعة 12:00 ليلاً
 */
Schedule::command('batch:update-status')->daily();