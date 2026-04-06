{{-- resources/views/inventory/dashboard.blade.php --}}
@extends('layouts.expiryapp')

@section('content')
@include('layouts._header', [
    'headerNav' => [
        ['url' => route('welcome'),                  'icon' => 'bi-house-door-fill',          'label' => 'Home',      'route_match' => 'welcome'],
        ['url' => route('inventory.dashboard'),      'icon' => 'bi-grid-fill',                'label' => 'Dashboard', 'route_match' => 'inventory.dashboard'],
        ['url' => route('inventory.products.index'), 'icon' => 'bi-box-seam-fill',            'label' => 'Products',  'route_match' => 'inventory.products.index'],
        ['url' => route('inventory.settings'),       'icon' => 'bi-gear-fill',                'label' => 'Settings',  'route_match' => 'inventory.settings'],
        ['icon' => 'bi-bell-fill',                                                             'label' => ''],
        ['url' => route('inventory.instructions'),   'icon' => 'bi-exclamation-circle-fill',  'label' => '',          'route_match' => 'inventory.instructions'],
    ],
])

<main class="max-w-7xl mx-auto px-6 py-8">
@php $autoDiscountsOn = $settings->auto_discounts ?? false; @endphp

    {{-- ═══════════════════════════════════════
         Status Overview
    ═══════════════════════════════════════ --}}
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
                <p class="stat-number">{{ $stats['green_batches'] ?? 0 }}</p>
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
                <p class="stat-number">{{ $stats['yellow_batches'] ?? 0 }}</p>
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
                <p class="stat-number">{{ $stats['red_batches'] ?? 0 }}</p>
                <p class="text-xs text-muted mt-1">Expired batches</p>
            </div>

        </div>
    </div>

    {{-- ═══════════════════════════════════════
         Products Table
    ═══════════════════════════════════════ --}}
    <style>
    .dash-table-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid hsla(0,0%,0%,0.05);
    }
    .prod-img-placeholder { overflow: hidden; }
    </style>
    <div class="table-wrapper">

        {{-- ✅ Header مضغوط بدون مسافة زائدة --}}
        <div class="dash-table-header">
            <div class="flex items-center gap-2">
                <i class="bi bi-box-seam-fill" style="color:var(--clr-orange); font-size:1rem;"></i>
                <h2 class="section-heading" style="margin:0;">Products</h2>
            </div>
            <div class="inv-filter-dropdown" id="dashFilterDropdown">
                <button class="inv-action-btn" id="dashFilterToggle">
                    <i class="bi bi-funnel"></i>
                    <span id="dashFilterLabel">Filter</span>
                    <i class="bi bi-chevron-down inv-chevron" id="dashFilterChevron"></i>
                </button>
                <div class="inv-filter-menu" id="dashFilterMenu">
                    <button class="inv-filter-option active" data-filter="all">All</button>
                    <button class="inv-filter-option" data-filter="green">Green</button>
                    <button class="inv-filter-option" data-filter="yellow">Yellow</button>
                    <button class="inv-filter-option" data-filter="red">Red</button>
                </div>
            </div>
        </div>

        @if(isset($products) && count($products) > 0)
        <div class="inv-table-wrap">
            <table class="inv-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Expiry Info</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="dashBody">
                    @foreach($products as $product)
                    @php $hasBatches = $product->batches && count($product->batches) > 0; @endphp

                    {{-- ── الصف الرئيسي ── --}}
                    <tr data-id="{{ $product->id }}" data-status="{{ $product->status }}">

                        {{-- Product --}}
                        <td>
                            <div class="prod-cell">
                                <div class="prod-img-placeholder">
                                    @if(!empty($product->image_url))
                                        <img src="{{ $product->image_url }}"
                                             alt="{{ $product->name }}"
                                             loading="lazy"
                                             style="width:100%; border-radius:4px;"
                                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                        <span style="display:none; align-items:center; justify-content:center; width:100%; height:100%;">
                                            <i class="bi bi-box"></i>
                                        </span>
                                    @else
                                        <i class="bi bi-box"></i>
                                    @endif
                                </div>
                                <div>
                                    <div class="prod-name">{{ $product->name }}</div>
                                    <div class="prod-id">#{{ $product->id }}</div>
                                </div>
                            </div>
                        </td>

                        {{-- Expiry Info + زر العين بجانبها --}}
                        <td id="dash-expiry-{{ $product->id }}">
                            @if($hasBatches)
                                <div class="exp-cell">
                                    <button class="btn-eye" data-product-id="{{ $product->id }}">
                                        <i class="bi bi-eye" id="dash-eye-{{ $product->id }}"></i>
                                    </button>
                                    <span>{{ count($product->batches) }} batch{{ count($product->batches) > 1 ? 'es' : '' }}</span>
                                </div>
                            @elseif($product->expiry_date)
                                <div class="exp-cell">
                                    <i class="bi bi-calendar3" style="font-size:0.78rem;"></i>
                                    <span>{{ $product->expiry_date }}</span>
                                </div>
                            @else
                                <span style="color:var(--muted);">—</span>
                            @endif
                        </td>

                        {{-- Status --}}
                        <td>
                            @if($product->status === 'green')
                                <span class="b-green">Safe</span>
                            @elseif($product->status === 'yellow')
                                <span class="b-yellow">Approaching</span>
                            @elseif($product->status === 'red')
                                <span class="b-red">Expired</span>
                            @endif
                        </td>

                        {{-- Actions --}}
                        <td>
                            @if($product->status === 'yellow')
                                @if(!$autoDiscountsOn)
                                    <button class="btn-edit-batch btn-discount"
                                            data-product-id="{{ $product->id }}"
                                            data-product-name="{{ $product->name }}">
                                        <i class="bi bi-percent"></i> Discount
                                    </button>
                                @else
                                    <span class="b-yellow" style="font-size:0.7rem; min-width:0; padding:0.25rem 0.7rem;">
                                        <i class="bi bi-check-circle-fill"></i> Auto Discount Applied
                                    </span>
                                @endif
                            @endif

                            @if($product->status === 'red')
                                <div style="display:flex; gap:0.4rem; justify-content:center;">
                                    <button class="btn-edit-batch btn-hide" data-product-id="{{ $product->id }}">
                                        <i class="bi bi-eye-slash"></i> Hide
                                    </button>
                                    <button class="btn-edit-batch btn-restock" data-product-id="{{ $product->id }}">
                                        <i class="bi bi-arrow-repeat"></i> Restock
                                    </button>
                                </div>
                            @endif
                        </td>

                    </tr>

                    {{-- ── صفوف الدفعات — نفس batch-row من Products بالضبط ── --}}
                    @if($hasBatches)
                        @foreach($product->batches as $batch)
                        <tr class="batch-row" data-parent="{{ $product->id }}">
                            <td>
                                <div class="batch-indent">
                                    <span class="batch-label-field">
                                        <i class="bi bi-layers"></i>
                                        {{ $batch->batch_code ?? 'Default Batch' }}
                                    </span>
                                </div>
                            </td>
                            <td>
                                <div class="exp-cell">
                                    <i class="bi bi-calendar3" style="font-size:0.78rem;"></i>
                                    <span style="color:var(--muted);">{{ $batch->expiry_date ?? 'No Date' }}</span>
                                </div>
                            </td>
                            <td>
                                @php $bs = $batch->status ?? $product->status; @endphp
                                <span class="b-{{ $bs }}">
                                    {{ $bs === 'red' ? 'Expired' : ($bs === 'yellow' ? 'Approaching' : 'Safe') }}
                                </span>
                            </td>
                            <td></td>
                        </tr>
                        @endforeach
                    @endif

                    @endforeach
                </tbody>
            </table>

            <div class="inv-empty" id="filterEmpty" style="display:none;">
                <i class="bi bi-funnel"></i>
                <p>No products match this filter.</p>
            </div>
        </div>

        @else
        <div class="p-16 text-center">
            <div class="empty-icon"><i class="bi bi-box-seam"></i></div>
            <p class="text-sm text-muted mb-5">No products with expiry dates yet</p>
            <a href="{{ route('inventory.products.index') }}" class="btn-primary">
                <i class="bi bi-plus-circle"></i> Show Products
            </a>
        </div>
        @endif

    </div>

</main>


@include('inventory.discountform')

@push('scripts')
    <script src="{{ mix('js/inventory-products.js') }}"></script>
    <script src="{{ mix('js/inventory-discountform.js') }}"></script>
    <script src="{{ mix('js/inventory-dashboard.js') }}"></script>
@endpush

@endsection