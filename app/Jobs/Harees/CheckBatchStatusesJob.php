<?php

namespace App\Jobs\Harees;

use App\Models\Batch;
use App\Models\Merchant;
use App\Notifications\BatchExpiryNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CheckBatchStatusesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        Log::info('[Harees] 🚀 بدء فحص حالات الباتشات');

        Merchant::all()->each(function ($merchant) {
            if (!$merchant->name) return;

            $this->processMerchantBatches($merchant);
        });

        Log::info('[Harees] ✅ اكتمل فحص حالات الباتشات');
    }

    private function processMerchantBatches(Merchant $merchant): void
    {
        Batch::where('merchant_id', $merchant->id)
            ->whereNotNull('expiry_date')
            ->get()
            ->each(function ($batch) use ($merchant) {
                $this->updateBatchStatus($batch, $merchant);
            });
    }

    private function updateBatchStatus(Batch $batch, Merchant $merchant): bool
    {
        $oldStatus = $batch->status;
        $batch->calculateStatus();
        $batch->save();

        if ($oldStatus !== $batch->status && in_array($batch->status, ['yellow', 'red'])) {
            $merchant->notify(new BatchExpiryNotification($batch, $batch->status));
        }

        return $oldStatus !== $batch->status;
    }
}
