@extends('layouts.calcapp')

@section('content')
@include('layouts._header', [
    'headerNav' => [
        ['url' => route('welcome'),                   'icon' => 'bi-house-door-fill',         'label' => 'Home',     'route_match' => 'welcome'],
        ['url' => route('calculator.dashboard'),      'icon' => 'bi-grid-fill',               'label' => 'Dashboard','route_match' => 'calculator.dashboard'],
        ['url' => route('calculator.products.index'), 'icon' => 'bi-box-seam-fill',           'label' => 'Products', 'route_match' => 'calculator.products.*'],
        ['url' => route('calculator.settings'),       'icon' => 'bi-gear-fill',               'label' => 'Settings', 'route_match' => 'calculator.settings'],
        ['url' => route('calculator.instructions'),   'icon' => 'bi-exclamation-circle-fill', 'label' => '',         'route_match' => 'calculator.instructions'],
    ],
])

<div class="max-w-5xl mx-auto px-6 py-10" style="position: relative; z-index: 10;">

    {{-- Guide box --}}
    <div class="guide-box mb-6">

        {{-- Left: info text --}}
        <div style="display:flex; align-items:center; gap:1rem;">
            <div class="guide-icon"><i class="bi bi-info-circle-fill"></i></div>
            <div>
                <h3 style="font-size:0.875rem; font-weight:700; color:var(--fg); margin-bottom:0.15rem;">Activation Guide</h3>
                <p style="font-size:0.78rem; color:var(--muted); line-height:1.5;">
                    Enable or disable products to control what appears in the smart calculator.
                </p>
            </div>
        </div>

        {{-- Unified toolbar: [Search | Filter | Sync] --}}
        <div class="calc-toolbar">

            {{-- Search --}}
            <div class="search-wrap">
                <i class="bi bi-search"></i>
                <input type="text"
                       id="searchInput"
                       value="{{ request('search', '') }}"
                       placeholder="Quick find product…"
                       class="search-input"
                       aria-label="Search products">
            </div>

            {{-- Filter: All / Active / Inactive --}}
            <div class="inv-filter-dropdown" id="filterDropdown">
                <button class="inv-action-btn"
                        id="filterToggle"
                        type="button"
                        aria-haspopup="true"
                        aria-expanded="false">
                    <i class="bi bi-funnel"></i>
                    <span id="filterLabel">Filter</span>
                    <i class="bi bi-chevron-down inv-chevron" id="filterChevron"></i>
                </button>
                <div class="inv-filter-menu" id="filterMenu" role="menu">
                    <button class="inv-filter-option {{ request('filter', 'all') === 'all'      ? 'active' : '' }}"
                            data-filter="all"      role="menuitem">All</button>
                    <button class="inv-filter-option {{ request('filter') === 'active'           ? 'active' : '' }}"
                            data-filter="active"   role="menuitem">Active</button>
                    <button class="inv-filter-option {{ request('filter') === 'inactive'         ? 'active' : '' }}"
                            data-filter="inactive" role="menuitem">Inactive</button>
                </div>
            </div>

            {{-- Sync --}}
            <form action="{{ route('calculator.products.sync') }}" method="POST" id="syncForm">
                @csrf
                <button type="submit" class="inv-action-btn" id="syncBtn" title="Sync products from Salla">
                    <i class="bi bi-arrow-repeat" id="syncIcon"></i>
                </button>
            </form>

        </div>
    </div>

    {{-- Table --}}
    <div class="table-card">
        <table style="width:100%; border-collapse:collapse;">
            <thead>
                <tr class="table-head">
                    <th class="th-cell" style="text-align:left;">Product</th>
                    <th class="th-cell" style="text-align:center;">Category</th>
                    <th class="th-cell" style="text-align:center;">Status</th>
                    <th class="th-cell" style="text-align:center;">Toggle</th>
                </tr>
            </thead>
            <tbody id="productsTableBody">
                @forelse($products as $product)
                    @php $isEnabled = $product->calculator?->is_enabled ?? false; @endphp
                    <tr class="table-row"
                        id="row-{{ $product->id }}"
                        data-product-name="{{ strtolower($product->name) }}"
                        data-status="{{ $isEnabled ? 'active' : 'inactive' }}">

                        {{-- Product name --}}
                        <td class="td-cell">
                            <div style="display:flex; align-items:center; gap:0.875rem;">
                                <div id="icon-{{ $product->id }}"
                                     class="product-icon {{ $isEnabled ? 'active' : 'inactive' }}">
                                    @if(!empty($product->image_url))
                                        <img src="{{ $product->image_url }}"
                                             alt="{{ $product->name }}"
                                             loading="lazy"
                                             onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                                        <span style="display:none; align-items:center; justify-content:center; width:100%; height:100%;">
                                            <i class="bi bi-box"></i>
                                        </span>
                                    @else
                                        <i class="bi bi-box"></i>
                                    @endif
                                </div>
                                <span id="name-{{ $product->id }}"
                                      style="font-size:0.875rem; font-weight:600;
                                             color:{{ $isEnabled ? 'var(--fg)' : 'var(--muted)' }};">
                                    {{ $product->name }}
                                </span>
                            </div>
                        </td>

                        {{-- Category badge --}}
                        <td class="td-cell">
                            <div class="cell-center">
                                <span id="cat-{{ $product->id }}"
                                      class="cat-badge {{ $isEnabled ? '' : 'inactive' }}">
                                    {{ $product->category ?? 'General' }}
                                </span>
                            </div>
                        </td>

                        {{-- Status --}}
                        <td class="td-cell"
                            id="status-cell-{{ $product->id }}"
                            style="text-align:center;">
                            <div class="cell-center">
                                @if($isEnabled)
                                    <span class="status-active">
                                        <span class="status-dot"></span> Active
                                    </span>
                                @else
                                    <span class="status-inactive">Inactive</span>
                                @endif
                            </div>
                        </td>

                        {{-- Toggle --}}
                        <td class="td-cell" style="text-align:center;">
                            <label class="switch">
                                <input type="checkbox"
                                       class="product-toggle"
                                       data-product-id="{{ $product->id }}"
                                       data-toggle-url="{{ route('calculator.products.toggle', $product->id) }}"
                                       {{ $isEnabled ? 'checked' : '' }}>
                                <span class="slider"></span>
                            </label>
                        </td>

                    </tr>
                @empty
                    <tr>
                        <td colspan="4" class="empty-state" style="display:table-cell;">
                            <i class="bi bi-box-seam"></i>
                            No products found. Sync your products first.
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        {{-- Empty search/filter state --}}
        <div class="empty-state" id="emptySearchState">
            <i class="bi bi-search"></i>
            No products match your search.
        </div>

       
        {{-- Footer --}}
@if($products->hasPages())
<div class="table-footer table-footer--centered-pagination">
    <div class="table-pagination">
        {{ $products->onEachSide(1)->links('pagination::bootstrap-5') }}
    </div>
</div>
@endif
 

</div>
@endsection

@push('scripts')
<script src="{{ mix('js/products.js') }}" defer></script>
@endpush
