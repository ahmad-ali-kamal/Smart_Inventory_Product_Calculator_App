@extends('layouts.calcapp')

@section('content')
@include('layouts._header', [
    'headerNav' => [
        ['url' => route('welcome'),                   'icon' => 'bi-house-door-fill',    'label' => 'Home',     'route_match' => 'welcome'],
        ['url' => route('calculator.dashboard'), 'icon' => 'bi-grid-fill', 'label' => 'Dashboard', 'route_match' => 'calculator.dashboard'],
        ['url' => route('calculator.products.index'), 'icon' => 'bi-box-seam-fill', 'label' => 'Products', 'route_match' => 'calculator.products.*'],
        ['url' => route('calculator.settings'),       'icon' => 'bi-gear-fill',     'label' => 'Settings', 'route_match' => 'calculator.settings'],
        ['url' => route('calculator.instructions'), 'icon' => 'bi-exclamation-circle-fill', 'label' => '', 'route_match' => 'calculator.instructions'],
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
                    <tr class="table-row" id="row-{{ $product->id }}" data-product-name="{{ strtolower($product->name) }}">

                        {{-- Product name --}}
                        <td class="td-cell">
                            <div style="display:flex; align-items:center; gap:0.875rem;">
                               <div id="icon-{{ $product->id }}" class="product-icon {{ $isEnabled ? 'active' : 'inactive' }}">
    <img src="{{ $product->image_url }}" 
         alt="{{ $product->name }}" 
         style="width:100%; height:100%; object-fit:cover; border-radius:6px;">
</div>
                                <span id="name-{{ $product->id }}" style="font-size:0.875rem; font-weight:600; color:{{ $isEnabled ? 'var(--fg)' : 'var(--muted)' }};">
                                    {{ $product->name }}
                                </span>
                            </div>
                        </td>

                        {{-- Category --}}
                        <td class="td-cell">
                            <span id="cat-{{ $product->id }}" class="cat-badge {{ $isEnabled ? '' : 'inactive' }}">
                                {{ $product->category ?? 'General' }}
                            </span>
                        </td>

                        {{-- Status --}}
                        <td class="td-cell" id="status-cell-{{ $product->id }}" style="text-align:center;">
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
<script>
document.addEventListener('DOMContentLoaded', function() {
    // التعامل مع عملية الـ Toggle
    const toggles = document.querySelectorAll('.product-toggle');
    
    toggles.forEach(toggle => {
        toggle.addEventListener('change', function() {
            const productId = this.dataset.productId;
            const url = this.dataset.toggleUrl;
            const isChecked = this.checked;

            // إرسال طلب AJAX للكنترولر
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': '{{ csrf_token() }}',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    is_enabled: isChecked
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // تحديث الواجهة فوراً بناءً على الحالة الجديدة
                    updateProductUI(productId, data.is_enabled);
                    showToast(data.message, 'success');
                } else {
                    // في حال الفشل، أعد الزر لحالته السابقة
                    this.checked = !isChecked;
                    showToast('Error updating status', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                this.checked = !isChecked;
                showToast('Connection error', 'error');
            });
        });
    });

    // دالة لتحديث عناصر الواجهة
    function updateProductUI(id, isEnabled) {
        const icon = document.getElementById(`icon-${id}`);
        const name = document.getElementById(`name-${id}`);
        const cat = document.getElementById(`cat-${id}`);
        const statusCell = document.getElementById(`status-cell-${id}`);

        if (isEnabled) {
            icon.classList.remove('inactive');
            icon.classList.add('active');
            name.style.color = 'var(--fg)';
            cat.classList.remove('inactive');
            statusCell.innerHTML = '<span class="status-active"><span class="status-dot"></span> Active</span>';
        } else {
            icon.classList.remove('active');
            icon.classList.add('inactive');
            name.style.color = 'var(--muted)';
            cat.classList.add('inactive');
            statusCell.innerHTML = '<span class="status-inactive">Inactive</span>';
        }
    }

    // دالة بسيطة لإظهار التنبيهات
    function showToast(message, type) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast-item ${type}`;
        toast.innerHTML = `<i class="bi ${type === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'}"></i> ${message}`;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    // البحث السريع
    const searchInput = document.getElementById('searchInput');
    const tableRows = document.querySelectorAll('.table-row');
    const emptyState = document.getElementById('emptySearchState');

    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        let hasResults = false;

        tableRows.forEach(row => {
            const name = row.dataset.productName;
            if (name.includes(query)) {
                row.style.display = 'table-row';
                hasResults = true;
            } else {
                row.style.display = 'none';
            }
        });

        emptyState.style.display = hasResults || query === '' ? 'none' : 'flex';
    });
});
</script>
@endpush