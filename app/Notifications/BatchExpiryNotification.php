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

    /**
     * Get the merchant's preferred locale.
     * Falls back to 'ar' since the app is primarily Arabic.
     */
    private function getLocale($notifiable): string
    {
        if (method_exists($notifiable, 'getAttribute')) {
            $locale = $notifiable->preferred_locale
                ?? $notifiable->locale
                ?? config('app.locale', 'ar');
            return in_array($locale, ['ar', 'en']) ? $locale : 'ar';
        }
        return 'ar';
    }

    public function toMail($notifiable): MailMessage
    {
        $locale = $this->getLocale($notifiable);

        if ($locale === 'en') {
            return $this->toMailEnglish($notifiable);
        }

        return $this->toMailArabic($notifiable);
    }

    private function toMailArabic($notifiable): MailMessage
    {
        $productName = $this->getProductName();
        $batchCode   = $this->batch->batch_code ?? 'غير محدد';
        $expiryDate  = $this->batch->expiry_date?->format('Y-m-d') ?? 'غير محدد';
        $daysLeft    = $this->batch->days_until_expiry ?? 0;

        if ($this->status === 'red') {
            $subject = "⛔ تنبيه: دفعة منتهية الصلاحية — {$productName}";
            $intro   = "انتهت صلاحية الدفعة **{$batchCode}** للمنتج **{$productName}**.";
        } else {
            $subject = "⚠️ تحذير: دفعة تقترب من الانتهاء — {$productName}";
            $intro   = "الدفعة **{$batchCode}** للمنتج **{$productName}** ستنتهي صلاحيتها خلال **{$daysLeft} يوم**.";
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
        $batchCode   = $this->batch->batch_code ?? 'N/A';
        $expiryDate  = $this->batch->expiry_date?->format('Y-m-d') ?? 'N/A';
        $daysLeft    = $this->batch->days_until_expiry ?? 0;

        if ($this->status === 'red') {
            $subject = "⛔ Alert: Expired Batch — {$productName}";
            $intro   = "Batch **{$batchCode}** for product **{$productName}** has expired.";
        } else {
            $subject = "⚠️ Warning: Batch Approaching Expiry — {$productName}";
            $intro   = "Batch **{$batchCode}** for product **{$productName}** will expire in **{$daysLeft} day(s)**.";
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
     * Get the product name safely — the batch may not have a product yet
     * (happens when the saved event fires before BatchItem is created).
     */
    private function getProductName(): string
    {
        try {
            $product = $this->batch->products()->first();
            return $product?->name ?? $this->batch->name ?? 'منتج غير محدد';
        } catch (\Throwable $e) {
            return $this->batch->name ?? 'منتج غير محدد';
        }
    }

    public function toArray($notifiable): array
    {
        $locale = $this->getLocale($notifiable);
        $productName = $this->getProductName();

        if ($this->status === 'red') {
            $title = $locale === 'en'
                ? "⛔ Expired Batch: {$productName}"
                : "⛔ دفعة منتهية الصلاحية: {$productName}";
            $body = $locale === 'en'
                ? "Batch {$this->batch->batch_code} for {$productName} has expired."
                : "انتهت صلاحية الدفعة {$this->batch->batch_code} للمنتج {$productName}.";
        } else {
            $daysLeft = $this->batch->days_until_expiry ?? 0;
            $title = $locale === 'en'
                ? "⚠️ Batch Approaching Expiry: {$productName}"
                : "⚠️ دفعة تقترب من الانتهاء: {$productName}";
            $body = $locale === 'en'
                ? "Batch {$this->batch->batch_code} for {$productName} will expire in {$daysLeft} day(s)."
                : "الدفعة {$this->batch->batch_code} للمنتج {$productName} ستنتهي خلال {$daysLeft} يوم.";
        }

        return [
            'batch_id'    => $this->batch->id,
            'batch_code'  => $this->batch->batch_code,
            'product_name'=> $productName,
            'status'      => $this->status,
            'expiry_date' => $this->batch->expiry_date?->format('Y-m-d'),
            'title'       => $title,
            'body'        => $body,
            'locale'      => $locale,
        ];
    }
}