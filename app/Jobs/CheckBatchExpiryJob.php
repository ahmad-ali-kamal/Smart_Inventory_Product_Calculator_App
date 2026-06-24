<?php

namespace App\Jobs;

use App\Models\Merchant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CheckBatchExpiryJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Orchestrator — dispatches each dedicated job in sequence.
     *
     * Responsibilities are now split across single-purpose jobs:
     *
     *   CheckBatchStatusesJob     → status calculation + notifications
     *   UpdateBatchOptionsJob     → sync "خيارات الشراء" option to Salla
     *   ApplyAutoDiscountsJob     → auto discounts ONLY (no manual discount logic)
     *   SyncVariantQuantitiesJob  → push stock quantities to Salla variants
     *   CleanupDeletedBatchesJob  → auto-hide expired products + orphan cleanup
     *
     * Manual discounts are handled exclusively by DiscountController and
     * must NEVER interact with ApplyAutoDiscountsJob or share any code path.
     */
    public function handle(): void
    {
        Log::info('[Harees Engine] 🚀 بدء دورة الفحص والمزامنة المركزية');

        \App\Jobs\Harees\CheckBatchStatusesJob::dispatch();
        \App\Jobs\Harees\UpdateBatchOptionsJob::dispatch();
        \App\Jobs\Harees\ApplyAutoDiscountsJob::dispatch();
        \App\Jobs\Harees\SyncVariantQuantitiesJob::dispatch();
        \App\Jobs\Harees\CleanupDeletedBatchesJob::dispatch();

        Log::info('[Harees Engine] ✅ اكتملت دورة الفحص');
    }
}