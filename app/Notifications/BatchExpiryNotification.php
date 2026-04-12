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
        public Batch $batch,
        public string $type
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
{
    $productName = $this->getProductName();
    $status      = $this->type === 'yellow' ? 'Approaching Expiry' : 'Expired';
    $color       = $this->type === 'yellow' ? '⚠️' : '🔴';
    $days        = $this->batch->days_until_expiry;

    return (new MailMessage)
        ->subject("{$color} Expiry Alert: {$productName}")
        ->greeting("Hello {$notifiable->name}!")
        ->line("The product **{$productName}** has reached **{$status}** status.")
        ->line("Expiry Date: {$this->batch->expiry_date->format('Y-m-d')}")
        ->line("Days Remaining: {$days} day(s)")
        ->action('View Products', url('/inventory/products'))
        ->line('Thank you for using MerchantTools!');
}

    public function toArray(object $notifiable): array
    {
        return [
            'batch_id'    => $this->batch->id,
            'batch_code'  => $this->batch->batch_code,
            'type'        => $this->type,
            'message'     => $this->getProductName() .
                ($this->type === 'yellow'
                    ? ' is nearing its expiry date'
                    : ' Is expired'),
            'expiry_date' => $this->batch->expiry_date->format('Y-m-d'),
        ];
    }

    private function getProductName(): string
    {
        return $this->batch->items->first()?->product?->name
            ?? $this->batch->name
            ?? 'منتج غير معروف';
    }
}