@extends('layouts.expiryapp')

@php
$products = [
    ['id'=>'1',  'name'=>'Organic Fresh Milk',   'category'=>'Dairy',     'filter'=>'short',  'status'=>'green',  'discount'=>null, 'expiry'=>'2025-03-15', 'batches'=>[]],
    ['id'=>'2',  'name'=>'Whole Wheat Bread',     'category'=>'Bakery',    'filter'=>'short',  'status'=>'yellow', 'discount'=>20,   'expiry'=>'2025-02-10', 'batches'=>[]],
    ['id'=>'3',  'name'=>'Greek Yogurt 500g',     'category'=>'Dairy',     'filter'=>'short',  'status'=>'red',    'discount'=>null, 'expiry'=>null,         'batches'=>[]],
    ['id'=>'4',  'name'=>'Fresh Orange Juice',    'category'=>'Beverages', 'filter'=>'medium', 'status'=>null,     'discount'=>null, 'expiry'=>null,         'batches'=>[]],
    ['id'=>'5',  'name'=>'Cheddar Cheese Block',  'category'=>'Dairy',     'filter'=>'short',  'status'=>'green',  'discount'=>null, 'expiry'=>null,
        'batches'=>[
            ['label'=>'Batch 1', 'qty'=>50, 'status'=>'green',  'expiry'=>'2025-06-01'],
            ['label'=>'Batch 2', 'qty'=>30, 'status'=>'yellow', 'expiry'=>'2025-02-28'],
        ]
    ],
    ['id'=>'6',  'name'=>'Sourdough Bread',       'category'=>'Bakery',    'filter'=>'short',  'status'=>null,     'discount'=>null, 'expiry'=>null, 'batches'=>[]],
    ['id'=>'7',  'name'=>'Strawberry Yogurt',     'category'=>'Dairy',     'filter'=>'short',  'status'=>'yellow', 'discount'=>15,   'expiry'=>'2025-02-14', 'batches'=>[]],
    ['id'=>'8',  'name'=>'Apple Juice 1L',        'category'=>'Beverages', 'filter'=>'medium', 'status'=>'green',  'discount'=>null, 'expiry'=>'2025-08-20', 'batches'=>[]],
    ['id'=>'9',  'name'=>'Mozzarella Cheese',     'category'=>'Dairy',     'filter'=>'short',  'status'=>null,     'discount'=>null, 'expiry'=>null, 'batches'=>[]],
    ['id'=>'10', 'name'=>'Croissants Pack of 6',  'category'=>'Bakery',    'filter'=>'short',  'status'=>'red',    'discount'=>null, 'expiry'=>'2025-01-30', 'batches'=>[]],
];
@endphp

@section('content')
@include('layouts._header', [
    'headerNav' => [
        ['url' => route('welcome'), 'icon' => 'bi-house',  'label' => 'Home',          'route_match' => 'welcome'],
        ['icon' => 'bi-grid-fill',                         'label' => 'Dashboard'],
        ['icon' => 'bi-gear',                              'label' => 'Settings'],
        ['icon' => 'bi-bell-fill',                         'label' => 'Notifications'],
    ],
])


