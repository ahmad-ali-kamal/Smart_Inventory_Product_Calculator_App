@extends('layouts.expiryapp')

@php
$products = [
    ['id'=>'1',  'name'=>'Organic Fresh Milk',   'category'=>'Dairy',     'filter'=>'short',  'status'=>'green',  'discount'=>null, 'expiry'=>'2025-03-15', 'batches'=>[]],
    ['id'=>'2',  'name'=>'Whole Wheat Bread',    'category'=>'Bakery',    'filter'=>'short',  'status'=>'yellow', 'discount'=>20,   'expiry'=>'2025-02-10', 'batches'=>[]],
    ['id'=>'3',  'name'=>'Greek Yogurt 500g',    'category'=>'Dairy',     'filter'=>'short',  'status'=>'red',    'discount'=>null, 'expiry'=>null,         'batches'=>[]],
    ['id'=>'4',  'name'=>'Fresh Orange Juice',   'category'=>'Beverages', 'filter'=>'medium', 'status'=>null,     'discount'=>null, 'expiry'=>null,         'batches'=>[]],
    ['id'=>'5',  'name'=>'Cheddar Cheese Block', 'category'=>'Dairy',     'filter'=>'short',  'status'=>'green',  'discount'=>null, 'expiry'=>null,
        'batches'=>[
            ['label'=>'Batch 1', 'qty'=>50, 'status'=>'green',  'expiry'=>'2025-06-01'],
            ['label'=>'Batch 2', 'qty'=>30, 'status'=>'yellow', 'expiry'=>'2025-02-28'],
        ]
    ],
    ['id'=>'6',  'name'=>'Sourdough Bread',      'category'=>'Bakery',    'filter'=>'short',  'status'=>null,     'discount'=>null, 'expiry'=>null,         'batches'=>[]],
    ['id'=>'7',  'name'=>'Strawberry Yogurt',    'category'=>'Dairy',     'filter'=>'short',  'status'=>'yellow', 'discount'=>15,   'expiry'=>'2025-02-14', 'batches'=>[]],
    ['id'=>'8',  'name'=>'Apple Juice 1L',       'category'=>'Beverages', 'filter'=>'medium', 'status'=>'green',  'discount'=>null, 'expiry'=>'2025-08-20', 'batches'=>[]],
    ['id'=>'9',  'name'=>'Mozzarella Cheese',    'category'=>'Dairy',     'filter'=>'short',  'status'=>null,     'discount'=>null, 'expiry'=>null,         'batches'=>[]],
    ['id'=>'10', 'name'=>'Croissants Pack of 6', 'category'=>'Bakery',    'filter'=>'short',  'status'=>'red',    'discount'=>null, 'expiry'=>'2025-01-30', 'batches'=>[]],
];

