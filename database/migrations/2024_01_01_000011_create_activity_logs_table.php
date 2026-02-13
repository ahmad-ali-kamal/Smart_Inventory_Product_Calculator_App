<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('merchant_id')->constrained()->cascadeOnDelete();
            
            // Polymorphic relationship
            $table->morphs('loggable'); // loggable_id + loggable_type
            
            $table->string('action'); // 'discount_applied', 'product_hidden', 'batch_created', etc.
            $table->text('description');
            $table->json('metadata')->nullable();
            $table->timestamp('created_at');
            
            $table->index(['merchant_id', 'created_at']);
            $table->index('action');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};