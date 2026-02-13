<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('merchants', function (Blueprint $table) {
            $table->id();
            $table->string('salla_merchant_id')->unique();
            $table->string('store_name');
            $table->string('email')->unique();
            $table->string('verification_token')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->text('access_token')->nullable(); // من سلة API
            $table->text('refresh_token')->nullable();
            $table->timestamp('token_expires_at')->nullable();
            $table->json('store_info')->nullable();
            $table->boolean('is_active')->default(false); // يتم التفعيل بعد التحقق من الإيميل
            $table->timestamps();
            
            $table->index('email');
            $table->index('salla_merchant_id');
            $table->index('verification_token');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('merchants');
    }
};