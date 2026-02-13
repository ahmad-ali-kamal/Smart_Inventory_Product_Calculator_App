<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('batch_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('batch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->integer('quantity'); // الكمية من هذا المنتج في هذه الدفعة
            $table->decimal('unit_cost', 10, 2)->nullable(); // التكلفة لكل وحدة (اختياري)
            $table->integer('sold_quantity')->default(0); // الكمية المباعة
            $table->integer('remaining_quantity')->storedAs('quantity - sold_quantity'); // virtual column
            $table->timestamps();
            
            $table->unique(['batch_id', 'product_id']); // منتج واحد لكل دفعة
            $table->index(['product_id', 'batch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('batch_items');
    }
};