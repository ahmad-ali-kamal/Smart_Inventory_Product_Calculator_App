<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Facades\Log;

class Batch extends Model
{
    use HasFactory;

    public $afterCommit = true;

    const DISCOUNT_PENDING         = 'pending';
    const DISCOUNT_AUTO_DISCOUNTED  = 'auto_discounted';
    const DISCOUNT_MANUALLY_DISCOUNTED = 'manually_discounted';

    const VALID_DISCOUNT_TYPES = [
        self::DISCOUNT_PENDING,
        self::DISCOUNT_AUTO_DISCOUNTED,
        self::DISCOUNT_MANUALLY_DISCOUNTED,
    ];

    protected $fillable = [
        'merchant_id',
        'product_id',
        'expiry_date',
        'status',
        'discount_pct',
        'yellow_threshold',
        'red_threshold',
        'total_qty',
        'batch_qty',
        'offer_id',
        'days_until_expiry',
        'discount_type',
    ];

    protected $casts = [
        'expiry_date'       => 'date:Y-m-d',
        'days_until_expiry' => 'integer',
        'discount_type'     => 'string',
        'discount_pct'      => 'decimal:2',
        'total_qty'         => 'integer',
        'batch_qty'         => 'integer',
        'yellow_threshold'  => 'integer',
        'red_threshold'     => 'integer',
    ];

