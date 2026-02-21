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
        ['icon' => 'bi-grid-fill',    'label' => 'Dashboard'],
        ['icon' => 'bi-box-seam-fill','label' => 'Products'],
        ['icon' => 'bi-bell-fill',    'label' => 'Notifications'],
    ],
])

<style>
    body {
        background: linear-gradient(135deg,
            hsl(35,90%,96%) 0%, hsl(30,80%,94%) 30%,
            hsl(40,75%,95%) 60%, hsl(28,70%,96%) 100%
        );
        background-attachment: fixed;
    }

    .settings-main  { max-width: 56rem; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
    .settings-stack { display: flex; flex-direction: column; gap: 1.25rem; }

    .s-card {
        background: hsla(0,0%,100%,0.58);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid hsla(0,0%,100%,0.72);
        border-radius: 1.25rem;
        padding: 1.75rem;
    }

    .s-section-title { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.4rem; }
    .s-section-icon {
        width: 2rem; height: 2rem; flex-shrink: 0;
        background: hsla(28,85%,55%,0.08);
        border: 1px solid hsla(28,85%,55%,0.22);
        border-radius: 0.625rem;
        display: flex; align-items: center; justify-content: center;
        color: hsl(28,85%,55%); font-size: 0.9rem;
    }
    .s-section-title h2 { margin: 0; font-size: 0.92rem; font-weight: 700; color: hsl(25,30%,15%); }
    .s-section-sub { font-size: 0.77rem; color: hsl(25,10%,50%); line-height: 1.6; margin: 0 0 1.4rem; padding-left: 2.75rem; }

    /* ─── Thresholds ─── */
    .threshold-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; }
    .threshold-card {
        background: hsla(28,50%,96%,0.7);
        border: 1px solid hsla(28,55%,82%,0.55);
        border-radius: 1rem; padding: 1.25rem;
        transition: border-color 0.2s, box-shadow 0.2s;
    }
    .threshold-card:focus-within {
        border-color: hsla(28,85%,55%,0.45);
        box-shadow: 0 0 0 3px hsla(28,85%,55%,0.08);
    }
    .threshold-label     { font-size: 0.75rem; font-weight: 700; color: hsl(25,30%,30%); margin: 0 0 0.75rem; }
    .threshold-input-row { display: flex; align-items: center; gap: 0.5rem; }
    .threshold-input {
        width: 4rem; padding: 0.45rem 0.6rem;
        border: 1.5px solid hsla(28,55%,75%,0.5);
        border-radius: 0.6rem;
        background: hsla(0,0%,100%,0.75);
        font-family: 'DM Sans', sans-serif;
        font-size: 0.9rem; font-weight: 700;
        color: hsl(25,30%,15%); text-align: center; outline: none;
        transition: border-color 0.2s;
    }
    .threshold-input:focus { border-color: hsl(28,85%,55%); }
    .threshold-unit { font-size: 0.72rem; font-weight: 600; color: hsl(25,10%,50%); }
    .threshold-hint { font-size: 0.7rem; color: hsl(25,10%,55%); margin: 0.55rem 0 0; line-height: 1.45; }

    /* ─── Category Mapping ─── */
    .mapping-tip {
        background: hsla(28,85%,55%,0.07);
        border: 1px solid hsla(28,85%,55%,0.2);
        border-radius: 0.6rem;
        padding: 0.45rem 0.75rem;
        font-size: 0.68rem; color: hsl(28,60%,35%);
        margin-bottom: 1.25rem;
    }
    .mapping-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(168px, 1fr)); gap: 1rem; }
    .drop-zone {
        background: hsla(28,45%,96%,0.6);
        border: 1.5px solid hsla(28,55%,82%,0.5);
        border-radius: 1rem; padding: 1rem;
        min-height: 16rem;
        transition: background 0.18s, border-color 0.18s;
    }
    .drop-zone.drag-over {
        background: hsla(28,85%,92%,0.6);
        border-color: hsl(28,75%,65%);
        border-style: dashed;
    }
    .drop-zone-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.875rem; }
    .drop-zone-dot    { width: 0.55rem; height: 0.55rem; border-radius: 50%; flex-shrink: 0; background: hsl(28,65%,58%); }
    .drop-zone-title  { font-size: 0.78rem; font-weight: 700; color: hsl(25,30%,25%); flex: 1; }
    .drop-zone-badge  {
        font-size: 0.62rem; font-weight: 700;
        background: hsla(28,85%,55%,0.1); color: hsl(28,70%,40%);
        border: 1px solid hsla(28,85%,55%,0.22);
        padding: 0.12rem 0.45rem; border-radius: 999px;
    }
    .category-pill {
        display: flex; align-items: center; gap: 0.45rem;
        padding: 0.42rem 0.7rem;
        background: hsla(0,0%,100%,0.7);
        border: 1px solid hsla(28,45%,80%,0.5);
        border-radius: 0.6rem;
        font-size: 0.75rem; color: hsl(25,25%,20%);
        cursor: grab; margin-bottom: 0.4rem;
        transition: background 0.12s, transform 0.12s, border-color 0.12s;
        user-select: none;
    }
    .category-pill:hover { background: hsla(28,70%,95%,0.9); border-color: hsla(28,65%,68%,0.55); transform: translateX(2px); }
    .category-pill i { color: hsl(28,55%,60%); font-size: 0.7rem; }

    /* ─── Toggle Row ─── */
    .toggle-list { display: flex; flex-direction: column; }
    .toggle-row {
        display: flex; align-items: center; justify-content: space-between;
        padding: 1.1rem 0;
        border-bottom: 1px solid hsla(0,0%,0%,0.05);
    }
    .toggle-row:last-child { border-bottom: none; }
    .toggle-row-left { display: flex; align-items: flex-start; gap: 0.875rem; }
    .toggle-icon {
        width: 2.25rem; height: 2.25rem; flex-shrink: 0;
        border-radius: 0.625rem;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.95rem;
        background: hsla(28,50%,94%,0.7);
        border: 1px solid hsla(28,50%,80%,0.4);
        color: hsl(28,65%,50%);
        transition: all 0.2s;
    }
    .toggle-title { margin: 0 0 0.2rem; font-size: 0.85rem; font-weight: 700; color: hsl(25,30%,15%); display: flex; align-items: center; gap: 0.5rem; }
    .toggle-desc  { margin: 0; font-size: 0.74rem; color: hsl(25,10%,50%); line-height: 1.5; max-width: 28rem; }
    .beta-badge {
        font-size: 0.6rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;
        background: hsla(28,85%,55%,0.1); color: hsl(28,75%,42%);
        border: 1px solid hsla(28,85%,55%,0.25);
        padding: 0.12rem 0.48rem; border-radius: 999px;
    }
    .toggle-switch {
        position: relative; width: 3rem; height: 1.625rem; flex-shrink: 0;
        background: hsla(0,0%,0%,0.12); border: none; border-radius: 999px;
        cursor: pointer; transition: background 0.25s ease;
    }
    .toggle-switch.on { background: hsl(28,85%,55%); }
    .toggle-switch::after {
        content: '';
        position: absolute; top: 0.1875rem; left: 0.1875rem;
        width: 1.25rem; height: 1.25rem;
        background: #fff; border-radius: 50%;
        box-shadow: 0 1px 4px hsla(0,0%,0%,0.2);
        transition: left 0.25s cubic-bezier(0.34,1.56,0.64,1);
    }
    .toggle-switch.on::after { left: 1.4375rem; }

    /* ─── Footer ─── */
    .settings-footer { display: flex; justify-content: flex-end; gap: 0.75rem; align-items: center; }
    .btn-cancel {
        padding: 0.65rem 1.4rem;
        background: hsla(0,0%,100%,0.6);
        border: 1px solid hsla(0,0%,0%,0.1);
        border-radius: 0.75rem;
        font-family: 'DM Sans', sans-serif;
        font-size: 0.82rem; font-weight: 600; color: hsl(25,10%,50%);
        cursor: pointer; transition: all 0.15s; text-decoration: none;
        display: inline-flex; align-items: center;
    }
    .btn-cancel:hover { background: hsla(0,0%,100%,0.9); color: hsl(25,30%,20%); }
    .btn-save {
        padding: 0.65rem 2rem;
        background: linear-gradient(135deg, hsl(28,85%,55%), hsl(28,85%,36%));
        border: none; border-radius: 0.75rem;
        font-family: 'DM Sans', sans-serif;
        font-size: 0.82rem; font-weight: 700; color: #fff;
        cursor: pointer;
        box-shadow: 0 4px 16px hsla(28,70%,50%,0.3);
        transition: all 0.2s;
        display: inline-flex; align-items: center; gap: 0.4rem;
    }
    .btn-save:hover  { transform: translateY(-1px); box-shadow: 0 8px 24px hsla(28,70%,50%,0.4); }
    .btn-save:active { transform: scale(0.97); }
