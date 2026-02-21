@extends('layouts.expiryApp')

@section('content')
@include('layouts._header', [
    'headerNav' => [
     [
            'url'         => route('welcome'),
            'icon'        => 'bi-house',
            'label'       => 'Home',
            'route_match' => 'welcome',
        ],
        [
            'icon'  => 'bi-gear-fill',
            'label' => 'Settings',
        ],
        [
            'icon'  => 'bi-box-seam-fill',
            'label' => 'products',
        ],
        [
            'icon'  => 'bi-bell-fill',
            'label' => 'Notifications',
        ],
    ],
])

<style>
    /* ─── Body ─── */
    body {
        background: linear-gradient(135deg,
            hsl(35, 90%, 96%) 0%,
            hsl(30, 80%, 94%) 30%,
            hsl(40, 75%, 95%) 60%,
            hsl(28, 70%, 96%) 100%
        );
        background-attachment: fixed;
    }

    /* ─── Stat Cards ─── */
    .stat-card {
        background: hsla(0,0%,100%,0.6);
        backdrop-filter: blur(20px);
        border: 1px solid hsla(0,0%,100%,0.75);
        border-radius: 1.25rem;
        padding: 1.5rem;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .stat-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 32px hsla(28,40%,50%,0.1);
    }
    .stat-card.green  { border-bottom: 3px solid #6EE7B7; }
    .stat-card.yellow { border-bottom: 3px solid #FCD34D; }
    .stat-card.red    { border-bottom: 3px solid #FCA5A5; }

    /* ─── Icon Box ─── */
    .icon-box {
        width: 2.5rem; height: 2.5rem;
        border-radius: 0.75rem;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.95rem;
        flex-shrink: 0;
    }
    .icon-box.green  { background: hsla(152,45%,60%,0.15); color: hsl(152,42%,42%); }
    .icon-box.yellow { background: hsla(42,60%,60%,0.15);  color: hsl(42,50%,42%); }
    .icon-box.red    { background: hsla(8,55%,65%,0.15);   color: hsl(8,48%,48%); }

    .stat-label-green  { color: hsl(152,38%,42%); }
    .stat-label-yellow { color: hsl(42,48%,40%); }
    .stat-label-red    { color: hsl(8,44%,48%); }

    /* ─── Table Wrapper ─── */
    .table-wrapper {
        background: hsla(0,0%,100%,0.55);
        backdrop-filter: blur(24px);
        border: 1px solid hsla(0,0%,100%,0.7);
        border-radius: 1.25rem;
        overflow: hidden;
    }
    .table-header-row {
        background: hsla(28,60%,92%,0.35);
        border-bottom: 1px solid hsla(0,0%,0%,0.06);
    }
    .table-header-row th {
        padding: 0.875rem 1.5rem;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        color: var(--muted);
        text-align: left;
    }
    .table-header-row th:last-child { text-align: right; }

    .table-row {
        border-bottom: 1px solid hsla(0,0%,0%,0.04);
        transition: background 0.15s ease;
    }
    .table-row:last-child { border-bottom: none; }
    .table-row:hover { background: hsla(28,70%,90%,0.15); }

    /* ─── Expand Button ─── */
    .expand-btn {
        width: 1.75rem; height: 1.75rem;
        display: flex; align-items: center; justify-content: center;
        background: hsla(28,60%,88%,0.4);
        border: 1px solid hsla(28,55%,75%,0.3);
        border-radius: 0.5rem;
        cursor: pointer;
        transition: background 0.15s ease, transform 0.2s ease;
        color: hsl(28,55%,52%);
        font-size: 0.7rem;
    }
    .expand-btn:hover { background: hsla(28,60%,85%,0.6); transform: scale(1.05); }
    .expand-btn.expanded { transform: rotate(90deg); }

    /* ─── Product Icon ─── */
    .product-icon {
        width: 2.25rem; height: 2.25rem;
        background: hsla(28,70%,88%,0.45);
        border: 1px solid hsla(28,65%,74%,0.3);
        border-radius: 0.625rem;
        display: flex; align-items: center; justify-content: center;
        color: hsl(28,65%,50%);
        font-size: 0.85rem;
        flex-shrink: 0;
    }

    /* ─── Badges ─── */
    .badge {
        padding: 0.28rem 0.75rem;
        border-radius: 2rem;
        font-size: 0.72rem;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        letter-spacing: 0.01em;
    }
    .badge .dot {
        width: 5px; height: 5px;
        border-radius: 50%;
        flex-shrink: 0;
    }
    .badge.green  { background: hsla(152,45%,55%,0.1); color: hsl(152,40%,38%); border: 1px solid hsla(152,45%,55%,0.18); }
    .badge.yellow { background: hsla(42,58%,55%,0.12); color: hsl(42,45%,38%);  border: 1px solid hsla(42,55%,55%,0.2); }
    .badge.red    { background: hsla(8,52%,60%,0.1);   color: hsl(8,44%,42%);   border: 1px solid hsla(8,52%,60%,0.18); }
    .badge.green  .dot { background: hsl(152,48%,50%); }
    .badge.yellow .dot { background: hsl(42,58%,52%); }
    .badge.red    .dot { background: hsl(8,52%,58%); }

    /* ─── Action Buttons ─── */
    .action-btn {
        padding: 0.4rem 0.9rem;
        border-radius: 0.6rem;
        font-size: 0.78rem;
        font-weight: 600;
        border: none;
        cursor: pointer;
        transition: all 0.15s ease;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
    }
    .action-btn:active { transform: scale(0.96); }

    .btn-discount {
        background: hsla(42,65%,62%,0.18);
        color: hsl(42,50%,38%);
        border: 1px solid hsla(42,60%,62%,0.28);
    }
    .btn-discount:hover { background: hsla(42,65%,62%,0.3); }

    .btn-hide {
        background: hsla(8,52%,62%,0.15);
        color: hsl(8,44%,42%);
        border: 1px solid hsla(8,52%,62%,0.25);
    }
    .btn-hide:hover { background: hsla(8,52%,62%,0.28); }

    .btn-restock {
        background: hsla(152,45%,58%,0.15);
        color: hsl(152,40%,36%);
        border: 1px solid hsla(152,45%,58%,0.25);
    }
    .btn-restock:hover { background: hsla(152,45%,58%,0.28); }

    /* ─── Filter Pills ─── */
    .filter-tabs {
        display: flex;
        gap: 0.4rem;
        align-items: center;
        background: hsla(0,0%,0%,0.04);
        padding: 0.3rem;
        border-radius: 999px;
        border: 1px solid hsla(0,0%,0%,0.07);
    }
    .filter-tab {
        padding: 0.35rem 1rem;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.18s ease;
        border: 1.5px solid transparent;
        background: transparent;
        color: var(--muted);
        white-space: nowrap;
    }
    .filter-tab:active { transform: scale(0.95); }

    /* All */
    .filter-tab.tab-all:hover:not(.active) { background: hsla(0,0%,0%,0.06); color: var(--fg); }
    .filter-tab.tab-all.active {
        background: hsla(0,0%,100%,0.85);
        color: var(--fg);
        border-color: hsla(0,0%,0%,0.1);
        box-shadow: 0 1px 6px hsla(0,0%,0%,0.08);
    }

    /* Green */
    .filter-tab.tab-green:hover:not(.active) { background: rgba(167,243,208,0.2); color: #065F46; }
    .filter-tab.tab-green.active {
        background: rgba(167,243,208,0.35);
        color: #065F46;
        border-color: #A7F3D0;
        box-shadow: 0 1px 8px rgba(110,231,183,0.3);
    }

    /* Yellow */
    .filter-tab.tab-yellow:hover:not(.active) { background: rgba(253,230,138,0.25); color: #92400E; }
    .filter-tab.tab-yellow.active {
        background: rgba(253,230,138,0.38);
        color: #92400E;
        border-color: #FDE68A;
        box-shadow: 0 1px 8px rgba(252,211,77,0.3);
    }

    /* Red */
    .filter-tab.tab-red:hover:not(.active) { background: rgba(254,202,202,0.25); color: #7F1D1D; }
    .filter-tab.tab-red.active {
        background: rgba(254,202,202,0.38);
        color: #7F1D1D;
        border-color: #FECACA;
        box-shadow: 0 1px 8px rgba(252,165,165,0.3);
    }

    /* ─── Empty State ─── */
    .empty-icon {
        width: 4rem; height: 4rem;
        background: hsla(28,70%,88%,0.4);
        border: 1px solid hsla(28,65%,74%,0.3);
        border-radius: 1.1rem;
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 1.25rem;
        color: hsl(28,65%,52%);
        font-size: 1.4rem;
    }
    .btn-primary {
        padding: 0.55rem 1.2rem;
        background: hsl(28,75%,58%);
        color: white;
        border: none;
        border-radius: 0.7rem;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        transition: all 0.15s ease;
        box-shadow: 0 4px 12px hsla(28,65%,50%,0.22);
    }
    .btn-primary:hover {
        background: hsl(28,78%,54%);
        transform: translateY(-1px);
        box-shadow: 0 6px 16px hsla(28,65%,50%,0.3);
    }
    .btn-primary:active { transform: scale(0.97); }

    /* ─── Section Heading ─── */
    .section-heading {
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--fg);
        margin: 0 0 1rem;
    }

    /* ─── Muted Text ─── */
    .text-muted { color: var(--muted); }
    .text-xs    { font-size: 0.75rem; }
    .text-sm    { font-size: 0.82rem; }
</style>

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

                {{-- Filter Pills --}}
                <div class="filter-tabs">
                    <button class="filter-tab tab-all active" onclick="setFilter(this,'all')">All</button>
                    <button class="filter-tab tab-green" onclick="setFilter(this,'green')">Green</button>
                    <button class="filter-tab tab-yellow" onclick="setFilter(this,'yellow')">Yellow</button>
                    <button class="filter-tab tab-red" onclick="setFilter(this,'red')">Red</button>
                </div>
            </div>
        </div>

        {{-- Table Content --}}
        @if(isset($products) && count($products) > 0)
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead>
                    <tr class="table-header-row">
                        <th>Product</th>
                        <th>Expiry / Batches</th>
                        <th>Status</th>
                        <th style="text-align:right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($products as $product)
                    <tr class="table-row" data-status="{{ $product->status }}">
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-3">
                                @if($product->batches && count($product->batches) > 0)
                                <button class="expand-btn">
                                    <i class="bi bi-chevron-right"></i>
                                </button>
                                @endif
                                <div class="product-icon">
                                    <i class="bi bi-box"></i>
                                </div>
                                <span class="font-semibold text-sm">{{ $product->name }}</span>
                            </div>
                        </td>
                        <td class="px-6 py-4 text-sm text-muted">
                            @if($product->batches && count($product->batches) > 0)
                                {{ count($product->batches) }} batches
                            @else
                                {{ $product->expiry_date ?? '—' }}
                            @endif
                        </td>
                        <td class="px-6 py-4">
                            @if($product->status === 'green')
                            <span class="badge green">
                                <span class="dot"></span> Safe
                            </span>
                            @elseif($product->status === 'yellow')
                            <span class="badge yellow">
                                <span class="dot"></span> Approaching
                            </span>
                            @elseif($product->status === 'red')
                            <span class="badge red">
                                <span class="dot"></span> Expired
                            </span>
                            @endif
                        </td>
                        <td class="px-6 py-4" style="text-align:right">
                            <div class="flex justify-end gap-2">
                                @if($product->status === 'yellow')
                                <button class="action-btn btn-discount">
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
        </div>
        @else
        <div class="p-16 text-center">
            <div class="empty-icon">
                <i class="bi bi-box-seam"></i>
            </div>
            <p class="text-sm text-muted mb-5">No products with expiry dates yet</p>
            <button class="btn-primary">
                <i class="bi bi-plus-circle"></i> Show Products
            </button>
        </div>
        @endif
    </div>

</main>

@push('scripts')
<script>
    // Filter tabs
    function setFilter(el, status) {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
        document.querySelectorAll('.table-row[data-status]').forEach(row => {
            row.style.display = (status === 'all' || row.dataset.status === status) ? '' : 'none';
        });
    }

    // Expand button rotation
    document.querySelectorAll('.expand-btn').forEach(btn => {
        btn.addEventListener('click', () => btn.classList.toggle('expanded'));
    });
</script>
@endpush

@endsection