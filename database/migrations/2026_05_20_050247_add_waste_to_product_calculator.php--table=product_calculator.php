<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds per-product waste_percentage to the product_calculator table.
 *
 * Nullable — null means "fall back to the global mustashar_settings value".
 * This mirrors the existing coverage_per_unit column pattern.
 *
 * Run: php artisan migrate
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_calculator', function (Blueprint $table) {
            $table->decimal('waste_percentage', 5, 2)
                  ->nullable()
                  ->after('coverage_per_unit')
                  ->comment('Per-product waste override. null = use global mustashar_settings value.');
        });
    }

    public function down(): void
    {
        Schema::table('product_calculator', function (Blueprint $table) {
            $table->dropColumn('waste_percentage');
        });
    }
};