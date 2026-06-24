<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ApplyAutoDiscountToPendingBatches implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $merchantId
    ) {}

    /**
     * Delegates to the dedicated Harees jobs.
     * ApplyAutoDiscountsJob handles auto discounts only.
     * UpdateBatchOptionsJob syncs option labels to Salla.
     */
    public function handle(): void
    {
        Log::info('[AUTO DISCOUNT] بدء التطبيق للتاجر ' . $this->merchantId);

        \App\Jobs\Harees\ApplyAutoDiscountsJob::dispatch();
        \App\Jobs\Harees\UpdateBatchOptionsJob::dispatch();

        Cache::forget("harees_dashboard_{$this->merchantId}");
        Cache::forget("harees_dashboard_api_{$this->merchantId}");

        Log::info('[AUTO DISCOUNT] ✅ اكتمل تطبيق الخصومات التلقائية');
    }
}
