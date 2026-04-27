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
        Schema::table('apps', function (Blueprint $table) {
            // حذف القيد القديم الذي يسبب المشكلة
            $table->dropUnique('apps_client_id_unique'); 

             // (اختياري) إضافة قيد جديد منطقي: 
             // التاجر الواحد لا يتكرر لنفس التطبيق
            $table->unique(['merchant_id', 'app_name']); 
        });
    }

    public function down(): void
    {
        Schema::table('apps', function (Blueprint $table) {
            $table->unique('client_id');
            $table->dropUnique(['merchant_id', 'app_name']);
        });
    }
};
