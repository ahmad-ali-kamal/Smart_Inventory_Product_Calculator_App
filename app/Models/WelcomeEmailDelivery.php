<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WelcomeEmailDelivery extends Model
{
    protected $fillable = [
        'merchant_id',
        'salla_merchant_id',
        'app_name',
        'event_type',
        'email',
        'status',
        'attempts',
        'payload',
        'sent_at',
        'failed_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'sent_at' => 'datetime',
        'failed_at' => 'datetime',
        'attempts' => 'integer',
    ];

    public const APP_HAREES = 'harees';
    public const APP_MUSTASHAR = 'mustashar';

    public const EVENT_TRIAL = 'app.trial.started';
    public const EVENT_SUBSCRIPTION = 'app.subscription.started';

    public const STATUS_PENDING = 'pending';
    public const STATUS_SENT = 'sent';
    public const STATUS_FAILED = 'failed';

    public const VALID_APPS = [self::APP_HAREES, self::APP_MUSTASHAR];
    public const VALID_EVENTS = [self::EVENT_TRIAL, self::EVENT_SUBSCRIPTION];

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    public function isSent(): bool
    {
        return $this->status === self::STATUS_SENT && $this->sent_at !== null;
    }
}
