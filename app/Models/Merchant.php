<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Crypt;

class Merchant extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'salla_merchant_id',
        'store_name',
        'email',
        'access_token',
        'refresh_token',
        'token_expires_at',
        'store_info',
        'is_active',
    ];

    protected $hidden = [
        'access_token',
        'refresh_token',
    ];

    protected $casts = [
        'token_expires_at' => 'datetime',
        'store_info' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * 🔒 تشفير وفك تشفير التوكن تلقائياً
     * لضمان حماية بيانات التاجر في قاعدة البيانات
     */
    public function getAccessTokenAttribute($value): ?string
    {
        try {
            return $value ? Crypt::decryptString($value) : null;
        } catch (\Exception $e) {
            return $value; // في حال لم يكن مشفراً مسبقاً
        }
    }

    public function setAccessTokenAttribute($value): void
    {
        $this->attributes['access_token'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getRefreshTokenAttribute($value): ?string
    {
        try {
            return $value ? Crypt::decryptString($value) : null;
        } catch (\Exception $e) {
            return $value;
        }
    }

    public function setRefreshTokenAttribute($value): void
    {
        $this->attributes['refresh_token'] = $value ? Crypt::encryptString($value) : null;
    }

    /**
     * التحقق من صلاحية الـ Token
     */
    public function isTokenExpired(): bool
    {
        return $this->token_expires_at && $this->token_expires_at->isPast();
    }

    public function hasValidToken(): bool
    {
        return !empty($this->access_token) && !$this->isTokenExpired();
    }

    /**
     * العلاقات (Relationships)
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function batches(): HasMany
    {
        return $this->hasMany(Batch::class);
    }

    public function categoryMappings(): HasMany
    {
        return $this->hasMany(CategoryMapping::class);
    }

    public function batchSettings(): HasOne
    {
        return $this->hasOne(BatchSetting::class);
    }

    public function calculatorSettings(): HasOne
    {
        return $this->hasOne(CalculatorSetting::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    /**
     * Scopes لمساعدتك في الاستعلامات
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}