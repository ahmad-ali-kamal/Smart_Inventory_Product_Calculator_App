<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BatchSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'merchant_id',
        'green_threshold_days',
        'yellow_threshold_days',
        'red_threshold_days',
        'auto_hide_expired',
        'enable_notifications',
    ];

    protected $casts = [
        'green_threshold_days' => 'integer',
        'yellow_threshold_days' => 'integer',
        'red_threshold_days' => 'integer',
        'auto_hide_expired' => 'boolean',
        'enable_notifications' => 'boolean',
    ];

    // Relationships
    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    // Methods
    public function getStatusForDays(int $days): string
    {
        if ($days < 0 || $days <= $this->red_threshold_days) {
            return 'red';
        } elseif ($days <= $this->yellow_threshold_days) {
            return 'yellow';
        } elseif ($days <= $this->green_threshold_days) {
            return 'yellow';
        } else {
            return 'green';
        }
    }

    public function shouldAutoHideExpired(): bool
    {
        return $this->auto_hide_expired;
    }

    public function shouldSendNotifications(): bool
    {
        return $this->enable_notifications;
    }

    // Static Methods
    public static function getDefaults(): array
    {
        return [
            'green_threshold_days' => 60,
            'yellow_threshold_days' => 15,
            'red_threshold_days' => 0,
            'auto_hide_expired' => false,
            'enable_notifications' => true,
        ];
    }
}