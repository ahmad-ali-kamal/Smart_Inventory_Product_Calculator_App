{{--
    Partial : inventory/discountform.blade.php
    Include : @include('inventory.discountform')

    ── API Endpoints ──────────────────────────────────────
    ADD  single  POST  /api/inventory/expiry/single
                 Body  { product_id, expiry_date, status }

    ADD  batch   POST  /api/inventory/expiry/batch
                 Body  { product_id, batches: [{label, qty, expiry_date, status}] }

    EDIT         PUT   /api/inventory/expiry/{product_id}
                 Body  { product_id, type, expiry_date? , batches? }

    ── Success response shape (all endpoints) ─────────────
    { success: true, type: 'single'|'batch', expiry_date?, batches? }

    ── After success ──────────────────────────────────────
    Calls Inventory.onSaveSuccess(productId, data, wasEdit)
    defined in inventory-product.blade.php
--}}

@push('styles')
<style>
    /* ── Overlay ── */
    .ef-backdrop {
        display:none; position:fixed; inset:0; z-index:200;
        background:hsla(25,30%,10%,0.55);
        align-items:flex-start; justify-content:center;
        padding:2rem 1rem; overflow-y:auto;
    }
    .ef-backdrop.open { display:flex; animation:ef-fade-in 0.22s ease-out forwards; }
    body.ef-open .inv-card { opacity:0.35; pointer-events:none; transition:opacity 0.22s ease; }

    @keyframes ef-fade-in { from { opacity:0; } to { opacity:1; } }
    @keyframes ef-card-in { to   { opacity:1; transform:translateY(0) scale(1); } }
    @keyframes ef-spin     { to   { transform:rotate(360deg); } }

    /* ── Card ── */
    .ef-card {
        background:#fff; border:1px solid hsla(0,0%,0%,0.08);
        border-radius:1.75rem; width:100%; max-width:560px;
        padding:2rem; margin:auto;
        box-shadow:0 24px 64px hsla(25,30%,10%,0.18), 0 2px 0 hsla(0,0%,100%,0.7) inset;
        opacity:0; transform:translateY(20px) scale(0.97);
        animation:ef-card-in 0.32s cubic-bezier(0.34,1.4,0.64,1) 0.05s forwards;
    }

    /* ── Header ── */
    .ef-header       { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.5rem; }
    .ef-header-left  { display:flex; align-items:center; gap:0.85rem; }
    .ef-icon {
        width:2.6rem; height:2.6rem; flex-shrink:0;
        background:linear-gradient(135deg, var(--mauve), var(--mauve-deep));
        border-radius:0.85rem; display:flex; align-items:center; justify-content:center;
        color:white; font-size:1.05rem; box-shadow:0 4px 14px hsla(28,85%,45%,0.3);
    }
    .ef-title    { font-size:1rem; font-weight:700; color:var(--fg); line-height:1.1; }
    .ef-subtitle { font-size:0.74rem; color:var(--muted); margin-top:0.15rem; }
    .ef-close {
        background:hsla(0,0%,0%,0.05); border:1px solid hsla(0,0%,0%,0.08);
        border-radius:0.65rem; width:2rem; height:2rem;
        display:flex; align-items:center; justify-content:center;
        cursor:pointer; color:var(--muted); font-size:0.9rem;
        transition:background 0.15s, color 0.15s;
    }
    .ef-close:hover { background:hsla(0,70%,50%,0.1); color:hsl(0,60%,45%); }

    .ef-divider  { height:1px; background:hsla(0,0%,0%,0.07); margin-bottom:1.5rem; }

    /* ── Edit Banner ── */
    .ef-edit-banner {
        display:none; align-items:center; gap:0.5rem;
        background:hsla(28,85%,55%,0.08); border:1px solid var(--mauve-border);
        border-radius:0.75rem; padding:0.6rem 1rem; margin-bottom:1.25rem;
        font-size:0.78rem; font-weight:600; color:var(--mauve-deep);
    }
    .ef-edit-banner.show { display:flex; }
    .ef-edit-banner i { font-size:0.85rem; }

    /* ── Question & Toggle ── */
    .ef-question { font-size:0.87rem; font-weight:700; color:var(--fg); margin-bottom:0.85rem; }
    .ef-toggle   { display:flex; gap:0.65rem; margin-bottom:1.5rem; }
    .ef-toggle-btn {
        flex:1; padding:0.75rem 1rem; border-radius:1rem;
        font-size:0.82rem; font-weight:700; cursor:pointer;
        border:2px solid hsla(0,0%,0%,0.1);
        background:hsla(0,0%,100%,0.5); color:var(--muted);
        display:flex; align-items:center; justify-content:center; gap:0.4rem;
        transition:all 0.18s ease; font-family:'DM Sans',sans-serif;
    }
    .ef-toggle-btn:hover       { border-color:var(--mauve-border); color:var(--fg); }
    .ef-toggle-btn.active-yes,
    .ef-toggle-btn.active-no   { background:hsla(28,85%,55%,0.1); border-color:var(--mauve); color:var(--mauve-deep); }

    /* ── Panels ── */
    .ef-panel { border-radius:1.1rem; padding:1.35rem; margin-bottom:1.5rem; display:none; }
    .ef-panel.show { display:block; animation:fade-up 0.25s ease-out forwards; }
    .ef-panel-yes, .ef-panel-no { background:hsla(28,85%,55%,0.07); border:1px solid var(--mauve-border); }
    .ef-panel-title {
        font-size:0.75rem; font-weight:700; letter-spacing:0.05em;
        text-transform:uppercase; margin-bottom:1rem; color:var(--mauve-deep);
    }

    /* ── Form Fields ── */
    .ef-label {
        display:block; font-size:0.69rem; font-weight:700;
        text-transform:uppercase; letter-spacing:0.06em;
        color:var(--muted); margin-bottom:0.4rem;
    }
    .ef-input {
        width:100%; padding:0.7rem 1rem;
        background:hsla(0,0%,100%,0.7); border:1.5px solid hsla(0,0%,0%,0.1);
        border-radius:0.8rem; font-size:0.84rem; color:var(--fg); outline:none;
        font-family:'DM Sans',sans-serif;
        transition:border-color 0.2s, box-shadow 0.2s, background 0.2s;
    }
    .ef-input:focus { border-color:var(--mauve); background:white; box-shadow:0 0 0 3px hsla(28,85%,55%,0.15); }

    /* ── Batch Items ── */
    .ef-batch-list { display:flex; flex-direction:column; gap:0.75rem; }
    .ef-batch-item {
        background:hsla(0,0%,100%,0.65); border:1px solid hsla(0,0%,0%,0.08);
        border-radius:0.9rem; padding:1rem;
    }
    .ef-batch-head   { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.75rem; }
    .ef-batch-lbl    { font-size:0.78rem; font-weight:700; color:var(--fg); display:flex; align-items:center; gap:0.4rem; }
    .ef-batch-remove {
        background:none; border:none; cursor:pointer;
        color:var(--muted); font-size:0.82rem; padding:0.2rem 0.4rem;
        border-radius:0.4rem; line-height:1; transition:background 0.15s, color 0.15s;
    }
    .ef-batch-remove:hover { background:hsla(0,70%,50%,0.1); color:hsl(0,60%,45%); }
    .ef-batch-grid { display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; }

    /* ── Add Batch Button ── */
    .ef-add-batch {
        display:inline-flex; align-items:center; gap:0.38rem;
        padding:0.52rem 1rem; margin-top:0.85rem;
        background:var(--mauve-soft); border:1.5px dashed var(--mauve-border);
        color:var(--mauve-deep); border-radius:0.75rem;
        font-size:0.78rem; font-weight:700; cursor:pointer;
        font-family:'DM Sans',sans-serif; transition:background 0.15s, border-color 0.15s;
    }
    .ef-add-batch:hover { background:hsla(28,85%,55%,0.15); border-color:var(--mauve); }

    /* ── Status Badge ── */
    .ef-status-badge { display:inline-flex; align-items:center; gap:0.25rem; padding:0.15rem 0.55rem; border-radius:2rem; font-size:0.68rem; font-weight:700; }
    .ef-s-green  { background:hsla(140,60%,45%,0.13); color:hsl(140,55%,22%); }
    .ef-s-yellow { background:hsla(38,90%,50%,0.13);  color:hsl(38,72%,24%); }
    .ef-s-red    { background:hsla(0,70%,50%,0.13);   color:hsl(0,60%,28%); }

    /* ── Save Button ── */
    .ef-save {
        width:100%; padding:0.88rem; border:none; border-radius:1rem;
        background:linear-gradient(135deg, var(--mauve), var(--mauve-deep));
        color:white; font-size:0.88rem; font-weight:700; cursor:pointer;
        display:flex; align-items:center; justify-content:center; gap:0.5rem;
        font-family:'DM Sans',sans-serif; letter-spacing:0.02em;
        box-shadow:0 4px 16px hsla(28,85%,45%,0.3);
        transition:transform 0.18s, box-shadow 0.18s, opacity 0.18s;
    }
    .ef-save:hover    { transform:translateY(-1px); box-shadow:0 6px 22px hsla(28,85%,45%,0.4); }
    .ef-save:active   { transform:scale(0.98); }
    .ef-save:disabled { opacity:0.4; cursor:not-allowed; transform:none; box-shadow:none; }

    @media (max-width: 768px) {
        .ef-batch-grid { grid-template-columns:1fr; }
        .ef-card { padding:1.35rem; border-radius:1.25rem; }
    }
