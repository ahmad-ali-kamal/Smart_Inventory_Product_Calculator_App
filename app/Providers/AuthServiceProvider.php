<?php

namespace App\Providers;

use App\Models\Product;
use App\Models\Batch;
use App\Models\CategoryMapping;
use App\Policies\ProductPolicy;
use App\Policies\BatchPolicy;
use App\Policies\CategoryMappingPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Product::class => ProductPolicy::class,
        Batch::class => BatchPolicy::class,
        CategoryMapping::class => CategoryMappingPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();
    }
}