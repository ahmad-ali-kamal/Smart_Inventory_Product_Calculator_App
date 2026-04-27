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

<section class="min-h-screen flex items-center justify-center py-16 px-4"
         style="position: relative; z-index: 10;">

    <div class="w-full max-w-lg">
        <div class="login-card p-10 md:p-12">

            {{-- Header --}}
            <div class="flex flex-col items-center mb-10">
                <div class="logo-icon mb-4">
                    <i class="bi bi-calculator text-white" style="font-size: 1.25rem;"></i>
                </div>
                <h1 class="page-title font-serif text-2xl font-bold tracking-tight" style="color: var(--fg)">
                    Merchant<span style="color: var(--mauve)">Tools</span>
                </h1>
                <p class="page-title text-xs mt-1" style="color: var(--muted); letter-spacing: 0.08em;">
                    CALCULATION RULES
                </p>
            </div>

            <form id="settingsForm" action="{{ route('calculator.settings.store') }}" method="POST"
                  style="display: flex; flex-direction: column; gap: 1rem;">
                @csrf

                <div class="panel-info">
                    <h4>How it works</h4>
                    <p>The formula uses coverage to calculate units, then adds waste percentage on top.</p>
                </div>

                {{-- Coverage --}}
                <div class="field-card fc-1">
                    <label class="field-label">Coverage per Unit (m²)</label>
                    <div class="input-row">
                        <input type="number" step="0.01" name="coverage_per_unit" id="coverage_per_unit"
                               placeholder="e.g. 1.5"
                               value="{{ old('coverage_per_unit', $settings->coverage_per_unit ?? '') }}" required>
                        <span class="input-unit">sqm</span>
                    </div>
                    @error('coverage_per_unit')
                        <span style="color:red; font-size:0.75rem;">{{ $message }}</span>
                    @enderror
                </div>

                {{-- Waste --}}
                <div class="field-card fc-2">
                    <label class="field-label">Waste Percentage (%)</label>
                    <div class="input-row">
                        <input type="number" step="1" name="waste_percentage" id="waste_percentage"
                               placeholder="e.g. 10"
                               value="{{ old('waste_percentage', $settings->waste_percentage ?? '') }}" required>
                        <span class="input-unit">%</span>
                    </div>
                    @error('waste_percentage')
                        <span style="color:red; font-size:0.75rem;">{{ $message }}</span>
                    @enderror
                </div>

                <div class="divider"></div>

                {{-- Live Preview --}}
                <div class="panel-live" id="preview-panel">
                    <div class="panel-live-label" style="margin-bottom: 0.85rem;">
                        Live Preview — 20 m² room
                    </div>
                    <div id="preview-placeholder" style="text-align:center; padding: 0.75rem 0;">
                        <p style="font-size:0.82rem; color:var(--muted);">Fill both fields to see the calculation</p>
                    </div>
                    <div id="preview-result" style="display:none; flex-direction:column; gap:0.75rem;">
                        <div id="formula-line" style="font-family:'Courier New',monospace; font-size:0.78rem; font-weight:600; color:var(--fg); background:hsla(282,45%,55%,0.07); border:1px solid var(--mauve-border); border-radius:0.75rem; padding:0.7rem 1rem; text-align:center; white-space:nowrap; overflow:hidden;"></div>
                        <div id="var-rows" style="display:flex; flex-direction:column; gap:0.35rem; padding:0 0.25rem;"></div>
                        <div style="display:flex; justify-content:center; margin-top:0.25rem;">
                            <div id="result-pill" style="display:inline-flex; align-items:center; gap:0.5rem; background:hsla(282,45%,55%,0.08); border:1.5px solid var(--mauve-border); border-radius:2rem; padding:0.5rem 1.25rem; font-size:0.82rem; font-weight:600; color:var(--mauve-deep);">
                                <i class="bi bi-box-seam" style="font-size:0.85rem;"></i>
                                <span>You need</span>
                                <span id="result-number" style="font-size:1.3rem; font-weight:800; letter-spacing:-0.03em; line-height:1;"></span>
                                <span>boxes</span>
                            </div>
                        </div>
                    </div>
                </div>

                <button type="submit" class="btn-signin">
                    <span>Save Settings & Continue</span>
                    <i class="bi bi-arrow-right btn-arrow"></i>
                </button>

            </form>
        </div>
    </div>
</section>
@endsection

@push('scripts')
<script src="{{ mix('js/settings.js') }}" defer></script>
@endpush