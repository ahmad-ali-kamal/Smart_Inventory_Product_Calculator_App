<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Merchant extends Authenticatable
{
    use HasFactory, Notifiable;

    /**
     * الحقول القابلة للتعبئة (Mass Assignment)
     * تم حذف حقول التوكنات لأنها انتقلت لجدول salla_apps
     */
    protected $fillable = [
        'salla_merchant_id',
        'name',
        'email',
        'mobile',
        'store_info',
        'has_calculator', 
        'has_management', 
    ];

    /**
     * الحقول المخفية عند تحويل المودل إلى Array/JSON
     */
    protected $hidden = [
        'remember_token',
    ];

    /**
     * تحويل أنواع البيانات تلقائياً
     */
    protected $casts = [
        'store_info' => 'array',
        'has_calculator' => 'boolean',
        'has_management' => 'boolean',
    ];

    /*
    |--------------------------------------------------------------------------
    | العلاقات (Relationships)
    |--------------------------------------------------------------------------
    */

    /**
     * علاقة التاجر مع تطبيقاته (حريص، المستشار، إلخ)
     */
    public function sallaApps(): HasMany
    {
        return $this->hasMany(SallaApp::class);
    }

    /**
     * الوصول للمنتجات التابعة للتاجر
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /**
     * الوصول للباتشات التابعة للتاجر
     */
    public function batches(): HasMany
    {
        return $this->hasMany(Batch::class);
    }

    /**
     * إعدادات التصنيفات
     */
    public function categoryMappings(): HasMany
    {
        return $this->hasMany(CategoryMapping::class);
    }

    /**
     * إعدادات الباتشات العامة
     */
    public function batchSettings(): HasOne
    {
        return $this->hasOne(BatchSetting::class);
    }

    /**
     * إعدادات الحاسبة
     */
    public function calculatorSettings(): HasOne
    {
        return $this->hasOne(CalculatorSetting::class);
    }

    /**
     * سجل النشاطات
     */
    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }
}