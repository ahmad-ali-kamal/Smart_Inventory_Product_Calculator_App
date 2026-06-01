<?php

/**
 * ====================================================================
 * Fix batch_items unique constraint for multi-variant support
 * ====================================================================
 *
 * المشكلة:
 *   كان الـ unique index على (batch_id, product_id) فقط
 *   مما يمنع وجود أكثر من BatchItem لنفس المنتج داخل نفس Batch
 *   وهذا يمنع توزيع الكمية على عدة Variants
 *
 * الحل:
 *   تغيير الـ unique index إلى (batch_id, salla_variant_id)
 *   بحيث:
 *     - الـ Variants: salla_variant_id غير null → ممنوع التكرار لكل variant داخل نفس الـ batch ✓
 *     - بدون Variants: salla_variant_id = null → MySQL يسمح بتكرار null (التطبيق يمنعه منطقياً) ✓
 *
 * ملاحظة:
 *   تم حذف وإعادة إنشاء foreign keys لأن MySQL يمنع حذف الـ index
 *   إذا كان مستخدماً في foreign key constraint
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. حذف foreign keys المؤقتاً (MySQL يمنع حذف index مستخدم في FK)
        Schema::table('batch_items', function (Blueprint $table) {
            $table->dropForeign(['batch_id']);
            $table->dropForeign(['product_id']);
        });

        Schema::table('batch_items', function (Blueprint $table) {
            // 2. حذف الـ unique القديم الذي يمنع تعدد الـ variants
            $table->dropUnique(['batch_id', 'product_id']);

            // 3. إضافة unique جديد يدعم تعدد الـ variants
            //    (batch_id, salla_variant_id):
            //    - لو salla_variant_id موجود → ممنوع التكرار
            //    - لو salla_variant_id = null → MySQL يسمح بالتكرار (التطبيق مسؤول عن المنع)
            $table->unique(['batch_id', 'salla_variant_id']);
        });

        // 4. إعادة إنشاء foreign keys
        Schema::table('batch_items', function (Blueprint $table) {
            $table->foreign('batch_id')->references('id')->on('batches')->cascadeOnDelete();
            $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('batch_items', function (Blueprint $table) {
            $table->dropForeign(['batch_id']);
            $table->dropForeign(['product_id']);
        });

        Schema::table('batch_items', function (Blueprint $table) {
            $table->dropUnique(['batch_id', 'salla_variant_id']);
            $table->unique(['batch_id', 'product_id']);
        });

        Schema::table('batch_items', function (Blueprint $table) {
            $table->foreign('batch_id')->references('id')->on('batches')->cascadeOnDelete();
            $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
        });
    }
};
