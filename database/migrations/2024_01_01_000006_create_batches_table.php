<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('merchant_id')->constrained()->cascadeOnDelete();
            $table->string('batch_code')->unique(); // كود الدفعة الفريد
            $table->string('name')->nullable(); // اسم الدفعة (اختياري)
            $table->date('manufactured_date')->nullable();
            $table->date('expiry_date');
            $table->enum('status', ['green', 'yellow', 'red'])->default('green');
            $table->integer('days_until_expiry')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index(['merchant_id', 'expiry_date']);
            $table->index(['merchant_id', 'status']);
            $table->index('batch_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('batches');
    }
};