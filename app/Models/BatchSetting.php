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
        'short_term_days',   // المدة الزمنية للمنتجات قصيرة الأمد
        'medium_term_days',  // المدة الزمنية للمنتجات متوسطة الأمد
        'long_term_days',    // المدة الزمنية للمنتجات طويلة الأمد
        'auto_hide_expired',
        'enable_notifications',
    ];

    protected $casts = [
        'short_term_days'  => 'integer',
        'medium_term_days' => 'integer',
        'long_term_days'   => 'integer',
        'auto_hide_expired' => 'boolean',
        'enable_notifications' => 'boolean',
    ];

    /**
     * العلاقة مع التاجر
     */
    public function merchant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'merchant_id'); // تأكد من اسم المودل (User أو Merchant)
    }

    /**
     * ✅ تحديد حالة المنتج بناءً على الأيام المتبقية والعتبة الزمنية الممررة
     * * @param int $days الأيام المتبقية للانتهاء
     * @param int $threshold أيام الإشعار (تؤخذ من إعدادات الـ Bucket الخاص بالمنتج)
     * @return string (red, yellow, green)
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
     * القيم الافتراضية للمدد الزمنية
     */
    public static function getDefaults(): array
    {
        return [
            'short_term_days'  => 7,   // إشعار قبل أسبوع
            'medium_term_days' => 14,  // إشعار قبل أسبوعين
            'long_term_days'   => 30,  // إشعار قبل شهر
            'auto_hide_expired' => false,
            'enable_notifications' => true,
        ];
    }
}