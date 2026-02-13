<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('calculator_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('merchant_id')->unique()->constrained()->cascadeOnDelete();
            $table->decimal('coverage_per_unit', 10, 2);
            $table->decimal('waste_percentage', 5, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('calculator_settings');
    }
};