<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Batch;
use App\Models\BatchSetting;
use Carbon\Carbon;

class UpdateBatchStatus extends Command
{
    // اسم الأمر الذي ستكتبه في التيرمنال للتجربة
    protected $signature = 'batch:update-status';
    protected $description = 'تحديث الأيام المتبقية والحالة لكل الباتشات يومياً';

    public function handle()
    {
        $this->info('بدء عملية تحديث الباتشات...');

        // جلب كل الباتشات التي لها تاريخ انتهاء
        $batches = Batch::whereNotNull('expiry_date')->get();
        $today = Carbon::now()->startOfDay();

        foreach ($batches as $batch) {
            // 1. حساب الأيام المتبقية
            $expiry = Carbon::parse($batch->expiry_date)->startOfDay();
            $daysLeft = (int) $today->diffInDays($expiry, false);

            // 2. تحديد الـ Threshold (الحد الأدنى للتحذير)
            $product = $batch->products()->first();
            $threshold = 14; // القيمة الافتراضية

            if ($product && method_exists($product, 'getCategoryThreshold')) {
                $threshold = $product->getCategoryThreshold();
            } else {
                $settings = BatchSetting::where('merchant_id', $batch->merchant_id)->first();
                $threshold = $settings->medium_term_days ?? 14;
            }

            // 3. تحديد الحالة (Status)
            $status = 'green';
            if ($daysLeft < 0) {
                $status = 'red';
            } elseif ($daysLeft <= $threshold) {
                $status = 'yellow';
            }

            // 4. تحديث السطر في قاعدة البيانات
            $batch->update([
                'days_until_expiry' => $daysLeft,
                'status' => $status
            ]);
        }

        $this->info('تم تحديث ' . $batches->count() . ' باتش بنجاح! ✅');
    }
}