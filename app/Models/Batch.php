<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class Batch extends Model
{
    use HasFactory;

    public $afterCommit = true;

    protected $fillable = [
        'merchant_id',
        'variant_info',
        'batch_code',
        'name',
        'manufactured_date',
        'expiry_date',
        'status',
        'days_until_expiry',
        'notes',
    ];

    protected $casts = [
        'manufactured_date' => 'date',
        'expiry_date'       => 'date:Y-m-d',
        'days_until_expiry' => 'integer',
        'variant_info'      => 'array',
    ];

    protected $appends = [
        'is_expired',
        'expiry_label',
        'total_quantity',
        'total_remaining',
        'total_sold',
    ];

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($batch) {
            $batch->calculateStatus();
        });

        static::saved(function ($batch) {
            $oldStatus = $batch->getOriginal('status');
            $newStatus = $batch->status;

            if ($oldStatus === $newStatus) {
                return;
            }

            if (!in_array($newStatus, ['yellow', 'red'])) {
                return;
            }

            $merchant = $batch->merchant;
            if (!$merchant) {
                Log::warning("[Batch] No merchant found for batch ID: {$batch->id}");
                return;
            }

            $hasProduct = $batch->batchItems()->exists();
            if (!$hasProduct) {
                Log::info("[Batch] Batch {$batch->id} has no product yet — notification deferred");
                return;
            }

            // Create Salla variant when batch turns yellow for the first time
            if ($newStatus === 'yellow' && empty($batch->getSallaVariantId())) {
                try {
                    $batch->createSallaVariant();
                } catch (\Throwable $e) {
                    Log::error("[Batch] Failed to create variant: " . $e->getMessage());
                }
            }

            // Send expiry notification
            try {
                $merchant->notify(new \App\Notifications\BatchExpiryNotification($batch, $newStatus));
            } catch (\Throwable $e) {
                Log::error("[Batch] Failed to send notification: " . $e->getMessage());
            }
        });
    }

    // ====================================================================
    // Helpers
    // ====================================================================

    public function getSallaVariantId(): ?int
    {
        return isset($this->variant_info['variant_id'])
            ? (int) $this->variant_info['variant_id']
            : null;
    }

    public function getSallaOptionId(): ?int
    {
        return isset($this->variant_info['option_id'])
            ? (int) $this->variant_info['option_id']
            : null;
    }

    public function getVariantSku(): ?string
    {
        return $this->variant_info['sku'] ?? null;
    }

    // ====================================================================
    // Accessors
    // ====================================================================

    public function getIsExpiredAttribute(): bool
    {
        if (!$this->expiry_date) return false;
        return $this->expiry_date->isPast() || $this->expiry_date->isToday();
    }

    public function getExpiryLabelAttribute(): string
    {
        $days = $this->days_until_expiry ?? 0;
        if ($days < 0)  return 'منتهي الصلاحية';
        if ($days == 0) return 'ينتهي اليوم!';
        return $days <= 7 ? "خطر: باقي {$days} أيام فقط!" : "باقي {$days} يوم";
    }

    public function getTotalQuantityAttribute(): int
    {
        return (int) $this->batchItems()->sum('quantity');
    }

    public function getTotalSoldAttribute(): int
    {
        return (int) $this->batchItems()->sum('sold_quantity');
    }

    public function getTotalRemainingAttribute(): int
    {
        return $this->total_quantity - $this->total_sold;
    }

    // ====================================================================
    // Relationships
    // ====================================================================

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class, 'merchant_id');
    }

    public function batchItems(): HasMany
    {
        return $this->hasMany(BatchItem::class, 'batch_id');
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'batch_items')
            ->withPivot(['quantity', 'sold_quantity'])
            ->withTimestamps();
    }

    public function activityLogs(): MorphMany
    {
        return $this->morphMany(ActivityLog::class, 'loggable');
    }

    // ====================================================================
    // Scopes
    // ====================================================================

    public function scopeForMerchant($query, $merchantId)
    {
        return $query->where('merchant_id', $merchantId);
    }

    public function scopeExpired($query)
    {
        return $query->where('status', 'red');
    }

    public function scopeWarning($query)
    {
        return $query->where('status', 'yellow');
    }

    public function scopeSafe($query)
    {
        return $query->where('status', 'green');
    }

    // ====================================================================
    // Methods
    // ====================================================================

    public function calculateStatus(): void
    {
        if (!$this->expiry_date) return;

        $expiry   = Carbon::parse($this->expiry_date)->startOfDay();
        $today    = Carbon::now()->startOfDay();
        $daysLeft = (int) $today->diffInDays($expiry, false);

        $this->days_until_expiry = $daysLeft;

        if ($daysLeft <= 0) {
            $this->status = 'red';
            return;
        }

        $threshold    = $this->getThreshold();
        $this->status = ($daysLeft <= $threshold) ? 'yellow' : 'green';
    }

    public function getThreshold(): int
    {
        $product = $this->products()->first();
        if ($product && method_exists($product, 'getCategoryThreshold')) {
            $threshold = $product->getCategoryThreshold();
            if (!is_null($threshold)) return (int) $threshold;
        }

        $settings = BatchSetting::where('merchant_id', $this->merchant_id)->first();
        return (int) ($settings?->medium_term_days ?? 14);
    }

    /**
     * Create a Salla variant for this batch and store variant_info.
     * If the expiry option already exists on the product, adds a new value.
     * Otherwise creates the option for the first time.
     */
    public function createSallaVariant(): void
    {
        $merchant = $this->merchant;
        $product  = $this->products()->first();

        if (!$product || !$product->salla_product_id) {
            Log::warning("[Batch] No salla_product_id found — skipping variant creation");
            return;
        }

        $sallaApi    = \App\Services\SallaApiService::for($merchant);
        $variantName = $this->batch_code . ' - ' . $this->expiry_date->format('Y-m-d');

        Log::info("[Batch] Creating variant", [
            'batch_id'     => $this->id,
            'variant_name' => $variantName,
        ]);

        // Add a new value to the existing option
        if (!empty($product->salla_expiry_option_id)) {
            $res = $sallaApi->addValueToOption(
    $product->salla_product_id,
    $product->salla_expiry_option_id,
    $variantName
);
            $optionValueId = $res['data']['id'] ?? null;
            $skus          = $res['data']['skus'] ?? [];
            $optionId      = $product->salla_expiry_option_id;
        } else {
            // Create the option for the first time
            $res           = $sallaApi->createProductOption(
                $product->salla_product_id,
                'تاريخ الانتهاء',
                $variantName
            );
            $optionValueId = $res['data']['values'][0]['id'] ?? null;
            $skus          = $res['data']['skus'] ?? [];
            $optionId      = $res['data']['id'] ?? null;

            if ($optionId) {
                $product->update(['salla_expiry_option_id' => $optionId]);
            }
        }

        if (!$optionValueId) {
            Log::error("[Batch] Option value ID not found", ['batch_id' => $this->id]);
            return;
        }

        // Find the SKU linked to this option value
        $sallaVariantId = null;
        foreach ($skus as $sku) {
            if (in_array($optionValueId, $sku['related_option_values'] ?? [])) {
                $sallaVariantId = $sku['id'];
                break;
            }
        }

        if (!$sallaVariantId) {
            Log::error("[Batch] No SKU found for option value", [
                'batch_id'        => $this->id,
                'option_value_id' => $optionValueId,
            ]);
            return;
        }

        $variantInfo = [
            'option_id'  => $optionId,
            'variant_id' => $sallaVariantId,
            'sku'        => $product->sku,
        ];

        DB::table('batches')
            ->where('id', $this->id)
            ->update(['variant_info' => json_encode($variantInfo)]);

        $this->variant_info = $variantInfo;

        Log::info("[Batch] variant_info saved successfully", [
            'batch_id'     => $this->id,
            'variant_info' => $variantInfo,
        ]);
    }

    /**
     * Manually send expiry notification after product is linked.
     * Called from the controller to avoid the saved hook firing before BatchItem exists.
     */
    public function sendExpiryNotificationIfNeeded(): void
    {
        if (!in_array($this->status, ['yellow', 'red'])) {
            return;
        }

        $merchant = $this->merchant;
        if (!$merchant) return;

        if (!$this->batchItems()->exists()) return;

        try {
            $merchant->notify(new \App\Notifications\BatchExpiryNotification($this, $this->status));
            Log::info("[Batch] Manual notification sent for batch: {$this->id}");
        } catch (\Throwable $e) {
            Log::error("[Batch] Failed to send manual notification: " . $e->getMessage());
        }
    }
}