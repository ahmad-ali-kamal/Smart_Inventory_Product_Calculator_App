<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CategoryMapping extends Model
{
    use HasFactory;

    protected $fillable = [
        'merchant_id',
        'category_name',
        'expiry_bucket',
        'custom_threshold_days',
        'sort_order',
    ];

    protected $casts = [
        'custom_threshold_days' => 'integer',
        'sort_order' => 'integer',
    ];

    protected $appends = [
        'threshold_days',
        'bucket_label',
    ];

    // Relationships
    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'category', 'category_name')
            ->where('merchant_id', $this->merchant_id);
    }

    // Accessors
    public function getThresholdDaysAttribute(): int
    {
        if ($this->custom_threshold_days) {
            return $this->custom_threshold_days;
        }

        return match($this->expiry_bucket) {
            'short' => 7,
            'medium' => 14,
            'long' => 30,
            default => 14,
        };
    }

    public function getBucketLabelAttribute(): string
    {
        return match($this->expiry_bucket) {
            'short' => 'قصير الأجل (7 أيام)',
            'medium' => 'متوسط الأجل (14 يوم)',
            'long' => 'طويل الأجل (30 يوم)',
            default => 'غير محدد',
        };
    }

    // Scopes
    public function scopeForMerchant($query, int $merchantId)
    {
        return $query->where('merchant_id', $merchantId);
    }

    public function scopeByBucket($query, string $bucket)
    {
        return $query->where('expiry_bucket', $bucket);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }

    // Static Methods
    public static function getDefaultCategories(): array
    {
        return [
            // Short-term (7 days)
            ['name' => 'مخبوزات', 'bucket' => 'short'],
            ['name' => 'خبز', 'bucket' => 'short'],
            ['name' => 'معجنات', 'bucket' => 'short'],
            ['name' => 'لحوم طازجة', 'bucket' => 'short'],
            ['name' => 'أسماك', 'bucket' => 'short'],
            
            // Medium-term (14 days)
            ['name' => 'ألبان', 'bucket' => 'medium'],
            ['name' => 'حليب', 'bucket' => 'medium'],
            ['name' => 'أجبان', 'bucket' => 'medium'],
            ['name' => 'زبادي', 'bucket' => 'medium'],
            ['name' => 'خضروات', 'bucket' => 'medium'],
            ['name' => 'فواكه', 'bucket' => 'medium'],
            
            // Long-term (30 days)
            ['name' => 'معلبات', 'bucket' => 'long'],
            ['name' => 'مواد غذائية', 'bucket' => 'long'],
            ['name' => 'بقوليات', 'bucket' => 'long'],
            ['name' => 'حبوب', 'bucket' => 'long'],
            ['name' => 'توابل', 'bucket' => 'long'],
        ];
    }
}