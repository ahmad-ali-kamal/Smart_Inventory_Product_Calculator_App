<?php

namespace Tests\Unit;

use App\Models\Batch;
use App\Models\Merchant;
use App\Models\Product;
use App\Services\BatchExpiryNotifierService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\DatabaseNotification;
use Tests\TestCase;

class BatchExpiryNotificationIdempotencyTest extends TestCase
{
    use RefreshDatabase;

    private function makeMerchant(int $id = 5000): Merchant
    {
        return Merchant::create([
            'salla_merchant_id' => $id,
            'name' => 'Idempotency Merchant',
            'email' => "merchant{$id}@example.com",
        ]);
    }

    private function makeProduct(Merchant $merchant): Product
    {
        return Product::create([
            'merchant_id' => $merchant->id,
            'salla_product_id' => "product-{$merchant->id}",
            'name' => 'Jacket',
            'price' => 100.0,
            'quantity' => 10,
            'status' => 'sale',
        ]);
    }

    private function countFor(Batch $batch, string $status): int
    {
        return DatabaseNotification::query()
            ->where('batch_id', $batch->id)
            ->where('status', $status)
            ->count();
    }

    public function test_notify_is_idempotent_for_the_same_batch_and_status(): void
    {
        $merchant = $this->makeMerchant();
        $product  = $this->makeProduct($merchant);
        $batch    = Batch::create([
            'merchant_id' => $merchant->id,
            'product_id'  => $product->id,
            'expiry_date' => now()->addDays(5)->toDateString(),
            'status'      => 'yellow',
            'discount_type' => 'pending',
            'total_qty'   => 10,
            'batch_qty'   => 10,
        ]);

        BatchExpiryNotifierService::notify($batch, 'yellow', $merchant);
        BatchExpiryNotifierService::notify($batch, 'yellow', $merchant);
        BatchExpiryNotifierService::notify($batch, 'yellow', $merchant);

        $this->assertSame(1, $this->countFor($batch, 'yellow'));
    }

    public function test_yellow_then_red_creates_two_distinct_notifications(): void
    {
        $merchant = $this->makeMerchant(5001);
        $product  = $this->makeProduct($merchant);
        $batch    = Batch::create([
            'merchant_id' => $merchant->id,
            'product_id'  => $product->id,
            'expiry_date' => now()->addDays(5)->toDateString(),
            'status'      => 'yellow',
            'discount_type' => 'pending',
            'total_qty'   => 10,
            'batch_qty'   => 10,
        ]);

        BatchExpiryNotifierService::notify($batch, 'yellow', $merchant);
        BatchExpiryNotifierService::notify($batch, 'red', $merchant);
        BatchExpiryNotifierService::notify($batch, 'red', $merchant);

        $this->assertSame(1, $this->countFor($batch, 'yellow'));
        $this->assertSame(1, $this->countFor($batch, 'red'));
    }

    public function test_saved_hook_plus_job_path_produce_only_one_notification(): void
    {
        $merchant = $this->makeMerchant(5002);
        $product  = $this->makeProduct($merchant);
        $batch    = Batch::create([
            'merchant_id' => $merchant->id,
            'product_id'  => $product->id,
            'expiry_date' => now()->addDays(20)->toDateString(),
            'status'      => 'green',
            'discount_type' => 'pending',
            'total_qty'   => 10,
            'batch_qty'   => 10,
        ]);

        $this->assertSame('green', $batch->status);

        // Simulate CheckBatchStatusesJob::updateBatchStatus(): days pass so the
        // batch transitions green -> yellow. The model's saved hook fires during
        // save() (notification #1) and the job then notifies again on the same
        // transition (would-be notification #2).
        $batch->expiry_date = now()->addDays(5)->toDateString();
        $batch->save();

        $this->assertSame('yellow', $batch->status);

        BatchExpiryNotifierService::notify($batch, $batch->status, $merchant);

        $this->assertSame(1, $this->countFor($batch, $batch->status));
    }

    public function test_notification_is_inserted_with_ui_payload(): void
    {
        $merchant = $this->makeMerchant(5003);
        $product  = $this->makeProduct($merchant);
        $batch    = Batch::create([
            'merchant_id' => $merchant->id,
            'product_id'  => $product->id,
            'expiry_date' => now()->addDays(5)->toDateString(),
            'status'      => 'yellow',
            'discount_type' => 'pending',
            'total_qty'   => 10,
            'batch_qty'   => 10,
        ]);

        // The model's saved hook or the explicit call may create the row; either
        // way exactly one notification with a UI-ready payload must exist.
        BatchExpiryNotifierService::notify($batch, 'yellow', $merchant);

        $this->assertSame(1, $this->countFor($batch, 'yellow'));

        $row = DatabaseNotification::query()
            ->where('batch_id', $batch->id)
            ->where('status', 'yellow')
            ->first();

        $this->assertNotNull($row);
        $this->assertSame('App\Models\Merchant', $row->notifiable_type);
        $this->assertSame($merchant->id, $row->notifiable_id);
        $this->assertSame(\App\Notifications\BatchExpiryNotification::class, $row->type);

        $data = $row->data;
        $this->assertSame((string) $batch->id, (string) ($data['batch_id'] ?? null));
        $this->assertSame('yellow', $data['status'] ?? null);
        $this->assertArrayHasKey('title_ar', $data);
        $this->assertArrayHasKey('body_ar', $data);
        $this->assertArrayHasKey('title_en', $data);
        $this->assertArrayHasKey('body_en', $data);
    }

    public function test_no_notification_when_status_does_not_change(): void
    {
        $merchant = $this->makeMerchant(5004);
        $product  = $this->makeProduct($merchant);
        $batch    = Batch::create([
            'merchant_id' => $merchant->id,
            'product_id'  => $product->id,
            'expiry_date' => now()->addDays(5)->toDateString(),
            'status'      => 'yellow',
            'discount_type' => 'pending',
            'total_qty'   => 10,
            'batch_qty'   => 10,
        ]);

        $this->assertSame(1, $this->countFor($batch, 'yellow'));

        // Batch stays yellow — re-running the scheduler must not add anything.
        $batch->refresh();
        $batch->save();
        BatchExpiryNotifierService::notify($batch, 'yellow', $merchant);

        $this->assertSame(1, $this->countFor($batch, 'yellow'));
    }
}
