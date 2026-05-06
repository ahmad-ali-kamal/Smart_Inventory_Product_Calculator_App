<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\BatchItem;
use App\Models\Batch;
use App\Models\Product;
use Illuminate\Support\Str;
use App\Services\SallaApiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ApiProductController extends Controller
{
    /**
     * عرض جميع المنتجات من قاعدة البيانات لتاجر محدد
     */
    public function index(Request $request)
    {
        $merchant = $request->user();

        $products = Product::forMerchant($merchant->id)
            ->with(['mainImage'])
            ->when($request->category, fn($q) => $q->where('category', $request->category))
            ->when($request->status,   fn($q) => $q->where('status', $request->status))
            ->when($request->search,   fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->orderBy('name')
            ->paginate(20);

        return ProductResource::collection($products);
    }

    /**
     * عرض تفاصيل منتج واحد
     */
    public function show(Request $request, Product $product)
    {
        if ($product->merchant_id !== $request->user()->id) {
            return response()->json(['message' => 'غير مصرح للوصول لهذا المنتج'], 403);
        }

        return new ProductResource($product->load(['images', 'batchItems.batch']));
    }

    /**
     * قائمة الـ Variants المخزنة في قاعدة بيانات "حريص" للمنتج
     */
    public function variants(Request $request, $product_id)
    {
        $merchant = $request->user();
        $product = Product::where('merchant_id', $merchant->id)
            ->where('id', $product_id)
            ->firstOrFail();

        $variants = $product->batchItems()->with('batch')->get()->map(function ($bi) use ($product) {
            return [
                'id' => $bi->id,
                'price' => ['amount' => (float) $product->price, 'currency' => 'SAR'],
                'stock_quantity' => (int) $bi->quantity,
                'sku' => $bi->batch?->batch_code ?? $product->sku,
                'batch_info' => [
                    'code' => $bi->batch?->batch_code,
                    'expiry' => $bi->batch?->expiry_date?->format('Y-m-d'),
                    'status' => $bi->batch?->status
                ]
            ];
        })->values();

        return response()->json([
            'status' => 200,
            'success' => true,
            'data' => $variants,
        ]);
    }

    /**
     * مزامنة يدوية للمنتجات من سلة
     */
    public function sync(Request $request)
    {
        $merchant = $request->user();
        try {
            $service = SallaApiService::for($merchant);
            $result = $service->syncProducts(); // تأكد أن هذه الدالة موجودة في SallaApiService

            return response()->json([
                'success' => true,
                'message' => "تمت المزامنة بنجاح",
                'synced_count' => count($result['synced'] ?? []),
            ]);
        } catch (\Exception $e) {
            Log::error('[Sync Error] ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'فشلت المزامنة'], 500);
        }
    }

    // ====================================================================
    // السيناريو 1: تحويل منتج "بسيط" إلى منتج "بدفعات"
    // ====================================================================
    public function convertToVariantProduct(Request $request, $product_id)
    {
        $merchant = $request->user();
        $product = Product::where('merchant_id', $merchant->id)->where('id', $product_id)->firstOrFail();

        if (!$product->salla_product_id) {
            return response()->json(['success' => false, 'message' => 'المنتج غير مرتبط بسلة'], 400);
        }

        $expiryDate = $request->input('expiry_date');
        $quantity = (int) ($request->input('quantity', $product->quantity ?? 0));
        $batchCode = $request->input('batch_code', 'B-' . Str::upper(Str::random(6)));

        try {
            $sallaApi = SallaApiService::for($merchant);

            // 1. إنشاء خيار "تاريخ الانتهاء" في سلة
            $optionResult = $sallaApi->createProductOption(
                $product->salla_product_id,
                'تاريخ الانتهاء',
                $expiryDate
            );

            if (!$optionResult || !isset($optionResult['data'])) {
                return response()->json(['success' => false, 'message' => 'فشل إنشاء خيار التاريخ في سلة'], 500);
            }

            $optionValueId = $optionResult['data']['values'][0]['id'] ?? null;

            // 2. إنشاء الـ Variant المرتبط بالتاريخ
            $variantResult = $sallaApi->createVariant($product->salla_product_id, [
                'price' => $product->price ?? 0,
                'stock_quantity' => $quantity,
                'sku' => $batchCode,
                'related_option_values' => [$optionValueId],
            ]);

            // 3. تحديث قاعدة البيانات المحلية
            $batch = Batch::create([
                'merchant_id' => $merchant->id,
                'salla_variant_id' => $variantResult['data']['id'] ?? null,
                'batch_code' => $batchCode,
                'name' => 'دفعة: ' . $product->name,
                'expiry_date' => \Carbon\Carbon::parse($expiryDate),
                'status' => 'green',
                'days_until_expiry' => (int) now()->diffInDays(\Carbon\Carbon::parse($expiryDate), false),
            ]);

            BatchItem::create([
                'batch_id' => $batch->id,
                'product_id' => $product->id,
                'quantity' => $quantity,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم تحويل المنتج وإضافة الدفعة الأولى بنجاح',
                'batch' => $batch
            ]);

        } catch (\Exception $e) {
            Log::error('[Scenario 1 Error] ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ====================================================================
    // السيناريو 2: دمج الدفعة مع خيارات موجودة (الخيار المتعدد)
    // ====================================================================
    public function mergeBatchWithOptions(Request $request, $product_id)
    {
        $merchant = $request->user();
        $product = Product::where('merchant_id', $merchant->id)->where('id', $product_id)->firstOrFail();
        $expiryDate = $request->input('expiry_date');
        $variantsInput = $request->input('variants', []);

        try {
            $sallaApi = SallaApiService::for($merchant);
            
            // البحث عن خيار "تاريخ الانتهاء" أو إنشاؤه لضمان وجود حقل للتاريخ
            $options = $sallaApi->getProductOptions($product->salla_product_id);
            $batchOption = collect($options['data'] ?? [])->firstWhere('name', 'تاريخ الانتهاء');
            
            if (!$batchOption) {
                $optionRes = $sallaApi->createProductOption($product->salla_product_id, 'تاريخ الانتهاء', $expiryDate);
                $optionValueId = $optionRes['data']['values'][0]['id'];
            } else {
                $valRes = $sallaApi->addValueToOption($batchOption['id'], $expiryDate);
                $optionValueId = $valRes['data']['id'];
            }

            foreach ($variantsInput as $vInput) {
                if ((int)$vInput['quantity'] <= 0) continue;

                // إنشاء Variant جديد يجمع الخيار القديم + تاريخ الانتهاء
                $sallaVariant = $sallaApi->createVariant($product->salla_product_id, [
                    'price' => $product->price,
                    'stock_quantity' => $vInput['quantity'],
                    'sku' => $vInput['sku'] ?? 'B-'.Str::random(5),
                    'related_option_values' => array_filter([$vInput['old_value_id'] ?? null, $optionValueId])
                ]);

                // تسجيل في قاعدة البيانات
                $batch = Batch::create([
                    'merchant_id' => $merchant->id,
                    'salla_variant_id' => $sallaVariant['data']['id'] ?? null,
                    'batch_code' => $vInput['sku'] ?? 'B-'.Str::random(5),
                    'expiry_date' => $expiryDate,
                    'status' => 'green'
                ]);

                BatchItem::create([
                    'batch_id' => $batch->id,
                    'product_id' => $product->id,
                    'quantity' => $vInput['quantity']
                ]);
            }

            return response()->json(['success' => true, 'message' => 'تم دمج الدفعات بنجاح']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ====================================================================
    // السيناريو 3: التحديث الجزئي (Partial Batch Update)
    // ====================================================================
    public function partialBatchUpdate(Request $request, $product_id)
    {
        // نستخدم نفس منطق الدمج ولكن للفارييشنز المختارة فقط
        return $this->mergeBatchWithOptions($request, $product_id);
    }
}