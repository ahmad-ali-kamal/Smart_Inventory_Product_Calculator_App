@extends('layouts.calcapp') {{-- تم التغيير للملف الشغال عندك --}}

@section('content')
@include('layouts._header', [
    'headerNav' => [
        ['url' => route('welcome'),            'icon' => 'bi-house',          'label' => 'Home',          'route_match' => 'welcome'],
        ['url' => route('inventory.dashboard'), 'icon' => 'bi-grid-fill',      'label' => 'Dashboard',     'route_match' => 'inventory.dashboard'],
        ['url' => route('inventory.products.index'), 'icon' => 'bi-box-seam-fill', 'label' => 'Products', 'route_match' => 'inventory.products.index'],
        ['url' => route('inventory.settings'),  'icon' => 'bi-gear-fill',      'label' => 'Settings',      'route_match' => 'inventory.settings'],
    ],
])

<main class="settings-main">

    {{-- ① تصحيح الـ Action ليرتبط بـ BatchSettingController --}}
    <form action="{{ route('inventory.settings.batch.store') }}" method="POST" id="settingsForm">
        @csrf
        @method('PUT')

        <div class="settings-stack">

            {{-- ── 1. Alert Thresholds (إعدادات المدد الزمنية) ── --}}
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
                            {{-- ② استخدام مسميات المتغيرات الجديدة من الموديل --}}
                            <input class="threshold-input"
                                   type="number" min="{{ $min }}" max="{{ $max }}"
                                   name="{{ $name }}"
                                   value="{{ old($name, $settings->$name ?? $min) }}" />
                            <span class="threshold-unit">days</span>
                        </div>
                        <p class="threshold-hint">{{ $hint }}</p>
                    </div>
                    @endforeach
                </div>
            </div>

            {{-- ── 2. Category Mapping (توزيع التصنيفات) ── --}}
            <div class="s-card">
                <div class="s-section-title">
                    <div class="s-section-icon"><i class="bi bi-collection-fill"></i></div>
                    <h2>Category Mapping</h2>
                </div>

                <div class="mapping-tip">
                    <i class="bi bi-lightbulb"></i>
                    <strong> Tip:</strong> Drag a category card from one bucket to another to change which alert threshold applies to it.
                </div>

                {{-- ③ توحيد المسميات مع الـ JS: استخدام short/medium/long بدلاً من shortTerm --}}
                @php
                    $buckets = ['short', 'medium', 'long'];
                @endphp

                {{-- المدخلات المخفية يتم تحديثها بواسطة inventory-settings.js --}}
                <div id="hiddenInputsContainer">
                    @foreach($buckets as $bucket)
                        {{-- هنا نفترض أن الكنترولر يرسل $mappings مقسمة حسب الـ bucket --}}
                        @if(isset($mappings) && isset($mappings[$bucket]))
                            @foreach($mappings[$bucket] as $catId)
                                <input type="hidden" name="category_mapping[{{ $bucket }}][]" value="{{ $catId }}" class="hid-{{ $bucket }}">
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
                            {{-- ④ تصحيح الـ ID الخاص بالـ Badge ليتوافق مع الـ JS --}}
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

            {{-- ── 3. Automation (الأتمتة) ── --}}
            <div class="s-card">
                <div class="s-section-title">
                    <div class="s-section-icon"><i class="bi bi-lightning-charge-fill"></i></div>
                    <h2>Automation</h2>
                </div>

                {{-- تصحيح أسماء الحقول لتطابق الموديل BatchSetting --}}
                <input type="hidden" name="auto_hide_expired"    id="val-autohide"      value="{{ old('auto_hide_expired', $settings->auto_hide_expired ?? 0) }}" />
                <input type="hidden" name="enable_notifications" id="val-notifications" value="{{ old('enable_notifications', $settings->enable_notifications ?? 0) }}" />

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
{{-- الربط مع ملف الـ JS الموحد --}}
<script src="{{ asset('js/inventory-settings.js') }}" defer></script>
@endpush

@endsection