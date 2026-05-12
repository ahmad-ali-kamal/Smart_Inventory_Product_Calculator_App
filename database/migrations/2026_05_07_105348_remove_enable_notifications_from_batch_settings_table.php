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
        Schema::table('batch_settings', function (Blueprint $table) {
        // حذف العمود
             $table->dropColumn('enable_notifications');
         });
    }

    public function down(): void
    {
        Schema::table('batch_settings', function (Blueprint $table) {
        // إعادة العمود في حال قررت التراجع عن المهاجرة (Rollback)
            $table->boolean('enable_notifications')->default(true);
        });
    }
};
