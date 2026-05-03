<?php

namespace App\Notifications;

use App\Models\Batch;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class BatchExpiryNotification extends Notification
{
    use Queueable;

    public function __construct(
        private Batch $batch,
        private string $status
    ) {}

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toMail($notifiable): MailMessage
    {
        $productName = $this->getProductName();
        $batchCode   = $this->batch->batch_code ?? 'غير محدد';
        $expiryDate  = $this->batch->expiry_date?->format('Y-m-d') ?? 'غير محدد';
        $daysLeft    = $this->batch->days_until_expiry ?? 0;

        if ($this->status === 'red') {
            $subject = "⛔ تنبيه: دفعة منتهية الصلاحية — {$productName}";
            $intro   = "انتهت صلاحية الدفعة **{$batchCode}** للمنتج **{$productName}**.";
            $color   = 'error';
        } else {
            $subject = "⚠️ تحذير: دفعة تقترب من الانتهاء — {$productName}";
            $intro   = "الدفعة **{$batchCode}** للمنتج **{$productName}** ستنتهي صلاحيتها خلال **{$daysLeft} يوم**.";
            $color   = 'warning';
        }

        return (new MailMessage)
            ->subject($subject)
            ->greeting('مرحباً ' . ($notifiable->name ?? 'التاجر'))
            ->line($intro)
            ->line("تاريخ الانتهاء: **{$expiryDate}**")
            ->action('عرض تفاصيل المنتج', url('/inventory'))
            ->line('يرجى اتخاذ الإجراء المناسب لتجنب الخسائر.');
    }

    /**
     * جلب اسم المنتج بأمان — الباتش قد لا يكون مرتبطاً بمنتج بعد
     * (يحدث عند إطلاق الـ saved event قبل إنشاء BatchItem)
     */
    private function getProductName(): string
    {
        try {
            // ✅ null-safe: إذا لم يوجد منتج مرتبط نرجع اسم الباتش أو قيمة افتراضية
            $product = $this->batch->products()->first();
            return $product?->name ?? $this->batch->name ?? 'منتج غير محدد';
        } catch (\Throwable $e) {
            return $this->batch->name ?? 'منتج غير محدد';
        }
    }

    public function toArray($notifiable): array
    {
        return [
            'batch_id'   => $this->batch->id,
            'batch_code' => $this->batch->batch_code,
            'status'     => $this->status,
            'expiry_date'=> $this->batch->expiry_date?->format('Y-m-d'),
        ];
    }
}