</style>

<main class="settings-main">

{{-- ════════════════════════════════════════════
     FORM
════════════════════════════════════════════ --}}
<form method="POST"  id="settingsForm">
    @csrf
    @method('PUT')

    <div class="settings-stack">

        {{-- ── 1. Alert Thresholds ──────────────────────────────── --}}
        <div class="s-card">
            <div class="s-section-title">
                <div class="s-section-icon"><i class="bi bi-calendar3"></i></div>
                <h2>Alert Thresholds</h2>
            </div>
            <p class="s-section-sub">Set how many days before expiry each product tier should trigger a warning.</p>

            <div class="threshold-grid">

                <div class="threshold-card">
                    <p class="threshold-label">Short-term</p>
                    <div class="threshold-input-row">
                        <input class="threshold-input"
                               type="number" min="1" max="30"
                               name="short_term_days"
                               value="{{ old('short_term_days', $settings->short_term_days ?? 7) }}" />
                        <span class="threshold-unit">days</span>
                    </div>
                    <p class="threshold-hint">Dairy, Fresh produce</p>
                </div>

                <div class="threshold-card">
                    <p class="threshold-label">Medium-term</p>
                    <div class="threshold-input-row">
                        <input class="threshold-input"
                               type="number" min="1" max="60"
                               name="medium_term_days"
                               value="{{ old('medium_term_days', $settings->medium_term_days ?? 14) }}" />
                        <span class="threshold-unit">days</span>
                    </div>
                    <p class="threshold-hint">Frozen foods, Beverages</p>
                </div>

                <div class="threshold-card">
                    <p class="threshold-label">Long-term</p>
                    <div class="threshold-input-row">
                        <input class="threshold-input"
                               type="number" min="1" max="90"
                               name="long_term_days"
                               value="{{ old('long_term_days', $settings->long_term_days ?? 30) }}" />
                        <span class="threshold-unit">days</span>
                    </div>
                    <p class="threshold-hint">Canned goods, Dry goods</p>
                </div>

            </div>
        </div>

        {{-- ── 2. Category Mapping ──────────────────────────────── --}}
        <div class="s-card">
            <div class="s-section-title">
                <div class="s-section-icon"><i class="bi bi-collection-fill"></i></div>
                <h2>Category Mapping</h2>
            </div>
        

            <div class="mapping-tip">
                <i class="bi bi-lightbulb"></i>
                <strong> Tip:</strong> Drag a category card from one bucket to another to change which alert threshold applies to it.
            </div>

            {{-- Hidden inputs synced by JS after every drag ──────── --}}
            @php
                $mapping = old('category_mapping', $settings->category_mapping ?? [
                    'shortTerm'  => ['Dairy Products','Fresh Vegetables','Fresh Fruits','Bakery Items','Fresh Meat','Seafood','Ready Meals','Salads','Yogurt','Cheese','Milk'],
                    'mediumTerm' => ['Frozen Foods','Packaged Snacks','Beverages'],
                    'longTerm'   => ['Canned Goods','Dry Goods','Pasta','Rice','Spices','Condiments'],
                ]);
            @endphp

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
                <div class="drop-zone" id="zone-{{ $bucket }}"
                     ondragover="event.preventDefault(); this.classList.add('drag-over')"
                     ondragleave="this.classList.remove('drag-over')"
                     ondrop="handleDrop(event,'{{ $bucket }}')">
                    <div class="drop-zone-header">
                        <span class="drop-zone-dot"></span>
                        <span class="drop-zone-title">{{ $label }}</span>
                        <span class="drop-zone-badge" id="badge-{{ $bucket }}">
                            {{ $settings->$daysKey ?? $defaultDays }}d
                        </span>
                    </div>
                    <div id="list-{{ $bucket }}">
                        @foreach($mapping[$bucket] as $cat)
                        <div class="category-pill" draggable="true" data-category="{{ $cat }}"
                             ondragstart="handleDragStart(event,'{{ $cat }}','{{ $bucket }}')">
                            <i class="bi bi-grip-vertical"></i>{{ $cat }}
                        </div>
                        @endforeach
                    </div>
                </div>
                @endforeach

            </div>
        </div>

        {{-- ── 3. Automation ───────────────────────────────────── --}}
        <div class="s-card">
            <div class="s-section-title">
                <div class="s-section-icon"><i class="bi bi-lightning-charge-fill"></i></div>
                <h2>Automation</h2>
            </div>

            {{-- Hidden boolean values — updated by toggleSwitch() ── --}}
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
                    <button class="toggle-switch {{ ($settings->auto_hide ?? false) ? 'on' : '' }}"
                            id="toggle-autohide"
                            onclick="toggleSwitch('autohide')"
                            type="button"></button>
                </div>

                {{-- Auto Discounts --}}
                <div class="toggle-row">
                    <div class="toggle-row-left">
                        <div class="toggle-icon"><i class="bi bi-tag-fill"></i></div>
                        <div>
                            <p class="toggle-title">Auto Discounts</p>
                            <p class="toggle-desc">Auto-apply a set discount to all Yellow-status products the moment they hit the threshold.</p>

                            {{-- Discount % — visible only when toggle ON --}}
                            <div id="discount-input-wrap" style="
                                display:{{ ($settings->auto_discounts ?? false) ? 'block' : 'none' }};
                                margin-top:0.875rem; padding:1rem 1.1rem;
                                background:hsla(28,85%,55%,0.06);
                                border:1px solid hsla(28,85%,55%,0.2);
                                border-radius:0.875rem; max-width:22rem;
                            ">
                                <p style="margin:0 0 0.65rem;font-size:0.74rem;font-weight:700;color:hsl(25,30%,25%);">
                                    <i class="bi bi-tag"></i>&nbsp; Global Discount Rate &nbsp;<span style="color:hsla(25,10%,50%,0.6);font-weight:400;">·</span>&nbsp; Duration
                                </p>
                                <div style="display:flex;align-items:center;gap:0.6rem;flex-wrap:wrap;">
                                    <div style="position:relative;">
                                        <input type="number" min="1" max="90"
                                               name="auto_discount_percent"
                                               value="{{ old('auto_discount_percent', $settings->auto_discount_percent ?? 20) }}"
                                               style="width:5rem;padding:0.45rem 1.6rem 0.45rem 0.65rem;
                                                      border:1.5px solid hsla(28,65%,70%,0.55);
                                                      border-radius:0.6rem;background:hsla(0,0%,100%,0.75);
                                                      font-family:'DM Sans',sans-serif;font-size:0.9rem;
                                                      font-weight:700;color:hsl(25,30%,15%);outline:none;
                                                      transition:border-color 0.2s;"
                                               onfocus="this.style.borderColor='hsl(28,85%,55%)'"
                                               onblur="this.style.borderColor='hsla(28,65%,70%,0.55)'" />
                                        <span style="position:absolute;right:0.5rem;top:50%;transform:translateY(-50%);
                                                     font-size:0.78rem;font-weight:700;color:hsl(28,65%,50%);
                                                     pointer-events:none;">%</span>
                                    </div>
                                    <div style="width:1px;height:1.75rem;background:hsla(28,55%,75%,0.35);flex-shrink:0;"></div>
                                    <div style="position:relative;">
                                        <input type="number" min="1" max="365"
                                               name="auto_discount_duration_days"
                                               value="{{ old('auto_discount_duration_days', $settings->auto_discount_duration_days ?? 7) }}"
                                               style="width:5rem;padding:0.45rem 0.65rem;
                                                      border:1.5px solid hsla(28,65%,70%,0.55);
                                                      border-radius:0.6rem;background:hsla(0,0%,100%,0.75);
                                                      font-family:'DM Sans',sans-serif;font-size:0.9rem;
                                                      font-weight:700;color:hsl(25,30%,15%);outline:none;
                                                      transition:border-color 0.2s;"
                                               onfocus="this.style.borderColor='hsl(28,85%,55%)'"
                                               onblur="this.style.borderColor='hsla(28,65%,70%,0.55)'" />
                                    </div>
                                    <span style="font-size:0.72rem;font-weight:600;color:hsl(25,10%,50%);">days</span>
                                    <p style="margin:0;font-size:0.72rem;color:hsl(25,10%,50%);line-height:1.5;width:100%;">
                                        Applied instantly to every product that reaches Yellow status
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button class="toggle-switch {{ ($settings->auto_discounts ?? false) ? 'on' : '' }}"
                            id="toggle-autodiscounts"
                            onclick="toggleSwitch('autodiscounts')"
                            type="button"></button>
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
                    <button class="toggle-switch {{ ($settings->ai_discounts ?? false) ? 'on' : '' }}"
                            id="toggle-aidiscounts"
                            onclick="toggleSwitch('aidiscounts')"
                            type="button"></button>
                </div>

            </div>
        </div>

        {{-- ── Footer ─────────────────────────────────────────── --}}
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
<script>
// ── Drag & Drop ──────────────────────────────────────────────────────────
let draggedEl  = null;
let dragSource = null;

