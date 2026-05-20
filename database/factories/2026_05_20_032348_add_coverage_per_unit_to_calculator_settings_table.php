<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('calculator_settings', function (Blueprint $table) {
            // Global coverage — used when the merchant chooses "same for all products"
            // NULL means the merchant has not set a global default (per-product mode only).
            $table->decimal('coverage_per_unit', 10, 2)->nullable()->after('waste_percentage');
        });
    }

    public function down(): void
    {
        Schema::table('calculator_settings', function (Blueprint $table) {
            $table->dropColumn('coverage_per_unit');
        });
    }
};