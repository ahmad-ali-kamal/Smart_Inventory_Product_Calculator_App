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
        $table->unsignedBigInteger('salla_expiry_option_id')->nullable()->after('salla_product_id');
    });
}

public function down(): void
{
    Schema::table('products', function (Blueprint $table) {
        $table->dropColumn('salla_expiry_option_id');
    });
}
};
