<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('batch_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('batch_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('variant_id');
            $table->integer('total_qty')->default(0);
            $table->integer('batch_qty')->default(0);
            $table->timestamps();

            $table->unique(['batch_id', 'variant_id']);
        });

        // Migrate existing variant data from batch_items to batch_variants
        $batchItems = DB::table('batch_items')
            ->whereNotNull('salla_variant_id')
            ->where('salla_variant_id', '>', 0)
            ->get();

        foreach ($batchItems as $item) {
            DB::table('batch_variants')->insert([
                'batch_id'    => $item->batch_id,
                'variant_id'  => $item->salla_variant_id,
                'total_qty'   => $item->variant_quantity ?? $item->quantity,
                'batch_qty'   => $item->variant_quantity ?? $item->quantity,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('batch_variants');
    }
};
