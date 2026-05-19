<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Check if we need to rename (old table exists)
        $tables = DB::select('SHOW TABLES');
        $tableNames = array_map(fn($t) => array_values((array)$t)[0], $tables);

        // If product_discounts exists and batch_discounts doesn't, rename
        if (in_array('product_discounts', $tableNames) && !in_array('batch_discounts', $tableNames)) {
            Schema::rename('product_discounts', 'batch_discounts');
        }

        // If batch_discounts exists (old or new), alter it
        if (Schema::hasTable('batch_discounts')) {
            // Remove AI-related columns (manual discounts only now)
            if (Schema::hasColumn('batch_discounts', 'is_ai_suggested')) {
                Schema::table('batch_discounts', function (Blueprint $table) {
                    $table->dropColumn('is_ai_suggested');
                });
            }

            if (Schema::hasColumn('batch_discounts', 'ai_reasoning')) {
                Schema::table('batch_discounts', function (Blueprint $table) {
                    $table->dropColumn('ai_reasoning');
                });
            }

            if (Schema::hasColumn('batch_discounts', 'applied_to_salla')) {
                Schema::table('batch_discounts', function (Blueprint $table) {
                    $table->dropColumn('applied_to_salla');
                });
            }

            if (Schema::hasColumn('batch_discounts', 'salla_special_price_id')) {
                Schema::table('batch_discounts', function (Blueprint $table) {
                    $table->dropColumn('salla_special_price_id');
                });
            }

            // Remove product_id with correct foreign key name
            if (Schema::hasColumn('batch_discounts', 'product_id')) {
                Schema::table('batch_discounts', function (Blueprint $table) {
                    // Try the correct foreign key name based on original migration
                    try {
                        DB::statement('ALTER TABLE batch_discounts DROP FOREIGN KEY product_discounts_product_id_foreign');
                    } catch (\Exception $e) {
                        // FK may not exist, try alternative names
                        try {
                            DB::statement('ALTER TABLE batch_discounts DROP FOREIGN KEY batch_discounts_product_id_foreign');
                        } catch (\Exception $e2) {
                            // Ignore if not found
                        }
                    }
                    $table->dropColumn('product_id');
                });
            }

            // Drop old indexes with original names
            Schema::table('batch_discounts', function (Blueprint $table) {
                try {
                    DB::statement('DROP INDEX product_discounts_product_id_status_index ON batch_discounts');
                } catch (\Exception $e) {
                    // Index may not exist
                }

                if (!Schema::hasColumn('batch_discounts', 'created_by')) {
                    $table->unsignedBigInteger('created_by')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        Schema::create('product_discounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('batch_id')->nullable()->constrained('batches')->nullOnDelete();
            $table->decimal('discount_percentage', 5, 2);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->enum('status', ['scheduled', 'active', 'expired', 'cancelled'])->default('scheduled');
            $table->boolean('is_ai_suggested')->default(false);
            $table->boolean('applied_to_salla')->default(false);
            $table->string('salla_special_price_id')->nullable();
            $table->text('ai_reasoning')->nullable();
            $table->timestamps();

            $table->index(['product_id', 'status']);
            $table->index(['batch_id', 'status']);
            $table->index('ends_at');
        });
    }
};