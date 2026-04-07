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
        'expiry_date'       => 'date:Y-m-d',
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

    // Boot
    protected static function boot()
{
    parent::boot();

    static::saving(function ($batch) {
        
        $batch->calculateStatus();
    });

    static::saved(function ($batch) {
        $oldStatus = $batch->getOriginal('status');
        $newStatus = $batch->status;

        if ($oldStatus === $newStatus) return;
        if (!in_array($newStatus, ['yellow', 'red'])) return;

        $merchant = $batch->merchant;
        if (!$merchant) return;

        $merchant->notify(
            new \App\Notifications\BatchExpiryNotification($batch, $newStatus)
        );
        // 2. تطبيق الخصم التلقائي إذا كانت الحالة صفراء فقط
        if ($newStatus === 'yellow') {
            $setting = \App\Models\BatchSetting::where('merchant_id', $merchant->id)->first();

            if (!$setting || !$setting->auto_discounts) return;

            foreach ($batch->items as $batchItem) {
                $product = $batchItem->product;
                if (!$product) continue;

                // تجنب خصم مكرر
                $alreadyDiscounted = \App\Models\ProductDiscount::where('product_id', $product->id)
                    ->where('status', 'active')
                    ->exists();

                if ($alreadyDiscounted) continue;

                try {
                    $discountPercent = $setting->auto_discount_percent;
                    $durationDays    = $setting->auto_discount_duration_days ?? 7;
                    $discountedPrice = $product->price * (1 - ($discountPercent / 100));
                    $endsAt          = now()->addDays($durationDays);

            
$sallaApi = \App\Services\SallaApiService::for($merchant);
$sallaApi->applySpecialPrice(
    $product->salla_product_id,
    $discountedPrice,
    now()->toIso8601String(),
    $endsAt->toIso8601String(),
    $discountPercent
);
                    \App\Models\ProductDiscount::create([
                        'product_id'          => $product->id,
                        'batch_id'            => $batch->id,
                        'discount_percentage' => $discountPercent,
                        'starts_at'           => now(),
                        'ends_at'             => $endsAt,
                        'status'              => 'active',
                        'is_ai_suggested'     => false,
                        'applied_to_salla'    => true,
                    ]);

                    \Illuminate\Support\Facades\Log::info("[AutoDiscount] تم تطبيق خصم {$discountPercent}% على: {$product->name}");

                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error("[AutoDiscount] فشل: " . $e->getMessage());
                }
            }
        }
    });
}
    
        
    
    // Accessors
    public function getIsExpiredAttribute(): bool
    {
        if (!$this->expiry_date) return false;
        return $this->expiry_date->isPast() || $this->expiry_date->isToday();
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
        if (!$this->expiry_date) return;
        
        $expiry   = Carbon::parse($this->expiry_date)->startOfDay();
        $today    = Carbon::now()->startOfDay();
        $daysLeft = $today->diffInDays($expiry, false);
         $this->days_until_expiry = $daysLeft;


        // 1. إذا كان التاريخ بالماضي (سالب) فاللون أحمر فوراً
         if ($daysLeft <= 0) {
            $this->status = 'red';
            return;
        }

        $threshold = $this->getThreshold();
        $this->status = $daysLeft <= $threshold ? 'yellow' : 'green';
        
    }
    public function getThreshold(): int
    {
        $product = $this->products()->first();

        if ($product && method_exists($product, 'getCategoryThreshold')) {
            $threshold = $product->getCategoryThreshold();
            if (!is_null($threshold)) {
                return (int) $threshold;
            }
        }

        $settings = BatchSetting::where('merchant_id', $this->merchant_id)->first();
        return (int) ($settings->medium_term_days ?? 14);
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