@extends('layouts.calcapp')

@section('content')
@include('layouts._header', [
    'headerNav' => [
        ['url' => route('welcome'),                   'icon' => 'bi-house-door-fill',         'label' => 'Home',      'route_match' => 'welcome'],
        ['url' => route('calculator.dashboard'),      'icon' => 'bi-grid-fill',               'label' => 'Dashboard', 'route_match' => 'calculator.dashboard'],
        ['url' => route('calculator.products.index'), 'icon' => 'bi-box-seam-fill',           'label' => 'Products',  'route_match' => 'calculator.products.*'],
        ['url' => route('calculator.settings'),       'icon' => 'bi-gear-fill',               'label' => 'Settings',  'route_match' => 'calculator.settings'],
        ['url' => route('calculator.instructions'),   'icon' => 'bi-exclamation-circle-fill', 'label' => '',          'route_match' => 'calculator.instructions'],
    ],
])

<section class="min-h-screen py-12 px-4" style="position: relative; z-index: 10;">
    <div class="max-w-4xl mx-auto space-y-6">

        {{-- Stats row --}}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4"
             style="opacity:0; animation: fade-up 0.5s ease-out 0.55s forwards;">

            <div class="stat-card card-1">
                <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem;">
                    <div class="icon-box"><i class="bi bi-box-seam"></i></div>
                    <div>
                        <div class="stat-label">Total Products</div>
                        <div class="stat-sub">in your store</div>
                    </div>
                </div>
                <div class="stat-num">{{ $stats['total_products'] }}</div>
            </div>

            <div class="stat-card card-2">
                <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem;">
                    <div class="icon-box icon-2"><i class="bi bi-check2-circle"></i></div>
                    <div>
                        <div class="stat-label">Activated Products</div>
                        <div class="stat-sub">Calculator enabled</div>
                    </div>
                </div>
                <div class="stat-num">{{ $stats['enabled_products'] }}</div>
            </div>

            <div class="stat-card card-3">
                <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem;">
                    <div class="icon-box icon-3"><i class="bi bi-gear"></i></div>
                    <div>
                        <div class="stat-label">Current Settings</div>
                        <div class="stat-sub">Calculator defaults</div>
                    </div>
                </div>
                <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                    {{-- cat-badge resized to Orange App spec via CSS variables --}}
                    <span class="cat-badge">{{ $settings->coverage_per_unit }} sqm</span>
                    <span class="cat-badge">{{ $settings->waste_percentage }}% waste</span>
                    <a href="{{ route('calculator.settings') }}"
                       style="font-size:0.7rem; color:var(--mauve); text-decoration:none; align-self:center; margin-left:auto;">Edit</a>
                </div>
            </div>

        </div>

        {{-- Empty state --}}
        @if($stats['enabled_products'] == 0)
            <div class="empty-card" style="opacity:0; animation: fade-up 0.5s ease-out 0.7s forwards;">
                <div class="empty-icon"><i class="bi bi-box-seam"></i></div>
                <h2 class="font-serif" style="font-size:1.25rem; font-weight:700; color:var(--fg); margin-bottom:0.6rem;">
                    No Activated Products Yet
                </h2>
                <p style="font-size:0.875rem; color:var(--muted); line-height:1.65; max-width:380px; margin:0 auto 2rem;">
                    You haven't activated any products yet. Add your first product and let the smart calculator handle the math.
                </p>
                <a href="{{ route('calculator.products.index') }}" class="btn-signin" style="max-width:280px; margin:0 auto;">
                    <i class="bi bi-plus-circle"></i>
                    <span>Add Product</span>
                    <i class="bi bi-arrow-right btn-arrow"></i>
                </a>
            </div>

        @else
            {{--
                Activated Products table — fully synced with products.blade.php:
                  • Same 4-column structure: Product / Category / Status / Toggle
                  • TASK 1: .product-icon uses Orange App image frame (2.4rem, 0.6rem radius,
                            dashed border, object-fit:cover, onerror fallback)
                  • TASK 2: .cat-badge resized to Orange App token spec
                  • Toggle column: identical .switch markup; products.js picks it up
                    via .product-toggle + data-toggle-url, so no extra JS is needed.
            --}}
            <div style="opacity:0; animation: fade-up 0.5s ease-out 0.7s forwards;">
                <p class="section-heading" style="padding: 0 0 0 0.25rem;">Activated Products</p>

                <div class="table-card" style="opacity:1; animation:none;">
                    <table style="width:100%; border-collapse:collapse;">
                        <thead>
                            <tr class="table-head">
                                <th class="th-cell" style="text-align:left;">Product</th>
                                <th class="th-cell" style="text-align:center;">Category</th>
                                <th class="th-cell" style="text-align:center;">Status</th>
                                <th class="th-cell" style="text-align:center;">Toggle</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($enabledProducts as $product)
                            <tr class="table-row"
                                id="row-{{ $product->id }}"
                                data-product-name="{{ strtolower($product->name) }}">

                                {{-- Product name --}}
                                <td class="td-cell">
                                    <div style="display:flex; align-items:center; gap:0.875rem;">

                                        {{--
                                            TASK 1 — Orange App image standard (identical to products page)
                                        --}}
                                        <div id="icon-{{ $product->id }}"
                                             class="product-icon active">
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
                                              style="font-size:0.875rem; font-weight:600; color:var(--fg);">
                                            {{ $product->name }}
                                        </span>
                                    </div>
                                </td>

                                {{-- TASK 2 — Resized category badge --}}
                                <td class="td-cell">
                                    <div class="cell-center">
                                        <span id="cat-{{ $product->id }}" class="cat-badge">
                                            {{ $product->category ?? 'General' }}
                                        </span>
                                    </div>
                                </td>

                                {{-- Status --}}
                                <td class="td-cell"
                                    id="status-cell-{{ $product->id }}"
                                    style="text-align:center;">
                                    <div class="cell-center">
                                        <span class="status-active">
                                            <span class="status-dot"></span> Active
                                        </span>
                                    </div>
                                </td>

                                {{-- Toggle — identical to products page --}}
                                <td class="td-cell" style="text-align:center;">
                                    <label class="switch">
                                        <input type="checkbox"
                                               class="product-toggle"
                                               data-product-id="{{ $product->id }}"
                                               data-toggle-url="{{ route('calculator.products.toggle', $product->id) }}"
                                               checked>
                                        <span class="slider"></span>
                                    </label>
                                </td>

                            </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        @endif

    </div>
</section>
@endsection

@push('scripts')
<script src="{{ mix('js/products.js') }}" defer></script>
@endpush