</style>
@endpush

{{-- Overlay --}}
<div class="ef-backdrop" id="efBackdrop" onclick="ExpiryForm.closeOnBackdrop(event)">
    <div class="ef-card" id="efCard">

        <div class="ef-header">
            <div class="ef-header-left">
                <div class="ef-icon"><i class="bi bi-calendar-plus" id="efIcon"></i></div>
                <div>
                    <div class="ef-title" id="efTitle">Add Expiry Date</div>
                    <div class="ef-subtitle" id="efProductName">Product</div>
                </div>
            </div>
            <button class="ef-close" onclick="ExpiryForm.close()" title="Close">
                <i class="bi bi-x-lg"></i>
            </button>
        </div>
        <div class="ef-divider"></div>

        <div class="ef-edit-banner" id="efEditBanner">
            <i class="bi bi-pencil-square"></i>
            <span>Edit mode — modifying existing expiry data</span>
        </div>

        <p class="ef-question">Do all quantities have the same expiry date?</p>
        <div class="ef-toggle">
            <button class="ef-toggle-btn" id="btnYes" onclick="ExpiryForm.selectMode(true)">
                <i class="bi bi-check-circle"></i> Yes
            </button>
            <button class="ef-toggle-btn" id="btnNo" onclick="ExpiryForm.selectMode(false)">
                <i class="bi bi-layers"></i> No — multiple batches
            </button>
        </div>

        <div class="ef-panel ef-panel-yes" id="panelYes">
            <p class="ef-panel-title"><i class="bi bi-calendar3"></i> Single Expiry Date</p>
            <label class="ef-label" for="efSingleDate">Expiry Date</label>
            <input type="date" class="ef-input" id="efSingleDate" oninput="ExpiryForm.validate()">
        </div>

        <div class="ef-panel ef-panel-no" id="panelNo">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
                <p class="ef-panel-title" style="margin:0;"><i class="bi bi-layers"></i> Batch-Level Tracking</p>
                <button class="ef-add-batch" onclick="ExpiryForm.addBatch()">
                    <i class="bi bi-plus-lg"></i> Add Batch
                </button>
            </div>
            <div class="ef-batch-list" id="efBatchList"></div>
        </div>

        <button class="ef-save" id="efSaveBtn" disabled onclick="ExpiryForm.save()">
            <i class="bi bi-floppy"></i> Save Expiry Information
        </button>

    </div>
