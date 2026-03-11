<?php

namespace App\Console\Commands;

use App\Models\Merchant;
use App\Services\SallaApiService;
use Illuminate\Console\Command;

class FetchSallaProducts extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'salla:fetch-products {merchant_id? : ID التاجر (اختياري - إذا فارغ يجلب لكل التجار)}';

    /**
     * The console command description.
     */
    protected $description = 'جلب المنتجات من سلة وحفظها في قاعدة البيانات';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $merchantId = $this->argument('merchant_id');

        if ($merchantId) {
            // جلب لتاجر محدد
            $merchant = Merchant::find($merchantId);

            if (!$merchant) {
                $this->error("لم يتم العثور على تاجر بالـID: {$merchantId}");
                return 1;
            }

            $this->fetchForMerchant($merchant);

        } else {
            // جلب لجميع التجار النشطين
            $merchants = Merchant::where('is_active', true)
                ->whereNotNull('access_token')
                ->get();

            if ($merchants->isEmpty()) {
                $this->warn('لا يوجد تجار نشطين');
                return 0;
            }

            $this->info("جاري جلب المنتجات لـ {$merchants->count()} تاجر...");

            foreach ($merchants as $merchant) {
                $this->fetchForMerchant($merchant);
            }
        }

        $this->info('✅ تمت العملية بنجاح!');
        return 0;
    }

    /**
     * جلب المنتجات لتاجر محدد
     */
    private function fetchForMerchant(Merchant $merchant): void
    {
        $this->line("-------------------------------------------");
        $this->info("🔄 جاري جلب منتجات: {$merchant->store_name}");

        try {
            $service = SallaApiService::for($merchant);
            $result = $service->syncProducts();

            $this->info("✅ تم بنجاح!");
            $this->table(
                ['التاجر', 'تمت المزامنة', 'أخطاء'],
                [[$merchant->store_name, $result['synced'], $result['errors']]]
            );

        } catch (\Exception $e) {
            $this->error("❌ فشل جلب منتجات {$merchant->store_name}: " . $e->getMessage());
        }
    }
}