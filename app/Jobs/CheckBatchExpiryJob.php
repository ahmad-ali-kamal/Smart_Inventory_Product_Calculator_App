<?php

namespace App\Jobs;

use App\Models\Batch;
use App\Models\Merchant;
use App\Notifications\BatchExpiryNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CheckBatchExpiryJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        Log::info('[CheckBatchExpiry] بدء فحص الباتشات');

        Merchant::all()->each(function ($merchant) {
            $batches = Batch::where('merchant_id', $merchant->id)
                ->whereIn('status', ['yellow', 'red'])
                ->get();

            foreach ($batches as $batch) {
                // تجنب إرسال إشعار مكرر لنفس الباتش في نفس اليوم
                $alreadyNotified = $merchant->notifications()
                    ->whereDate('created_at', today())
                    ->where('data->batch_id', $batch->id)
                    ->exists();

                if ($alreadyNotified) continue;

                try {
                    $merchant->notify(new BatchExpiryNotification($batch, $batch->status));
                    Log::info("[CheckBatchExpiry] إشعار لـ {$merchant->name} - باتش #{$batch->id}");
                } catch (\Exception $e) {
                    Log::error("[CheckBatchExpiry] فشل: " . $e->getMessage());
                }
            }
        });

        Log::info('[CheckBatchExpiry] انتهى الفحص');
    }
}