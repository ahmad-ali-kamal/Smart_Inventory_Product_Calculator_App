@extends('layouts.calcapp')

@section('content')
@include('layouts._header', [
    'headerNav' => [
        ['url' => route('welcome'),              'icon' => 'bi-house',        'label' => 'Home',      'route_match' => 'welcome'],
        ['url' => route('calculator.dashboard'), 'icon' => 'bi-speedometer2', 'label' => 'Dashboard', 'route_match' => 'calculator.dashboard'],
        ['url' => route('calculator.settings'),  'icon' => 'bi-gear',         'label' => 'Settings',  'route_match' => 'calculator.settings'],
    ],
])

{{-- Toast container --}}
<div class="toast-wrap" id="toastContainer"></div>

<div class="max-w-5xl mx-auto px-6 py-10" style="position: relative; z-index: 10;">

    {{-- Guide box --}}
    <div class="guide-box mb-6">
        <div style="display:flex; align-items:center; gap:1rem;">
            <div class="guide-icon"><i class="bi bi-info-circle-fill"></i></div>
            <div>
                <h3 style="font-size:0.875rem; font-weight:700; color:var(--fg); margin-bottom:0.15rem;">Activation Guide</h3>
                <p style="font-size:0.78rem; color:var(--muted); line-height:1.5;">
                    Enable or disable products to control what appears in the smart calculator.
                </p>
            </div>
        </div>
        <div class="search-wrap">
            <i class="bi bi-search"></i>
            <input type="text" id="searchInput" placeholder="Quick find product..." class="search-input">
        </div>
    </div>

    {{-- Table --}}
    <div class="table-card">
        <table style="width:100%; border-collapse:collapse;">
            <thead>
                <tr class="table-head">
                    <th class="th-cell" style="text-align:left;">Product</th>
                    <th class="th-cell" style="text-align:left;">Category</th>
                    <th class="th-cell" style="text-align:center;">Status</th>
                    <th class="th-cell" style="text-align:center;">Toggle</th>
                </tr>
            </thead>
            <tbody id="productsTableBody">
                @forelse($products as $product)
                    @php $isEnabled = $product->calculator?->is_enabled ?? false; @endphp
                    <tr class="table-row" data-product-name="{{ strtolower($product->name) }}">

                        {{-- Product name --}}
                        <td class="td-cell">
                            <div style="display:flex; align-items:center; gap:0.875rem;">
                                <div class="product-icon {{ $isEnabled ? 'active' : 'inactive' }}">
                                    <i class="bi bi-box"></i>
                                </div>
                                <span style="font-size:0.875rem; font-weight:600; color:{{ $isEnabled ? 'var(--fg)' : 'var(--muted)' }};">
                                    {{ $product->name }}
                                </span>
                            </div>
                        </td>

                        {{-- Category --}}
                        <td class="td-cell">
                            <span class="cat-badge {{ $isEnabled ? '' : 'inactive' }}">
                                {{ $product->category ?? 'General' }}
                            </span>
                        </td>

                        {{-- Status --}}
                        <td class="td-cell" style="text-align:center;">
                            @if($isEnabled)
                                <span class="status-active">
                                    <span class="status-dot"></span> Active
                                </span>
                            @else
                                <span class="status-inactive">Inactive</span>
                            @endif
                        </td>

                        {{-- Toggle --}}
                        <td class="td-cell" style="text-align:center;">
                            <label class="switch">
                                <input type="checkbox" class="product-toggle"
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

        {{-- Empty search state --}}
        <div class="empty-state" id="emptySearchState">
            <i class="bi bi-search"></i>
            No products match your search.
        </div>

        {{-- Footer --}}
        <div class="table-footer">
            <a href="{{ route('calculator.dashboard') }}" class="btn-signin" style="max-width:320px; text-decoration:none;">
                <i class="bi bi-check2-circle"></i>
                <span>Confirm Activation Settings</span>
                <i class="bi bi-arrow-right btn-arrow"></i>
            </a>
        </div>
    </div>

    {{-- Pagination --}}
    @if($products->hasPages())
        <div style="margin-top: 1.5rem; display: flex; justify-content: center;">
            {{ $products->links() }}
        </div>
    @endif

</div>
@endsection

@push('scripts')
<script src="{{ mix('js/products.js') }}" defer></script>
@endpush