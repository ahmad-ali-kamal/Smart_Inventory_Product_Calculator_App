<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('batch_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('merchant_id')->unique()->constrained()->cascadeOnDelete();
            $table->integer('green_threshold_days')->default(60); // أكثر من 60 يوم = أخضر
            $table->integer('yellow_threshold_days')->default(15); // 15-60 يوم = أصفر
            $table->integer('red_threshold_days')->default(0); // أقل من 15 يوم = أحمر
            $table->boolean('auto_hide_expired')->default(false); // إخفاء تلقائي للمنتجات المنتهية
            $table->boolean('enable_notifications')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('batch_settings');
    }
};