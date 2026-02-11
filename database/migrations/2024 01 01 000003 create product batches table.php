<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->integer('batch_number')->default(1);
            $table->integer('quantity');
            $table->date('expiry_date');
            $table->enum('status', ['green', 'yellow', 'red'])->default('green');
            $table->integer('days_until_expiry')->nullable();
            $table->timestamps();
            
            $table->index(['product_id', 'status']);
            $table->index('expiry_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_batches');
    }
};