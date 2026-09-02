<?php

namespace App\Mail;

use App\Models\Merchant;
use App\Models\WelcomeEmailDelivery;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class WelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $appName,
        public string $eventType,
        public ?Merchant $merchant,
        public ?WelcomeEmailDelivery $delivery = null
    ) {}

    public function envelope(): \Illuminate\Mail\Mailables\Envelope
    {
        $subject = $this->resolveSubject();
        return new \Illuminate\Mail\Mailables\Envelope(
            from: new \Illuminate\Mail\Mailables\Address(
                config('mail.from.address', 'noreply@quantixapp.dev'),
                config('mail.from.name', 'QUANTIX')
            ),
            subject: $subject,
        );
    }

    public function content(): \Illuminate\Mail\Mailables\Content
    {
        return new \Illuminate\Mail\Mailables\Content(
            view: 'emails.welcome.bilingual',
            with: [
                'appName' => $this->appName,
                'eventType' => $this->eventType,
                'merchant' => $this->merchant,
                'appDisplayAr' => $this->appDisplayAr(),
                'appDisplayEn' => $this->appDisplayEn(),
                'isTrial' => $this->eventType === WelcomeEmailDelivery::EVENT_TRIAL,
                'isSubscription' => $this->eventType === WelcomeEmailDelivery::EVENT_SUBSCRIPTION,
                'appUrl' => $this->resolveAppUrl(),
                'supportUrl' => $this->resolveSupportUrl(),
            ]
        );
    }

    private function resolveSubject(): string
    {
        $appEn = $this->appDisplayEn();
        $isTrial = $this->eventType === WelcomeEmailDelivery::EVENT_TRIAL;
        if ($this->appName === 'harees') {
            return $isTrial
                ? "مرحباً بك في حريص — بدأت فترتك التجريبية | Welcome to Harees — Your trial has started"
                : "تم تفعيل اشتراكك في حريص | Your Harees subscription is now active";
        }
        return $isTrial
            ? "مرحباً بك في قياسات — بدأت فترتك التجريبية | Welcome to Qiyast — Your trial has started"
            : "تم تفعيل اشتراكك في قياسات | Your Qiyast subscription is now active";
    }

    private function appDisplayAr(): string
    {
        return $this->appName === 'harees' ? 'حريص' : 'قياسات';
    }

    private function appDisplayEn(): string
    {
        return $this->appName === 'harees' ? 'Harees' : 'Qiyast';
    }

    private function resolveAppUrl(): string
    {
        if ($this->appName === 'harees') {
            return config('services.quantix.harees_url', config('app.url') . '/harees/login');
        }
        return config('services.quantix.qiyast_url', config('app.url') . '/qiasat/login');
    }

    private function resolveSupportUrl(): string
    {
        if ($this->appName === 'harees') {
            return config('services.quantix.harees_support_url', config('services.quantix.support_url', 'https://quantixapp.dev/'));
        }
        return config('services.quantix.qiyast_support_url', config('services.quantix.support_url', 'https://quantixapp.dev/'));
    }
}
