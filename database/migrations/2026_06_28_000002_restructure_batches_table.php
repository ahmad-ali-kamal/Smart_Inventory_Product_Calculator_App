<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('batches', function (Blueprint $table) {
            $table->foreignId('product_id')->nullable()->constrained()->cascadeOnDelete()->after('merchant_id');
            $table->decimal('discount_pct', 5, 2)->nullable()->after('status');
            $table->integer('yellow_threshold')->nullable()->after('discount_pct');
            $table->integer('red_threshold')->nullable()->after('yellow_threshold');
            $table->integer('total_qty')->default(0)->after('red_threshold');
            $table->integer('batch_qty')->default(0)->after('total_qty');
            $table->string('offer_id')->nullable()->after('batch_qty');
        });

        // Migrate data from batch_items to batches (one batch per product)
        // For products with multiple batches, keep the one with yellow status first, then the most recent
        $products = DB::table('products')->get();

        foreach ($products as $product) {
            $batchItems = DB::table('batch_items')
                ->where('product_id', $product->id)
                ->get();

            if ($batchItems->isEmpty()) continue;

            // Group by batch_id, prefer yellow over green, then most recent expiry
            $batchIds = $batchItems->pluck('batch_id')->unique();
            $batches = DB::table('batches')
                ->whereIn('id', $batchIds)
                ->orderByRaw("FIELD(status, 'yellow', 'green', 'red')")
                ->orderBy('expiry_date', 'desc')
                ->get();

            $primaryBatch = $batches->first();
            if (!$primaryBatch) continue;

            $primaryItems = $batchItems->where('batch_id', $primaryBatch->id);
            $totalQty = $primaryItems->sum('quantity');

            DB::table('batches')
                ->where('id', $primaryBatch->id)
                ->update([
                    'product_id' => $product->id,
                    'total_qty'  => $totalQty,
                    'batch_qty'  => $totalQty,
                ]);

            // Delete other batches & their items for this product
            $otherIds = $batchIds->reject(fn($id) => $id === $primaryBatch->id);
            if ($otherIds->isNotEmpty()) {
                DB::table('batch_items')
                    ->whereIn('batch_id', $otherIds)
                    ->where('product_id', $product->id)
                    ->delete();

                DB::table('batches')
                    ->whereIn('id', $otherIds)
                    ->whereNotExists(function ($q) {
                        $q->select(DB::raw(1))
                          ->from('batch_items')
                          ->whereColumn('batch_id', 'batches.id');
                    })
                    ->delete();
            }
        }
    }

    public function down(): void
    {
        Schema::table('batches', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
            $table->dropColumn([
                'product_id', 'discount_pct', 'yellow_threshold',
                'red_threshold', 'total_qty', 'batch_qty', 'offer_id',
            ]);
        });
    }
};
