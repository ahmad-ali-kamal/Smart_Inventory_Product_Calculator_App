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
     * عدد محاولات إعادة التشغيل في حال فشل الجووب
     */
    public $tries = 3;

    /**
     * المهلة الزمنية قبل محاولة إعادة التشغيل (بالثواني)
     */
    public $backoff = 60;

    public function __construct(Merchant $merchant, $page = 1)
    {
        $this->merchant = $merchant;
        $this->page = $page;
    }

    public function handle()
    {
        Log::info("--- [Salla Sync] Start fetching page {$this->page} for merchant: {$this->merchant->name} ---");

        // جلب التوكن من جدول salla_apps
        $sallaApp = $this->merchant->sallaApps()->where('app_name', 'management')->first() 
                    ?? $this->merchant->sallaApps()->first();

        if (!$sallaApp || empty($sallaApp->access_token)) {
            Log::error("Salla Access Token missing for merchant: {$this->merchant->name}. Sync aborted.");
            return;
        }

        try {
            $response = Http::withToken($sallaApp->access_token)
                ->get("https://api.salla.dev/admin/v2/products?page={$this->page}");

            // 1. معالجة الـ Rate Limit (إذا سلة عطتك بلوك مؤقت)
            if ($response->status() === 429) {
                Log::warning("Rate limit hit for {$this->merchant->name}. Holding job for 60 seconds.");
                return $this->release(now()->addMinute());
            }

            if ($response->successful()) {
                $data = $response->json();
                $products = $data['data'] ?? [];
                
                Log::info("Retrieved " . count($products) . " products from Salla API.");

                foreach ($products as $p) {
                    $this->syncProduct($p);
                }

                // 2. المتابعة التلقائية للصفحة التالية (Pagination)
                $pagination = $data['pagination'] ?? [];
                $totalPages = $pagination['total_pages'] ?? 1;

                if ($this->page < $totalPages) {
                    Log::info("Dispatching next page: " . ($this->page + 1));
                    self::dispatch($this->merchant, $this->page + 1)->delay(now()->addSeconds(2));
                } else {
                    Log::info("--- [Salla Sync] Completed successfully for {$this->merchant->name} ---");
                }

            } else {
                Log::error("Failed to fetch products for {$this->merchant->name}. Status: " . $response->status() . " Body: " . $response->body());
                $this->release(now()->addMinutes(2));
            }

        } catch (\Exception $e) {
            Log::error("Critical Error in FetchProductsJob: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * مزامنة المنتج وتحديث بياناته أو إنشاؤه
     */
    private function syncProduct(array $p)
    {
        // استخراج اسم التصنيف (Category)
        $categoryName = 'General';
        if (!empty($p['categories'])) {
            $mainCat = collect($p['categories'])->firstWhere('main', true) ?? $p['categories'][0];
            $categoryName = $mainCat['name'] ?? 'General';
        }

        // 🏆 تحديث أو إنشاء المنتج مع ضمان تحديث الكمية (Quantity)
        $product = Product::updateOrCreate(
            [
                'merchant_id' => $this->merchant->id, 
                'salla_product_id' => $p['id']
            ],
            [
                'name'      => $p['name'],
                'price'         => $p['price']['amount'] ?? 0,
                'sku'       => $p['sku'] ?? null,
                'category'  => $categoryName,
                'status'    => (string) ($p['status'] ?? 'active'),
                'quantity'  => $p['quantity'] ?? 0, // هنا يتم سحب العدد من سلة
                'synced_at' => now(),
            ]
        );
        $expiryOption = collect($p['options'] ?? [])
        ->firstWhere('name', 'تاريخ الانتهاء');

    if ($expiryOption) {
        $product->update(['salla_expiry_option_id' => $expiryOption['id']]);
    }

        // تحديث الصور
        if (!empty($p['images'])) {
            $product->images()->delete();
            foreach ($p['images'] as $index => $imgData) {
                $product->images()->create([
                    'image_url'  => $imgData['url'],
                    'is_main'    => $index === 0,
                    'sort_order' => $imgData['sort'] ?? $index,
                ]);
            }
        }
        
        Log::debug("Synced product ID: {$p['id']} - Name: {$p['name']} - Qty: {$p['quantity']}");
    }
}