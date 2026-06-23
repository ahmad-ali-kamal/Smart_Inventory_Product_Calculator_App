<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_mustashar', function (Blueprint $table) {
            $table->tinyInteger('dimension_count')->default(2)->after('is_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('product_mustashar', function (Blueprint $table) {
            $table->dropColumn('dimension_count');
        });
    }
};
