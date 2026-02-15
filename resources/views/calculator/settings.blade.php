@extends('layouts.calcapp')

@section('content')

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

            <form id="settingsForm" action="{{ route('calculator.dashboard') }}" method="get" style="display: flex; flex-direction: column; gap: 1rem;">

                {{-- Info panel --}}
                <div class="panel-info">
                    <h4>How it works</h4>
                    <p>The formula uses coverage to calculate units, then adds waste percentage on top.</p>
                </div>

                {{-- Coverage --}}
                <div class="field-card fc-1">
                    <label class="field-label">Coverage per Unit</label>
                    <div class="input-row">
                        <input type="text" inputmode="decimal" id="coverage_per_unit" placeholder="e.g. 1.5">
                        <span class="input-unit">sqm</span>
                    </div>
                </div>

                {{-- Waste --}}
                <div class="field-card fc-2">
                    <label class="field-label">Waste Percentage</label>
                    <div class="input-row">
                        <input type="text" inputmode="numeric" id="waste_percentage" placeholder="e.g. 10">
                        <span class="input-unit">%</span>
                    </div>
                </div>

                {{-- Divider --}}
                <div class="divider"></div>

                {{-- Live Preview Panel --}}
                <div class="panel-live" id="preview-panel">

                    <div class="panel-live-label" style="margin-bottom: 0.85rem;">
                        Live Preview — 20 m² room
                    </div>

                    {{-- Placeholder state --}}
                    <div id="preview-placeholder" style="text-align:center; padding: 0.75rem 0;">
                        <p style="font-size:0.82rem; color:var(--muted);">Fill both fields to see the calculation</p>
                    </div>

                    {{-- Result state (hidden initially) --}}
                    <div id="preview-result" style="display:none; flex-direction:column; gap:0.75rem;">

                        {{-- Formula — سطر واحد --}}
                        <div id="formula-line"
                             style="font-family: 'Courier New', monospace;
                                    font-size: 0.78rem;
                                    font-weight: 600;
                                    color: var(--fg);
                                    background: hsla(282,45%,55%,0.07);
                                    border: 1px solid var(--mauve-border);
                                    border-radius: 0.75rem;
                                    padding: 0.7rem 1rem;
                                    text-align: center;
                                    white-space: nowrap;
                                    overflow: hidden;">
                        </div>

                        {{-- Variable rows --}}
                        <div id="var-rows"
                             style="display:flex; flex-direction:column; gap:0.35rem; padding: 0 0.25rem;">
                        </div>

                        {{-- Result pill --}}
                        <div style="display:flex; justify-content:center; margin-top:0.25rem;">
                            <div id="result-pill"
                                 style="display:inline-flex;
                                        align-items:center;
                                        gap:0.5rem;
                                        background: hsla(282,45%,55%,0.08);
                                        border: 1.5px solid var(--mauve-border);
                                        border-radius: 2rem;
                                        padding: 0.5rem 1.25rem;
                                        font-size: 0.82rem;
                                        font-weight: 600;
                                        color: var(--mauve-deep);">
                                <i class="bi bi-box-seam" style="font-size:0.85rem;"></i>
                                <span>You need</span>
                                <span id="result-number"
                                      style="font-size:1.3rem;
                                             font-weight:800;
                                             letter-spacing:-0.03em;
                                             line-height:1;">
                                </span>
                                <span>boxes</span>
                            </div>
                        </div>

                    </div>

                </div>

                {{-- Submit --}}
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
<script>
document.addEventListener('DOMContentLoaded', function () {

    const coverageInput = document.getElementById('coverage_per_unit');
    const wasteInput    = document.getElementById('waste_percentage');
    const placeholder   = document.getElementById('preview-placeholder');
    const resultBlock   = document.getElementById('preview-result');
    const formulaLine   = document.getElementById('formula-line');
    const varRows       = document.getElementById('var-rows');
    const resultNumber  = document.getElementById('result-number');

    const AREA = 20;

    // helper — صف واحد من المتغيرات
    function varRow(name, value) {
        return `
            <div style="display:flex; align-items:center; gap:0.6rem;">
                <span style="font-family:'Courier New',monospace;
                             font-size:0.72rem; font-weight:700;
                             color:var(--mauve-deep);
                             background:var(--mauve-soft);
                             border:1px solid var(--mauve-border);
                             border-radius:2rem;
                             padding:0.15rem 0.7rem;
                             min-width:72px; text-align:center;">
                    ${name}
                </span>
                <span style="font-size:0.72rem; color:var(--muted);">=</span>
                <span style="font-size:0.78rem; font-weight:600; color:var(--fg);">${value}</span>
            </div>`;
    }

    function updatePreview() {
        const coverage = parseFloat(coverageInput.value);
        const waste    = parseFloat(wasteInput.value);

        if (!coverage || !waste) {
            placeholder.style.display  = 'block';
            resultBlock.style.display  = 'none';
            return;
        }

        const wasteDecimal = waste / 100;
        const raw          = (AREA / coverage) * (1 + wasteDecimal);
        const boxes        = Math.ceil(raw);

        // المعادلة في سطر واحد
        formulaLine.innerHTML =
            `boxes = ceil( `
          + `<span style="color:var(--mauve-deep);font-weight:700;">area</span>`
          + ` &divide; `
          + `<span style="color:var(--mauve-deep);font-weight:700;">coverage</span>`
          + ` &times; (1 + `
          + `<span style="color:var(--mauve-deep);font-weight:700;">waste</span>`
          + `) )`;

        // صفوف القيم
        varRows.innerHTML =
            varRow('area',     `${AREA} m²`)
          + varRow('coverage', `${coverage} m² per box`)
          + varRow('waste',    `${wasteDecimal.toFixed(2)} &nbsp;(${waste}%)`);

        // النتيجة
        resultNumber.textContent = boxes;

        placeholder.style.display = 'none';
        resultBlock.style.display = 'flex';
    }

    coverageInput.addEventListener('input', updatePreview);
    wasteInput.addEventListener('input',    updatePreview);
});
</script>
@endpush