<main class="inv-page">

    {{-- Info Banner --}}
    <div class="inv-banner">
        <i class="bi bi-info-circle-fill"></i>
        <span>Click <strong>Add Expiry Date</strong> to start tracking expiry for any product.</span>
    </div>

    {{-- Card --}}
    <div class="inv-card">
        <div class="inv-card-head">
            <h2 class="inv-card-title"><i class="bi bi-box-seam"></i> Products</h2>

            {{-- data-filter is read by inventory-products.js --}}
            <div class="inv-filter-tabs">
                <button class="inv-filter-tab active" data-filter="all">All</button>
                <button class="inv-filter-tab"        data-filter="short">Short-term</button>
                <button class="inv-filter-tab"        data-filter="medium">Medium-term</button>
                <button class="inv-filter-tab"        data-filter="long">Long-term</button>
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
                    @foreach($products as $p)
                    @php $hasExpiry = $p['expiry'] || count($p['batches']) > 0; @endphp

                    {{-- Product Row --}}
                    {{--
                        data-id, data-filter, data-batches, data-expiry, data-expiry-type
                        are all read by inventory-products.js — no PHP logic bleeds into JS
                    --}}
                    <tr data-id="{{ $p['id'] }}"
                        data-filter="{{ $p['filter'] }}"
                        data-batches="{{ json_encode($p['batches']) }}"
                        data-expiry="{{ $p['expiry'] ?? '' }}"
                        data-expiry-type="{{ count($p['batches']) > 0 ? 'batch' : ($p['expiry'] ? 'single' : '') }}">

                        <td>
                            <div class="prod-cell">
                                <div class="prod-img-placeholder" title="Product image">
                                    <i class="bi bi-image"></i>
                                </div>
                                <div>
                                    <div class="prod-name">{{ $p['name'] }}</div>
                                    <div class="prod-id">#{{ $p['id'] }}</div>
                                    @if($p['discount'])
                                        <div class="disc-pill">
                                            <i class="bi bi-tag-fill"></i>
                                            {{ $p['discount'] }}% &bull; Active
                                        </div>
                                    @endif
                                </div>
                            </div>
                        </td>

                        <td><span class="b-cat">{{ $p['category'] }}</span></td>

                        <td class="td-status">
                            @if($p['status'] === 'green')
                                <span class="badge b-green">Safe</span>
                            @elseif($p['status'] === 'yellow')
                                <span class="badge b-yellow">Approaching</span>
                            @elseif($p['status'] === 'red')
                                <span class="badge b-red">Expired</span>
                            @else
                                <span class="badge b-none">No expiry set</span>
                            @endif
                        </td>

                        <td id="expiry-cell-{{ $p['id'] }}">
                            @if(count($p['batches']) > 0)
                                <div class="exp-cell">
                                    {{-- data-product-id read by JS to call toggleBatch --}}
                                    <button class="btn-eye" data-product-id="{{ $p['id'] }}">
                                        <i class="bi bi-eye" id="eye-{{ $p['id'] }}"></i>
                                    </button>
                                    <span>{{ count($p['batches']) }} batch{{ count($p['batches']) > 1 ? 'es' : '' }}</span>
                                </div>
                            @elseif($p['expiry'])
                                <div class="exp-cell">
                                    <i class="bi bi-calendar3" style="font-size:0.78rem;"></i>
                                    <span>{{ $p['expiry'] }}</span>
                                </div>
                            @else
                                <span style="color:var(--muted);">—</span>
                            @endif
                        </td>

                        <td>
                            {{-- data-product-id + data-product-name read by JS to open ExpiryForm --}}
                            <button class="btn-expiry {{ $hasExpiry ? 'is-edit' : '' }}"
                                    id="btn-expiry-{{ $p['id'] }}"
                                    data-product-id="{{ $p['id'] }}"
                                    data-product-name="{{ $p['name'] }}">
                                @if($hasExpiry)
                                    <i class="bi bi-pencil-square"></i> Edit Expiry Date
                                @else
                                    <i class="bi bi-calendar-plus"></i> Add Expiry Date
                                @endif
                            </button>
                        </td>
                    </tr>

                    {{-- Batch Rows --}}
                    @foreach($p['batches'] as $batch)
                        <tr class="batch-row" data-parent="{{ $p['id'] }}" data-filter="{{ $p['filter'] }}">
                            <td>
                                <div class="batch-indent">
                                    <span class="batch-label-field">
                                        <i class="bi bi-layers"></i>
                                        {{ $batch['label'] }}
                                    </span>
                                </div>
                            </td>
                            <td style="color:var(--muted);">{{ $batch['qty'] }} units</td>
                            <td>
                                @if($batch['status'] === 'green')
                                    <span class="badge b-green">Safe</span>
                                @elseif($batch['status'] === 'yellow')
                                    <span class="badge b-yellow">Approaching</span>
                                @elseif($batch['status'] === 'red')
                                    <span class="badge b-red">Expired</span>
                                @endif
                            </td>
                            <td>
                                <div class="exp-cell">
                                    <i class="bi bi-calendar3" style="font-size:0.78rem;"></i>
                                    <span style="color:var(--muted);">{{ $batch['expiry'] }}</span>
                                </div>
                            </td>
                            <td>
                                <button class="btn-edit-batch"
                                        data-product-id="{{ $p['id'] }}"
                                        data-product-name="{{ $p['name'] }}">
                                    <i class="bi bi-pencil-square"></i> Edit Expiry Date
                                </button>
                            </td>
                        </tr>
                    @endforeach

                    @endforeach
                </tbody>
            </table>

            <div class="inv-empty" id="invEmpty">
                <i class="bi bi-funnel"></i>
                <p>No products match this filter.</p>
            </div>
        </div>
    </div>

    <p class="inv-footer" id="invFooter">
        <i class="bi bi-box-seam"></i>
        Showing {{ count($products) }} products from your Salla store
    </p>

</main>

{{-- Toast --}}
<div class="inv-toast" id="invToast">
    <i id="invToastIcon"></i>
    <span id="invToastMsg"></span>
</div>

{{-- Modals (rendered in DOM before JS runs) --}}
@include('inventory.dateform')

@push('scripts')
<script src="{{ mix('js/inventory-products.js') }}"></script>
    <script src="{{ mix('js/inventory-dateform.js') }}"></script>
    
@endpush

@endsection