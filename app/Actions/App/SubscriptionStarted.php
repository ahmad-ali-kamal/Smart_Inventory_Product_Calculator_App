<?php

namespace App\Actions\App;

use App\Actions\BaseAction;

/**
 * @property string merchant example "1234509876"
 * @property string created_at example "Wed Jun 30 2021 14:32:33 GMT+0300"
 * @property string event example "app.subscription.started"
 * @property array data @see https://docs.salla.dev/docs/merchent/ZG9jOjIzMjE3MjQ0-app-events#app-subscription-start
 */
class SubscriptionStarted extends BaseAction
{
    public function handle()
    {
        $merchantId = (string) ($this->merchant ?? $this->data['merchant'] ?? '');
        $payload = is_array($this->data) ? $this->data : [];
        $body = $this->request ? $this->request->all() : ['merchant' => $merchantId, 'data' => $payload];
        $appName = $this->detectApp();
        if (!$merchantId) return;
        if (!$appName) $appName = 'harees';
        \App\Services\WelcomeEmailService::handleAppEvent('app.subscription.started', $appName, $merchantId, $body);
    }

    private function detectApp(): ?string
    {
        if (!$this->request) return null;
        $payload = $this->request->getContent();
        $sig = $this->request->header('X-Salla-Signature') ?? '';
        $map = [
            'harees' => env('SALLA_HAREES_WEBHOOK_SECRET') ?? config('services.salla_harees.webhook_secret'),
            'mustashar' => env('SALLA_MUSTASHAR_WEBHOOK_SECRET') ?? config('services.salla_mustashar.webhook_secret'),
        ];
        foreach ($map as $app => $secret) {
            if ($secret && hash_equals(hash_hmac('sha256', $payload, $secret), $sig)) return $app;
        }
        return null;
    }
}
