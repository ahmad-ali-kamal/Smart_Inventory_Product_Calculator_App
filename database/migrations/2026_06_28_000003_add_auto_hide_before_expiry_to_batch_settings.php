<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('batch_settings', function (Blueprint $table) {
            $table->integer('auto_hide_before_expiry_days')
                  ->nullable()
                  ->default(null)
                  ->after('auto_hide_expired')
                  ->comment('Hide product X days before expiry. Only active when auto_hide_expired is enabled.');
        });
    }

    public function down(): void
    {
        Schema::table('batch_settings', function (Blueprint $table) {
            $table->dropColumn('auto_hide_before_expiry_days');
        });
    }
};