@endphp
@push('styles')
<style>
    /* ── Header ── */
    .app-header {
        position: sticky; top: 0; z-index: 100; overflow: visible;
        padding: 0.75rem 1.75rem;
        background: hsla(0,0%,100%,0.55);
        backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
        border-bottom: 1px solid var(--mauve-border);
        box-shadow: 0 1px 0 hsla(0,0%,100%,0.7) inset, 0 4px 24px hsla(0,0%,0%,0.04);
        animation: header-slide-in 0.5s cubic-bezier(0.4,0,0.2,1) forwards;
    }
    @keyframes header-slide-in {
        from { opacity:0; transform:translateY(-8px); }
        to   { opacity:1; transform:translateY(0); }
    }
    .app-header-inner { max-width:1200px; margin:0 auto; display:flex; align-items:center; gap:1rem; }

    .app-logo { display:flex; align-items:center; gap:0.7rem; text-decoration:none; flex-shrink:0; }
    .app-logo-icon {
        width:2.2rem; height:2.2rem; position:relative; flex-shrink:0;
        background: linear-gradient(135deg, var(--mauve), var(--mauve-deep));
        border-radius:0.7rem; display:flex; align-items:center; justify-content:center;
        color:white; font-size:0.9rem; box-shadow:0 4px 12px hsla(0,0%,0%,0.15);
    }
    .app-logo-icon::after {
        content:''; position:absolute; inset:0; border-radius:inherit;
        background: linear-gradient(135deg, hsla(0,0%,100%,0.25), transparent);
    }
    .app-logo-name { font-family:'DM Serif Display',serif; font-size:1.05rem; color:var(--fg); line-height:1; }
    .app-logo-name span { color:var(--mauve); }

    .app-spacer { flex:1; }

    .app-nav { display:flex; align-items:center; gap:0.15rem; }
    .app-nav-link {
        display:inline-flex; align-items:center; gap:0.4rem;
        padding:0.5rem 0.9rem; border-radius:0.75rem;
        font-size:0.82rem; font-weight:600; color:var(--muted);
        text-decoration:none; transition:background 0.2s, color 0.2s; white-space:nowrap;
    }
    .app-nav-link i { font-size:0.85rem; transition:transform 0.2s; }
    .app-nav-link:hover { background:var(--mauve-soft); color:var(--mauve-deep); }
    .app-nav-link:hover i { transform:scale(1.15); }
    .app-nav-link.active { background:var(--mauve-soft); color:var(--mauve-deep); position:relative; }
    .app-nav-link.active::after {
        content:''; position:absolute; bottom:5px; left:50%; transform:translateX(-50%);
        width:18px; height:2px; background:var(--mauve); border-radius:2px;
    }

    .app-actions { display:flex; align-items:center; gap:0.6rem; flex-shrink:0; }
    .app-avatar {
        background:var(--mauve-soft); border:1.5px solid var(--mauve-border);
        border-radius:0.65rem; display:flex; align-items:center; justify-content:center;
        color:var(--mauve-deep); font-size:0.75rem; font-weight:700; cursor:pointer;
        transition:all 0.2s; padding:0 0.75rem; height:2rem; gap:0.35rem; white-space:nowrap;
    }
    .app-avatar:hover { background:var(--mauve); color:white; border-color:var(--mauve); transform:scale(1.03); }
    .app-avatar i { font-size:0.85rem; }

    .app-header-divider { height:1px; background:linear-gradient(90deg, transparent, var(--mauve-border), transparent); }

    .app-menu-btn {
        display:none; background:var(--mauve-soft); border:1px solid var(--mauve-border);
        border-radius:0.65rem; padding:0.45rem 0.6rem; cursor:pointer; color:var(--mauve-deep); font-size:1.05rem;
    }

    /* ── Page ── */
    .inv-page { position:relative; z-index:1; max-width:1180px; margin:0 auto; padding:2rem 1.5rem 3rem; }

    /* ── Info Banner ── */
    .inv-banner {
        display:flex; align-items:center; gap:0.65rem;
        background:hsla(30,100%,55%,0.10); border:1px solid hsla(30,100%,55%,0.30);
        border-radius:1rem; padding:0.9rem 1.2rem;
        margin-bottom:1.25rem; font-size:0.82rem; color:hsl(25,80%,30%);
        opacity:0; animation:fade-up 0.5s ease-out 0.4s forwards;
    }
    .inv-banner i { font-size:1rem; flex-shrink:0; }

    /* ── Card ── */
    .inv-card {
        background:hsla(0,0%,100%,0.55);
        backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);
        border:1px solid hsla(0,0%,100%,0.72);
        border-radius:1.5rem; overflow:hidden;
        box-shadow:0 8px 32px hsla(0,0%,0%,0.07);
        opacity:0; animation:fade-up 0.5s ease-out 0.55s forwards;
    }
    .inv-card-head {
        padding:1.4rem 1.5rem 0;
        display:flex; align-items:flex-start; justify-content:space-between;
        gap:1rem; flex-wrap:wrap;
    }
    .inv-card-title { font-size:1rem; font-weight:700; color:var(--fg); margin:0 0 1rem; display:flex; align-items:center; gap:0.5rem; }
    .inv-card-title i { color:var(--mauve); }

    /* ── Filter Tabs ── */
    .inv-filter-tabs {
        display:flex; gap:0.4rem; align-items:center;
        background:hsla(0,0%,0%,0.04); padding:0.3rem; border-radius:999px;
        border:1px solid hsla(0,0%,0%,0.07); margin-bottom:1rem;
    }
    .inv-filter-tab {
        padding:0.35rem 1rem; border-radius:999px;
        font-size:0.78rem; font-weight:600; cursor:pointer;
        border:1.5px solid transparent; background:transparent; color:var(--muted);
        white-space:nowrap; font-family:'DM Sans',sans-serif;
        transition:all 0.18s ease;
    }
    .inv-filter-tab:active { transform:scale(0.95); }
    .inv-filter-tab:hover:not(.active) { background:hsla(0,0%,0%,0.07); color:var(--fg); }
    .inv-filter-tab.active {
        background:hsla(0,0%,100%,0.85); color:var(--fg);
        border-color:hsla(0,0%,0%,0.1); box-shadow:0 1px 6px hsla(0,0%,0%,0.08);
    }

    /* ── Table ── */
    .inv-table-wrap { overflow-x:auto; }
    .inv-table { width:100%; border-collapse:collapse; }
    .inv-table thead { background:hsla(0,0%,0%,0.025); border-bottom:1px solid hsla(0,0%,0%,0.07); }
    .inv-table th {
        padding:1rem 1.5rem; text-align:center;
        font-size:0.71rem; font-weight:700; color:var(--muted);
        text-transform:uppercase; letter-spacing:0.06em; white-space:nowrap;
    }
    .inv-table th:first-child { text-align:left; }
    .inv-table tbody tr { border-bottom:1px solid hsla(0,0%,0%,0.05); transition:background 0.15s; }
    .inv-table tbody tr:hover { background:hsla(0,0%,100%,0.6); }
    .inv-table tbody tr:last-child { border-bottom:none; }
    .inv-table td { padding:1.1rem 1.5rem; font-size:0.84rem; color:var(--fg); vertical-align:middle; text-align:center; }
    .inv-table td:first-child { text-align:left; }

    /* ── Product Cell ── */
    .prod-cell { display:flex; align-items:center; gap:0.75rem; }
    .prod-img-placeholder {
        width:2.4rem; height:2.4rem; flex-shrink:0;
        background:hsla(0,0%,0%,0.04); border:1.5px dashed hsla(0,0%,0%,0.15);
        border-radius:0.6rem; display:flex; align-items:center; justify-content:center;
        color:hsla(0,0%,0%,0.22); font-size:0.9rem;
    }
    .prod-name { font-weight:600; }
    .prod-id   { font-size:0.69rem; color:var(--muted); margin-top:0.05rem; }

    /* ── Badges ── */
    .badge { display:inline-flex; align-items:center; justify-content:center; padding:0.28rem 0.8rem; border-radius:2rem; font-size:0.74rem; font-weight:600; white-space:nowrap; min-width:7rem; }
    .b-cat    { background:transparent; color:var(--muted); font-weight:500; padding:0; border-radius:0; min-width:0; }
    .b-green  { background:hsla(140,60%,45%,0.13); color:hsl(140,55%,22%); }
    .b-yellow { background:hsla(38,90%,50%,0.13);  color:hsl(38,72%,24%); }
    .b-red    { background:hsla(0,70%,50%,0.13);   color:hsl(0,60%,28%); }
    .b-none   { background:hsla(0,0%,0%,0.05);     color:var(--muted); }

    /* ── Discount Pill ── */
    .disc-pill {
        display:inline-flex; align-items:center; gap:0.3rem;
        font-size:0.71rem; font-weight:700; color:hsl(28,80%,32%);
        background:linear-gradient(135deg, hsla(38,100%,58%,0.18), hsla(28,90%,55%,0.12));
        border:1px solid hsla(38,90%,55%,0.35); border-radius:0.5rem;
        padding:0.15rem 0.55rem; margin-top:0.28rem;
        box-shadow:0 1px 4px hsla(38,80%,50%,0.12);
    }
    .disc-pill i { font-size:0.62rem; color:hsl(38,80%,42%); }

    /* ── Expiry Cell ── */
    .exp-cell { display:flex; align-items:center; justify-content:center; gap:0.4rem; color:var(--muted); }
    .btn-eye {
        background:none; border:none; padding:0.22rem 0.42rem;
        border-radius:0.4rem; cursor:pointer; color:var(--muted);
        line-height:1; transition:background 0.15s, color 0.15s;
    }
    .btn-eye:hover { background:var(--mauve-soft); color:var(--mauve-deep); }

    /* ── Toast ── */
    .inv-toast {
        position:fixed; bottom:2rem; left:50%; transform:translateX(-50%) translateY(6px);
        z-index:9999; display:flex; align-items:center; gap:0.65rem;
        padding:0.75rem 1.25rem; border-radius:1rem;
        font-size:0.83rem; font-weight:600; white-space:nowrap;
        box-shadow:0 8px 32px hsla(0,0%,0%,0.18);
        opacity:0; pointer-events:none;
        transition:opacity 0.25s ease, transform 0.25s ease;
    }
    .inv-toast.show { opacity:1; transform:translateX(-50%) translateY(0); pointer-events:auto; }
    .inv-toast.toast-add  { background:hsl(140,50%,20%); color:hsl(140,60%,88%); }
    .inv-toast.toast-edit { background:hsl(28,70%,22%);  color:hsl(38,90%,88%); }
    .inv-toast i { font-size:1rem; }

    /* ── Batch Rows ── */
    .batch-row { display:none; }
    .batch-row.open { display:table-row; }
    .batch-row td {
        padding:0.5rem 1.5rem;
        background:hsla(28,80%,55%,0.045);
        border-bottom:1px solid hsla(28,80%,55%,0.12) !important;
        font-size:0.79rem; color:var(--fg);
    }
    .batch-row:last-of-type td { border-bottom:none !important; }
    .batch-indent { display:flex; align-items:center; gap:0.5rem; padding-left:3.1rem; }
    .batch-label-field {
        display:inline-flex; align-items:center; gap:0.38rem;
        padding:0.32rem 0.75rem;
        background:hsla(28,85%,55%,0.09); border:1.5px solid var(--mauve-border);
        border-radius:0.7rem; font-size:0.77rem; font-weight:700; color:var(--mauve-deep);
    }
    .batch-label-field i { font-size:0.72rem; }

    /* ── Action Buttons ── */
    .btn-expiry {
        display:inline-flex; align-items:center; justify-content:center; gap:0.38rem;
        padding:0.42rem 0.9rem; min-width:9rem;
        background:linear-gradient(135deg, var(--mauve), var(--mauve-deep));
        color:white; border-radius:0.65rem; font-size:0.74rem; font-weight:700;
        border:none; cursor:pointer; white-space:nowrap;
        box-shadow:0 4px 12px hsla(0,0%,0%,0.12);
        transition:transform 0.18s, box-shadow 0.18s;
        font-family:'DM Sans',sans-serif;
    }
    .btn-expiry:hover  { transform:translateY(-1px); box-shadow:0 6px 18px hsla(0,0%,0%,0.18); color:white; }
    .btn-expiry:active { transform:scale(0.97); }
    .btn-expiry.is-edit {
        background:hsla(28,85%,55%,0.1); color:var(--mauve-deep);
        border:1.5px solid var(--mauve-border); box-shadow:none;
    }
    .btn-expiry.is-edit:hover { background:hsla(28,85%,55%,0.18); border-color:var(--mauve); color:var(--mauve-deep); }

    .btn-edit-batch {
        display:inline-flex; align-items:center; justify-content:center; gap:0.35rem;
        padding:0.42rem 0.9rem; min-width:9rem;
        background:hsla(28,85%,55%,0.08); color:var(--mauve-deep);
        border:1.5px solid var(--mauve-border); border-radius:0.65rem;
        font-size:0.74rem; font-weight:700; cursor:pointer; white-space:nowrap;
        transition:background 0.15s, border-color 0.15s, transform 0.15s;
        font-family:'DM Sans',sans-serif;
    }
    .btn-edit-batch:hover  { background:hsla(28,85%,55%,0.16); border-color:var(--mauve); transform:translateY(-1px); }
    .btn-edit-batch:active { transform:scale(0.97); }

    /* ── Empty State ── */
    .inv-empty { padding:3rem 1.5rem; text-align:center; color:var(--muted); display:none; }
    .inv-empty i { font-size:2.5rem; margin-bottom:0.75rem; display:block; opacity:0.35; }
    .inv-empty p { font-size:0.85rem; margin:0; }

    /* ── Footer ── */
    .inv-footer {
        text-align:center; margin-top:1.25rem;
        font-size:0.77rem; color:var(--muted);
        display:flex; align-items:center; justify-content:center; gap:0.4rem;
        opacity:0; animation:fade-up 0.5s ease-out 0.9s forwards;
    }

    /* ── Responsive ── */
    @media (max-width: 768px) {
        .app-nav { display:none; }
        .app-nav.mobile-open {
            display:flex; flex-direction:column;
            position:absolute; top:100%; left:0; right:0;
            background:hsla(0,0%,100%,0.97);
            backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);
            border-bottom:1px solid var(--mauve-border);
            padding:0.5rem 1rem 0.75rem;
            box-shadow:0 8px 24px hsla(0,0%,0%,0.08); z-index:99;
        }
        .app-menu-btn { display:flex; align-items:center; }
        .inv-page { padding:1rem 0.75rem 2rem; }
        .inv-table th, .inv-table td { padding:0.7rem 0.75rem; }
        .inv-filter-tab { font-size:0.72rem; padding:0.3rem 0.7rem; }
        .inv-card-head { flex-direction:column; }
        .th-status, .td-status { display:none; }
    }
