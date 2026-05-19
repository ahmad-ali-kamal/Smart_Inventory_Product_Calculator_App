<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Job extends Model
{
    public $table = 'jobs';

    public $timestamps = false;

    protected $fillable = [
        'queue',
        'payload',
        'attempts',
        'reserved_at',
        'available_at',
        'created_at',
    ];

    protected $casts = [
        'attempts' => 'integer',
        'reserved_at' => 'integer',
        'available_at' => 'integer',
        'created_at' => 'integer',
    ];

    public function scopePending($query)
    {
        return $query->whereNull('reserved_at')
            ->where('available_at', '<=', time());
    }

    public function scopeReserved($query)
    {
        return $query->whereNotNull('reserved_at');
    }

    public function scopeAvailable($query)
    {
        return $query->where('available_at', '<=', time());
    }

    public function scopeOnQueue($query, string $queue)
    {
        return $query->where('queue', $queue);
    }

    public function scopeOnQueues($query, array $queues)
    {
        return $query->whereIn('queue', $queues);
    }

    public function getDisplayNameAttribute(): string
    {
        $payload = $this->getPayload();

        if (!$payload || !isset($payload['displayName'])) {
            return 'Unknown Job';
        }

        return $payload['displayName'];
    }

    public function getJobAttribute(): string
    {
        $payload = $this->getPayload();

        if (!$payload || !isset($payload['job'])) {
            return '';
        }

        return $payload['job'];
    }

    public function getAttemptsAttribute(): int
    {
        return (int) parent::getAttributeValue('attempts');
    }

    public function isReserved(): bool
    {
        return $this->reserved_at !== null;
    }

    public function isPending(): bool
    {
        return !$this->isReserved() && $this->available_at <= time();
    }

    public function isAvailable(): bool
    {
        return $this->available_at <= time();
    }

    public function isExpired(): bool
    {
        return $this->reserved_at !== null
            && (time() - $this->reserved_at) > 90;
    }

    public function getPayload(): ?array
    {
        if (!$this->payload) {
            return null;
        }

        $decoded = json_decode($this->payload, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return null;
        }

        return $decoded;
    }

    public function getMaxTries(): ?int
    {
        $payload = $this->getPayload();

        return $payload['maxTries'] ?? null;
    }

    public function getMaxExceptions(): ?int
    {
        $payload = $this->getPayload();

        return $payload['maxExceptions'] ?? null;
    }

    public function getTimeout(): ?int
    {
        $payload = $this->getPayload();

        return $payload['timeout'] ?? null;
    }

    public function retryUntil(): ?int
    {
        $payload = $this->getPayload();

        return $payload['retryUntil'] ?? null;
    }

    public function getTags(): array
    {
        $payload = $this->getPayload();

        return $payload['tags'] ?? [];
    }

    public function getConnectionName(): string
    {
        $payload = $this->getPayload();

        return $payload['connectionName'] ?? 'default';
    }

    public function getQueueName(): string
    {
        return $this->queue ?? 'default';
    }

    public static function countByStatus(): array
    {
        return [
            'pending' => static::pending()->count(),
            'reserved' => static::reserved()->count(),
            'total' => static::available()->count(),
        ];
    }

    public static function statsByQueue(): array
    {
        return static::available()
            ->select('queue')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN reserved_at IS NULL THEN 1 ELSE 0 END) as pending')
            ->selectRaw('SUM(CASE WHEN reserved_at IS NOT NULL THEN 1 ELSE 0 END) as reserved')
            ->groupBy('queue')
            ->get()
            ->mapWithKeys(fn($row) => [
                $row->queue => [
                    'total' => (int) $row->total,
                    'pending' => (int) $row->pending,
                    'reserved' => (int) $row->reserved,
                ],
            ])
            ->toArray();
    }

    public static function cleanup(int $hoursOld = 24): int
    {
        return static::where('reserved_at', '<', time() - ($hoursOld * 3600))
            ->whereNotNull('reserved_at')
            ->delete();
    }

    public static function releaseStaleReserved(int $retryAfter = 90): int
    {
        $cutoff = time() - $retryAfter;

        return static::where('reserved_at', '<', $cutoff)
            ->whereNotNull('reserved_at')
            ->update(['reserved_at' => null]);
    }
}