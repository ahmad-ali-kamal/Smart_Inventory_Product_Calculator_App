{{-- تأكد أن هذا الملف موجود في layouts/expiryapp.blade.php أو غيره إلى calcapp إذا كنت تستخدم واحداً فقط --}}
@include('layouts._header', [
    'headerNav' => [
        ['url' => route('welcome'),            'icon' => 'bi-house',          'label' => 'Home',          'route_match' => 'welcome'],
        ['url' => route('inventory.dashboard'), 'icon' => 'bi-speedometer2',   'label' => 'Dashboard',     'route_match' => 'inventory.dashboard'],
        ['url' => route('inventory.products.index'), 'icon' => 'bi-box-seam-fill', 'label' => 'Products', 'route_match' => 'inventory.products.index'],
        ['url' => route('inventory.settings'),  'icon' => 'bi-gear-fill',      'label' => 'Settings',      'route_match' => 'inventory.settings'],
    ],
])
<main class="max-w-7xl mx-auto px-6 py-8">

    {{-- Status Overview --}}
    <div class="mb-8">
        <h2 class="section-heading" style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1.5rem; color: var(--fg);">Status Overview</h2>
        <div class="grid md:grid-cols-3 gap-4" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">

            {{-- Green Status --}}
            <div class="stat-card green" style="background: #f0fdf4; border: 1px solid #bcf0da; padding: 1.5rem; border-radius: 12px;">
                <div class="flex items-center gap-3 mb-4" style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                    <div class="icon-box green" style="color: #16a34a; font-size: 1.5rem;"><i class="bi bi-check-circle-fill"></i></div>
                    <div>
                        <p class="text-sm font-bold stat-label-green" style="color: #16a34a; font-size: 0.875rem;">Green Status</p>
                        <p class="text-xs text-muted" style="color: #6b7280; font-size: 0.75rem;">Safe batches</p>
                    </div>
                </div>
                <p class="font-bold" style="font-size:2rem; line-height:1; color: #111827;">{{ $stats['green_batches'] ?? 0 }}</p>
                <p class="text-xs text-muted mt-1" style="color: #6b7280; margin-top: 0.25rem;">Batches in safe state</p>
            </div>

            {{-- Yellow Status --}}
            <div class="stat-card yellow" style="background: #fffbeb; border: 1px solid #fde68a; padding: 1.5rem; border-radius: 12px;">
                <div class="flex items-center gap-3 mb-4" style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                    <div class="icon-box yellow" style="color: #d97706; font-size: 1.5rem;"><i class="bi bi-exclamation-triangle-fill"></i></div>
                    <div>
                        <p class="text-sm font-bold stat-label-yellow" style="color: #d97706; font-size: 0.875rem;">Yellow Status</p>
                        <p class="text-xs text-muted" style="color: #6b7280; font-size: 0.75rem;">Approaching expiry</p>
                    </div>
                </div>
                <p class="font-bold" style="font-size:2rem; line-height:1; color: #111827;">{{ $stats['yellow_batches'] ?? 0 }}</p>
                <p class="text-xs text-muted mt-1" style="color: #6b7280; margin-top: 0.25rem;">Needs attention soon</p>
            </div>

            {{-- Red Status --}}
            <div class="stat-card red" style="background: #fef2f2; border: 1px solid #fecaca; padding: 1.5rem; border-radius: 12px;">
                <div class="flex items-center gap-3 mb-4" style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                    <div class="icon-box red" style="color: #dc2626; font-size: 1.5rem;"><i class="bi bi-x-circle-fill"></i></div>
                    <div>
                        <p class="text-sm font-bold stat-label-red" style="color: #dc2626; font-size: 0.875rem;">Red Status</p>
                        <p class="text-xs text-muted" style="color: #6b7280; font-size: 0.75rem;">Expired</p>
                    </div>
                </div>
                <p class="font-bold" style="font-size:2rem; line-height:1; color: #111827;">{{ $stats['red_batches'] ?? 0 }}</p>
                <p class="text-xs text-muted mt-1" style="color: #6b7280; margin-top: 0.25rem;">Expired batches</p>
            </div>

        </div>
    </div>

    {{-- Products Table --}}
    <div class="table-wrapper" style="background: #fff; border: 1px solid hsla(0,0%,0%,0.05); border-radius: 12px; overflow: hidden;">

        <div class="p-6" style="padding: 1.5rem; border-bottom:1px solid hsla(0,0%,0%,0.05)">
            <div class="flex justify-between items-center" style="display: flex; justify-content: space-between; align-items: center;">
                <h2 class="section-heading" style="font-size: 1.1rem; font-weight: 700;">Inventory Products</h2>
                <div class="filter-tabs" style="display: flex; gap: 0.5rem;">
                    <button class="filter-tab active" data-filter="all" style="padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.8rem; border: 1px solid #ddd;">All</button>
                    <button class="filter-tab" data-filter="green" style="padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.8rem; border: 1px solid #bcf0da; color: #16a34a;">Safe</button>
                    <button class="filter-tab" data-filter="yellow" style="padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.8rem; border: 1px solid #fde68a; color: #d97706;">Warning</button>
                    <button class="filter-tab" data-filter="red" style="padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.8rem; border: 1px solid #fecaca; color: #dc2626;">Expired</button>
                </div>
            </div>
        </div>

        @if(isset($products) && count($products) > 0)
        <div class="overflow-x-auto">
            <table class="w-full" style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr class="table-header-row" style="background: #f9fafb; border-bottom: 1px solid #eee;">
                        <th style="text-align:left; padding:1rem 1.5rem; font-size: 0.85rem; color: #6b7280;">Product</th>
                        <th style="text-align:center; padding:1rem 1rem; font-size: 0.85rem; color: #6b7280;">Expiry / Batches</th>
                        <th style="text-align:center; padding:1rem 1rem; font-size: 0.85rem; color: #6b7280;">Status</th>
                        <th style="text-align:center; padding:1rem 1.5rem; font-size: 0.85rem; color: #6b7280;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($products as $product)
                    <tr class="table-row" data-status="{{ $product->status }}" style="border-bottom: 1px solid #f3f4f6;">

                        <td style="padding:1rem 1.5rem;">
                            <div class="flex items-center gap-3" style="display: flex; align-items: center; gap: 0.75rem;">
                                <div class="product-icon" style="background: #f3f4f6; padding: 0.5rem; border-radius: 8px;"><i class="bi bi-box"></i></div>
                                <span class="font-semibold" style="font-size: 0.875rem;">{{ $product->name }}</span>
                            </div>
                        </td>

                        <td class="text-sm text-muted" style="text-align:center; padding:1rem 1rem; font-size: 0.875rem;">
                            @if(isset($product->batches) && count($product->batches) > 0)
                                <span class="badge" style="background: #eef2ff; color: #4f46e5; padding: 0.2rem 0.6rem; border-radius: 12px;">{{ count($product->batches) }} batches</span>
                            @else
                                {{ $product->expiry_date ?? 'No date' }}
                            @endif
                        </td>

                        <td style="text-align:center; padding:1rem 1rem;">
                            @php
                                $statusClass = [
                                    'green' => 'background: #dcfce7; color: #166534;',
                                    'yellow' => 'background: #fef3c7; color: #92400e;',
                                    'red' => 'background: #fee2e2; color: #991b1b;'
                                ][$product->status] ?? 'background: #f3f4f6; color: #374151;';
                            @endphp
                            <span style="padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; {{ $statusClass }}">
                                {{ ucfirst($product->status === 'green' ? 'Safe' : ($product->status === 'yellow' ? 'Warning' : 'Expired')) }}
                            </span>
                        </td>

                        <td style="text-align:center; padding:1rem 1.5rem;">
                            <div class="flex justify-center gap-2" style="display: flex; justify-content: center; gap: 0.5rem;">
                                @if($product->status === 'yellow')
                                    <button class="action-btn btn-discount" 
                                            onclick="openDiscountModal({{ $product->id }}, '{{ $product->name }}')"
                                            style="background: #4f46e5; color: #fff; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.75rem; cursor: pointer;">
                                        <i class="bi bi-percent"></i> Discount
                                    </button>
                                @endif
                                
                                <button class="action-btn" style="background: #f3f4f6; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.75rem; cursor: pointer;">
                                    <i class="bi bi-pencil"></i> Edit
                                </button>
                            </div>
                        </td>

                    </tr>
                    @endforeach
                </tbody>
            </table>

            <div id="filterEmpty" style="display:none;" class="p-12 text-center">
                <p class="text-sm text-muted">No products match this filter</p>
            </div>
        </div>
        @else
        <div class="p-16 text-center" style="padding: 4rem; text-align: center;">
            <div class="empty-icon" style="font-size: 3rem; color: #d1d5db; margin-bottom: 1rem;"><i class="bi bi-box-seam"></i></div>
            <p class="text-sm text-muted mb-5" style="color: #6b7280;">No products with expiry dates yet</p>
            <a href="{{ route('inventory.products.index') }}" class="btn-primary" style="background: #4f46e5; color: #fff; padding: 0.6rem 1.2rem; border-radius: 8px; text-decoration: none; font-size: 0.875rem;">
                <i class="bi bi-plus-circle"></i> View All Products
            </a>
        </div>
        @endif

    </div>

</main>

{{-- تضمين نماذج الفورم --}}
@include('inventory.discountform')

@push('scripts')
    {{-- تأكد من وجود هذه الملفات في مجلد الـ JS الخاص بك --}}
    <script src="{{ asset('js/inventory-dashboard.js') }}"></script>
    <script>
        function openDiscountModal(id, name) {
            // كود لفتح المودال الخاص بالخصم (تأكد أن discountform.blade.php يحتوي على المعرف الصحيح)
            console.log("Opening discount for: " + name);
            // إذا كنت تستخدم Bootstrap modal:
            // $('#discountModal').modal('show'); 
        }
    </script>
@endpush

@endsection