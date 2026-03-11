@extends('layouts.expiryapp')

@section('content')
@include('layouts._header', [
    'headerNav' => [
        ['url' => route('welcome'), 'icon' => 'bi-house',      'label' => 'Home',     'route_match' => 'welcome'],
        ['icon' => 'bi-gear-fill',                             'label' => 'Settings'],
        ['icon' => 'bi-box-seam-fill',                         'label' => 'Products'],
        ['icon' => 'bi-bell-fill',                             'label' => 'Notifications'],
    ],
])

<main class="max-w-7xl mx-auto px-6 py-8">

    {{-- Status Overview --}}
    <div class="mb-8">
        <h2 class="section-heading">Status Overview</h2>
        <div class="grid md:grid-cols-3 gap-4">

            <div class="stat-card green">
                <div class="flex items-center gap-3 mb-4">
                    <div class="icon-box green"><i class="bi bi-check-circle-fill"></i></div>
                    <div>
                        <p class="text-sm font-bold stat-label-green">Green Status</p>
                        <p class="text-xs text-muted">Safe batches</p>
                    </div>
                </div>
                <p class="font-bold" style="font-size:2rem; line-height:1">{{ $stats['green_batches'] ?? 0 }}</p>
                <p class="text-xs text-muted mt-1">Batches in safe state</p>
            </div>

            <div class="stat-card yellow">
                <div class="flex items-center gap-3 mb-4">
                    <div class="icon-box yellow"><i class="bi bi-exclamation-triangle-fill"></i></div>
                    <div>
                        <p class="text-sm font-bold stat-label-yellow">Yellow Status</p>
                        <p class="text-xs text-muted">Approaching expiry</p>
                    </div>
                </div>
                <p class="font-bold" style="font-size:2rem; line-height:1">{{ $stats['yellow_batches'] ?? 0 }}</p>
                <p class="text-xs text-muted mt-1">Batches need attention</p>
            </div>

            <div class="stat-card red">
                <div class="flex items-center gap-3 mb-4">
                    <div class="icon-box red"><i class="bi bi-x-circle-fill"></i></div>
                    <div>
                        <p class="text-sm font-bold stat-label-red">Red Status</p>
                        <p class="text-xs text-muted">Expired</p>
                    </div>
                </div>
                <p class="font-bold" style="font-size:2rem; line-height:1">{{ $stats['red_batches'] ?? 0 }}</p>
                <p class="text-xs text-muted mt-1">Expired batches</p>
            </div>

        </div>
    </div>

    {{-- Products Table --}}
    <div class="table-wrapper">

        <div class="p-6" style="border-bottom:1px solid hsla(0,0%,0%,0.05)">
            <div class="flex justify-between items-center">
                <h2 class="section-heading">Products</h2>
                <div class="filter-tabs">
                    {{-- data-filter is read by inventory-dashboard.js --}}
                    <button class="filter-tab tab-all active" data-filter="all">All</button>
                    <button class="filter-tab tab-green"      data-filter="green">Green</button>
                    <button class="filter-tab tab-yellow"     data-filter="yellow">Yellow</button>
                    <button class="filter-tab tab-red"        data-filter="red">Red</button>
                </div>
            </div>
        </div>

        @if(isset($products) && count($products) > 0)
        <div class="overflow-x-auto">
            <table class="w-full" style="table-layout:fixed;">
                <colgroup>
                    <col style="width:20%">
                    <col style="width:27%">
                    <col style="width:27%">
                    <col style="width:26%">
                </colgroup>
                <thead>
                    <tr class="table-header-row">
                        <th style="text-align:left; padding:0.875rem 1.5rem;">Product</th>
                        <th style="text-align:center; padding:0.875rem 1rem;">Expiry / Batches</th>
                        <th style="text-align:center; padding:0.875rem 1rem;">Status</th>
                        <th style="text-align:center; padding:0.875rem 1.5rem;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($products as $product)
                    <tr class="table-row" data-status="{{ $product->status }}">

                        <td style="padding:1rem 1.5rem;">
                            <div class="flex items-center gap-3">
                                @if($product->batches && count($product->batches) > 0)
                                    <button class="expand-btn">
                                        <i class="bi bi-chevron-right"></i>
                                    </button>
                                @endif
                                <div class="product-icon"><i class="bi bi-box"></i></div>
                                <span class="font-semibold text-sm">{{ $product->name }}</span>
                            </div>
                        </td>

                        <td class="text-sm text-muted" style="text-align:center; padding:1rem 1rem;">
                            @if($product->batches && count($product->batches) > 0)
                                {{ count($product->batches) }} batches
                            @else
                                {{ $product->expiry_date ?? '—' }}
                            @endif
                        </td>

                        <td style="text-align:center; padding:1rem 1rem;">
                            @if($product->status === 'green')
                                <span class="b-green">Safe</span>
                            @elseif($product->status === 'yellow')
                                <span class="b-yellow">Approaching</span>
                            @elseif($product->status === 'red')
                                <span class="b-red">Expired</span>
                            @endif
                        </td>

                        <td style="text-align:center; padding:1rem 1.5rem;">
                            <div class="flex justify-center gap-2">
                                @if($product->status === 'yellow')
                                    {{--
                                        data-product-id and data-product-name are read by
                                        inventory-dashboard.js to open DiscountForm
                                    --}}
                                    <button class="action-btn btn-discount"
                                            data-product-id="{{ $product->id }}"
                                            data-product-name="{{ $product->name }}">
                                        <i class="bi bi-percent"></i> Discount
                                    </button>
                                @endif
                                @if($product->status === 'red')
                                    <button class="action-btn btn-hide">
                                        <i class="bi bi-eye-slash"></i> Hide
                                    </button>
                                    <button class="action-btn btn-restock">
                                        <i class="bi bi-arrow-repeat"></i> Restock
                                    </button>
                                @endif
                            </div>
                        </td>

                    </tr>
                    @endforeach
                </tbody>
            </table>

            <div id="filterEmpty" style="display:none;" class="p-12 text-center">
                <div class="empty-icon"><i class="bi bi-funnel"></i></div>
                <p class="text-sm text-muted">No products match this filter</p>
            </div>
        </div>

        @else
        <div class="p-16 text-center">
            <div class="empty-icon"><i class="bi bi-box-seam"></i></div>
            <p class="text-sm text-muted mb-5">No products with expiry dates yet</p>
            <button class="btn-primary">
                <i class="bi bi-plus-circle"></i> Show Products
            </button>
        </div>
        @endif

    </div>

</main>

@include('inventory.discountform')

@push('scripts')
    {{--
        inventory-products.js must come first — it defines window.Inventory
        which inventory-discountform.js calls via Inventory.onDiscountSuccess()
    --}}
    <script src="{{ mix('js/inventory-products.js') }}"></script>
    <script src="{{ mix('js/inventory-discountform.js') }}"></script>
    <script src="{{ mix('js/inventory-dashboard.js') }}"></script>
@endpush

@endsection