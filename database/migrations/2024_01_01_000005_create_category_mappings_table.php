<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('category_mappings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('merchant_id')->constrained()->cascadeOnDelete();
            $table->string('category_name'); // اسم الفئة من سلة
            $table->enum('expiry_bucket', ['short', 'medium', 'long'])->default('medium');
            // short = 7 days, medium = 14 days, long = 30 days
            $table->integer('custom_threshold_days')->nullable(); // إذا أراد تخصيص الفترة
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            $table->unique(['merchant_id', 'category_name']);
            $table->index(['merchant_id', 'expiry_bucket']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('category_mappings');
    }
};