</div>

@push('scripts')
<script>
const ExpiryForm = (() => {
    /* ── State ── */
    let productId  = null;
    let mode       = null;    // true = single | false = batch
    let isEdit     = false;
    let batchCount = 0;

    /* ── Helpers: DOM shortcuts ── */
    const $  = id => document.getElementById(id);
    const $q = s  => document.querySelector(s);

    /* ── Status calculation ── */
    function calcStatus(dateStr) {
        const today = new Date(); today.setHours(0,0,0,0);
        const days  = Math.floor((new Date(dateStr) - today) / 86400000);
        if (days < 0)  return 'red';
        if (days <= 7) return 'yellow';
        return 'green';
    }

    function statusBadgeHtml(status, idx) {
        const map = {
            green:  ['ef-s-green',  'Safe'],
            yellow: ['ef-s-yellow', 'Approaching'],
            red:    ['ef-s-red',    'Expired'],
        };
        const [cls, label] = map[status] ?? ['', ''];
        return `<span class="ef-status-badge ${cls}" id="bStatus-${idx}">
            <i class="bi bi-circle-fill" style="font-size:0.4rem"></i> ${label}
        </span>`;
    }

    function updateBadge(idx) {
        const dateEl = $(`bDate-${idx}`);
        const badge  = $(`bStatus-${idx}`);
        if (!dateEl || !badge) return;
        badge.outerHTML = dateEl.value
            ? statusBadgeHtml(calcStatus(dateEl.value), idx)
            : `<span class="ef-status-badge" id="bStatus-${idx}"></span>`;
    }

    /* ── Reset form UI ── */
    function _reset(productName) {
        $('efProductName').textContent  = productName;
        $('btnYes').className           = 'ef-toggle-btn';
        $('btnNo').className            = 'ef-toggle-btn';
        $('panelYes').classList.remove('show');
        $('panelNo').classList.remove('show');
        $('efSingleDate').value         = '';
        $('efBatchList').innerHTML      = '';
        $('efSaveBtn').disabled         = true;
        batchCount = 0;
    }

    /* ── Build a batch item element ── */
    function _buildBatchItem(prefill = {}) {
        batchCount++;
        const idx  = batchCount;
        const item = document.createElement('div');
        item.className = 'ef-batch-item';
        item.id        = `efBatch-${idx}`;

        const status    = prefill.expiry ? calcStatus(prefill.expiry) : null;
        const badgeHtml = status
            ? statusBadgeHtml(status, idx)
            : `<span class="ef-status-badge" id="bStatus-${idx}"></span>`;

        item.innerHTML = `
            <div class="ef-batch-head">
                <span class="ef-batch-lbl" id="bLbl-${idx}">
                    <i class="bi bi-layers" style="font-size:0.78rem;color:var(--mauve)"></i>
                    Batch ${idx} ${badgeHtml}
                </span>
                <button class="ef-batch-remove" onclick="ExpiryForm.removeBatch(${idx})" title="Remove">
                    <i class="bi bi-trash3"></i>
                </button>
            </div>
            <div class="ef-batch-grid">
                <div>
                    <label class="ef-label">Quantity</label>
                    <input type="number" class="ef-input" id="bQty-${idx}" min="1"
                        value="${prefill.qty ?? ''}" placeholder="0"
                        oninput="ExpiryForm.validate()">
                </div>
                <div>
                    <label class="ef-label">Expiry Date</label>
                    <input type="date" class="ef-input" id="bDate-${idx}"
                        value="${prefill.expiry ?? ''}"
                        oninput="ExpiryForm.updateBadge(${idx}); ExpiryForm.validate();">
                </div>
            </div>`;
        return item;
    }

    /* ── Re-number visible batch labels ── */
    function _reNumber() {
        document.querySelectorAll('#efBatchList .ef-batch-item').forEach((item, i) => {
            const lbl   = item.querySelector('.ef-batch-lbl');
            const badge = lbl?.querySelector('.ef-status-badge');
            if (!lbl) return;
            lbl.innerHTML = `<i class="bi bi-layers" style="font-size:0.78rem;color:var(--mauve)"></i> Batch ${i + 1} `;
            if (badge) lbl.appendChild(badge);
        });
    }

    /* ── Collect batch payload ── */
    function _collectBatches() {
        const batches = [];
        document.querySelectorAll('#efBatchList .ef-batch-item').forEach((item, i) => {
            const id  = item.id.replace('efBatch-', '');
            const qty = parseInt($(`bQty-${id}`)?.value) || 0;
            const dt  = $(`bDate-${id}`)?.value;
            if (qty > 0 && dt) batches.push({ label: `Batch ${i + 1}`, qty, expiry_date: dt, status: calcStatus(dt) });
        });
        return batches;
    }

    /* ── Open: Add mode ── */
    function open(pid, productName) {
        productId = pid;
        isEdit    = false;
        mode      = null;
        _reset(productName);
        $('efTitle').textContent  = 'Add Expiry Date';
        $('efIcon').className     = 'bi bi-calendar-plus';
        $('efEditBanner').classList.remove('show');
        _show();
    }

    /* ── Open: Edit single ── */
    function openSingle(pid, productName, dateValue) {
        productId = pid;
        isEdit    = true;
        mode      = true;
        _reset(productName);
        $('efTitle').textContent      = 'Edit Expiry Date';
        $('efIcon').className         = 'bi bi-pencil-square';
        $('efEditBanner').classList.add('show');
        $('btnYes').className         = 'ef-toggle-btn active-yes';
        $('panelYes').classList.add('show');
        $('efSingleDate').value       = dateValue ?? '';
        validate();
        _show();
    }

    /* ── Open: Edit batch ── */
    function openBatch(pid, productName, prefillBatches = []) {
        productId = pid;
        isEdit    = prefillBatches.length > 0;
        mode      = false;
        _reset(productName);
        $('efTitle').textContent  = isEdit ? 'Edit Expiry Date' : 'Add Expiry Date';
        $('efIcon').className     = isEdit ? 'bi bi-pencil-square' : 'bi bi-calendar-plus';
        isEdit
            ? $('efEditBanner').classList.add('show')
            : $('efEditBanner').classList.remove('show');
        $('btnNo').className      = 'ef-toggle-btn active-no';
        $('panelNo').classList.add('show');

        const list = $('efBatchList');
        if (prefillBatches.length) {
            prefillBatches.forEach(b => list.appendChild(_buildBatchItem(b)));
        } else {
            list.appendChild(_buildBatchItem());
        }
        validate();
        _show();
    }

    function _show() {
        $('efBackdrop').classList.add('open');
        document.body.classList.add('ef-open');
        document.body.style.overflow = 'hidden';
    }

    /* ── Close ── */
    function close() {
        $('efBackdrop').classList.remove('open');
        document.body.classList.remove('ef-open');
        document.body.style.overflow = '';
    }

    function closeOnBackdrop(e) {
        if (e.target === $('efBackdrop')) close();
    }

    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

    /* ── Mode toggle ── */
    function selectMode(isSingle) {
        mode = isSingle;
        $('btnYes').className = 'ef-toggle-btn' + (isSingle  ? ' active-yes' : '');
        $('btnNo').className  = 'ef-toggle-btn' + (!isSingle ? ' active-no'  : '');
        $('panelYes').classList.toggle('show',  isSingle);
        $('panelNo').classList.toggle('show',  !isSingle);
        if (!isSingle && $('efBatchList').children.length === 0) {
            $('efBatchList').appendChild(_buildBatchItem());
        }
        validate();
    }

    /* ── Batch management ── */
    function addBatch() {
        $('efBatchList').appendChild(_buildBatchItem());
        _reNumber();
        validate();
    }

    function removeBatch(idx) {
        $(`efBatch-${idx}`)?.remove();
        _reNumber();
        validate();
    }

    /* ── Validation ── */
    function validate() {
        const btn = $('efSaveBtn');
        if (mode === null && !isEdit) { btn.disabled = true; return; }
        if (mode === true) {
            btn.disabled = !$('efSingleDate').value;
            return;
        }
        btn.disabled = !_collectBatches().length;
    }

    /* ── Save → API ── */
    async function save() {
        const btn = $('efSaveBtn');
        btn.disabled  = true;
        btn.innerHTML = '<i class="bi bi-arrow-repeat" style="animation:ef-spin 0.7s linear infinite"></i> Saving...';

        let endpoint, method, payload;

        if (mode === true) {
            const date = $('efSingleDate').value;
            endpoint   = isEdit ? `/api/inventory/expiry/${productId}` : '/api/inventory/expiry/single';
            method     = isEdit ? 'PUT' : 'POST';
            payload    = { product_id: productId, type: 'single', expiry_date: date, status: calcStatus(date) };
        } else {
            endpoint   = isEdit ? `/api/inventory/expiry/${productId}` : '/api/inventory/expiry/batch';
            method     = isEdit ? 'PUT' : 'POST';
            payload    = { product_id: productId, type: 'batch', batches: _collectBatches() };
        }

        try {
            const res  = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type' : 'application/json',
                    'X-CSRF-TOKEN' : document.querySelector('meta[name="csrf-token"]').content,
                    'Accept'       : 'application/json',
                },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                if (typeof Inventory !== 'undefined') {
                    Inventory.onSaveSuccess(productId, data, isEdit);
                }
                close();
            } else {
                _showError(data.message ?? 'Something went wrong. Please try again.');
            }
        } catch {
            _showError('Network error. Please check your connection and try again.');
        } finally {
            btn.disabled  = false;
            btn.innerHTML = '<i class="bi bi-floppy"></i> Save Expiry Information';
            validate();
        }
    }

    /* ── Inline error inside the card ── */
    function _showError(msg) {
        let el = $('efErrorMsg');
        if (!el) {
            el = document.createElement('div');
            el.id        = 'efErrorMsg';
            el.className = 'ef-edit-banner show';
            el.style.cssText = 'background:hsla(0,70%,50%,0.08);border-color:hsla(0,70%,50%,0.3);color:hsl(0,60%,35%);margin-top:0.75rem;';
            $('efSaveBtn').insertAdjacentElement('afterend', el);
        }
        el.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i> ${msg}`;
        el.style.display = 'flex';
        setTimeout(() => { if (el) el.style.display = 'none'; }, 5000);
    }

    return { open, openSingle, openBatch, close, closeOnBackdrop, selectMode, addBatch, removeBatch, updateBadge, validate, save };
})();
</script>
@endpush