</style>
@endpush
@include('layouts._header', [
    'headerNav' => [
     [
            'url'         => route('welcome'),
            'icon'        => 'bi-house',
            'label'       => 'Home',
            'route_match' => 'welcome',
        ],
        ['icon' => 'bi-grid-fill',    'label' => 'Dashboard'],

        [
           
            'icon'        => 'bi-gear',
            'label'       => 'Settings',
        ],
        ['icon' => 'bi-bell-fill',    'label' => 'Notifications'],
    ],
])
@section('content')

{{-- Header --}}


{{-- Page --}}
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
            <div class="inv-filter-tabs">
                <button class="inv-filter-tab active" data-filter="all"    onclick="Inventory.filter(this)">All</button>
                <button class="inv-filter-tab"        data-filter="short"  onclick="Inventory.filter(this)">Short-term</button>
                <button class="inv-filter-tab"        data-filter="medium" onclick="Inventory.filter(this)">Medium-term</button>
                <button class="inv-filter-tab"        data-filter="long"   onclick="Inventory.filter(this)">Long-term</button>
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
                                    <button class="btn-eye" onclick="Inventory.toggleBatch('{{ $p['id'] }}')">
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
                            <button class="btn-expiry {{ $hasExpiry ? 'is-edit' : '' }}"
                                id="btn-expiry-{{ $p['id'] }}"
                                onclick="Inventory.openForm('{{ $p['id'] }}', '{{ addslashes($p['name']) }}')">
                                @if($hasExpiry)
                                    <i class="bi bi-pencil-square"></i> Edit Expiry Date
                                @else
                                    <i class="bi bi-calendar-plus"></i> Add Expiry Date
                                @endif
                            </button>
                        </td>
                    </tr>

                    {{-- Batch Rows --}}
                    @foreach($p['batches'] as $bi => $batch)
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
                                    onclick="Inventory.openForm('{{ $p['id'] }}', '{{ addslashes($p['name']) }}')">
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

