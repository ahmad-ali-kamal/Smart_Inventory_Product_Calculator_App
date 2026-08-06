<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const NOTIFICATION_CLASS = \App\Notifications\BatchExpiryNotification::class;

    /**
     * Add a database-level guarantee that prevents duplicate batch-expiry
     * notifications: only one row is ever allowed per (notifiable, batch, status).
     */
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->unsignedBigInteger('batch_id')->nullable()->after('data');
            $table->string('status')->nullable()->after('batch_id');
        });

        $this->backfillExistingRows();
        $this->removeHistoricalDuplicates();

        Schema::table('notifications', function (Blueprint $table) {
            $table->unique(
                ['notifiable_type', 'notifiable_id', 'batch_id', 'status'],
                'notifications_batch_unique'
            );
        });
    }

    /**
     * Populate the new columns from the JSON payload stored in legacy rows.
     */
    private function backfillExistingRows(): void
    {
        $rows = DB::table('notifications')
            ->where('type', self::NOTIFICATION_CLASS)
            ->whereNull('batch_id')
            ->get(['id', 'data']);

        foreach ($rows as $row) {
            $data = is_string($row->data) ? json_decode($row->data, true) : $row->data;

            if (!is_array($data) || !isset($data['batch_id'])) {
                continue;
            }

            DB::table('notifications')
                ->where('id', $row->id)
                ->update([
                    'batch_id' => $data['batch_id'],
                    'status'   => $data['status'] ?? null,
                ]);
        }
    }

    /**
     * Delete any pre-existing duplicate notifications so the unique index
     * can be created without failing. The earliest row of each group is kept.
     */
    private function removeHistoricalDuplicates(): void
    {
        $duplicates = DB::table('notifications')
            ->select('notifiable_type', 'notifiable_id', 'batch_id', 'status', DB::raw('MIN(id) as keep_id'))
            ->whereNotNull('batch_id')
            ->groupBy('notifiable_type', 'notifiable_id', 'batch_id', 'status')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($duplicates as $dup) {
            DB::table('notifications')
                ->where('notifiable_type', $dup->notifiable_type)
                ->where('notifiable_id', $dup->notifiable_id)
                ->where('batch_id', $dup->batch_id)
                ->where('status', $dup->status)
                ->where('id', '<>', $dup->keep_id)
                ->delete();
        }
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropUnique('notifications_batch_unique');
            $table->dropColumn(['batch_id', 'status']);
        });
    }
};