    protected $appends = [
        'is_expired',
        'expiry_label',
        'total_quantity',
        'total_remaining',
        'total_sold',
    ];

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($batch) {
            $batch->calculateStatus();
        });

        static::saved(function ($batch) {
            Log::info("--- [Batch Hook] Notification Triggered for ID: {$batch->id} ---");

            $oldStatus = $batch->getOriginal('status');
            $newStatus = $batch->status;

            // ✅ إصلاح 1: لا نُرسل notification إذا لم يتغيّر الوضع
            if ($oldStatus === $newStatus) {
                return;
            }

            // ✅ إصلاح 2: لا نُرسل إلا للحالات الحرجة
            if (!in_array($newStatus, ['yellow', 'red'])) {
                return;
            }

            $merchant = $batch->merchant;
            if (!$merchant) {
                Log::warning("[Batch Hook] لا يوجد تاجر للدفعة ID: {$batch->id}");
                return;
            }

            // التحقق من وجود منتج مرتبط قبل إرسال الـ notification
            $hasProduct = !is_null($batch->product_id) && $batch->product()->exists();

            if (!$hasProduct) {
                Log::info("[Batch Hook] الدفعة {$batch->id} ليس لها منتج بعد — تم تأجيل الـ notification");
                return;
            }

            try {
                $merchant->notify(new \App\Notifications\BatchExpiryNotification($batch, $newStatus));
                Log::info("[Batch Hook] تم إرسال notification للتاجر: {$merchant->id}");
            } catch (\Throwable $e) {
                Log::error("[Batch Hook] فشل إرسال notification: " . $e->getMessage());
            }
        });
    }

    // ====================================================================
    // Accessors
    // ====================================================================

    public function getIsExpiredAttribute(): bool
    {
        if (!$this->expiry_date) return false;
        return $this->expiry_date->isPast() || $this->expiry_date->isToday();
    }

    public function getExpiryLabelAttribute(): string
    {
        $days = $this->days_until_expiry ?? 0;
        if ($days < 0)  return 'منتهي الصلاحية';
        if ($days == 0) return 'ينتهي اليوم!';
        return $days <= 7 ? "خطر: باقي {$days} أيام فقط!" : "باقي {$days} يوم";
    }

    public function getTotalQuantityAttribute(): int
    {
        return $this->total_qty ?? 0;
    }

    public function getTotalSoldAttribute(): int
    {
        return ($this->total_qty ?? 0) - ($this->batch_qty ?? 0);
    }

    public function getTotalRemainingAttribute(): int
    {
        return $this->batch_qty ?? 0;
    }

    // ====================================================================
    // Relationships
    // ====================================================================

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class, 'merchant_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function batchVariants(): HasMany
    {
        return $this->hasMany(BatchVariant::class);
    }

    public function activityLogs(): MorphMany
    {
        return $this->morphMany(ActivityLog::class, 'loggable');
    }

    public function discounts(): HasMany
    {
        return $this->hasMany(BatchDiscount::class);
    }

    public function activeDiscount(): ?BatchDiscount
    {
        return $this->discounts()->active()->first();
    }

    // ====================================================================
    // Discount Type Helpers
    // ====================================================================

    public function isPending(): bool
    {
        return $this->discount_type === self::DISCOUNT_PENDING;
    }

    public function isAutoDiscounted(): bool
    {
        return $this->discount_type === self::DISCOUNT_AUTO_DISCOUNTED;
    }

    public function isManuallyDiscounted(): bool
    {
        return $this->discount_type === self::DISCOUNT_MANUALLY_DISCOUNTED;
    }

    /**
     * هل يمكن للخصم التلقائي التعديل على هذا الباتش؟
     * فقط pending هي المؤهلة. auto_discounted ممنوع (Non-Retroactive),
     * manually_discounted ممنوع تماماً.
     */
    public function canAutoDiscount(): bool
    {
        return $this->discount_type === self::DISCOUNT_PENDING;
    }

    public function markAsAutoDiscounted(): void
    {
        $this->discount_type = self::DISCOUNT_AUTO_DISCOUNTED;
        $this->save();
    }

    public function markAsManuallyDiscounted(): void
    {
        $this->discount_type = self::DISCOUNT_MANUALLY_DISCOUNTED;
        $this->save();
    }

    public function markAsPending(): void
    {
        $this->discount_type = self::DISCOUNT_PENDING;
        $this->save();
    }

    // ====================================================================
    // Scopes
    // ====================================================================

    public function scopeForMerchant($query, $merchantId)
    {
        return $query->where('merchant_id', $merchantId);
    }

    public function scopeExpired($query)
    {
        return $query->where('status', 'red');
    }

    public function scopeWarning($query)
    {
        return $query->where('status', 'yellow');
    }

    public function scopeSafe($query)
    {
        return $query->where('status', 'green');
    }

    public function scopePending($query)
    {
        return $query->where('discount_type', self::DISCOUNT_PENDING);
    }

    public function scopeAutoDiscounted($query)
    {
        return $query->where('discount_type', self::DISCOUNT_AUTO_DISCOUNTED);
    }

    public function scopeManuallyDiscounted($query)
    {
        return $query->where('discount_type', self::DISCOUNT_MANUALLY_DISCOUNTED);
    }

    public function scopeDiscountable($query)
    {
        return $query->where('discount_type', self::DISCOUNT_PENDING);
    }

    // ====================================================================
    // Methods
    // ====================================================================

    public function calculateStatus(): void
    {
        if (!$this->expiry_date) return;

        $expiry   = Carbon::parse($this->expiry_date)->startOfDay();
        $today    = Carbon::now()->startOfDay();
        $daysLeft = (int) $today->diffInDays($expiry, false);

        $this->days_until_expiry = $daysLeft;

        if ($daysLeft <= 0) {
            $this->status = 'red';
            return;
        }

        $threshold    = $this->getThreshold();
        $this->status = ($daysLeft <= $threshold) ? 'yellow' : 'green';
    }

    public function getThreshold(): int
    {
        if ($this->product && method_exists($this->product, 'getCategoryThreshold')) {
            $threshold = $this->product->getCategoryThreshold();
            if (!is_null($threshold)) return (int) $threshold;
        }

        $settings = BatchSetting::where('merchant_id', $this->merchant_id)->first();
        return (int) ($settings?->medium_term_days ?? 14);
    }

    /**
     * إرسال notification يدوياً بعد ربط المنتج (يُستدعى من Controller)
     * يحل مشكلة: الـ saved hook يُطلَق قبل إنشاء BatchItem
     */
    public function sendExpiryNotificationIfNeeded(): void
    {
        if (!in_array($this->status, ['yellow', 'red'])) {
            return;
        }

        $merchant = $this->merchant;
        if (!$merchant) return;

        if (!$this->product_id || !$this->product()->exists()) return;

        try {
            $merchant->notify(new \App\Notifications\BatchExpiryNotification($this, $this->status));
            Log::info("[Batch] Notification يدوية أُرسلت للدفعة: {$this->id}");
        } catch (\Throwable $e) {
            Log::error("[Batch] فشل إرسال notification يدوية: " . $e->getMessage());
        }
    }
}