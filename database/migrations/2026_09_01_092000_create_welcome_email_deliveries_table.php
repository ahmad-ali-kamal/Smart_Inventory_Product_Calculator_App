<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('welcome_email_deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('merchant_id')->nullable()->constrained('merchants')->nullOnDelete();
            $table->unsignedBigInteger('salla_merchant_id')->index();
            $table->string('app_name', 20);
            $table->string('event_type', 40);
            $table->string('email')->nullable();
            $table->string('status', 20)->default('pending');
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->json('payload')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamps();

            $table->unique(['merchant_id', 'app_name', 'event_type'], 'welcome_unique_merchant_app_event');
            $table->index(['salla_merchant_id', 'app_name', 'event_type'], 'welcome_email_lookup_idx');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('welcome_email_deliveries');
    }
};
