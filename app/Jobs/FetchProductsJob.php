<?php

namespace App\Jobs;

use App\Models\Merchant;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FetchProductsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $merchant;
    protected $page;

    /**
     * تحديث: الجووب سيحاول 3 مرات في حال الفشل
     */
    public $tries = 3;

    public function __construct(Merchant $merchant, $page = 1)
    {
        $this->merchant = $merchant;
        $this->page = $page;
    }

    public function handle()
    {
        Log::info("Background Thread: Fetching page {$this->page} for {$this->merchant->name}");

        $response = Http::withToken($this->merchant->access_token)
            ->get("https://api.salla.dev/admin/v2/products?page={$this->page}");

        // 1. معالجة الـ Rate Limit (إذا سلة قالت "تمهل")
        if ($response->status() === 429) {
            Log::warning("Rate limit hit. Holding job until the next minute...");
            return $this->release(now()->addMinute()); // عمل هولد للدقيقة التالية
        }

        if ($response->successful()) {
            $data = $response->json();
            $products = $data['data'] ?? [];

            foreach ($products as $p) {
                $this->syncProduct($p);
            }

            // 2. الانتقال التلقائي للصفحة التالية بإنشاء جووب جديد
            $pagination = $data['pagination'] ?? [];
            if ($this->page < ($pagination['total_pages'] ?? 1)) {
                FetchProductsJob::dispatch($this->merchant, $this->page + 1)
                    ->delay(now()->addSeconds(2)); // تأخير بسيط لعدم إرهاق الـ API
            }
        } else {
            // في حال وجود خطأ في الصفحة (مثل 500)، يحاول مرة أخرى بعد دقيقة
            Log::error("Error fetching page {$this->page}: " . $response->body());
            $this->release(now()->addMinute());
        }
    }

    private function syncProduct(array $p)
    {
        $categoryName = 'General';
        if (!empty($p['categories'])) {
            $mainCat = collect($p['categories'])->firstWhere('main', true) ?? $p['categories'][0];
            $categoryName = $mainCat['name'] ?? 'General';
        }

        $product = Product::updateOrCreate(
            ['merchant_id' => $this->merchant->id, 'salla_product_id' => $p['id']],
            [
                'name'      => $p['name'],
                'price'     => $p['price']['amount'] ?? 0,
                'sku'       => $p['sku'] ?? null,
                'category'  => $categoryName,
                'status'    => $p['status'] ?? 'active',
                'quantity'  => $p['quantity'] ?? 0,
                'synced_at' => now(),
            ]
        );

        if (!empty($p['images'])) {
            $product->images()->delete();
            foreach ($p['images'] as $index => $imgData) {
                ProductImage::create([
                    'product_id' => $product->id,
                    'image_url'  => $imgData['url'],
                    'is_main'    => $imgData['main'] ?? false,
                    'sort_order' => $imgData['sort'] ?? $index,
                ]);
            }
        }
    }
}