function handleDragStart(e, name, source) {
    draggedEl  = e.currentTarget;
    dragSource = source;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => draggedEl.style.opacity = '0.4', 0);
}

function handleDrop(e, target) {
    e.preventDefault();
    document.getElementById('zone-' + target).classList.remove('drag-over');

    if (!draggedEl || dragSource === target) {
        if (draggedEl) draggedEl.style.opacity = '';
        return;
    }

    const prevSource = dragSource;
    draggedEl.style.opacity = '';

    // Re-bind dragstart to new bucket
    const category = draggedEl.dataset.category;
    draggedEl.ondragstart = (ev) => handleDragStart(ev, category, target);

    // Move pill DOM
    document.getElementById('list-' + target).appendChild(draggedEl);

    // Sync hidden inputs for both buckets
    syncHiddenInputs(prevSource);
    syncHiddenInputs(target);

    draggedEl  = null;
    dragSource = null;
}

function syncHiddenInputs(bucket) {
    // Remove old
    document.querySelectorAll('.hid-' + bucket).forEach(el => el.remove());
    // Re-create from current DOM order
    document.querySelectorAll('#list-' + bucket + ' .category-pill').forEach(pill => {
        const inp   = document.createElement('input');
        inp.type    = 'hidden';
        inp.name    = 'category_mapping[' + bucket + '][]';
        inp.value   = pill.dataset.category;
        inp.classList.add('hid-' + bucket);
        document.getElementById('settingsForm').appendChild(inp);
    });
}

