<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * The Artisan commands provided by your application.
     *
     * @var array
     */
    protected $commands = [
        //
    ];

    /**
     * Define the application's command schedule.
     *
     * @param  \Illuminate\Console\Scheduling\Schedule  $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule)
    {
        /**
         * تشغيل المحرك الأساسي لنظام "حريص".
         * هذه المهمة تقوم بفحص تواريخ الانتهاء يومياً وتحديث متجر سلة:
         * 1. تصفير وخصم الباتشات الحمراء (منتهية الصلاحية).
         * 2. تحديث أسعار الباتشات الصفراء (قريبة الانتهاء) كـ Variants مستقلة.
         * 3. إخفاء المنتج تماماً في حال كانت كافة الباتشات المرتبطة به "حمراء".
         */
        $schedule->job(new \App\Jobs\CheckBatchExpiryJob())
                 ->dailyAt('00:00')
                 ->withoutOverlapping();
    }

    /**
     * Register the commands for the application.
     *
     * @return void
     */
    protected function commands()
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}