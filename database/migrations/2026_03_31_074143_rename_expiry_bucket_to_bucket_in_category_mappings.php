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
        // تغيير مسمى العمود من المسمى القديم إلى الجديد ليطابق الكنترولر
        $table->renameColumn('expiry_bucket', 'bucket');
        });
    }

    public function down(): void
    {
        Schema::table('category_mappings', function (Blueprint $table) {
        $table->renameColumn('bucket', 'expiry_bucket');
        });
    }
};
