<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_discounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('batch_id')->nullable()->constrained('product_batches')->nullOnDelete();
            $table->decimal('discount_percentage', 5, 2);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->enum('status', ['scheduled', 'active', 'expired', 'cancelled'])->default('scheduled');
            $table->boolean('is_ai_suggested')->default(false);
            $table->boolean('applied_to_salla')->default(false);
            $table->string('salla_special_price_id')->nullable();
            $table->text('ai_reasoning')->nullable(); // سبب الاقتراح من AI
            $table->timestamps();
            
            $table->index(['product_id', 'status']);
            $table->index('ends_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_discounts');
    }
};