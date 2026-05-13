<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('calculator_settings', function (Blueprint $table) {
            $table->dropColumn('coverage_per_unit');
        });

        Schema::table('product_calculator', function (Blueprint $table) {
            $table->decimal('coverage_per_unit', 10, 2)->nullable()->after('is_enabled');
        });

        Schema::table('calculator_settings', function (Blueprint $table) {
            $table->enum('unit_type', ['m2', 'cm2', 'mm2'])->default('m2')->after('waste_percentage');
            $table->decimal('min_input_area', 10, 4)->nullable()->after('unit_type');
            $table->decimal('max_input_area', 10, 4)->nullable()->after('min_input_area');
        });
    }

    public function down(): void
    {
        Schema::table('calculator_settings', function (Blueprint $table) {
            $table->decimal('coverage_per_unit', 10, 2)->after('merchant_id');
        });

        Schema::table('product_calculator', function (Blueprint $table) {
            $table->dropColumn('coverage_per_unit');
        });

        Schema::table('calculator_settings', function (Blueprint $table) {
            $table->dropColumn(['unit_type', 'min_input_area', 'max_input_area']);
        });
    }
};