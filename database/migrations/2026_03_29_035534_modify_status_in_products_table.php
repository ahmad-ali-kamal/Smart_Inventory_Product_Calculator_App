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
        Schema::table('products', function (Blueprint $table) {
            // تحويل العمود إلى نص (string) ليتسع لأي حالة قادمة من سلة
            // واستخدام change() لتعديل العمود الموجود مسبقاً
            $table->string('status')->default('active')->change();
            
            // إضافة عمود الـ Category إذا لم يكن موجوداً لضمان ظهور المنتجات في الواجهة
            if (!Schema::hasColumn('products', 'category')) {
                $table->string('category')->nullable()->after('sku');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // في حال أردت التراجع عن التعديل (اختياري)
            // $table->string('status')->change(); 
        });
    }
};