<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('apps', function (Blueprint $table) {
            $table->id();
            // الربط مع جدول التجار
            $table->foreignId('merchant_id')->constrained('merchants')->onDelete('cascade');
            
            $table->string('app_name'); // 'calculator' أو 'management'
            $table->string('client_id')->unique(); // معرف التطبيق من سلة
            
            $table->text('access_token');
            $table->text('refresh_token')->nullable();
            $table->timestamp('token_expires_at')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('apps');
    }
};