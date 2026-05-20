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
        // ── product_calculator ────────────────────────────────────────────────
        Schema::table('product_calculator', function (Blueprint $table) {
            // coverage_type: 'global' = inherit from calculator_settings
            //                'custom' = use coverage_per_unit on this row
            $table->enum('coverage_type', ['global', 'custom'])
                  ->default('global')
                  ->after('is_enabled')
                  ->comment('global = inherit from store settings | custom = use this row\'s coverage_per_unit');

            // waste_type: same pattern
            $table->enum('waste_type', ['global', 'custom'])
                  ->default('global')
                  ->after('coverage_per_unit')
                  ->comment('global = inherit from store settings | custom = use this row\'s waste_percentage');
        });

        // Backfill: rows that already have a value → mark as 'custom'
        DB::statement("
            UPDATE product_calculator
            SET coverage_type = 'custom'
            WHERE coverage_per_unit IS NOT NULL
        ");

        DB::statement("
            UPDATE product_calculator
            SET waste_type = 'custom'
            WHERE waste_percentage IS NOT NULL
        ");

        // ── calculator_settings ───────────────────────────────────────────────
        // Drop min_input_area / max_input_area — not surfaced in UI, unused.
        Schema::table('calculator_settings', function (Blueprint $table) {
            $table->dropColumn(['min_input_area', 'max_input_area']);
        });
    }

    public function down(): void
    {
        Schema::table('product_calculator', function (Blueprint $table) {
            $table->dropColumn(['coverage_type', 'waste_type']);
        });

        Schema::table('calculator_settings', function (Blueprint $table) {
            $table->decimal('min_input_area', 10, 4)->nullable();
            $table->decimal('max_input_area', 10, 4)->nullable();
        });
    }
};