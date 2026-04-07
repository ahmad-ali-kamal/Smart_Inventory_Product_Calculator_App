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
        'status',            // تم تفعيله ليقبل التخزين من المجدول
        'days_until_expiry', // تم تفعيله ليقبل التخزين من المجدول
        'notes',
    ];

    protected $casts = [
        'manufactured_date' => 'date',
        'expiry_date'       => 'date',
        'days_until_expiry' => 'integer',
    ];

    protected $appends = [
        'is_expired',
        'expiry_label',
        'total_quantity',
        'total_remaining',
    ];

    // ====================================================================
    // 1. السكوبس (Scopes) - سريعة جداً لأنها تبحث في أعمدة حقيقية
    // ====================================================================

    public function scopeSafe($query)
    {
        return $query->where('status', 'green');
    }

    public function scopeWarning($query)
    {
        return $query->where('status', 'yellow');
    }

    public function scopeExpired($query)
    {
        return $query->where('status', 'red');
    }

    public function scopeForMerchant($query, int $merchantId)
    {
        return $query->where('merchant_id', $merchantId);
    }

    // ====================================================================
    // 2. الأكسيسورز المساعدة (UI Helpers)
    // ====================================================================

    /**
     * هل المنتج منتهي؟ (تعتمد على القيمة المخزنة)
     */
    public function getIsExpiredAttribute(): bool
    {
        return $this->status === 'red' || $this->days_until_expiry < 0;
    }

    /**
     * ملصق تاريخ الانتهاء للعرض في الواجهة
     */
    public function getExpiryLabelAttribute(): string
    {
        $days = $this->days_until_expiry;

        if ($days < 0) return 'منتهي الصلاحية';
        if ($days == 0) return 'ينتهي اليوم!';
        return $days <= 7 ? "خطر: باقي {$days} أيام!" : "باقي {$days} يوم";
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

    // ====================================================================
    // 4. حساب الكميات (Calculations)
    // ====================================================================

    public function getTotalQuantityAttribute(): int
    {
        return (int) $this->items()->sum('quantity');
    }

    public function getTotalRemainingAttribute(): int
    {
        $sold = (int) $this->items()->sum('sold_quantity');
        return $this->getTotalQuantityAttribute() - $sold;
    }
}