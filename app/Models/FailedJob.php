<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class FailedJob extends Model
{
    public $table = 'failed_jobs';

    public $timestamps = false;

    protected $fillable = [
        'uuid',
        'connection',
        'queue',
        'payload',
        'exception',
        'failed_at',
    ];

    protected $casts = [
        'failed_at' => 'datetime',
    ];

    public function getOriginalJobAttribute(): string
    {
        $payload = $this->getPayload();

        if (!$payload || !isset($payload['displayName'])) {
            return 'Unknown Job';
        }

        return $payload['displayName'];
    }

    public function getFailedAtAttribute($value)
    {
        if (is_numeric($value)) {
            return \Carbon\Carbon::createFromTimestamp($value);
        }

        return $value;
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

    public function getExceptionSummary(): string
    {
        if (!$this->exception) {
            return 'No exception details';
        }

        $lines = explode("\n", trim($this->exception));

        foreach ($lines as $line) {
            if (strpos($line, 'Exception:') !== false || strpos($line, 'Error:') !== false) {
                return trim($line);
            }
        }

        return $lines[0] ?? 'Unknown error';
    }

    public static function generateUuid(): string
    {
        return (string) Str::uuid();
    }
}