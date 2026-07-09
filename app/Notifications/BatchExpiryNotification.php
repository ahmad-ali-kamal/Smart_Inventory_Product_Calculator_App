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

    /**
     * Get a display-safe batch identifier (product name falls back to ID).
     */
    private function getBatchIdentifier(): string
    {
        $product = $this->batch->product;
        if ($product?->name) {
            return $product->name;
        }
        return '#' . $this->batch->id;
    }

    public function via($notifiable): array
    {
        return ['database'];
    }

    public function toMail($notifiable): MailMessage
    {
        return $this->toMailArabic($notifiable);
    }

    private function toMailArabic($notifiable): MailMessage
    {
        $productName = $this->getProductName();
        $batchId     = $this->getBatchIdentifier();
        $expiryDate  = $this->batch->expiry_date?->format('Y-m-d') ?? 'غير محدد';
        $daysLeft    = $this->batch->days_until_expiry ?? 0;

        if ($this->status === 'red') {
            $subject = "⛔ تنبيه: دفعة منتهية الصلاحية — {$productName}";
            $intro   = "انتهت صلاحية الدفعة **{$batchId}** للمنتج **{$productName}**.";
        } else {
            $subject = "⚠️ تحذير: دفعة تقترب من الانتهاء — {$productName}";
            $intro   = "الدفعة **{$batchId}** للمنتج **{$productName}** ستنتهي صلاحيتها خلال **{$daysLeft} يوم**.";
        }

        return (new MailMessage)
            ->subject($subject)
            ->greeting('مرحباً ' . ($notifiable->name ?? 'التاجر'))
            ->line($intro)
            ->line("تاريخ الانتهاء: **{$expiryDate}**")
            ->action('عرض تفاصيل المنتج', url('/harees'))
            ->line('يرجى اتخاذ الإجراء المناسب لتجنب الخسائر.');
    }

    private function toMailEnglish($notifiable): MailMessage
    {
        $productName = $this->getProductName();
        $batchId     = $this->getBatchIdentifier();
        $expiryDate  = $this->batch->expiry_date?->format('Y-m-d') ?? 'N/A';
        $daysLeft    = $this->batch->days_until_expiry ?? 0;

        if ($this->status === 'red') {
            $subject = "⛔ Alert: Expired Batch — {$productName}";
            $intro   = "Batch **{$batchId}** for product **{$productName}** has expired.";
        } else {
            $subject = "⚠️ Warning: Batch Approaching Expiry — {$productName}";
            $intro   = "Batch **{$batchId}** for product **{$productName}** will expire in **{$daysLeft} day(s)**.";
        }

        return (new MailMessage)
            ->subject($subject)
            ->greeting('Hello ' . ($notifiable->name ?? 'Merchant'))
            ->line($intro)
            ->line("Expiry Date: **{$expiryDate}**")
            ->action('View Product Details', url('/harees'))
            ->line('Please take appropriate action to avoid losses.');
    }

    /**
     * Get the product name safely.
     */
    private function getProductName(): string
    {
        try {
            $product = $this->batch->product;
            return $product?->name ?? 'منتج غير محدد';
        } catch (\Throwable $e) {
            return 'منتج غير محدد';
        }
    }

    public function toArray($notifiable): array
    {
        $productName = $this->getProductName();
        $batchId     = $this->getBatchIdentifier();

        if ($this->status === 'red') {
            $titleAr = "⛔ دفعة منتهية الصلاحية: {$productName}";
            $titleEn = "⛔ Expired Batch: {$productName}";
            $bodyAr  = "انتهت صلاحية الدفعة {$batchId} للمنتج {$productName}.";
            $bodyEn  = "Batch {$batchId} for {$productName} has expired.";
        } else {
            $daysLeft = $this->batch->days_until_expiry ?? 0;
            $titleAr  = "⚠️ دفعة تقترب من الانتهاء: {$productName}";
            $titleEn  = "⚠️ Batch Approaching Expiry: {$productName}";
            $bodyAr   = "الدفعة {$batchId} للمنتج {$productName} ستنتهي خلال {$daysLeft} يوم.";
            $bodyEn   = "Batch {$batchId} for {$productName} will expire in {$daysLeft} day(s).";
        }

        return [
            'batch_id'    => $this->batch->id,
            'batch_code'  => $batchId,
            'product_name'=> $productName,
            'status'      => $this->status,
            'expiry_date' => $this->batch->expiry_date?->format('Y-m-d'),
            'title_ar'    => $titleAr,
            'title_en'    => $titleEn,
            'body_ar'     => $bodyAr,
            'body_en'     => $bodyEn,
        ];
    }
}