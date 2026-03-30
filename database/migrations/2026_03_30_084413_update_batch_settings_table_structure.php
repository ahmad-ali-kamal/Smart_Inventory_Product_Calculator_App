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
        // الخطوة 1: تغيير مسميات الأعمدة فقط
        Schema::table('batch_settings', function (Blueprint $table) {
            $table->renameColumn('red_threshold_days', 'short_term_days');
            $table->renameColumn('yellow_threshold_days', 'medium_term_days');
            $table->renameColumn('green_threshold_days', 'long_term_days');
       });

    // الخطوة 2: الآن بما أن الأسماء الجديدة أصبحت "رسمية"، نعدل الخصائص
        Schema::table('batch_settings', function (Blueprint $table) {
            $table->integer('short_term_days')->default(7)->change();
            $table->integer('medium_term_days')->default(14)->change();
            $table->integer('long_term_days')->default(30)->change();
       });
   }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('batch_settings', function (Blueprint $table) {
            // تراجع عن التعديلات في حال أردت العودة للخلف
            $table->renameColumn('short_term_days', 'red_threshold_days');
            $table->renameColumn('medium_term_days', 'yellow_threshold_days');
            $table->renameColumn('long_term_days', 'green_threshold_days');
        });
    }
};