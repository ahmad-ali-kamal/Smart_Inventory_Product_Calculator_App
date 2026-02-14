<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

class Merchant extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'salla_merchant_id',
        'store_name',
        'email',
        'verification_token',
        'email_verified_at',
        'access_token',
        'refresh_token',
        'token_expires_at',
        'store_info',
        'is_active',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'token_expires_at' => 'datetime',
        'store_info' => 'array',
        'is_active' => 'boolean',
    ];

    protected $hidden = [
        'access_token',
        'refresh_token',
        'verification_token',
    ];

    // Relationships
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

    // Accessors & Mutators
    public function getAccessTokenAttribute($value): ?string
    {
        return $value ? Crypt::decryptString($value) : null;
    }

    public function setAccessTokenAttribute($value): void
    {
        $this->attributes['access_token'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getRefreshTokenAttribute($value): ?string
    {
        return $value ? Crypt::decryptString($value) : null;
    }

    public function setRefreshTokenAttribute($value): void
    {
        $this->attributes['refresh_token'] = $value ? Crypt::encryptString($value) : null;
    }

    // Helper Methods
    public function isEmailVerified(): bool
    {
        return !is_null($this->email_verified_at);
    }

    public function generateVerificationToken(): string
    {
        $this->verification_token = Str::random(64);
        $this->save();

        return $this->verification_token;
    }

    public function markEmailAsVerified(): bool
    {
        $this->email_verified_at = now();
        $this->is_active = true;
        $this->verification_token = null;

        return $this->save();
    }

    public function isTokenExpired(): bool
    {
        return $this->token_expires_at && $this->token_expires_at->isPast();
    }

    public function hasCalculatorSettings(): bool
    {
        return $this->calculatorSettings()->exists();
    }

    public function hasBatchSettings(): bool
    {
        return $this->batchSettings()->exists();
    }

    // Scopes
    public function scopeVerified($query)
    {
        return $query->whereNotNull('email_verified_at');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}