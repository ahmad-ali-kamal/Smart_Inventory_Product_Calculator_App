<?php

namespace App\Services;

use App\Models\Merchant;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SallaApiService
{
    protected Merchant $merchant;
    protected string $baseUrl;
    protected string $oauthUrl;

    public function __construct(Merchant $merchant)
    {
        $this->merchant = $merchant;
        $this->baseUrl = config('salla.api_url');
        $this->oauthUrl = config('salla.oauth_url');
        
        $this->refreshTokenIfNeeded();
    }

    /**
     * Get products from Salla
     */
    public function getProducts(int $page = 1, int $perPage = 50): array
    {
        try {
            $response = $this->makeRequest('GET', '/products', [
                'page' => $page,
                'per_page' => $perPage,
            ]);

            return $response['data'] ?? [];
        } catch (\Exception $e) {
            Log::error('Failed to fetch products from Salla', [
                'merchant_id' => $this->merchant->id,
                'error' => $e->getMessage(),
            ]);
            
            throw $e;
        }
    }

    /**
     * Get single product
     */
    public function getProduct(string $productId): ?array
    {
        try {
            $response = $this->makeRequest('GET', "/products/{$productId}");
            return $response['data'] ?? null;
        } catch (\Exception $e) {
            Log::error('Failed to fetch product from Salla', [
                'merchant_id' => $this->merchant->id,
                'product_id' => $productId,
                'error' => $e->getMessage(),
            ]);
            
            return null;
        }
    }

    /**
     * Update product
     */
    public function updateProduct(string $productId, array $data): ?array
    {
        try {
            $response = $this->makeRequest('PUT', "/products/{$productId}", $data);
            return $response['data'] ?? null;
        } catch (\Exception $e) {
            Log::error('Failed to update product in Salla', [
                'merchant_id' => $this->merchant->id,
                'product_id' => $productId,
                'error' => $e->getMessage(),
            ]);
            
            throw $e;
        }
    }

    /**
     * Hide product
     */
    public function hideProduct(string $productId): bool
    {
        try {
            $this->updateProduct($productId, ['status' => 'hidden']);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Show product
     */
    public function showProduct(string $productId): bool
    {
        try {
            $this->updateProduct($productId, ['status' => 'active']);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Apply discount/special price
     */
    public function applySpecialPrice(
        string $productId,
        float $specialPrice,
        ?string $startsAt = null,
        ?string $endsAt = null
    ): ?array {
        try {
            $data = [
                'sale_price' => $specialPrice,
            ];

            if ($startsAt) {
                $data['sale_start'] = $startsAt;
            }

            if ($endsAt) {
                $data['sale_end'] = $endsAt;
            }

            return $this->updateProduct($productId, $data);
        } catch (\Exception $e) {
            Log::error('Failed to apply special price in Salla', [
                'merchant_id' => $this->merchant->id,
                'product_id' => $productId,
                'error' => $e->getMessage(),
            ]);
            
            throw $e;
        }
    }

    /**
     * Remove special price
     */
    public function removeSpecialPrice(string $productId): bool
    {
        try {
            $this->updateProduct($productId, [
                'sale_price' => null,
                'sale_start' => null,
                'sale_end' => null,
            ]);
            
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Get store info
     */
    public function getStoreInfo(): ?array
    {
        try {
            $response = $this->makeRequest('GET', '/store/info');
            return $response['data'] ?? null;
        } catch (\Exception $e) {
            Log::error('Failed to fetch store info from Salla', [
                'merchant_id' => $this->merchant->id,
                'error' => $e->getMessage(),
            ]);
            
            return null;
        }
    }

    /**
     * Make HTTP request to Salla API
     */
    protected function makeRequest(string $method, string $endpoint, array $data = []): array
    {
        $url = $this->baseUrl . $endpoint;

        $response = Http::withToken($this->merchant->access_token)
            ->withHeaders([
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])
            ->$method($url, $data);

        if ($response->failed()) {
            throw new \Exception("Salla API request failed: " . $response->body());
        }

        return $response->json();
    }

    /**
     * Refresh access token if needed
     */
    protected function refreshTokenIfNeeded(): void
    {
        if (!$this->merchant->isTokenExpired()) {
            return;
        }

        try {
            $response = Http::post($this->oauthUrl . '/token', [
                'grant_type' => 'refresh_token',
                'client_id' => config('salla.client_id'),
                'client_secret' => config('salla.client_secret'),
                'refresh_token' => $this->merchant->refresh_token,
            ]);

            if ($response->successful()) {
                $data = $response->json();

                $this->merchant->update([
                    'access_token' => $data['access_token'],
                    'refresh_token' => $data['refresh_token'] ?? $this->merchant->refresh_token,
                    'token_expires_at' => now()->addSeconds($data['expires_in']),
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to refresh Salla token', [
                'merchant_id' => $this->merchant->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Static method to create instance
     */
    public static function for(Merchant $merchant): self
    {
        return new self($merchant);
    }
}