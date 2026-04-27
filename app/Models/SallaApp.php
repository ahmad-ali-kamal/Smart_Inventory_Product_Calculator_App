<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;
use Carbon\Carbon;

class SallaApp extends Model
{
    // تأكد أن اسم الجدول مطابق لما وضعته في الـ Migration
    // إذا سميت الجدول في الميغريشن salla_apps غيرها هنا
    protected $table = 'apps';

    protected $fillable = [
        'merchant_id',
        'app_name',
        'client_id',
        'access_token',
        'refresh_token',
        'token_expires_at',
    ];

    protected $casts = [
        'token_expires_at' => 'datetime',
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
    | دوال فحص الصلاحية (Helper Methods)
    |--------------------------------------------------------------------------
    */

    /**
     * فحص هل انتهت صلاحية التوكن
     */
    public function isTokenExpired(): bool
    {
        return $this->token_expires_at && $this->token_expires_at->isPast();
    }

    /**
     * فحص هل التوكن موجود وصالح للاستخدام
     */
    public function hasValidToken(): bool
    {
        return !empty($this->access_token) && !$this->isTokenExpired();
    }

    /*
    |--------------------------------------------------------------------------
    | العلاقات (Relationships)
    |--------------------------------------------------------------------------
    */

    public function merchant()
    {
        return $this->belongsTo(Merchant::class);
    }
}