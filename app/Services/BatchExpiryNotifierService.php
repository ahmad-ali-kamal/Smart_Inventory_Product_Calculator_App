<?php

namespace App\Services;

use App\Models\Batch;
use App\Models\Merchant;
use App\Notifications\BatchExpiryNotification;
use Illuminate\Database\QueryException;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class BatchExpiryNotifierService
{
    private static ?bool $hasDedupColumns = null;

    /**
     * Idempotently persist a batch-expiry notification.
     *
     * Exactly ONE notification is ever allowed per (merchant, batch, status).
     * Because `status` is part of the key, a Yellow → Red transition is a
     * different event and always creates a fresh Red notification.
     *
     * Two layers of protection:
     *   1. Application-level existence check (fast path).
     *   2. Database unique index `notifications_batch_unique` — the final
     *      guarantee against race conditions between concurrent workers,
     *      queue retries and repeated scheduler runs.
     *
     * The service degrades gracefully if the dedup columns are not present yet
     * (migration not applied): the notification is still created through the
     * standard channel and a JSON-based existence check keeps it idempotent,
     * while a warning is logged so the migration is not forgotten.
     */
    public static function notify(Batch $batch, string $status, ?Merchant $merchant = null): bool
    {
        $merchant = $merchant ?? $batch->merchant;

        if (!$merchant) {
            Log::warning('[BatchExpiryNotifier] لا يوجد تاجر مرتبط بالدفعة', ['batch_id' => $batch->id]);
            return false;
        }

        if (!in_array($status, ['yellow', 'red'], true)) {
            return false;
        }

        return self::hasDedupColumns()
            ? self::notifyWithColumns($batch, $status, $merchant)
            : self::notifyWithoutColumns($batch, $status, $merchant);
    }

    private static function notifyWithColumns(Batch $batch, string $status, Merchant $merchant): bool
    {
        $exists = DatabaseNotification::query()
            ->where('notifiable_type', get_class($merchant))
            ->where('notifiable_id', $merchant->getKey())
            ->where('batch_id', $batch->id)
            ->where('status', $status)
            ->exists();

        if ($exists) {
            Log::info('[BatchExpiryNotifier] تخطي إنشاء إشعار مكرر', [
                'batch_id' => $batch->id,
                'status'   => $status,
            ]);
            return false;
        }

        try {
            $notification = new DatabaseNotification();
            $notification->forceFill([
                'id'              => (string) Str::uuid(),
                'type'            => BatchExpiryNotification::class,
                'notifiable_type' => get_class($merchant),
                'notifiable_id'   => $merchant->getKey(),
                'data'            => (new BatchExpiryNotification($batch, $status))->toArray($merchant),
                'batch_id'        => $batch->id,
                'status'          => $status,
                'read_at'         => null,
            ]);
            $notification->save();

            Log::info('[BatchExpiryNotifier] تم إنشاء إشعار انتهاء صلاحية', [
                'merchant_id' => $merchant->getKey(),
                'batch_id'    => $batch->id,
                'status'      => $status,
            ]);

            return true;
        } catch (QueryException $e) {
            if (self::isUniqueViolation($e)) {
                Log::info('[BatchExpiryNotifier] إشعار موجود مسبقاً (تعارض تزامن) — تم التخطي', [
                    'batch_id' => $batch->id,
                    'status'   => $status,
                ]);
                return false;
            }

            Log::error('[BatchExpiryNotifier] فشل إنشاء إشعار: ' . $e->getMessage(), [
                'batch_id' => $batch->id,
                'status'   => $status,
            ]);
            throw $e;
        }
    }

    private static function notifyWithoutColumns(Batch $batch, string $status, Merchant $merchant): bool
    {
        Log::warning('[BatchExpiryNotifier] عمودا batch_id/status غير موجودين — شغّل php artisan migrate لتطبيق القيد الفريد ضد التكرار', [
            'batch_id' => $batch->id,
            'status'   => $status,
        ]);

        if (self::existsInPayload($batch, $status, $merchant)) {
            Log::info('[BatchExpiryNotifier] تخطي إنشاء إشعار مكرر (فحص JSON)', [
                'batch_id' => $batch->id,
                'status'   => $status,
            ]);
            return false;
        }

        $merchant->notify(new BatchExpiryNotification($batch, $status));
        return true;
    }

    private static function existsInPayload(Batch $batch, string $status, Merchant $merchant): bool
    {
        $query = DatabaseNotification::query()
            ->where('type', BatchExpiryNotification::class)
            ->where('notifiable_type', get_class($merchant))
            ->where('notifiable_id', $merchant->getKey());

        $driver = $query->getConnection()->getDriverName();

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            return $query
                ->whereRaw('data->\'$.batch_id\' = ?', [$batch->id])
                ->whereRaw('data->>\'$.status\' = ?', [$status])
                ->exists();
        }

        return $query->get()->contains(function (DatabaseNotification $notification) use ($batch, $status) {
            $data = $notification->data;
            return isset($data['batch_id'], $data['status'])
                && (int) $data['batch_id'] === (int) $batch->id
                && $data['status'] === $status;
        });
    }

    private static function hasDedupColumns(): bool
    {
        return self::$hasDedupColumns ??= Schema::hasColumn('notifications', 'batch_id');
    }

    private static function isUniqueViolation(QueryException $e): bool
    {
        $driverCode = $e->errorInfo[1] ?? null;
        $sqlState   = $e->getCode();

        return in_array($driverCode, [1062, 19, 2601, 2627], true)
            || in_array((string) $sqlState, ['23000', '23505'], true);
    }
}
