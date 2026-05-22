<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Adds explicit coverage_type / waste_type flags to product_calculator.
 * Drops min_input_area / max_input_area from calculator_settings (unused).
 *
 * Run: php artisan migrate
 *
 * Rollback-safe: down() restores the dropped columns with nullable.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('product_calculator', 'coverage_type')) {
            Schema::table('product_calculator', function (Blueprint $table) {
                $table->enum('coverage_type', ['global', 'custom'])
                      ->default('global')
                      ->after('is_enabled')
                      ->comment('global = inherit from store settings | custom = use this row\'s coverage_per_unit');
            });

            DB::statement("
                UPDATE product_calculator
                SET coverage_type = 'custom'
                WHERE coverage_per_unit IS NOT NULL
            ");
        }

        if (!Schema::hasColumn('product_calculator', 'waste_type')) {
            Schema::table('product_calculator', function (Blueprint $table) {
                $table->enum('waste_type', ['global', 'custom'])
                      ->default('global')
                      ->after('coverage_per_unit')
                      ->comment('global = inherit from store settings | custom = use this row\'s waste_percentage');
            });

            DB::statement("
                UPDATE product_calculator
                SET waste_type = 'custom'
                WHERE waste_percentage IS NOT NULL
            ");
        }

        if (Schema::hasTable('calculator_settings')) {
            Schema::table('calculator_settings', function (Blueprint $table) {
                $table->dropColumn(['min_input_area', 'max_input_area']);
            });
        } elseif (Schema::hasTable('mustashar_settings') && Schema::hasColumn('mustashar_settings', 'min_input_area')) {
            Schema::table('mustashar_settings', function (Blueprint $table) {
                $table->dropColumn(['min_input_area', 'max_input_area']);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('product_calculator') && Schema::hasColumn('product_calculator', 'coverage_type')) {
            Schema::table('product_calculator', function (Blueprint $table) {
                $table->dropColumn(['coverage_type', 'waste_type']);
            });
        }

        if (Schema::hasTable('calculator_settings')) {
            Schema::table('calculator_settings', function (Blueprint $table) {
                $table->decimal('min_input_area', 10, 4)->nullable();
                $table->decimal('max_input_area', 10, 4)->nullable();
            });
        }
    }
};