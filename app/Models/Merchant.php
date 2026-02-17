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

    /**
     * الحقول القابلة للتعبئة (Mass Assignment)
     * مطابقة تماماً لجدول merchants في قاعدة البيانات
     */
    protected $fillable = [
        'salla_merchant_id',
        'name',          // الاسم في قاعدة البيانات
        'email',
        'mobile',
        'access_token',
        'refresh_token',
        'token_expires_at',
        'store_info',    // حقل JSON لكامل البيانات
    ];

    /**
     * الحقول المخفية عند تحويل المودل إلى Array/JSON
     */
    protected $hidden = [
        'access_token',
        'refresh_token',
    ];

    /**
     * تحويل أنواع البيانات تلقائياً
     */
    protected $casts = [
        'token_expires_at' => 'datetime',
        'store_info' => 'array',
    ];

    /*
    |--------------------------------------------------------------------------
    | التشفير والحماية (Encryption)
    |--------------------------------------------------------------------------
    */

    public function setAccessTokenAttribute($value)
    {
        $this->attributes['access_token'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getAccessTokenAttribute($value)
    {
        try {
            return $value ? Crypt::decryptString($value) : null;
        } catch (\Exception $e) {
            return $value;
        }
    }

    public function setRefreshTokenAttribute($value)
    {
        $this->attributes['refresh_token'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getRefreshTokenAttribute($value)
    {
        try {
            return $value ? Crypt::decryptString($value) : null;
        } catch (\Exception $e) {
            return $value;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | دوال مساعدة (Helper Methods)
    |--------------------------------------------------------------------------
    */

    public function isTokenExpired(): bool
    {
        return $this->token_expires_at && $this->token_expires_at->isPast();
    }

    public function hasValidToken(): bool
    {
        return !empty($this->access_token) && !$this->isTokenExpired();
    }

    /*
    |--------------------------------------------------------------------------
    | العلاقات (Relationships)
    |--------------------------------------------------------------------------
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
}