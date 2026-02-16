<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('merchants', function (Blueprint $table) {
            // إزالة حقول Email Verification (إذا كانت موجودة)
            if (Schema::hasColumn('merchants', 'verification_token')) {
                $table->dropColumn('verification_token');
            }
            if (Schema::hasColumn('merchants', 'email_verified_at')) {
                $table->dropColumn('email_verified_at');
            }
            
            // إضافة حقول Salla OAuth
            if (!Schema::hasColumn('merchants', 'access_token')) {
                $table->text('access_token')->nullable()->after('email');
            }
            if (!Schema::hasColumn('merchants', 'refresh_token')) {
                $table->text('refresh_token')->nullable()->after('access_token');
            }
            if (!Schema::hasColumn('merchants', 'token_expires_at')) {
                $table->timestamp('token_expires_at')->nullable()->after('refresh_token');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('merchants', function (Blueprint $table) {
            // استعادة حقول Email Verification
            if (!Schema::hasColumn('merchants', 'verification_token')) {
                $table->string('verification_token', 64)->nullable()->unique();
            }
            if (!Schema::hasColumn('merchants', 'email_verified_at')) {
                $table->timestamp('email_verified_at')->nullable();
            }
            
            // حذف حقول OAuth
            if (Schema::hasColumn('merchants', 'access_token')) {
                $table->dropColumn('access_token');
            }
            if (Schema::hasColumn('merchants', 'refresh_token')) {
                $table->dropColumn('refresh_token');
            }
            if (Schema::hasColumn('merchants', 'token_expires_at')) {
                $table->dropColumn('token_expires_at');
            }
        });
    }
};