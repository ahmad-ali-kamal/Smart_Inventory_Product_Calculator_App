<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up(): void
{
    Schema::table('batches', function (Blueprint $table) {
        // Remove old columns if they exist
        if (Schema::hasColumn('batches', 'salla_variant_id')) {
            $table->dropColumn('salla_variant_id');
        }
        if (Schema::hasColumn('batches', 'salla_variant_ids')) {
            $table->dropColumn('salla_variant_ids');
        }
        if (Schema::hasColumn('batches', 'salla_option_value_id')) {
            $table->dropColumn('salla_option_value_id');
        }

        // Add new column only if it doesn't exist
        if (!Schema::hasColumn('batches', 'variant_info')) {
            $table->json('variant_info')->nullable()->after('merchant_id');
        }
    });
}
    public function down(): void
    {
        Schema::table('batches', function (Blueprint $table) {
            $table->dropColumn('variant_info');

            // Restore old columns
            $table->string('salla_variant_id')->nullable()->after('merchant_id');
            $table->json('salla_variant_ids')->nullable()->after('salla_variant_id');
            $table->unsignedBigInteger('salla_option_value_id')->nullable()->after('salla_variant_ids');
        });
    }
};