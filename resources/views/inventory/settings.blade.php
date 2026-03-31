@extends('layouts.expiryapp') 

@section('content')
@include('layouts._header', [
    'headerNav' => [
        ['url' => route('welcome'),             'icon' => 'bi-house',           'label' => 'Home',           'route_match' => 'welcome'],
        ['url' => route('inventory.dashboard'), 'icon' => 'bi-grid-fill',      'label' => 'Dashboard',     'route_match' => 'inventory.dashboard'],
        ['url' => route('inventory.products.index'), 'icon' => 'bi-box-seam-fill', 'label' => 'Products', 'route_match' => 'inventory.products.index'],
        ['url' => route('inventory.settings'),  'icon' => 'bi-gear-fill',      'label' => 'Settings',      'route_match' => 'inventory.settings'],
        ['icon' => 'bi-bell-fill',                             'label' => 'Notifications'],
    ],
])

<main class="settings-main">

    <form action="{{ route('inventory.settings.batch.store') }}" method="POST" id="settingsForm">
        @csrf
        @method('PUT')

        <div class="settings-stack">

            {{-- ── 1. Alert Thresholds ── --}}
            <div class="s-card">
                <div class="s-section-title">
                    <div class="s-section-icon"><i class="bi bi-calendar3"></i></div>
                    <h2>Alert Thresholds</h2>
                </div>
                <p class="s-section-sub">Set how many days before expiry each product tier should trigger a warning.</p>

                <div class="threshold-grid">
                    @foreach([
                        ['short_term_days',  'Short-term',  'Dairy, Fresh produce'],
                        ['medium_term_days', 'Medium-term', 'Frozen foods, Beverages'],
                        ['long_term_days',   'Long-term',   'Canned goods, Dry goods'],
                    ] as [$name, $label, $hint])
                    <div class="threshold-card">
                        <p class="threshold-label">{{ $label }}</p>
                        <div class="threshold-input-row">
                            <input class="threshold-input"
                                   type="number"
                                   name="{{ $name }}"
                                   value="{{ old($name, $settings->$name ?? '') }}" />
                            <span class="threshold-unit">days</span>
                        </div>
                        <p class="threshold-hint">{{ $hint }}</p>
                    </div>
                    @endforeach
                </div>
            </div>

            {{-- ── 2. Unmapped Categories (القسم الجديد المضاف) ── --}}
            <div class="s-card">
                <div class="s-section-title">
                    <div class="s-section-icon"><i class="bi bi-tags-fill"></i></div>
                    <h2>New Categories Found</h2>
                </div>
                <p class="s-section-sub">التصنيفات التالية تم سحبها من متجرك ولم يتم توزيعها بعد. اسحبها إلى المربعات أدناه لتفعيل التنبيهات لها.</p>

                <div id="list-unmapped" class="bucket-list unmapped-list drop-zone" data-bucket="unmapped" style="min-height: 80px; border: 2px dashed var(--border); border-radius: 12px; padding: 15px; display: flex; flex-wrap: wrap; gap: 10px; background: var(--bg-soft);">
                    @forelse($unmappedCategories as $catName)
                        <div class="category-pill" draggable="true" data-category="{{ $catName }}" data-source="unmapped">
                            <i class="bi bi-grip-vertical"></i>{{ $catName }}
                        </div>
                    @empty
                        <div class="empty-state-msg" style="color: var(--muted); font-size: 0.9rem; width: 100%; text-align: center;">
                             🎉 كل التصنيفات الحالية تم توزيعها بنجاح.
                        </div>
                    @endforelse
                </div>
            </div>

            {{-- ── 3. Category Mapping ── --}}
            <div class="s-card">
                <div class="s-section-title">
                    <div class="s-section-icon"><i class="bi bi-collection-fill"></i></div>
                    <h2>Category Mapping</h2>
                </div>

                <div class="mapping-tip">
                    <i class="bi bi-lightbulb"></i>
                    <strong> Tip:</strong> Drag a category card from one bucket to another to change which alert threshold applies to it.
                </div>

                @php
                    $buckets = ['short', 'medium', 'long'];
                @endphp

                <div id="hiddenInputsContainer">
                    @foreach($buckets as $bucket)
                        @if(isset($mappings) && isset($mappings[$bucket]))
                            @foreach($mappings[$bucket] as $catName)
                                <input type="hidden" name="category_mapping[{{ $bucket }}][]" value="{{ $catName }}" class="hid-{{ $bucket }}">
                            @endforeach
                        @endif
                    @endforeach
                </div>

                <div class="mapping-grid">
                    @foreach([
                        ['short',  'Short-term',  'short_term_days',  7],
                        ['medium', 'Medium-term', 'medium_term_days', 14],
                        ['long',   'Long-term',   'long_term_days',   30],
                    ] as [$bucket, $label, $daysKey, $defaultDays])
                    
                    <div class="drop-zone" id="zone-{{ $bucket }}" data-bucket="{{ $bucket }}">
                        <div class="drop-zone-header">
                            <span class="drop-zone-dot"></span>
                            <span class="drop-zone-title">{{ $label }}</span>
                            <span class="drop-zone-badge" id="badge-{{ $bucket }}">
                                {{ $settings->$daysKey ?? $defaultDays }}d
                            </span>
                        </div>
                        <div id="list-{{ $bucket }}" class="bucket-list">
                            @if(isset($mappings) && isset($mappings[$bucket]))
                                @foreach($mappings[$bucket] as $catName)
                                <div class="category-pill" draggable="true"
                                     data-category="{{ $catName }}"
                                     data-source="{{ $bucket }}">
                                    <i class="bi bi-grip-vertical"></i>{{ $catName }}
                                </div>
                                @endforeach
                            @endif
                        </div>
                    </div>
                    @endforeach
                </div>
            </div>

            {{-- ── 4. Automation ── --}}
            <div class="s-card">
                <div class="s-section-title">
                    <div class="s-section-icon"><i class="bi bi-lightning-charge-fill"></i></div>
                    <h2>Automation</h2>
                </div>

                <input type="hidden" name="auto_hide_expired"    id="val-autohide"      value="{{ old('auto_hide_expired', $settings->auto_hide_expired ?? 0) }}" />
                <input type="hidden" name="enable_notifications" id="val-notifications" value="{{ old('enable_notifications', $settings->enable_notifications ?? 0) }}" />
                <input type="hidden" name="auto_discounts"       id="val-autodiscounts" value="{{ old('auto_discounts', $settings->auto_discounts ?? 0) }}" />

                <div class="toggle-list">

                    {{-- Auto-Hide --}}
                    <div class="toggle-row">
                        <div class="toggle-row-left">
                            <div class="toggle-icon"><i class="bi bi-eye-slash-fill"></i></div>
                            <div>
                                <p class="toggle-title">Auto-Hide Expired Products</p>
                                <p class="toggle-desc">Automatically hide products from your store when they reach expired status.</p>
                            </div>
                        </div>
                        <button class="toggle-switch {{ ($settings->auto_hide_expired ?? false) ? 'on' : '' }}"
                                id="toggle-autohide" data-toggle-id="autohide" type="button"></button>
                    </div>

                    {{-- Auto Discounts --}}
                    <div class="toggle-row">
                        <div class="toggle-row-left">
                            <div class="toggle-icon"><i class="bi bi-tag-fill"></i></div>
                            <div>
                                <p class="toggle-title">Auto Discounts</p>
                                <p class="toggle-desc">Auto-apply a set discount to all Yellow-status products the moment they hit the threshold.</p>

                                <div class="discount-panel" id="discount-input-wrap"
                                     style="{{ ($settings->auto_discounts ?? false) ? 'display:block' : 'display:none' }}">
                                    <p class="discount-panel-label">
                                        <i class="bi bi-tag"></i>&nbsp; Global Discount Rate &nbsp;·&nbsp; Duration
                                    </p>
                                    <div class="discount-panel-row">
                                        <div class="discount-input-wrap">
                                            <input class="discount-input" type="number"
                                                   name="auto_discount_percent"
                                                   value="{{ old('auto_discount_percent', $settings->auto_discount_percent ?? 20) }}" />
                                            <span class="discount-input-suffix">%</span>
                                        </div>
                                        <div class="discount-panel-divider"></div>
                                        <input class="discount-input-plain" type="number"
                                               name="auto_discount_duration_days"
                                               value="{{ old('auto_discount_duration_days', $settings->auto_discount_duration_days ?? 7) }}" />
                                        <span class="threshold-unit">days</span>
                                        <p class="discount-panel-hint">Applied instantly to every product that reaches Yellow status</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button class="toggle-switch {{ ($settings->auto_discounts ?? false) ? 'on' : '' }}"
                                id="toggle-autodiscounts" data-toggle-id="autodiscounts" type="button"></button>
                    </div>

                    {{-- Notifications --}}
                    <div class="toggle-row">
                        <div class="toggle-row-left">
                            <div class="toggle-icon"><i class="bi bi-bell-fill"></i></div>
                            <div>
                                <p class="toggle-title">Enable Notifications</p>
                                <p class="toggle-desc">Receive alerts when products enter the Warning (Yellow) or Expired (Red) state.</p>
                            </div>
                        </div>
                        <button class="toggle-switch {{ ($settings->enable_notifications ?? false) ? 'on' : '' }}"
                                id="toggle-notifications" data-toggle-id="notifications" type="button"></button>
                    </div>

                </div>
            </div>

            {{-- ── Footer ── --}}
            <div class="settings-footer">
                <a href="{{ route('inventory.dashboard') }}" class="btn-cancel">Cancel</a>
                <button class="btn-save" type="submit">
                    <i class="bi bi-check2"></i> Save Settings
                </button>
            </div>

        </div>
    </form>

</main>

@push('scripts')
<script src="{{ asset('js/inventory-settings.js') }}" defer></script>
@endpush

@endsection