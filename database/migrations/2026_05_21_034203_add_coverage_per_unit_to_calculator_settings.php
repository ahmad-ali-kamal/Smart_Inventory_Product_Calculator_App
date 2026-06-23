<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up(): void
{
    if (Schema::hasTable('mustashar_settings') && !Schema::hasColumn('mustashar_settings', 'coverage_per_unit')) {
        Schema::table('mustashar_settings', function (Blueprint $table) {
            $table->decimal('coverage_per_unit', 10, 2)
                  ->nullable()
                  ->after('waste_percentage');
        });
    }
}

public function down(): void
{
    if (Schema::hasTable('mustashar_settings') && Schema::hasColumn('mustashar_settings', 'coverage_per_unit')) {
        Schema::table('mustashar_settings', function (Blueprint $table) {
            $table->dropColumn('coverage_per_unit');
        });
    }
}
};