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

    /**
     * نترك afterCommit مفعلة لضمان استقرار العمليات المرتبطة بالباتش
     */
    public $afterCommit = true;

    protected $fillable = [
        'merchant_id',
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

    // ====================================================================
    // 1. البوت (Boot) - معالجة المنطق التلقائي عند الحفظ
    // ====================================================================
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($batch) {
            $batch->calculateStatus();
        });

        static::saved(function ($batch) {
            $oldStatus = $batch->getOriginal('status');
            $newStatus = $batch->status;
            $merchant = $batch->merchant;

            Log::info("--- [Batch Hook] Notification Triggered for ID: {$batch->id} ---");

            if (!$merchant) return;

            // 1. الإشعارات (هذا هو المكان الأنسب لها في الموديل)
            if ($oldStatus !== $newStatus && in_array($newStatus, ['yellow', 'red'])) {
                $merchant->notify(new \App\Notifications\BatchExpiryNotification($batch, $newStatus));
                Log::info("[Batch Hook] Notification sent for merchant: {$merchant->id}");
            }

            /**
             * ملاحظة هامة: تم نقل منطق الإخفاء التلقائي والخصومات إلى الكنترولر
             * لضمان أن جميع العناصر (Items) قد حُفظت فعلياً في قاعدة البيانات
             * وتجنب مشاكل سباق التوقيت (Race Conditions).
             */
        });
    }

    // ====================================================================
    // 2. الأكسيسورز (Accessors)
    // ====================================================================

    public function getIsExpiredAttribute(): bool
    {
        if (!$this->expiry_date) return false;
        return $this->expiry_date->isPast() || $this->expiry_date->isToday();
    }

    public function getExpiryLabelAttribute(): string
    {
        $days = $this->days_until_expiry;

        if ($days < 0) return 'منتهي الصلاحية';
        if ($days == 0) return 'ينتهي اليوم!';
        return $days <= 7 ? "خطر: باقي {$days} أيام فقط!" : "باقي {$days} يوم";
    }

    public function getTotalQuantityAttribute(): int
    {
        return (int) $this->items()->sum('quantity');
    }

    public function getTotalSoldAttribute(): int
    {
        return (int) $this->items()->sum('sold_quantity');
    }

    public function getTotalRemainingAttribute(): int
    {
        return $this->total_quantity - $this->total_sold;
    }

    // ====================================================================
    // 3. العلاقات (Relationships)
    // ====================================================================

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class, 'merchant_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(BatchItem::class);
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
    // 4. الدوال الأساسية (Methods)
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

        $threshold = $this->getThreshold();
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
        return (int) ($settings->medium_term_days ?? 14);
    }

    public function needsDiscount(): bool
    {
        return $this->status === 'yellow' && $this->days_until_expiry >= 0;
    }

    // ====================================================================
    // 5. السكوبس (Scopes)
    // ====================================================================

    public function scopeExpired($query) { return $query->where('status', 'red'); }
    public function scopeWarning($query) { return $query->where('status', 'yellow'); }
    public function scopeSafe($query)    { return $query->where('status', 'green'); }
    public function scopeForMerchant($query, int $merchantId) { return $query->where('merchant_id', $merchantId); }
}