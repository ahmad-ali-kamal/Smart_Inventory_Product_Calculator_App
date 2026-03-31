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
        'short_term_days',
        'medium_term_days',
        'long_term_days',
        'auto_hide_expired',
        'enable_notifications',
        'auto_discounts',
        'auto_discount_percent',
        'auto_discount_duration_days',
    ];

    protected $casts = [
        'short_term_days'             => 'integer',
        'medium_term_days'            => 'integer',
        'long_term_days'              => 'integer',
        'auto_hide_expired'           => 'boolean',
        'enable_notifications'        => 'boolean',
        'auto_discounts'              => 'boolean',
        'auto_discount_percent'       => 'integer',
        'auto_discount_duration_days' => 'integer',
    ];

    /**
     * العلاقة مع التاجر
     */
    public function merchant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'merchant_id');
    }

    /**
     * تحديد حالة المنتج بناءً على الأيام المتبقية والعتبة الزمنية
     */
    public static function getStatusForDays(int $days, int $threshold): string
    {
        // 1. إذا انتهى المنتج أو كان في اليوم الأخير
        if ($days <= 0) {
            return 'red';
        }

        // 2. إذا دخل في فترة التحذير (أقل من أو يساوي أيام الإشعار المحددة)
        if ($days <= $threshold) {
            return 'yellow';
        }

        // 3. المنتج آمن
        return 'green';
    }

    /**
     * التحقق من خيار الإخفاء التلقائي
     */
    public function shouldAutoHideExpired(): bool
    {
        return $this->auto_hide_expired;
    }

    /**
     * التحقق من تفعيل الإشعارات
     */
    public function shouldSendNotifications(): bool
    {
        return $this->enable_notifications;
    }

    /**
     * القيم الافتراضية
     */
    public static function getDefaults(): array
    {
        return [
            'short_term_days'             => 7,
            'medium_term_days'            => 14,
            'long_term_days'              => 30,
            'auto_hide_expired'           => false,
            'enable_notifications'        => true,
            'auto_discounts'              => false,
            'auto_discount_percent'       => 20,
            'auto_discount_duration_days' => 7,
        ];
    }
}