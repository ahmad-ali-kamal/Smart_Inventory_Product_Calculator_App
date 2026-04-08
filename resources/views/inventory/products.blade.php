@extends('layouts.expiryapp')

@section('content')
@include('layouts._header', [
    'headerNav' => [
        ['url' => route('welcome'), 'icon' => 'bi-house-door-fill', 'label' => 'Home', 'route_match' => 'welcome'],
        ['url' => route('inventory.dashboard'), 'icon' => 'bi-grid-fill', 'label' => 'Dashboard', 'route_match' => 'inventory.dashboard'],
        ['url' => route('inventory.products.index'), 'icon' => 'bi-box-seam-fill', 'label' => 'Products', 'route_match' => 'inventory.products.index'],
        ['url' => route('inventory.settings'), 'icon' => 'bi-gear-fill', 'label' => 'Settings', 'route_match' => 'inventory.settings'],
        ['icon' => 'bi-bell-fill',                             'label' => ''],
        ['url' => route('inventory.instructions'), 'icon' => 'bi-exclamation-circle-fill', 'label' => '', 'route_match' => 'inventory.instructions'],
    ],
])

<main class="inv-page">

    {{-- Info Banner --}}
    <div class="inv-banner">
        <i class="bi bi-info-circle-fill"></i>
        <span>Click<strong> “Add Expiry Date”</strong> to start tracking your product expiry dates</span>
    </div>

    {{-- Card --}}
    <div class="inv-card">
        <div class="inv-card-head">
            <h2 class="inv-card-title"><i class="bi bi-box-seam"></i> Products</h2>

            {{-- جديد - حطه --}}
<div class="inv-head-actions">

    <div class="inv-filter-dropdown" id="filterDropdown">
        <button class="inv-action-btn" id="filterToggle" onclick="toggleFilterMenu()">
            <i class="bi bi-funnel"></i>
            <span id="filterLabel">Filter</span>
            <i class="bi bi-chevron-down inv-chevron" id="filterChevron"></i>
        </button>
        <div class="inv-filter-menu" id="filterMenu">
            <button class="inv-filter-option active" data-filter="all"    onclick="selectFilter(this)">All</button>
            <button class="inv-filter-option"        data-filter="short"  onclick="selectFilter(this)">Short</button>
            <button class="inv-filter-option"        data-filter="medium" onclick="selectFilter(this)">Medium</button>
            <button class="inv-filter-option"        data-filter="long"   onclick="selectFilter(this)">Long</button>
        </div>
    </div>

    <form action="{{ route('inventory.products.sync') }}" method="POST">
        @csrf
        <button type="submit" class="inv-action-btn">
            <i class="bi bi-arrow-repeat"></i>
        </button>
    </form>

</div>
        </div>

        <div class="inv-table-wrap">
            <table class="inv-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th class="th-status">Status</th>
                        <th>Expiry Info</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody id="invBody">
                    @forelse($products as $product)
                    @php 
                        $hasBatches = $product->batchItems->count() > 0;
                        // تحويل الدفعات لتنسيق يفهمه الـ JS
$jsBatches = $product->batchItems->map(function($item) use ($product, $settings) {
    return [
        'label'      => $item->batch->batch_code ?? 'Batch',
        'qty'        => $item->quantity,
        'status'     => $item->batch->status ?? 'green',
        'expiry'     => $item->batch->expiry_date ? \Carbon\Carbon::parse($item->batch->expiry_date)->format('Y-m-d') : '',
        'batch_code' => $item->batch->batch_code ?? null,
        'threshold'  => $product->getCategoryThreshold() ?? $settings->medium_term_days ?? 14,
    ];
});

                    @endphp

                    {{-- Product Row --}}
                    @php
    $firstBatch = $product->batchItems->first()?->batch;
    $isSingle = $product->batchItems->count() === 1;
@endphp
<tr data-id="{{ $product->id }}"
    data-filter="{{ $product->bucket_type }}"
    data-batches="{{ json_encode($jsBatches) }}"
    data-expiry="{{ $firstBatch && $isSingle ? \Carbon\Carbon::parse($firstBatch->expiry_date)->format('Y-m-d') : '' }}"
    data-batch-code="{{ $firstBatch?->batch_code ?? '' }}"
   data-expiry-type="{{ $hasBatches ? ($isSingle ? 'single' : 'batch') : '' }}"
