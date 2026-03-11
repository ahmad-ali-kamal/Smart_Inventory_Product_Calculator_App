<?php

namespace App\Providers;

use App\Services\SallaAuthService;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register()
    {
        $this->app->singleton('salla.auth', function () {
            return $this->app->make(SallaAuthService::class);
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot()
    {
        // 👇👇 هذا هو الحل الجذري 👇👇
        
        // 1. إجبار استخدام HTTPS
        if (config('app.env') !== 'production') {
            URL::forceScheme('https');
        }

        // 2. إجبار استخدام رابط Ngrok كـ "جذر" للموقع
        // هذا يمنع لارافل من استخدام salla-app-project.test في الروابط
        $ngrokUrl = env('APP_URL'); 
        
        if (!empty($ngrokUrl) && str_contains($ngrokUrl, 'ngrok-free.dev')) {
            URL::forceRootUrl($ngrokUrl);
        }
    }
}