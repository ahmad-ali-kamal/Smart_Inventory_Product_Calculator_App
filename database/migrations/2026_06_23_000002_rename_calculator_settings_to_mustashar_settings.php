<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('calculator_settings') && !Schema::hasTable('mustashar_settings')) {
            Schema::rename('calculator_settings', 'mustashar_settings');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('mustashar_settings') && !Schema::hasTable('calculator_settings')) {
            Schema::rename('mustashar_settings', 'calculator_settings');
        }
    }
};
