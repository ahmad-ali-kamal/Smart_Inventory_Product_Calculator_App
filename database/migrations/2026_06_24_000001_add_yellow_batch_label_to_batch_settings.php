<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('batch_settings', function (Blueprint $table) {
            $table->string('yellow_batch_label', 100)->default('عرض التوفير (كمية محدودة)')->after('auto_discount_duration_days');
        });
    }

    public function down(): void
    {
        Schema::table('batch_settings', function (Blueprint $table) {
            $table->dropColumn('yellow_batch_label');
        });
    }
};
