<?php

namespace App\Jobs;

use App\Mail\WelcomeMail;
use App\Models\Merchant;
use App\Models\WelcomeEmailDelivery;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendWelcomeEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function backoff(): array
    {
        return [10, 60];
    }

    public function __construct(public int $deliveryId) {}

    public function handle(): void
    {
        $delivery = WelcomeEmailDelivery::find($this->deliveryId);
        if (!$delivery) {
            Log::warning('[WelcomeEmailJob] Delivery not found', ['id' => $this->deliveryId]);
            return;
        }

        if ($delivery->isSent()) {
            Log::info('[WelcomeEmailJob] Already sent, skip', ['id' => $delivery->id]);
            return;
        }

        $merchant = $delivery->merchant;
        if (!$merchant) {
            $merchant = Merchant::where('salla_merchant_id', $delivery->salla_merchant_id)->first();
            if ($merchant) {
                $delivery->update(['merchant_id' => $merchant->id]);
            }
        }

        $email = $this->resolveEmail($delivery, $merchant);

        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $delivery->increment('attempts');

            if ($this->attempts() >= $this->tries - 1) {
                $delivery->update(['status' => WelcomeEmailDelivery::STATUS_FAILED, 'failed_at' => now()]);
                Log::warning('[WelcomeEmailJob] No valid email after retries, marked failed', ['id' => $delivery->id]);
                return;
            }

            Log::info('[WelcomeEmailJob] No email yet, will retry', ['id' => $delivery->id, 'attempt' => $this->attempts()]);

            throw new \RuntimeException("Merchant email not available for delivery {$delivery->id}");
        }

        $delivery->update(['email' => $email]);

        try {
            Mail::to($email)->send(new WelcomeMail($delivery->app_name, $delivery->event_type, $merchant, $delivery));

            $delivery->update([
                'status' => WelcomeEmailDelivery::STATUS_SENT,
                'sent_at' => now(),
                'email' => $email,
                'attempts' => $delivery->attempts + 1,
            ]);

            Log::info('[WelcomeEmailJob] Sent', ['id' => $delivery->id, 'email' => $email, 'app' => $delivery->app_name, 'event' => $delivery->event_type]);
        } catch (\Throwable $e) {
            $delivery->increment('attempts');
            Log::error('[WelcomeEmailJob] Send failed', ['id' => $delivery->id, 'error' => $e->getMessage()]);

            if ($this->attempts() >= $this->tries) {
                $delivery->update(['status' => WelcomeEmailDelivery::STATUS_FAILED, 'failed_at' => now()]);
            }

            throw $e;
        }
    }

    private function resolveEmail(WelcomeEmailDelivery $delivery, ?Merchant $merchant): ?string
    {
        if ($merchant && !empty($merchant->email) && filter_var($merchant->email, FILTER_VALIDATE_EMAIL)) {
            return $merchant->email;
        }

        if (!empty($delivery->email) && filter_var($delivery->email, FILTER_VALIDATE_EMAIL)) {
            return $delivery->email;
        }

        if ($merchant && $merchant->sallaApps()->exists()) {
            try {
                $service = \App\Services\SallaApiService::for($merchant);
                $response = $service->getMerchantInfoViaApi();
                $info = $response['data'] ?? $response;
                $merchantData = $info['merchant'] ?? $info;
                $email = $merchantData['email'] ?? $info['email'] ?? null;
                if ($email && filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $merchant->update(['email' => $email]);
                    return $email;
                }
            } catch (\Throwable $e) {
                Log::warning('[WelcomeEmailJob] Could not fetch email via Salla API', ['delivery_id' => $delivery->id, 'error' => $e->getMessage()]);
            }
        }

        return null;
    }
}
