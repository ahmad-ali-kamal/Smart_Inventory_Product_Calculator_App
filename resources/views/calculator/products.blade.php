@extends('layouts.calcapp')

@push('styles')
<style>
    /* ── Guide box ── */
    .guide-box {
        background: hsla(0,0%,100%,0.5);
        backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
        border: 1px solid hsla(0,0%,100%,0.65);
        border-radius: 1.5rem;
        padding: 1.5rem;
        box-shadow: 0 8px 32px hsla(282,45%,45%,0.07);
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        opacity: 0; animation: fade-up 0.5s ease-out 0.4s forwards;
    }

    .guide-icon {
        width: 2.75rem; height: 2.75rem;
        background: var(--mauve-soft);
        border: 1px solid var(--mauve-border);
        border-radius: 0.875rem;
        display: flex; align-items: center; justify-content: center;
        color: var(--mauve); font-size: 1.1rem;
        flex-shrink: 0;
    }

    /* ── Search input ── */
    .search-wrap {
        position: relative;
        width: 100%;
        max-width: 280px;
    }
    .search-wrap i {
        position: absolute; left: 1rem;
        top: 50%; transform: translateY(-50%);
        color: var(--muted); font-size: 0.875rem;
        pointer-events: none;
    }
    .search-input {
        width: 100%;
        padding: 0.75rem 1rem 0.75rem 2.75rem;
        background: hsla(0,0%,100%,0.6);
        border: 1.5px solid hsla(0,0%,100%,0.7);
        border-radius: 1rem;
        font-family: 'DM Sans', sans-serif;
        font-size: 0.82rem;
        color: var(--fg);
        outline: none;
        transition: all 0.2s;
    }
    .search-input::placeholder { color: var(--muted); }
    .search-input:focus {
        background: hsla(0,0%,100%,0.9);
        border-color: var(--mauve);
        box-shadow: 0 0 0 4px hsla(282,45%,55%,0.1);
    }

    /* ── Table card ── */
    .table-card {
        background: hsla(0,0%,100%,0.5);
        backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
        border: 1px solid hsla(0,0%,100%,0.65);
        border-radius: 1.5rem;
        overflow: hidden;
        box-shadow: 0 8px 32px hsla(282,45%,45%,0.07);
        opacity: 0; animation: fade-up 0.5s ease-out 0.55s forwards;
    }

    /* ── Table head ── */
    .table-head {
        background: var(--mauve-soft);
        border-bottom: 1px solid var(--mauve-border);
    }
    .th-cell {
        padding: 1rem 1.75rem;
        font-size: 0.68rem; font-weight: 700;
        color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase;
    }

    /* ── Table rows ── */
    .table-row {
        border-bottom: 1px solid hsla(282,30%,70%,0.1);
        transition: background 0.2s, opacity 0.3s;
    }
    .table-row:last-child { border-bottom: none; }
    .table-row:hover { background: hsla(282,45%,55%,0.04); }
    .table-row.hidden-row { display: none; }

    .td-cell {
        padding: 0 1.75rem;
        height: 72px;
        vertical-align: middle;
    }

    /* ── Product icon ── */
    .product-icon {
        width: 2.5rem; height: 2.5rem;
        border-radius: 0.75rem;
        display: flex; align-items: center; justify-content: center;
        font-size: 1rem; flex-shrink: 0;
        transition: all 0.3s;
    }
    .product-icon.active {
        background: var(--mauve-soft);
        border: 1px solid var(--mauve-border);
        color: var(--mauve);
    }
    .product-icon.inactive {
        background: hsla(0,0%,0%,0.04);
        border: 1px solid hsla(0,0%,0%,0.07);
        color: var(--muted);
    }

    /* ── Category badge ── */
    .cat-badge {
        display: inline-block;
        padding: 0.2rem 0.65rem;
        background: var(--mauve-soft);
        border: 1px solid var(--mauve-border);
        border-radius: 0.5rem;
        font-size: 0.7rem; font-weight: 700;
        color: var(--mauve-deep); letter-spacing: 0.03em;
    }
    .cat-badge.inactive {
        background: hsla(0,0%,0%,0.04);
        border-color: hsla(0,0%,0%,0.08);
        color: var(--muted);
    }

    /* ── Status badges ── */
    .status-active {
        display: inline-flex; align-items: center; gap: 0.35rem;
        padding: 0.25rem 0.75rem;
        background: hsla(150,60%,45%,0.1);
        border: 1px solid hsla(150,60%,45%,0.25);
        border-radius: 2rem;
        font-size: 0.68rem; font-weight: 700;
        color: hsl(150,50%,28%); letter-spacing: 0.05em; text-transform: uppercase;
        transition: all 0.3s;
    }
    .status-dot {
        width: 6px; height: 6px; border-radius: 50%;
        background: hsl(150,55%,42%);
        animation: pulse-dot 2s infinite;
    }
    @keyframes pulse-dot {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
    }
    .status-inactive {
        font-size: 0.68rem; font-weight: 600;
        color: var(--muted); letter-spacing: 0.05em; text-transform: uppercase;
        transition: all 0.3s;
    }

    /* ── Toggle switch ── */
    .switch { position: relative; display: inline-block; width: 40px; height: 22px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider {
        position: absolute; cursor: pointer;
        top: 0; left: 0; right: 0; bottom: 0;
        background: hsla(0,0%,0%,0.12);
        border-radius: 22px;
        transition: 0.3s;
    }
    .slider::before {
        position: absolute; content: '';
        height: 16px; width: 16px;
        left: 3px; bottom: 3px;
        background: white;
        border-radius: 50%;
        transition: 0.3s;
        box-shadow: 0 1px 4px rgba(0,0,0,0.15);
    }
    input:checked + .slider { background: var(--mauve); }
    input:checked + .slider::before { transform: translateX(18px); }

    /* ── Toggle loading state ── */
    .switch.loading .slider { opacity: 0.5; pointer-events: none; }

    /* ── Empty state ── */
    .empty-state {
        padding: 3rem;
        text-align: center;
        color: var(--muted);
        font-size: 0.875rem;
        display: none;
    }
    .empty-state i { font-size: 2rem; margin-bottom: 0.75rem; display: block; opacity: 0.4; }

    /* ── Toast notification ── */
    .toast-wrap {
        position: fixed;
        bottom: 2rem; right: 2rem;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    .toast {
        padding: 0.75rem 1.25rem;
        border-radius: 0.875rem;
        font-size: 0.8rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        transform: translateY(10px);
        opacity: 0;
        transition: all 0.3s ease;
        pointer-events: none;
    }
    .toast.show { transform: translateY(0); opacity: 1; }
    .toast.success {
        background: hsla(150,60%,45%,0.1);
        border: 1px solid hsla(150,60%,45%,0.25);
        color: hsl(150,50%,28%);
    }
    .toast.error {
        background: hsla(0,80%,55%,0.1);
        border: 1px solid hsla(0,80%,55%,0.25);
        color: hsl(0,60%,35%);
    }

    /* ── Footer button ── */
    .table-footer {
        padding: 1.5rem;
        border-top: 1px solid hsla(282,30%,70%,0.12);
        display: flex; justify-content: center;
        background: hsla(282,45%,55%,0.03);
    }

    /* ── Loading skeleton ── */
    @keyframes shimmer {
        0% { background-position: -1000px 0; }
        100% { background-position: 1000px 0; }
    }
    .skeleton {
        background: linear-gradient(90deg, hsla(0,0%,0%,0.06) 25%, hsla(0,0%,0%,0.1) 50%, hsla(0,0%,0%,0.06) 75%);
        background-size: 1000px 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 0.5rem;
    }
</style>
@endpush

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
            'url'         => route('calculator.dashboard'),
            'icon'        => 'bi-speedometer2',
            'label'       => 'Dashboard',
            'route_match' => 'calculator.dashboard',
        ],
        [
            'url'         => route('calculator.settings'),
            'icon'        => 'bi-gear',
            'label'       => 'Settings',
            'route_match' => 'calculator.settings',
        ],
    ],
])

