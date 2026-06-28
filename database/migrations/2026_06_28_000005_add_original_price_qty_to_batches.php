<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('batches', function (Blueprint $table) {
            $table->decimal('original_price', 10, 2)->nullable()->after('offer_id')
                  ->comment('Original product price before batch modifications');
            $table->integer('original_qty')->nullable()->after('original_price')
                  ->comment('Original product quantity before batch modifications');
            $table->json('original_variant_prices')->nullable()->after('original_qty')
                  ->comment('Original variant prices before batch modifications [{variant_id, price}]');
            $table->json('original_variant_qtys')->nullable()->after('original_variant_prices')
                  ->comment('Original variant quantities before batch modifications [{variant_id, qty}]');
        });
    }

    public function down(): void
    {
        Schema::table('batches', function (Blueprint $table) {
            $table->dropColumn(['original_price', 'original_qty', 'original_variant_prices', 'original_variant_qtys']);
        });
    }
};
