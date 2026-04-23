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

    protected $fillable = [
        'merchant_id',
        'salla_variant_id',
        'batch_code',
        'name',
        'manufactured_date',
        'expiry_date',
        'status',
        'days_until_expiry',
        'notes',
    ];

    protected $casts = [
        'manufactured_date' => 'date',
        'expiry_date'       => 'date:Y-m-d',
        'days_until_expiry' => 'integer',
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

            // ✅ إصلاح 3: التحقق من وجود منتج مرتبط قبل إرسال الـ notification
            // عند إنشاء Batch جديد، البيانات تُحفظ قبل BatchItem بفارق صغير
            // لذلك نتحقق بدلاً من إطلاق exception
            $hasProduct = $batch->batchItems()->exists();

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
        return (int) $this->batchItems()->sum('quantity');
    }

    public function getTotalSoldAttribute(): int
    {
        return (int) $this->batchItems()->sum('sold_quantity');
    }

    public function getTotalRemainingAttribute(): int
    {
        return $this->total_quantity - $this->total_sold;
    }

    // ====================================================================
    // Relationships
    // ====================================================================

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class, 'merchant_id');
    }

    public function batchItems(): HasMany
    {
        return $this->hasMany(BatchItem::class, 'batch_id');
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'batch_items')
            ->withPivot(['quantity', 'sold_quantity'])
            ->withTimestamps();
    }

    public function activityLogs(): MorphMany
    {
        return $this->morphMany(ActivityLog::class, 'loggable');
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
        $product = $this->products()->first();
        if ($product && method_exists($product, 'getCategoryThreshold')) {
            $threshold = $product->getCategoryThreshold();
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

        if (!$this->batchItems()->exists()) return;

        try {
            $merchant->notify(new \App\Notifications\BatchExpiryNotification($this, $this->status));
            Log::info("[Batch] Notification يدوية أُرسلت للدفعة: {$this->id}");
        } catch (\Throwable $e) {
            Log::error("[Batch] فشل إرسال notification يدوية: " . $e->getMessage());
        }
    }
}