<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('batches', function (Blueprint $table) {
            try { $table->dropIndex(['salla_variant_id']); } catch (\Throwable $e) {}
            if (Schema::hasColumn('batches', 'salla_variant_id')) {
                $table->dropColumn('salla_variant_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('batches', function (Blueprint $table) {
            $table->bigInteger('salla_variant_id')->nullable()->after('notes');
        });
    }
};