<?php

namespace App\Jobs;

use App\Models\Merchant;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\SallaApiService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FetchProductsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $backoff = 60;

    protected $merchant;
    protected $page;

    private const SYNC_COUNTER_KEY = 'queue:salla_sync_active_merchants';
    private const SYNC_COMPLETE_FLAG = 'queue:salla_sync_complete';

    public function __construct(Merchant $merchant, $page = 1)
    {
        $this->afterCommit = true;
        $this->merchant = $merchant;
        $this->page = $page;

        if ($page === 1) {
            $key = self::SYNC_COUNTER_KEY . ':started:' . $merchant->id;
            if (!Cache::has($key)) {
                Cache::put($key, true, now()->addMinutes(30));
                $this->incrementSyncCounter();
            }
        }
    }

    public function handle()
    {
        Log::info("--- [Salla Sync] Start fetching page {$this->page} for merchant: {$this->merchant->name} ---");

        $sallaApp = $this->merchant->sallaApps()->where('app_name', 'management')->first()
                    ?? $this->merchant->sallaApps()->first();

        if (!$sallaApp || empty($sallaApp->access_token)) {
            Log::error("Salla Access Token missing for merchant: {$this->merchant->name}. Sync aborted.");
            $this->decrementSyncCounter();
            return;
        }

        try {
            $response = Http::withToken($sallaApp->access_token)
                ->get("https://api.salla.dev/admin/v2/products?page={$this->page}");

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

                $pagination = $data['pagination'] ?? [];
                $totalPages = $pagination['total_pages'] ?? 1;

                if ($this->page < $totalPages) {
                    Log::info("Dispatching next page: " . ($this->page + 1));
                    self::dispatch($this->merchant, $this->page + 1)->delay(now()->addSeconds(2));
                } else {
                    Log::info("--- [Salla Sync] Completed all pages for {$this->merchant->name} ---");
                    $this->decrementSyncCounter();
                }

            } else {
                Log::error("Failed to fetch products for {$this->merchant->name}. Status: " . $response->status() . " Body: " . $response->body());
                $this->release(now()->addMinutes(2));
            }

        } catch (\Exception $e) {
            Log::error("Critical Error in FetchProductsJob: " . $e->getMessage());
            $this->decrementSyncCounter();
            throw $e;
        }
    }

    private function incrementSyncCounter(): void
    {
        $current = Cache::get(self::SYNC_COUNTER_KEY, 0);
        Cache::forever(self::SYNC_COUNTER_KEY, $current + 1);
    }

    private function decrementSyncCounter(): void
    {
        $current = Cache::get(self::SYNC_COUNTER_KEY, 0);

        if ($current <= 1) {
            Cache::forget(self::SYNC_COUNTER_KEY);
            Log::info("=== [Orchestration] All merchants synced. Dispatching CheckBatchExpiryJob ===");
            CheckBatchExpiryJob::dispatch();
        } else {
            Cache::forever(self::SYNC_COUNTER_KEY, $current - 1);
            Log::info("[Orchestration] Merchant sync completed. Remaining: " . ($current - 1));
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
                'price'     => $p['price']['amount'] ?? 0,
                'sku'       => $p['sku'] ?? null,
                'category'  => $categoryName,
                'status'    => (string) ($p['status'] ?? 'active'),
                'quantity'  => $p['quantity'] ?? 0, // هنا يتم سحب العدد من سلة
                'synced_at' => now(),
            ]
        );

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
        
        // حفظ الفاريينت
        $this->syncProductVariants($product);
        
        Log::debug("Synced product ID: {$p['id']} - Name: {$p['name']} - Qty: {$p['quantity']}");
    }
    
    /**
     * مزامنة الفاريينت للمنتج وتخزينها
     */
    private function syncProductVariants(Product $product)
    {
        if (!$product->salla_product_id) return;
        
        try {
            $sallaApp = $this->merchant->sallaApps()->where('app_name', 'management')->first() 
                        ?? $this->merchant->sallaApps()->first();
            
            if (!$sallaApp || empty($sallaApp->access_token)) return;
            
            $sallaApi = new SallaApiService($this->merchant);
            
            // جلب الفاريينت
            $variantsResponse = $sallaApi->getProductVariants($product->salla_product_id);
            $variants = $variantsResponse['data'] ?? [];
            
            if (empty($variants)) {
                $product->update(['variants_data' => null]);
                return;
            }
            
            // نحتاج نجمع كل الـ option IDs من كل variants
            $allOptionIds = [];
            foreach ($variants as $v) {
                foreach ($v['related_options'] ?? [] as $optId) {
                    $allOptionIds[$optId] = true;
                }
            }
            
            // جلب الخيارات لأسماء القيم
            $valueNames = [];
            $optionsResponse = $sallaApi->getProductOptions($product->salla_product_id);
            $options = $optionsResponse['data'] ?? [];
            
            // من product options
            foreach ($options as $option) {
                $optionId = $option['id'] ?? null;
                if (!$optionId) continue;
                
                $optionDetails = $sallaApi->getOptionDetails($optionId);
                $optionData = $optionDetails['data'] ?? null;
                
                if ($optionData && isset($optionData['values'])) {
                    foreach ($optionData['values'] as $value) {
                        $valueNames[$value['id']] = $value['name'];
                    }
                }
            }
            
            // من related_options في variants (إذا ما كانت موجودة)
            foreach (array_keys($allOptionIds) as $optId) {
                if (!isset($valueNames[$optId])) {
                    try {
                        $optionDetails = $sallaApi->getOptionDetails($optId);
                        $optionData = $optionDetails['data'] ?? null;
                        
                        if ($optionData && isset($optionData['values'])) {
                            foreach ($optionData['values'] as $value) {
                                $valueNames[$value['id']] = $value['name'];
                            }
                        }
                    } catch (\Exception $e) {
                        // تجاهل
                    }
                }
            }
            
            // تجهيز الفاريينت بشكل مدمج
            $formattedVariants = array_map(function ($v) use ($valueNames) {
                $optionNames = [];
                foreach ($v['related_option_values'] ?? [] as $valueId) {
                    if (isset($valueNames[$valueId])) {
                        $optionNames[] = $valueNames[$valueId];
                    }
                }
                
                $displayName = implode(' - ', $optionNames);
                if (empty($displayName)) {
                    $displayName = $v['sku'] ?? 'فارينت ' . $v['id'];
                }
                
                return [
                    'id' => $v['id'],
                    'sku' => $v['sku'] ?? null,
                    'name' => $displayName,
                    'price' => $v['price']['amount'] ?? 0,
                    'stock_quantity' => $v['stock_quantity'] ?? 0,
                    'unlimited_quantity' => $v['unlimited_quantity'] ?? false,
                ];
            }, $variants);
            
            // حفظ variants_data كـ JSON في قاعدة البيانات
            $product->variants_data = $formattedVariants;
            $product->save();
            
            Log::info("[FetchVariants] Saved " . count($formattedVariants) . " variants for product {$product->id}");
            
        } catch (\Exception $e) {
            Log::warning("[FetchVariants] Failed for product {$product->id}: " . $e->getMessage());
        }
    }
}