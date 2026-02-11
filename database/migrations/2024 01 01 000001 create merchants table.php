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
            $table->string('email')->nullable();
            $table->text('access_token');
            $table->text('refresh_token');
            $table->timestamp('token_expires_at')->nullable();
            $table->json('store_info')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index('salla_merchant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('merchants');
    }
};