// ── Threshold badge live update ──────────────────────────────────────────
document.querySelectorAll('.threshold-input').forEach(input => {
    const map = { short_term_days: 'shortTerm', medium_term_days: 'mediumTerm', long_term_days: 'longTerm' };
    input.addEventListener('input', () => {
        const key = map[input.name];
        if (key) document.getElementById('badge-' + key).textContent = (input.value || '?') + 'd';
    });
});

// ── Toggle switches ──────────────────────────────────────────────────────
function toggleSwitch(id) {
    const btn      = document.getElementById('toggle-' + id);
    const willBeOn = !btn.classList.contains('on');

    // Mutual exclusion: autodiscounts ↔ aidiscounts
    if (willBeOn) {
        if (id === 'autodiscounts') turnOff('aidiscounts');
        if (id === 'aidiscounts')   turnOff('autodiscounts');
    }

    btn.classList.toggle('on');
    document.getElementById('val-' + id).value = willBeOn ? 1 : 0;

    // Show/hide discount input
    if (id === 'autodiscounts') {
        const wrap = document.getElementById('discount-input-wrap');
        if (willBeOn) {
            wrap.style.display   = 'block';
            wrap.style.opacity   = '0';
            wrap.style.transform = 'translateY(-6px)';
            requestAnimationFrame(() => {
                wrap.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
                wrap.style.opacity    = '1';
                wrap.style.transform  = 'translateY(0)';
            });
        } else {
            wrap.style.display = 'none';
        }
    }
}

function turnOff(id) {
    const btn = document.getElementById('toggle-' + id);
    if (!btn) return;
    btn.classList.remove('on');
    document.getElementById('val-' + id).value = 0;
    if (id === 'autodiscounts') {
        document.getElementById('discount-input-wrap').style.display = 'none';
    }
}
</script>
@endpush

@endsection