{{-- Toast container --}}
<div class="toast-wrap" id="toastContainer"></div>

<div class="max-w-5xl mx-auto px-6 py-10" style="position: relative; z-index: 10;">

    {{-- Guide box --}}
    <div class="guide-box mb-6">
        <div style="display:flex; align-items:center; gap:1rem;">
            <div class="guide-icon">
                <i class="bi bi-info-circle-fill"></i>
            </div>
            <div>
                <h3 style="font-size:0.875rem; font-weight:700; color:var(--fg); margin-bottom:0.15rem;">
                    Activation Guide
                </h3>
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
                    @php
                        $isEnabled = $product->calculator?->is_enabled ?? false;
                    @endphp
                    <tr class="table-row" data-product-name="{{ strtolower($product->name) }}">
                        {{-- Product name + icon --}}
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
                                    <span class="status-dot"></span>
                                    Active
                                </span>
                            @else
                                <span class="status-inactive">Inactive</span>
                            @endif
                        </td>

                        {{-- Toggle --}}
                        <td class="td-cell" style="text-align:center;">
                            <label class="switch">
                                <input
                                    type="checkbox"
                                    class="product-toggle"
                                    data-product-id="{{ $product->id }}"
                                    data-toggle-url="{{ route('calculator.products.toggle', $product->id) }}"
                                    {{ $isEnabled ? 'checked' : '' }}
                                >
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

        {{-- Empty search state (hidden by default) --}}
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
<script>
(function () {
    // ── CSRF Token ──
    const CSRF = document.querySelector('meta[name="csrf-token"]')?.content ?? '';

    // ── Toast helper ──
    function showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        const icon  = type === 'success' ? 'bi-check-circle-fill' : 'bi-x-circle-fill';
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="bi ${icon}"></i> ${message}`;
        container.appendChild(toast);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => toast.classList.add('show'));
        });
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ── Update row UI ──
    function updateRow(row, isEnabled) {
        const icon       = row.querySelector('.product-icon');
        const nameSpan   = row.querySelector('td:first-child span');
        const catBadge   = row.querySelector('.cat-badge');
        const statusCell = row.querySelector('td:nth-child(3)');

        // Icon
        icon.classList.toggle('active',   isEnabled);
        icon.classList.toggle('inactive', !isEnabled);

        // Name color
        nameSpan.style.color = isEnabled ? 'var(--fg)' : 'var(--muted)';

        // Category badge
        catBadge.classList.toggle('inactive', !isEnabled);

        // Status badge
        if (isEnabled) {
            statusCell.innerHTML = `
                <span class="status-active">
                    <span class="status-dot"></span>
                    Active
                </span>`;
        } else {
            statusCell.innerHTML = `<span class="status-inactive">Inactive</span>`;
        }
    }

    // ── Toggle handler ──
    document.querySelectorAll('.product-toggle').forEach(function (checkbox) {
        checkbox.addEventListener('change', async function () {
            const switchLabel = this.closest('.switch');
            const url         = this.dataset.toggleUrl;
            const row         = this.closest('.table-row');

            // Optimistic UI update
            const optimisticEnabled = this.checked;
            updateRow(row, optimisticEnabled);
            switchLabel.classList.add('loading');

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': CSRF,
                        'Accept':       'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (!response.ok) throw new Error('Server error');

                const data = await response.json();

                if (data.success) {
                    // Sync with real server value
                    this.checked = data.is_enabled;
                    updateRow(row, data.is_enabled);
                    showToast(data.message ?? (data.is_enabled ? 'Product activated' : 'Product deactivated'));
                } else {
                    throw new Error(data.message ?? 'Failed');
                }

            } catch (err) {
                // Revert on failure
                this.checked = !optimisticEnabled;
                updateRow(row, !optimisticEnabled);
                showToast('Something went wrong. Please try again.', 'error');
            } finally {
                switchLabel.classList.remove('loading');
            }
        });
    });

    // ── Search ──
    const searchInput    = document.getElementById('searchInput');
    const emptyState     = document.getElementById('emptySearchState');
    const rows           = document.querySelectorAll('.table-row[data-product-name]');

    searchInput.addEventListener('input', function () {
        const query   = this.value.toLowerCase().trim();
        let visible   = 0;

        rows.forEach(function (row) {
            const name = row.dataset.productName ?? '';
            const match = name.includes(query);
            row.classList.toggle('hidden-row', !match);
            if (match) visible++;
        });

        emptyState.style.display = visible === 0 ? 'block' : 'none';
    });

})();
</script>
@endpush