{{-- Expiry Form Partial --}}
@include('inventory.discountform')

@endsection

@push('scripts')
<script>
const Inventory = (() => {
    /* ── State ── */
    let currentFilter = 'all';

    /* ── Toast ── */
    let _toastTimer = null;
    function showToast(msg, type = 'add') {
        const toast = document.getElementById('invToast');
        const icon  = document.getElementById('invToastIcon');
        const msgEl = document.getElementById('invToastMsg');
        toast.className   = `inv-toast toast-${type}`;
        icon.className    = type === 'add' ? 'bi bi-check-circle-fill' : 'bi bi-pencil-square';
        msgEl.textContent = msg;
        toast.classList.add('show');
        clearTimeout(_toastTimer);
        _toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
    }

    /* ── Toggle batch rows ── */
    function toggleBatch(productId) {
        const rows   = document.querySelectorAll(`.batch-row[data-parent="${productId}"]`);
        const eye    = document.getElementById(`eye-${productId}`);
        const isOpen = rows.length && rows[0].classList.contains('open');
        rows.forEach(r => r.classList.toggle('open', !isOpen));
        if (eye) eye.className = isOpen ? 'bi bi-eye' : 'bi bi-eye-slash';
    }

    /* ── Open form (add or edit) ── */
    function openForm(productId, productName) {
        const row = document.querySelector(`#invBody tr[data-id="${productId}"]`);
        if (!row) return;

        let batches = [];
        try { batches = JSON.parse(row.dataset.batches || '[]'); } catch(e) {}

        if (row.dataset.expiryType === 'single' || (batches.length === 0 && row.dataset.expiry)) {
            ExpiryForm.openSingle(productId, productName, row.dataset.expiry);
        } else {
            ExpiryForm.openBatch(productId, productName, batches);
        }
    }

    /* ── Update row after API success (called by ExpiryForm) ── */
    function onSaveSuccess(productId, payload, wasEdit) {
        const row        = document.querySelector(`#invBody tr[data-id="${productId}"]`);
        const expiryCell = document.getElementById(`expiry-cell-${productId}`);
        const actionBtn  = document.getElementById(`btn-expiry-${productId}`);
        if (!row) return;

        if (payload.type === 'single') {
            row.dataset.expiry     = payload.expiry_date;
            row.dataset.expiryType = 'single';
            row.dataset.batches    = '[]';
            expiryCell.innerHTML   = `
                <div class="exp-cell">
                    <i class="bi bi-calendar3" style="font-size:0.78rem;"></i>
                    <span style="color:var(--muted);">${payload.expiry_date}</span>
                </div>`;

        } else if (payload.type === 'batch' && payload.batches?.length) {
            const normalized = payload.batches.map(b => ({
                label: b.label, qty: b.qty, status: b.status, expiry: b.expiry_date ?? b.expiry
            }));
            row.dataset.batches    = JSON.stringify(normalized);
            row.dataset.expiryType = 'batch';
            row.dataset.expiry     = '';
            const count            = payload.batches.length;
            expiryCell.innerHTML   = `
                <div class="exp-cell">
                    <button class="btn-eye" onclick="Inventory.toggleBatch('${productId}')">
                        <i class="bi bi-eye" id="eye-${productId}"></i>
                    </button>
                    <span>${count} batch${count > 1 ? 'es' : ''}</span>
                </div>`;
        }

        if (actionBtn) {
            actionBtn.className = 'btn-expiry is-edit';
            actionBtn.innerHTML = '<i class="bi bi-pencil-square"></i> Edit Expiry Date';
            actionBtn.onclick   = () => openForm(productId, row.querySelector('.prod-name')?.textContent?.trim() ?? '');
        }

        showToast(
            wasEdit ? 'Expiry date updated successfully' : 'Expiry date added successfully',
            wasEdit ? 'edit' : 'add'
        );
    }

    /* ── Filter tabs ── */
    function filter(btn) {
        currentFilter = btn.dataset.filter;
        document.querySelectorAll('.inv-filter-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        _applyFilter();
    }

    function _applyFilter() {
        let count = 0;
        document.querySelectorAll('#invBody tr[data-filter]:not(.batch-row)').forEach(row => {
            const visible = currentFilter === 'all' || row.dataset.filter === currentFilter;
            row.style.display = visible ? '' : 'none';
            if (visible) count++;

            const eyeEl = row.querySelector('[id^="eye-"]');
            if (eyeEl) {
                const pid = eyeEl.id.replace('eye-', '');
                document.querySelectorAll(`.batch-row[data-parent="${pid}"]`).forEach(r => {
                    if (!visible) { r.classList.remove('open'); r.style.display = 'none'; }
                    else          { r.style.display = r.classList.contains('open') ? '' : 'none'; }
                });
            }
        });

        const footer = document.getElementById('invFooter');
        const empty  = document.getElementById('invEmpty');
        if (footer) footer.innerHTML = `<i class="bi bi-box-seam"></i> Showing ${count} products from your Salla store`;
        if (empty)  empty.style.display = count === 0 ? 'block' : 'none';
    }

    return { toggleBatch, openForm, onSaveSuccess, filter };
})();
</script>
@endpush