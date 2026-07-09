<?php

namespace Tests\Unit;

use App\Http\Controllers\Harees\ProductExpiryController;
use App\Models\Batch;
use App\Models\BatchSetting;
use App\Models\Merchant;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class BatchAutoDiscountStateTest extends TestCase
{
    use RefreshDatabase;

    public function test_yellow_batch_is_marked_auto_discounted_when_auto_discount_is_enabled(): void
    {
        $merchant = Merchant::create([
            'salla_merchant_id' => 1001,
            'name' => 'Test Merchant',
            'email' => 'merchant@example.com',
        ]);

        BatchSetting::create([
            'merchant_id' => $merchant->id,
            'medium_term_days' => 14,
            'auto_discounts' => true,
            'auto_discount_percent' => 20,
        ]);

        $batch = Batch::create([
            'merchant_id' => $merchant->id,
            'expiry_date' => now()->addDays(2)->toDateString(),
            'total_qty' => 10,
            'batch_qty' => 10,
            'status' => 'green',
            'discount_type' => 'pending',
        ]);

        $batch->refresh();

        $this->assertSame('yellow', $batch->status);
        $this->assertSame(Batch::DISCOUNT_AUTO_DISCOUNTED, $batch->discount_type);
    }

    public function test_pending_batch_with_applied_sale_price_is_treated_as_auto_discounted(): void
    {
        $merchant = Merchant::create([
            'salla_merchant_id' => 1002,
            'name' => 'Price Merchant',
            'email' => 'price@example.com',
        ]);

        $batch = Batch::create([
            'merchant_id' => $merchant->id,
            'status' => 'yellow',
            'discount_type' => 'pending',
            'original_price' => 100.0,
            'applied_sale_price' => 80.0,
            'expiry_date' => now()->addDays(2)->toDateString(),
            'total_qty' => 5,
            'batch_qty' => 5,
        ]);

        $this->assertSame(Batch::DISCOUNT_AUTO_DISCOUNTED, $batch->getEffectiveDiscountType());
    }

    public function test_cleanup_restores_original_price_for_non_variant_batch(): void
    {
        $merchant = Merchant::create([
            'salla_merchant_id' => 1003,
            'name' => 'Price Merchant',
            'email' => 'price2@example.com',
        ]);

        $product = Product::create([
            'merchant_id' => $merchant->id,
            'salla_product_id' => 'product-123',
            'name' => 'Simple Product',
            'price' => 120.0,
            'quantity' => 5,
            'status' => 'sale',
        ]);

        $batch = Batch::create([
            'merchant_id' => $merchant->id,
            'product_id' => $product->id,
            'expiry_date' => now()->subDay()->toDateString(),
            'total_qty' => 5,
            'batch_qty' => 5,
            'status' => 'red',
            'original_price' => 120.0,
            'original_qty' => 5,
        ]);

        $api = Mockery::mock();
        $api->shouldReceive('updateProductPrice')->once()->with('product-123', 120.0, 0);
        $api->shouldReceive('updateBatchVariant')->never();

        $sallaApiService = Mockery::mock('alias:App\Services\SallaApiService');
        $sallaApiService->shouldReceive('for')->once()->andReturn($api);

        $controller = new class extends ProductExpiryController {
            public function runCleanup(Product $product, $batchIds): void
            {
                $this->cleanupDiscountsOnBatchDeletion($product, $batchIds);
            }
        };

        $controller->runCleanup($product, collect([$batch->id]));
    }
}
