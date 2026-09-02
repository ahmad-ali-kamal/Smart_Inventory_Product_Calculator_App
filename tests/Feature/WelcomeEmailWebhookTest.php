<?php

namespace Tests\Feature;

use App\Mail\WelcomeMail;
use App\Models\Merchant;
use App\Models\WelcomeEmailDelivery;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class WelcomeEmailWebhookTest extends TestCase
{
    private string $hareesSecret = 'test_harees_secret_123';
    private string $mustasharSecret = 'test_mustashar_secret_456';

    protected function setUp(): void
    {
        parent::setUp();
        config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:']);
        DB::purge('sqlite');
        DB::setDefaultConnection('sqlite');
        config(['services.salla_harees.webhook_secret' => $this->hareesSecret]);
        config(['services.salla_mustashar.webhook_secret' => $this->mustasharSecret]);
        putenv("SALLA_HAREES_WEBHOOK_SECRET={$this->hareesSecret}");
        putenv("SALLA_MUSTASHAR_WEBHOOK_SECRET={$this->mustasharSecret}");
        $_ENV['SALLA_HAREES_WEBHOOK_SECRET'] = $this->hareesSecret;
        $_ENV['SALLA_MUSTASHAR_WEBHOOK_SECRET'] = $this->mustasharSecret;

        $this->createTablesIfNeeded();
        DB::table('welcome_email_deliveries')->delete();
        DB::table('merchants')->delete();
    }

    private function createTablesIfNeeded(): void
    {
        if (!Schema::hasTable('merchants')) {
            Schema::create('merchants', function ($t) {
                $t->id();
                $t->unsignedBigInteger('salla_merchant_id')->unique();
                $t->string('name')->nullable();
                $t->string('email')->nullable();
                $t->string('mobile')->nullable();
                $t->json('store_info')->nullable();
                $t->boolean('has_calculator')->default(false);
                $t->boolean('has_management')->default(false);
                $t->string('remember_token', 100)->nullable();
                $t->timestamps();
            });
        }
        if (!Schema::hasTable('welcome_email_deliveries')) {
            Schema::create('welcome_email_deliveries', function ($t) {
                $t->id();
                $t->foreignId('merchant_id')->nullable();
                $t->unsignedBigInteger('salla_merchant_id')->index();
                $t->string('app_name', 20);
                $t->string('event_type', 40);
                $t->string('email')->nullable();
                $t->string('status', 20)->default('pending');
                $t->unsignedSmallInteger('attempts')->default(0);
                $t->json('payload')->nullable();
                $t->timestamp('sent_at')->nullable();
                $t->timestamp('failed_at')->nullable();
                $t->timestamps();
                $t->unique(['merchant_id', 'app_name', 'event_type'], 'welcome_unique_merchant_app_event');
            });
        }
        if (!Schema::hasTable('apps')) {
            Schema::create('apps', function ($t) {
                $t->id();
                $t->foreignId('merchant_id');
                $t->string('app_name');
                $t->string('client_id')->unique();
                $t->text('access_token')->nullable();
                $t->text('refresh_token')->nullable();
                $t->timestamp('token_expires_at')->nullable();
                $t->timestamps();
            });
        }
    }

    private function signedRequest(string $event, string $sallaMerchantId, string $secret, array $extraData = []): \Illuminate\Testing\TestResponse
    {
        $payload = [
            'event' => $event,
            'merchant' => $sallaMerchantId,
            'merchant_id' => $sallaMerchantId,
            'data' => array_merge(['id' => 999], $extraData),
        ];
        $json = json_encode($payload);
        $sig = hash_hmac('sha256', $json, $secret);
        $appName = $secret === $this->hareesSecret ? 'harees' : ($secret === $this->mustasharSecret ? 'mustashar' : null);
        $headers = [
            'X-Salla-Signature' => $sig,
            'Content-Type' => 'application/json',
        ];
        if ($appName) $headers['X-App-Name'] = $appName;
        return $this->withHeaders($headers)->postJson('/webhooks/salla', $payload);
    }

    private function createMerchant(string $sallaId, ?string $email = 'merchant@example.com'): Merchant
    {
        return Merchant::create([
            'salla_merchant_id' => $sallaId,
            'name' => 'Test',
            'email' => $email,
        ]);
    }

    public function test_harees_trial_creates_delivery(): void
    {
        Mail::fake();
        $m = $this->createMerchant('111');
        $res = $this->signedRequest('app.trial.started', '111', $this->hareesSecret);
        $res->assertOk();
        $this->assertDatabaseHas('welcome_email_deliveries', [
            'merchant_id' => $m->id,
            'app_name' => 'harees',
            'event_type' => 'app.trial.started',
        ]);
    }

    public function test_qiyast_trial_creates_mustashar_delivery(): void
    {
        Mail::fake();
        $m = $this->createMerchant('222');
        $res = $this->signedRequest('app.trial.started', '222', $this->mustasharSecret);
        $res->assertOk();
        $this->assertDatabaseHas('welcome_email_deliveries', [
            'merchant_id' => $m->id,
            'app_name' => 'mustashar',
            'event_type' => 'app.trial.started',
        ]);
    }

    public function test_harees_subscription_creates_delivery(): void
    {
        Mail::fake();
        $m = $this->createMerchant('333');
        $res = $this->signedRequest('app.subscription.started', '333', $this->hareesSecret);
        $res->assertOk();
        $this->assertDatabaseHas('welcome_email_deliveries', [
            'merchant_id' => $m->id,
            'app_name' => 'harees',
            'event_type' => 'app.subscription.started',
        ]);
    }

    public function test_qiyast_subscription_creates_delivery(): void
    {
        Mail::fake();
        $m = $this->createMerchant('444');
        $res = $this->signedRequest('app.subscription.started', '444', $this->mustasharSecret);
        $res->assertOk();
        $this->assertDatabaseHas('welcome_email_deliveries', [
            'merchant_id' => $m->id,
            'app_name' => 'mustashar',
            'event_type' => 'app.subscription.started',
        ]);
    }

    public function test_duplicate_trial_webhook_creates_one_delivery(): void
    {
        Mail::fake();
        $this->createMerchant('555');
        $this->signedRequest('app.trial.started', '555', $this->hareesSecret);
        $this->signedRequest('app.trial.started', '555', $this->hareesSecret);
        $this->assertEquals(1, WelcomeEmailDelivery::where('salla_merchant_id', '555')->where('app_name', 'harees')->where('event_type', 'app.trial.started')->count());
    }

    public function test_trial_and_subscription_create_two_deliveries(): void
    {
        Mail::fake();
        $this->createMerchant('666');
        $this->signedRequest('app.trial.started', '666', $this->hareesSecret);
        $this->signedRequest('app.subscription.started', '666', $this->hareesSecret);
        $this->assertEquals(2, WelcomeEmailDelivery::where('salla_merchant_id', '666')->where('app_name', 'harees')->count());
    }

    public function test_same_merchant_different_apps_not_collide(): void
    {
        Mail::fake();
        $this->createMerchant('777');
        $this->signedRequest('app.trial.started', '777', $this->hareesSecret);
        $this->signedRequest('app.trial.started', '777', $this->mustasharSecret);
        $this->assertEquals(2, WelcomeEmailDelivery::where('salla_merchant_id', '777')->where('event_type', 'app.trial.started')->count());
    }

    public function test_invalid_signature_no_email(): void
    {
        $this->createMerchant('888');
        $res = $this->signedRequest('app.trial.started', '888', 'wrong_secret');
        $res->assertStatus(401);
        $this->assertEquals(0, WelcomeEmailDelivery::where('salla_merchant_id', '888')->count());
    }

    public function test_job_does_not_send_twice_after_sent(): void
    {
        Mail::fake();
        $m = $this->createMerchant('999', 'ok@example.com');
        $delivery = WelcomeEmailDelivery::create([
            'merchant_id' => $m->id,
            'salla_merchant_id' => '999',
            'app_name' => 'harees',
            'event_type' => 'app.trial.started',
            'email' => 'ok@example.com',
            'status' => 'pending',
        ]);
        $job = new \App\Jobs\SendWelcomeEmailJob($delivery->id);
        $job->handle();
        $this->assertEquals(1, Mail::sent(WelcomeMail::class)->count());
        Mail::fake();
        $job2 = new \App\Jobs\SendWelcomeEmailJob($delivery->id);
        $job2->handle();
        Mail::assertNothingSent();
    }

    public function test_missing_email_does_not_send_successfully(): void
    {
        Mail::fake();
        $m = $this->createMerchant('1010', null);
        $delivery = WelcomeEmailDelivery::create([
            'merchant_id' => $m->id,
            'salla_merchant_id' => '1010',
            'app_name' => 'harees',
            'event_type' => 'app.trial.started',
            'email' => null,
            'status' => 'pending',
        ]);
        $job = new \App\Jobs\SendWelcomeEmailJob($delivery->id);
        try {
            $job->handle();
        } catch (\Throwable $e) {
        }
        $delivery->refresh();
        $this->assertNotEquals('sent', $delivery->status);
        Mail::assertNothingSent();
    }

    public function test_mail_contains_arabic_before_english_and_urls(): void
    {
        $m = Merchant::create(['salla_merchant_id' => '2020', 'name' => 'Test', 'email' => 'a@b.com']);
        $delivery = WelcomeEmailDelivery::create([
            'merchant_id' => $m->id,
            'salla_merchant_id' => '2020',
            'app_name' => 'harees',
            'event_type' => 'app.trial.started',
            'email' => 'a@b.com',
            'status' => 'pending',
        ]);
        $mail = new WelcomeMail('harees', 'app.trial.started', $m, $delivery);
        $html = $mail->render();
        $posAr = strpos($html, 'مرحباً بك');
        $posEn = strpos($html, 'Welcome to');
        $this->assertNotFalse($posAr);
        $this->assertNotFalse($posEn);
        $this->assertTrue($posAr < $posEn, 'Arabic must appear before English');
        $this->assertStringContainsString(config('services.quantix.harees_url'), $html);
        $this->assertStringContainsString(config('services.quantix.support_url'), $html);
        $this->assertStringContainsString('noreply@quantixapp.dev', $mail->envelope()->from->address);
    }

    public function test_harees_trial_via_hmac_without_x_app_name(): void
    {
        Mail::fake();
        $m = $this->createMerchant('3001');
        $payload = ['event' => 'app.trial.started', 'merchant' => '3001', 'merchant_id' => '3001', 'data' => ['id' => 999]];
        $json = json_encode($payload);
        $sig = hash_hmac('sha256', $json, $this->hareesSecret);
        $res = $this->call('POST', '/webhooks/salla', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_X_SALLA_SIGNATURE' => $sig], $json);
        $res->assertOk();
        $this->assertDatabaseHas('welcome_email_deliveries', ['merchant_id' => $m->id, 'app_name' => 'harees', 'event_type' => 'app.trial.started']);
    }

    public function test_mustashar_trial_via_hmac_without_x_app_name(): void
    {
        Mail::fake();
        $m = $this->createMerchant('3002');
        $payload = ['event' => 'app.trial.started', 'merchant' => '3002', 'merchant_id' => '3002', 'data' => ['id' => 999]];
        $json = json_encode($payload);
        $sig = hash_hmac('sha256', $json, $this->mustasharSecret);
        $res = $this->call('POST', '/webhooks/salla', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_X_SALLA_SIGNATURE' => $sig], $json);
        $res->assertOk();
        $this->assertDatabaseHas('welcome_email_deliveries', ['merchant_id' => $m->id, 'app_name' => 'mustashar', 'event_type' => 'app.trial.started']);
    }

    public function test_real_payload_harees_app_name_via_payload_fallback(): void
    {
        Mail::fake();
        $m = $this->createMerchant('4001');
        $fallbackSecret = 'fallback_secret_123';
        config(['services.salla.webhook_secret' => $fallbackSecret]);
        $payload = [
            'event' => 'app.trial.started',
            'merchant' => '4001',
            'created_at' => 'Wed Sep 03 2026 12:00:00 GMT+0300',
            'data' => [
                'id' => 123,
                'app_name' => 'Harees',
                'app_description' => 'test',
                'app_type' => 'app',
                'plan_type' => 'trial',
                'plan_name' => 'Trial',
                'start_date' => '2026-09-03',
                'end_date' => '2026-09-10',
            ],
        ];
        $json = json_encode($payload);
        $sig = hash_hmac('sha256', $json, $fallbackSecret);
        $res = $this->call('POST', '/webhooks/salla', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_X_SALLA_SIGNATURE' => $sig], $json);
        $res->assertOk();
        $this->assertDatabaseHas('welcome_email_deliveries', ['merchant_id' => $m->id, 'app_name' => 'harees', 'event_type' => 'app.trial.started']);
    }

    public function test_real_payload_qiyast_app_name_via_payload_fallback(): void
    {
        Mail::fake();
        $m = $this->createMerchant('4002');
        $fallbackSecret = 'fallback_secret_123';
        config(['services.salla.webhook_secret' => $fallbackSecret]);
        $payload = [
            'event' => 'app.subscription.started',
            'merchant' => '4002',
            'created_at' => 'Wed Sep 03 2026 12:00:00 GMT+0300',
            'data' => [
                'id' => 124,
                'app_name' => 'Qiyast',
                'app_description' => 'test',
                'app_type' => 'app',
                'plan_type' => 'subscription',
                'plan_name' => 'Monthly',
                'start_date' => '2026-09-03',
                'end_date' => '2026-10-03',
            ],
        ];
        $json = json_encode($payload);
        $sig = hash_hmac('sha256', $json, $fallbackSecret);
        $res = $this->call('POST', '/webhooks/salla', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_X_SALLA_SIGNATURE' => $sig], $json);
        $res->assertOk();
        $this->assertDatabaseHas('welcome_email_deliveries', ['merchant_id' => $m->id, 'app_name' => 'mustashar', 'event_type' => 'app.subscription.started']);
    }

    public function test_app_name_normalization_variants(): void
    {
        Mail::fake();
        $cases = [
            ['Harees', 'harees'],
            ['harees', 'harees'],
            ['HAREES', 'harees'],
            ['حريص', 'harees'],
            ['management', 'harees'],
            ['Qiyast', 'mustashar'],
            ['qiyast', 'mustashar'],
            ['Mustashar', 'mustashar'],
            ['mustashar', 'mustashar'],
            ['قياسات', 'mustashar'],
            ['calculator', 'mustashar'],
        ];
        foreach ($cases as $idx => [$input, $expected]) {
            $sallaId = '500' . $idx;
            $m = $this->createMerchant($sallaId);
            $payload = ['event' => 'app.trial.started', 'merchant' => $sallaId, 'data' => ['id' => 900 + $idx, 'app_name' => $input]];
            $json = json_encode($payload);
            $sig = hash_hmac('sha256', $json, $this->hareesSecret);
            // Use X-App-Name bypass to avoid HMAC app mapping, force payload path via fallback? Actually we need HMAC to fail to test payload.
            // Use fallback secret to make HMAC return null app, then payload should be used.
            $fallbackSecret = 'fallback_secret_123';
            config(['services.salla.webhook_secret' => $fallbackSecret]);
            $sig2 = hash_hmac('sha256', $json, $fallbackSecret);
            $res = $this->call('POST', '/webhooks/salla', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_X_SALLA_SIGNATURE' => $sig2], $json);
            $res->assertOk();
            $this->assertDatabaseHas('welcome_email_deliveries', ['merchant_id' => $m->id, 'app_name' => $expected]);
        }
    }

    public function test_unknown_merchant_is_created_for_welcome_event(): void
    {
        \Illuminate\Support\Facades\Queue::fake();
        $sallaId = '1827687421';
        $this->assertDatabaseMissing('merchants', ['salla_merchant_id' => $sallaId]);
        $payload = [
            'event' => 'app.subscription.started',
            'merchant' => $sallaId,
            'merchant_id' => $sallaId,
            'data' => ['id' => 777, 'app_name' => 'Harees', 'plan_name' => 'test'],
        ];
        $json = json_encode($payload);
        $sig = hash_hmac('sha256', $json, $this->hareesSecret);
        $res = $this->call('POST', '/webhooks/salla', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_X_SALLA_SIGNATURE' => $sig, 'HTTP_X_APP_NAME' => 'harees'], $json);
        $res->assertOk();
        $this->assertDatabaseHas('merchants', ['salla_merchant_id' => $sallaId]);
        $merchant = Merchant::where('salla_merchant_id', $sallaId)->first();
        $this->assertNotNull($merchant);
        $this->assertDatabaseHas('welcome_email_deliveries', ['merchant_id' => $merchant->id, 'salla_merchant_id' => $sallaId, 'app_name' => 'harees', 'event_type' => 'app.subscription.started']);
        \Illuminate\Support\Facades\Queue::assertPushed(\App\Jobs\SendWelcomeEmailJob::class);
    }

    public function test_product_event_with_unknown_merchant_still_fails(): void
    {
        $sallaId = '999999999';
        $this->assertDatabaseMissing('merchants', ['salla_merchant_id' => $sallaId]);
        $payload = ['event' => 'product.updated', 'merchant' => $sallaId, 'data' => ['id' => 123, 'name' => 'Test']];
        $json = json_encode($payload);
        $sig = hash_hmac('sha256', $json, $this->hareesSecret);
        $res = $this->call('POST', '/webhooks/salla', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_X_SALLA_SIGNATURE' => $sig, 'HTTP_X_APP_NAME' => 'harees'], $json);
        $res->assertOk();
        $res->assertJsonFragment(['note' => 'merchant not found']);
        $this->assertDatabaseMissing('merchants', ['salla_merchant_id' => $sallaId]);
    }

    public function test_real_payload_harees_smart_discounts_suffix(): void
    {
        Mail::fake();
        $m = $this->createMerchant('6001');
        $fallbackSecret = 'fallback_secret_123';
        config(['services.salla.webhook_secret' => $fallbackSecret]);
        $payload = [
            'event' => 'app.trial.started',
            'merchant' => '6001',
            'created_at' => 'Wed Sep 03 2026 12:00:00 GMT+0300',
            'data' => [
                'id' => 6001,
                'app_name' => 'Harees (Smart Discounts)',
                'app_description' => 'test',
                'app_type' => 'app',
                'plan_type' => 'trial',
                'plan_name' => 'Trial',
                'start_date' => '2026-09-03',
                'end_date' => '2026-09-10',
            ],
        ];
        $json = json_encode($payload);
        $sig = hash_hmac('sha256', $json, $fallbackSecret);
        $res = $this->call('POST', '/webhooks/salla', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_X_SALLA_SIGNATURE' => $sig], $json);
        $res->assertOk();
        $this->assertDatabaseHas('welcome_email_deliveries', ['merchant_id' => $m->id, 'app_name' => 'harees', 'event_type' => 'app.trial.started']);
    }

    public function test_real_payload_qiyast_suffix_variants(): void
    {
        Mail::fake();
        $cases = ['Qiyast (Smart Measurements)', 'Mustashar (Qiyast)', 'qiyast (test)', 'Mustashar (Smart)'];
        foreach ($cases as $idx => $appName) {
            $sallaId = '610' . $idx;
            $m = $this->createMerchant($sallaId);
            $fallbackSecret = 'fallback_secret_123';
            config(['services.salla.webhook_secret' => $fallbackSecret]);
            $payload = ['event' => 'app.subscription.started', 'merchant' => $sallaId, 'data' => ['id' => 700 + $idx, 'app_name' => $appName]];
            $json = json_encode($payload);
            $sig = hash_hmac('sha256', $json, $fallbackSecret);
            $res = $this->call('POST', '/webhooks/salla', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_X_SALLA_SIGNATURE' => $sig], $json);
            $res->assertOk();
            $this->assertDatabaseHas('welcome_email_deliveries', ['merchant_id' => $m->id, 'app_name' => 'mustashar', 'event_type' => 'app.subscription.started']);
        }
    }
}
