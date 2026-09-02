<?php

namespace App\Services;

use App\Jobs\SendWelcomeEmailJob;
use App\Models\Merchant;
use App\Models\WelcomeEmailDelivery;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WelcomeEmailService
{
    public const ALLOWED_EVENTS = [
        WelcomeEmailDelivery::EVENT_TRIAL,
        WelcomeEmailDelivery::EVENT_SUBSCRIPTION,
    ];

    public static function isWelcomeEvent(string $event): bool
    {
        return in_array($event, self::ALLOWED_EVENTS, true);
    }

    public static function resolveMerchant(string $sallaMerchantId): ?Merchant
    {
        $merchant = Merchant::where('salla_merchant_id', $sallaMerchantId)->first();
        if ($merchant) {
            return $merchant;
        }

        try {
            return Merchant::create([
                'salla_merchant_id' => $sallaMerchantId,
                'name' => null,
                'email' => null,
                'store_info' => null,
            ]);
        } catch (QueryException $e) {
            if (self::isUniqueViolation($e)) {
                return Merchant::where('salla_merchant_id', $sallaMerchantId)->first();
            }
            throw $e;
        }
    }

    public static function handleAppEvent(string $event, string $appName, string $sallaMerchantId, array $payload): ?WelcomeEmailDelivery
    {
        if (!self::isWelcomeEvent($event)) {
            return null;
        }

        if (!in_array($appName, WelcomeEmailDelivery::VALID_APPS, true)) {
            Log::warning('[WelcomeEmail] Unknown app', ['app' => $appName, 'event' => $event]);
            return null;
        }

        $merchant = self::resolveMerchant($sallaMerchantId);
        if (!$merchant) {
            Log::warning('[WelcomeEmail] Could not resolve merchant', ['salla_merchant_id' => $sallaMerchantId]);
            return null;
        }

        $existing = WelcomeEmailDelivery::where('merchant_id', $merchant->id)
            ->where('app_name', $appName)
            ->where('event_type', $event)
            ->first();

        if ($existing) {
            if ($existing->isSent()) {
                Log::info('[WelcomeEmail] Already sent, skip', ['merchant_id' => $merchant->id, 'app' => $appName, 'event' => $event]);
                return $existing;
            }
            if ($existing->status === WelcomeEmailDelivery::STATUS_PENDING) {
                SendWelcomeEmailJob::dispatch($existing->id);
                return $existing;
            }
            return $existing;
        }

        try {
            $delivery = DB::transaction(function () use ($merchant, $sallaMerchantId, $appName, $event, $payload) {
                return WelcomeEmailDelivery::create([
                    'merchant_id' => $merchant->id,
                    'salla_merchant_id' => $sallaMerchantId,
                    'app_name' => $appName,
                    'event_type' => $event,
                    'email' => $merchant->email,
                    'status' => WelcomeEmailDelivery::STATUS_PENDING,
                    'attempts' => 0,
                    'payload' => $payload,
                ]);
            });

            SendWelcomeEmailJob::dispatch($delivery->id);

            Log::info('[WelcomeEmail] Dispatched job', ['delivery_id' => $delivery->id, 'merchant_id' => $merchant->id, 'app' => $appName, 'event' => $event]);

            return $delivery;
        } catch (QueryException $e) {
            if (self::isUniqueViolation($e)) {
                $delivery = WelcomeEmailDelivery::where('merchant_id', $merchant->id)
                    ->where('app_name', $appName)
                    ->where('event_type', $event)
                    ->first();

                Log::info('[WelcomeEmail] Concurrent duplicate suppressed', ['merchant_id' => $merchant->id, 'app' => $appName, 'event' => $event]);

                return $delivery;
            }
            throw $e;
        }
    }

    private static function isUniqueViolation(QueryException $e): bool
    {
        $code = $e->errorInfo[1] ?? null;
        $sqlState = $e->getCode();
        return in_array($code, [1062, 19, 2601, 2627], true)
            || in_array((string) $sqlState, ['23000', '23505'], true);
    }
}
