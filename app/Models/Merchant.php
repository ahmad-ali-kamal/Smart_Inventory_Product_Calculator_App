<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Crypt;

class Merchant extends Model
{
    use HasFactory;

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

    protected $casts = [
        'token_expires_at' => 'datetime',
        'store_info' => 'array',
        'is_active' => 'boolean',
    ];

    protected $hidden = [
        'access_token',
        'refresh_token',
    ];

    // Relationships
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function calculatorSettings(): HasOne
    {
        return $this->hasOne(CalculatorSetting::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    // Accessors & Mutators
    public function getAccessTokenAttribute($value): string
    {
        return $value ? Crypt::decryptString($value) : '';
    }

    public function setAccessTokenAttribute($value): void
    {
        $this->attributes['access_token'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getRefreshTokenAttribute($value): string
    {
        return $value ? Crypt::decryptString($value) : '';
    }

    public function setRefreshTokenAttribute($value): void
    {
        $this->attributes['refresh_token'] = $value ? Crypt::encryptString($value) : null;
    }

    // Helper Methods
    public function isTokenExpired(): bool
    {
        return $this->token_expires_at && $this->token_expires_at->isPast();
    }

    public function hasCalculatorSettings(): bool
    {
        return $this->calculatorSettings()->exists();
    }
}