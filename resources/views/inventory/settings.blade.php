@extends('layouts.expiryApp')

@section('content')
@include('layouts._header', [
    'headerNav' => [
        ['url' => route('welcome'), 'icon' => 'bi-house',         'label' => 'Home',          'route_match' => 'welcome'],
        ['icon' => 'bi-grid-fill',                                 'label' => 'Dashboard'],
        ['icon' => 'bi-box-seam-fill',                             'label' => 'Products'],
        ['icon' => 'bi-bell-fill',                                 'label' => 'Notifications'],
    ],
])

<main class="settings-main">

    <form method="POST" id="settingsForm">
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
                        ['short_term_days',  'Short-term',  7,  30, 'Dairy, Fresh produce'],
                        ['medium_term_days', 'Medium-term', 1,  60, 'Frozen foods, Beverages'],
                        ['long_term_days',   'Long-term',   1,  90, 'Canned goods, Dry goods'],
                    ] as [$name, $label, $min, $max, $hint])
                    <div class="threshold-card">
                        <p class="threshold-label">{{ $label }}</p>
                        <div class="threshold-input-row">
                            <input class="threshold-input"
                                   type="number" min="{{ $min }}" max="{{ $max }}"
                                   name="{{ $name }}"
                                   value="{{ old($name, $settings->$name ?? ($min === 7 ? 7 : ($max === 60 ? 14 : 30))) }}" />
                            <span class="threshold-unit">days</span>
                        </div>
                        <p class="threshold-hint">{{ $hint }}</p>
                    </div>
                    @endforeach
                </div>
            </div>

            {{-- ── 2. Category Mapping ── --}}
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
                    $mapping = old('category_mapping', $settings->category_mapping ?? [
                        'shortTerm'  => ['Dairy Products','Fresh Vegetables','Fresh Fruits','Bakery Items','Fresh Meat','Seafood','Ready Meals','Salads','Yogurt','Cheese','Milk'],
                        'mediumTerm' => ['Frozen Foods','Packaged Snacks','Beverages'],
                        'longTerm'   => ['Canned Goods','Dry Goods','Pasta','Rice','Spices','Condiments'],
                    ]);
                @endphp

                {{-- Hidden inputs synced by JS after every drag --}}
                @foreach(['shortTerm','mediumTerm','longTerm'] as $bucket)
                    @foreach($mapping[$bucket] as $cat)
                        <input type="hidden"
                               name="category_mapping[{{ $bucket }}][]"
                               value="{{ $cat }}"
                               class="hid-{{ $bucket }}" />
                    @endforeach
                @endforeach

                <div class="mapping-grid">
                    @foreach([
                        ['shortTerm',  'Short-term',  'short_term_days',  7],
                        ['mediumTerm', 'Medium-term', 'medium_term_days', 14],
                        ['longTerm',   'Long-term',   'long_term_days',   30],
                    ] as [$bucket, $label, $daysKey, $defaultDays])
                    {{-- data-bucket is read by inventory-settings.js for drag & drop --}}
                    <div class="drop-zone" id="zone-{{ $bucket }}"
                         data-bucket="{{ $bucket }}">
                        <div class="drop-zone-header">
                            <span class="drop-zone-dot"></span>
                            <span class="drop-zone-title">{{ $label }}</span>
                            <span class="drop-zone-badge" id="badge-{{ $bucket }}">
                                {{ $settings->$daysKey ?? $defaultDays }}d
                            </span>
                        </div>
                        <div id="list-{{ $bucket }}">
                            @foreach($mapping[$bucket] as $cat)
                            {{-- data-category + data-source read by inventory-settings.js --}}
                            <div class="category-pill" draggable="true"
                                 data-category="{{ $cat }}"
                                 data-source="{{ $bucket }}">
                                <i class="bi bi-grip-vertical"></i>{{ $cat }}
                            </div>
                            @endforeach
                        </div>
                    </div>
                    @endforeach
                </div>
            </div>

            {{-- ── 3. Automation ── --}}
            <div class="s-card">
                <div class="s-section-title">
                    <div class="s-section-icon"><i class="bi bi-lightning-charge-fill"></i></div>
                    <h2>Automation</h2>
                </div>

                <input type="hidden" name="auto_hide"      id="val-autohide"      value="{{ old('auto_hide',      $settings->auto_hide      ?? 0) }}" />
                <input type="hidden" name="auto_discounts" id="val-autodiscounts" value="{{ old('auto_discounts', $settings->auto_discounts ?? 0) }}" />
                <input type="hidden" name="ai_discounts"   id="val-aidiscounts"   value="{{ old('ai_discounts',   $settings->ai_discounts   ?? 0) }}" />

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
                        {{-- data-toggle-id read by inventory-settings.js --}}
                        <button class="toggle-switch {{ ($settings->auto_hide ?? false) ? 'on' : '' }}"
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
                                     style="{{ ($settings->auto_discounts ?? false) ? 'display:block' : '' }}">
                                    <p class="discount-panel-label">
                                        <i class="bi bi-tag"></i>&nbsp; Global Discount Rate &nbsp;·&nbsp; Duration
                                    </p>
                                    <div class="discount-panel-row">
                                        <div class="discount-input-wrap">
                                            <input class="discount-input" type="number" min="1" max="90"
                                                   name="auto_discount_percent"
                                                   value="{{ old('auto_discount_percent', $settings->auto_discount_percent ?? 20) }}" />
                                            <span class="discount-input-suffix">%</span>
                                        </div>
                                        <div class="discount-panel-divider"></div>
                                        <input class="discount-input-plain" type="number" min="1" max="365"
                                               name="auto_discount_duration_days"
                                               value="{{ old('auto_discount_duration_days', $settings->auto_discount_duration_days ?? 7) }}" />
                                        <span class="threshold-unit">days</span>
                                        <p class="discount-panel-hint">Applied instantly to every product that reaches Yellow status</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {{-- data-toggle-id read by inventory-settings.js --}}
                        <button class="toggle-switch {{ ($settings->auto_discounts ?? false) ? 'on' : '' }}"
                                id="toggle-autodiscounts" data-toggle-id="autodiscounts" type="button"></button>
                    </div>

                    {{-- AI Discounts --}}
                    <div class="toggle-row">
                        <div class="toggle-row-left">
                            <div class="toggle-icon"><i class="bi bi-robot"></i></div>
                            <div>
                                <p class="toggle-title">
                                    AI-Powered Discounts
                                    <span class="beta-badge">Beta</span>
                                </p>
                                <p class="toggle-desc">Let AI suggest optimal discount percentages for approaching-expiry products based on remaining days and sales velocity.</p>
                            </div>
                        </div>
                        {{-- data-toggle-id read by inventory-settings.js --}}
                        <button class="toggle-switch {{ ($settings->ai_discounts ?? false) ? 'on' : '' }}"
                                id="toggle-aidiscounts" data-toggle-id="aidiscounts" type="button"></button>
                    </div>

                </div>
            </div>

            {{-- ── Footer ── --}}
            <div class="settings-footer">
                <a href="{{ route('dashboard') }}" class="btn-cancel">Cancel</a>
                <button class="btn-save" type="submit">
                    <i class="bi bi-check2"></i> Save Settings
                </button>
            </div>

        </div>
    </form>

</main>

@push('scripts')
<script src="{{ mix('js/inventory-settings.js') }}" defer></script>
@endpush

@endsection