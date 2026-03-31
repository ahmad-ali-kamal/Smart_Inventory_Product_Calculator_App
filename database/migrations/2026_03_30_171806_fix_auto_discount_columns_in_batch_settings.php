<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class FixAutoDiscountColumnsInBatchSettings extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::table('batch_settings', function (Blueprint $table) {
        // إضافة العمود الناقص
        $table->boolean('auto_discounts')->default(false)->after('enable_notifications');

        // تصحيح الأسماء والنوع
        $table->renameColumn('auto_discount_duration_day', 'auto_discount_duration_days');
        $table->renameColumn('auto_discount_percentage',   'auto_discount_percent');
    });

    // تصحيح نوع البيانات بعد الـ rename
    Schema::table('batch_settings', function (Blueprint $table) {
        $table->integer('auto_discount_percent')
              ->nullable()
              ->default(20)
              ->change();
    });
}

public function down(): void
{
    Schema::table('batch_settings', function (Blueprint $table) {
        $table->dropColumn('auto_discounts');
        $table->renameColumn('auto_discount_duration_days', 'auto_discount_duration_day');
        $table->renameColumn('auto_discount_percent',       'auto_discount_percentage');
    });
}
}
