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
            // نسبة الخصم (مثلاً 10.50%)
            $table->decimal('auto_discount_percentage', 5, 2)->default(0)->after('id'); 
        
            // مدة الخصم بالأيام
            $table->integer('auto_discount_duration_day')->default(0)->after('auto_discount_percentage');
         });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('batch_settings', function (Blueprint $table) {
            $table->dropColumn(['auto_discount_percentage', 'auto_discount_duration_day']);
         });
     }

};
