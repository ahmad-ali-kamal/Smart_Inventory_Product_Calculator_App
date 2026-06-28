<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop old foreign keys before dropping the table
        if (Schema::hasTable('batch_items')) {
            Schema::table('batch_items', function (Blueprint $table) {
                try { $table->dropForeign(['batch_id']); } catch (\Exception $e) {}
                try { $table->dropForeign(['product_id']); } catch (\Exception $e) {}
            });
            Schema::dropIfExists('batch_items');
        }

        // Remove obsolete columns from batches (keep: discount_type, days_until_expiry, salla_variant_id)
        Schema::table('batches', function (Blueprint $table) {
            $columns = ['batch_code', 'name', 'manufactured_date', 'notes'];
            foreach ($columns as $col) {
                if (Schema::hasColumn('batches', $col)) {
                    try { $table->dropColumn($col); } catch (\Exception $e) {}
                }
            }
        });

        // Drop salla_variant_id from batches if it still exists
        Schema::table('batches', function (Blueprint $table) {
            if (Schema::hasColumn('batches', 'salla_variant_id')) {
                try {
                    $table->dropIndex(['salla_variant_id']);
                    $table->dropColumn('salla_variant_id');
                } catch (\Exception $e) {}
            }
        });

        // Remove yellow_batch_label from batch_settings
        Schema::table('batch_settings', function (Blueprint $table) {
            if (Schema::hasColumn('batch_settings', 'yellow_batch_label')) {
                try { $table->dropColumn('yellow_batch_label'); } catch (\Exception $e) {}
            }
        });
    }

    public function down(): void
    {
        // Recreate batch_items
        Schema::create('batch_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('batch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->integer('quantity');
            $table->decimal('unit_cost', 10, 2)->nullable();
            $table->integer('sold_quantity')->default(0);
            $table->integer('remaining_quantity')->storedAs('quantity - sold_quantity');
            $table->bigInteger('salla_variant_id')->nullable();
            $table->integer('variant_quantity')->nullable();
            $table->timestamps();
            $table->unique(['batch_id', 'salla_variant_id']);
        });

        // Re-add columns to batches
        Schema::table('batches', function (Blueprint $table) {
            $table->string('batch_code')->unique()->nullable();
            $table->string('name')->nullable();
            $table->date('manufactured_date')->nullable();
            $table->integer('days_until_expiry')->nullable();
            $table->text('notes')->nullable();
            $table->string('discount_type', 30)->default('pending');
        });
    }
};
