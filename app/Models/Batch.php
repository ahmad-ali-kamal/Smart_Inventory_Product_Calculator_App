<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Batch extends Model
{
    use HasFactory;

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
        'expiry_date' => 'date',
        'days_until_expiry' => 'integer',
    ];

    protected $appends = [
        'is_expired',
        'expiry_label',
        'total_quantity',
        'total_sold',
        'total_remaining',
    ];

    // Relationships
    public function merchant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'merchant_id');
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

    // Boot
    protected static function boot()
    {
        parent::boot();

        // تحديث الأيام والحالة تلقائياً قبل الحفظ في الداتابيز
        static::saving(function ($batch) {
            $batch->calculateDaysUntilExpiry();
            $batch->calculateStatus();
        });
    }

    // Accessors
    public function getIsExpiredAttribute(): bool
    {
        if (!$this->expiry_date) return false;
        return $this->expiry_date->isPast() && !$this->expiry_date->isToday();
    }

    public function getExpiryLabelAttribute(): string
    {
        $days = $this->days_until_expiry;

        if ($days < 0) {
            return 'منتهي الصلاحية';
        } elseif ($days == 0) {
            return 'ينتهي اليوم!';
        } elseif ($days <= 7) {
            return "خطر: باقي {$days} أيام فقط!";
        } else {
            return "باقي {$days} يوم";
        }
    }

    public function getTotalQuantityAttribute(): int
    {
        return $this->items()->sum('quantity');
    }

    public function getTotalSoldAttribute(): int
    {
        return $this->items()->sum('sold_quantity');
    }

    public function getTotalRemainingAttribute(): int
    {
        return $this->total_quantity - $this->total_sold;
    }

    // Methods

    /**
     * حساب الأيام المتبقية: (تاريخ الانتهاء - تاريخ اليوم)
     */
    public function calculateDaysUntilExpiry(): void
    {
        if ($this->expiry_date) {
            $expiry = Carbon::parse($this->expiry_date)->startOfDay();
            $today = Carbon::now()->startOfDay();
            
            // النتيجة موجبة للمستقبل وسالبة للماضي
            $this->days_until_expiry = $today->diffInDays($expiry, false);
        }
    }

    /**
     * تطبيق القانون الذكي لتوزيع الألوان (Status)
     * $daysLeft = expiry_date - today
     * $threshold = CategoryMapping Threshold
     */
    public function calculateStatus(): void
    {
        $daysLeft = $this->days_until_expiry;

        // 1. إذا كان التاريخ بالماضي (سالب) فاللون أحمر فوراً
        if ($daysLeft < 0) {
            $this->status = 'red';
            return;
        }

        // 2. جلب الحد الأدنى (Threshold) من المنتج المرتبط بناءً على تصنيفه
        $product = $this->products()->first();
        $threshold = null;

        if ($product && method_exists($product, 'getCategoryThreshold')) {
            // استدعاء دالة جلب الـ threshold بناءً على الـ Category Mapping
            $threshold = $product->getCategoryThreshold();
        }

        // 3. خيار بديل (Fallback) في حال عدم وجود تصنيف مخصص
        if (is_null($threshold)) {
            $settings = BatchSetting::where('merchant_id', $this->merchant_id)->first();
            $threshold = $settings->medium_term_days ?? 14; 
        }

        // 4. تطبيق المنطق:
        // إذا كان الأيام المتبقية أقل من أو تساوي الـ threshold فالحالة صفراء (تحذير)
        if ($daysLeft <= $threshold) {
            $this->status = 'yellow';
        } else {
            $this->status = 'green';
        }
    }

    public function needsDiscount(): bool
    {
        return $this->status === 'yellow' && $this->days_until_expiry >= 0;
    }

    // Scopes
    public function scopeExpired($query)
    {
        return $query->where('status', 'red');
    }

    public function scopeWarning($query) {
        return $query->where('status', 'yellow');
    }

    public function scopeSafe($query) {
        return $query->where('status', 'green');
    }

    public function scopeForMerchant($query, int $merchantId) {
        return $query->where('merchant_id', $merchantId);
    }
}