data-threshold="{{ $product->getCategoryThreshold() ?? $settings->medium_term_days ?? 14 }}"
data-original-type="{{ $hasBatches ? ($isSingle ? 'single' : 'batch') : '' }}">
                        <td>
                            <div class="prod-cell">
                                <div class="prod-img-placeholder" title="Product image">
                                    <img src="{{ $product->image_url }}" alt="{{ $product->name }}" style="width:100%; border-radius:4px;">
                                </div>
                                <div>
                                    <div class="prod-name">{{ $product->name }}</div>
                                    <div class="prod-id">#{{ $product->salla_id ?? $product->id }}</div>
                                    {{-- إذا كان هناك خصم مفعل من سلة --}}
                                    @if($product->sale_price < $product->regular_price)
                                        <div class="disc-pill">
                                            <i class="bi bi-tag-fill"></i>
                                            On Sale &bull; Active
                                        </div>
                                    @endif
                                </div>
                            </div>
                        </td>

                        <td><span class="b-cat">{{ $product->category }}</span></td>

                        <td class="td-status">
                            @if($product->status === 'green')
                                <span class="badge b-green">Safe</span>
                            @elseif($product->status === 'yellow')
                                <span class="badge b-yellow">Approaching</span>
                            @elseif($product->status === 'red')
                                <span class="badge b-red">Expired</span>
                            @else
                                <span class="badge b-none">No expiry set</span>
                            @endif
                        </td>

                        <td id="expiry-cell-{{ $product->id }}">
                            @if($hasBatches)
                                <div class="exp-cell">
                                    <button class="btn-eye" data-product-id="{{ $product->id }}">
                                        <i class="bi bi-eye" id="eye-{{ $product->id }}"></i>
                                    </button>
                                    <span>{{ $isSingle ? 'Single' : $product->batchItems->count() . ' batches' }}</span>
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

                        <td>
                            <button class="btn-expiry {{ ($hasBatches || $product->expiry_date) ? 'is-edit' : '' }}"
                                    id="btn-expiry-{{ $product->id }}"
                                    data-product-id="{{ $product->id }}"
                                    data-product-name="{{ $product->name }}">
                                @if($hasBatches || $product->expiry_date)
                                    <i class="bi bi-pencil-square"></i> Edit Expiry Date
                                @else
                                    <i class="bi bi-calendar-plus"></i> Add Expiry Date
                                @endif
                            </button>
                        </td>
                    </tr>

                    {{-- Batch Rows (عرضها في حال وجود دفعات) --}}
                    @foreach($product->batchItems as $item)
                        {{-- جديد --}}
<tr class="batch-row" data-parent="{{ $product->id }}" data-filter="{{ $product->bucket_type }}">
                            <td>
                                <div class="batch-indent">
                                    <span class="batch-label-field">
                                        <i class="bi bi-layers"></i>
                                        {{ $item->batch->batch_code ?? 'Default Batch' }}
                                    </span>
                                </div>
                            </td>
                            <td style="color:var(--muted);">{{ $item->quantity }} units</td>
                            <td>
                                @php $bStatus = $item->batch->status ?? 'green'; @endphp
                                <span class="badge b-{{ $bStatus }}">
                                    {{ $bStatus === 'red' ? 'Expired' : ($bStatus === 'yellow' ? 'Approaching' : 'Safe') }}
                                </span>
                            </td>
                            <td>
                                <div class="exp-cell">
                                    <i class="bi bi-calendar3" style="font-size:0.78rem;"></i>
                                    <span style="color:var(--muted);">{{ $item->batch->expiry_date ? \Carbon\Carbon::parse($item->batch->expiry_date)->format('Y-m-d') : 'No Date' }}</span>
                                </div>
                            </td>
                            <td></td> {{-- مكان فارغ للأكشن في الدفعات --}}
                        </tr>
                    @endforeach

                    @empty
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 40px; color: var(--muted);">
                            <i class="bi bi-search" style="font-size: 2rem; display: block; margin-bottom: 10px;"></i>
                            لم يتم العثور على منتجات. جرب الضغط على "Sync Products".
                        </td>
                    </tr>
                    @endforelse
                </tbody>
            </table>

            <div class="inv-empty" id="invEmpty" style="display:none;">
                <i class="bi bi-funnel"></i>
                <p>No products match this filter.</p>
            </div>
        </div>
        
        {{-- إضافة روابط الترقيم (Pagination) --}}
        <div class="inv-pagination-wrap">
            {{ $products->links() }}
        </div>
    </div>

    <p class="inv-footer" id="invFooter">
        <i class="bi bi-box-seam"></i>
        Showing {{ $products->count() }} products from your Salla store
    </p>

</main>

{{-- Toast --}}
<div class="inv-toast" id="invToast">
    <i id="invToastIcon"></i>
    <span id="invToastMsg"></span>
</div>

{{-- Modals --}}
@include('inventory.dateform')

@push('scripts')
    {{-- استخدام asset مباشرة إذا كنت لا تستخدم Laravel Mix --}}
    <script src="{{ asset('js/inventory-products.js') }}" defer></script>
    <script src="{{ asset('js/inventory-dateform.js') }}" defer></script>
@endpush

@endsection