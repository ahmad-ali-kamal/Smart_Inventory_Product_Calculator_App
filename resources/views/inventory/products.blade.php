@extends('layouts.expiryapp')

@section('content')
@include('layouts._header', [
    'headerNav' => [
        ['url' => route('welcome'), 'icon' => 'bi-house', 'label' => 'Home', 'route_match' => 'welcome'],
        ['url' => route('inventory.dashboard'), 'icon' => 'bi-grid-fill', 'label' => 'Dashboard', 'route_match' => 'inventory.dashboard'],
        ['url' => route('inventory.products.index'), 'icon' => 'bi-box-seam-fill', 'label' => 'Products', 'route_match' => 'inventory.products.index'],
        ['url' => route('inventory.settings'), 'icon' => 'bi-gear-fill', 'label' => 'Settings', 'route_match' => 'inventory.settings'],
    ],
])

<main class="inv-page">

    {{-- Info Banner --}}
    <div class="inv-banner">
        <i class="bi bi-info-circle-fill"></i>
        <span>اضغط على <strong>Add Expiry Date</strong> للبدء في تتبع تاريخ انتهاء الصلاحية لأي منتج.</span>
    </div>

    {{-- Card --}}
    <div class="inv-card">
        <div class="inv-card-head">
            <h2 class="inv-card-title"><i class="bi bi-box-seam"></i> Products</h2>

            <div class="inv-filter-tabs">
                <button class="inv-filter-tab active" data-filter="all">All</button>
                <button class="inv-filter-tab" data-filter="short">Short-term</button>
                <button class="inv-filter-tab" data-filter="medium">Medium-term</button>
                <button class="inv-filter-tab" data-filter="long">Long-term</button>
            </div>
            
            {{-- زر المزامنة لاستدعاء دالة الـ Sync في الكنترولر --}}
            <form action="{{ route('inventory.products.sync') }}" method="POST" style="margin-left: auto;">
                @csrf
                <button type="submit" class="btn-sync-head">
                    <i class="bi bi-arrow-repeat"></i> Sync Products
                </button>
            </form>
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
                        $jsBatches = $product->batchItems->map(function($item) {
                            return [
                                'label' => $item->batch->label ?? 'Batch',
                                'qty' => $item->quantity,
                                'status' => $item->batch->status ?? 'green',
                                'expiry' => $item->batch->expiry_date ?? ''
                            ];
                        });
                    @endphp

                    {{-- Product Row --}}
                    <tr data-id="{{ $product->id }}"
                        data-filter="{{ $product->bucket_type }}"
                        data-batches="{{ json_encode($jsBatches) }}"
                        data-expiry="{{ $product->expiry_date ?? '' }}"
                        data-expiry-type="{{ $hasBatches ? 'batch' : ($product->expiry_date ? 'single' : '') }}">

                        <td>
                            <div class="prod-cell">
                                <div class="prod-img-placeholder" title="Product image">
                                    @if($product->images->isNotEmpty())
                                        <img src="{{ $product->images->first()->url }}" alt="img" style="width:100%; border-radius:4px;">
                                    @else
                                        <i class="bi bi-image"></i>
                                    @endif
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
                                    <span>{{ $product->batchItems->count() }} batch{{ $product->batchItems->count() > 1 ? 'es' : '' }}</span>
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
                        <tr class="batch-row" data-parent="{{ $product->id }}" data-filter="{{ $product->bucket_type }}" style="display:none;">
                            <td>
                                <div class="batch-indent">
                                    <span class="batch-label-field">
                                        <i class="bi bi-layers"></i>
                                        {{ $item->batch->label ?? 'Default Batch' }}
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
                                    <span style="color:var(--muted);">{{ $item->batch->expiry_date ?? 'No Date' }}</span>
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