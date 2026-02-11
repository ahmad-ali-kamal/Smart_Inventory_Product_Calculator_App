<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('merchant_id')->constrained()->cascadeOnDelete();
            $table->string('salla_product_id');
            $table->string('name');
            $table->string('sku')->nullable();
            $table->decimal('price', 10, 2)->default(0);
            $table->integer('quantity')->default(0);
            $table->string('image_url')->nullable();
            $table->enum('status', ['active', 'hidden', 'out_of_stock'])->default('active');
            $table->timestamp('synced_at')->nullable();
            $table->json('metadata')->nullable(); // للبيانات الإضافية من سلة
            $table->timestamps();
            
            $table->unique(['merchant_id', 'salla_product_id']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};