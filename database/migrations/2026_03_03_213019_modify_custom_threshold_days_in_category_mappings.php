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
        Schema::table('category_mappings', function (Blueprint $table) {
            // تغيير العمود ليصبح nullable
            $table->integer('custom_threshold_days')->nullable()->change();
          });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('category_mappings', function (Blueprint $table) {
            // في حال التراجع، نرجعه لعدم قبول الـ null (تأكد من وجود قيم قبل التنفيذ)
            $table->integer('custom_threshold_days')->nullable(false)->change();
        });
    }
};
