<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('batches', function (Blueprint $table) {
            // سنضع العمود بعد الـ merchant_id لضمان عدم حدوث خطأ
            $table->string('salla_variant_id')->nullable()->after('merchant_id');
            
            // إضافة index للبحث السريع
            $table->index('salla_variant_id');
        });
    }

    public function down(): void
    {
        Schema::table('batches', function (Blueprint $table) {
            if (Schema::hasColumn('batches', 'salla_variant_id')) {
                $table->dropColumn('salla_variant_id');
            }
        });
    }
};