<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('batch_items', function (Blueprint $table) {
            $table->bigInteger('salla_variant_id')->nullable()->after('product_id');
            $table->integer('variant_quantity')->nullable()->after('salla_variant_id');
        });
    }

    public function down(): void
    {
        Schema::table('batch_items', function (Blueprint $table) {
            $table->dropColumn(['salla_variant_id', 'variant_quantity']);
        });
    }
};