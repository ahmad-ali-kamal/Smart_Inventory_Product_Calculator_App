/**
 * inventory-dateform.js
 * Expiry Date Modal — Add / Edit (single date or batch-level)
 *
 * exposes window.ExpiryForm because the blade partial renders the modal HTML
 * statically and products.js calls ExpiryForm.open*() to open it.
 *
 * API Endpoints:
 *   ADD  single  POST  /api/inventory/expiry/single   { product_id, expiry_date, status }
 *   ADD  batch   POST  /api/inventory/expiry/batch    { product_id, batches:[{label,qty,expiry_date,status}] }
 *   EDIT         PUT   /api/inventory/expiry/{id}     { product_id, type, expiry_date?, batches? }
 *
 * Success callback: Inventory.onSaveSuccess(productId, data, wasEdit)
 *
 * Fixes:
 *   1. close() now fully resets state so re-opening always works
 *   2. pageshow listener handles bfcache (back-forward cache) restore
 *   3. toggleBatch eye-icon state is preserved correctly
 */
window.ExpiryForm = (() => {

    /* ── State ── */
    let productId  = null;
    let mode       = null;   // true = single | false = batch | null = not chosen
    let isEdit     = false;
    let batchCount = 0;
    let _isOpen    = false;  // track modal visibility

    /* ── DOM helper ── */
    const $ = id => document.getElementById(id);

    /* ══════════════════════════════════════════
       STATUS HELPERS
    ══════════════════════════════════════════ */
    function _calcStatus(dateStr) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const days  = Math.floor((new Date(dateStr) - today) / 86400000);
        if (days < 0)  return 'red';
        if (days <= 7) return 'yellow';
        return 'green';
    }

    function _statusBadgeHtml(status, idx) {
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

    /* ══════════════════════════════════════════
       BADGE UPDATE
    ══════════════════════════════════════════ */
    function updateBadge(idx) {
        const dateEl = $(`bDate-${idx}`);
        const badge  = $(`bStatus-${idx}`);
        if (!dateEl || !badge) return;
        badge.outerHTML = dateEl.value
            ? _statusBadgeHtml(_calcStatus(dateEl.value), idx)
            : `<span class="ef-status-badge" id="bStatus-${idx}"></span>`;
    }

    /* ══════════════════════════════════════════
       RESET — clears DOM + state completely
    ══════════════════════════════════════════ */
    function _reset(productName) {
        // state
        mode       = null;
        batchCount = 0;

        // DOM
        $('efProductName').textContent = productName ?? '';
        $('btnYes').className          = 'ef-toggle-btn';
        $('btnNo').className           = 'ef-toggle-btn';
        $('panelYes').classList.remove('show');
        $('panelNo').classList.remove('show');
        $('efSingleDate').value        = '';
        $('efBatchList').innerHTML     = '';
        $('efSaveBtn').disabled        = true;

        // clear any lingering error message
        const err = $('efErrorMsg');
        if (err) err.style.display = 'none';
    }

    /* ══════════════════════════════════════════
       BATCH ITEM BUILDER
    ══════════════════════════════════════════ */
    function _buildBatchItem(prefill = {}) {
        batchCount++;
        const idx  = batchCount;
        const item = document.createElement('div');
        item.className = 'ef-batch-item';
        item.id        = `efBatch-${idx}`;

        const status    = prefill.expiry ? _calcStatus(prefill.expiry) : null;
        const badgeHtml = status
            ? _statusBadgeHtml(status, idx)
            : `<span class="ef-status-badge" id="bStatus-${idx}"></span>`;

        item.innerHTML = `
            <div class="ef-batch-head">
                <span class="ef-batch-lbl" id="bLbl-${idx}">
                    <i class="bi bi-layers" style="font-size:0.78rem;color:var(--mauve)"></i>
                    Batch ${idx} ${badgeHtml}
                </span>
                <button class="ef-batch-remove" data-idx="${idx}" title="Remove">
                    <i class="bi bi-trash3"></i>
                </button>
            </div>
            <div class="ef-batch-grid">
                <div>
                    <label class="ef-label">Quantity</label>
                    <input type="number" class="ef-input" id="bQty-${idx}" min="1"
                           value="${prefill.qty ?? ''}" placeholder="0">
                </div>
                <div>
                    <label class="ef-label">Expiry Date</label>
                    <input type="date" class="ef-input" id="bDate-${idx}"
                           value="${prefill.expiry ?? ''}">
                </div>
            </div>`;

        item.querySelector('.ef-batch-remove')
            .addEventListener('click', () => removeBatch(idx));
        item.querySelector(`#bQty-${idx}`)
            .addEventListener('input', validate);
        item.querySelector(`#bDate-${idx}`)
            .addEventListener('input', () => { updateBadge(idx); validate(); });

        return item;
    }

    /* ── Re-number batch labels after removal ── */
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
            if (qty > 0 && dt) {
                batches.push({ label: `Batch ${i + 1}`, qty, expiry_date: dt, status: _calcStatus(dt) });
            }
        });
        return batches;
    }

    /* ══════════════════════════════════════════
       SHOW / CLOSE
    ══════════════════════════════════════════ */
    function _show() {
        _isOpen = true;
        $('efBackdrop').classList.add('open');
        document.body.classList.add('ef-open');
        document.body.style.overflow = 'hidden';
    }

    function close() {
        _isOpen = false;
        $('efBackdrop').classList.remove('open');
        document.body.classList.remove('ef-open');
        document.body.style.overflow = '';

        // ── Full state reset so next open() starts clean ──
        productId  = null;
        mode       = null;
        isEdit     = false;
        batchCount = 0;

        // ── DOM reset ──
        $('btnYes').className = 'ef-toggle-btn';
        $('btnNo').className  = 'ef-toggle-btn';
        $('panelYes').classList.remove('show');
        $('panelNo').classList.remove('show');
        $('efSingleDate').value    = '';
        $('efBatchList').innerHTML = '';
        $('efSaveBtn').disabled    = true;
        $('efEditBanner').classList.remove('show');
        const err = $('efErrorMsg');
        if (err) err.style.display = 'none';
    }

    /* ══════════════════════════════════════════
       OPEN VARIANTS
    ══════════════════════════════════════════ */
    function open(pid, productName) {
        productId = pid;
        isEdit    = false;
        _reset(productName);
        $('efTitle').textContent = 'Add Expiry Date';
        $('efIcon').className    = 'bi bi-calendar-plus';
        $('efEditBanner').classList.remove('show');
        _show();
    }

    function openSingle(pid, productName, dateValue) {
        productId = pid;
        isEdit    = true;
        mode      = true;
        _reset(productName);
        $('efTitle').textContent    = 'Edit Expiry Date';
        $('efIcon').className       = 'bi bi-pencil-square';
        $('efEditBanner').classList.add('show');
        $('btnYes').className       = 'ef-toggle-btn active-yes';
        $('panelYes').classList.add('show');
        $('efSingleDate').value     = dateValue ?? '';
        validate();
        _show();
    }

    function openBatch(pid, productName, prefillBatches = []) {
        productId = pid;
        isEdit    = prefillBatches.length > 0;
        mode      = false;
        _reset(productName);
        $('efTitle').textContent = isEdit ? 'Edit Expiry Date' : 'Add Expiry Date';
        $('efIcon').className    = isEdit ? 'bi bi-pencil-square' : 'bi bi-calendar-plus';
        isEdit
            ? $('efEditBanner').classList.add('show')
            : $('efEditBanner').classList.remove('show');
        $('btnNo').className = 'ef-toggle-btn active-no';
        $('panelNo').classList.add('show');

        const list = $('efBatchList');
        (prefillBatches.length ? prefillBatches : [{}])
            .forEach(b => list.appendChild(_buildBatchItem(b)));

        validate();
        _show();
    }

    /* ══════════════════════════════════════════
       MODE TOGGLE
    ══════════════════════════════════════════ */
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

    /* ══════════════════════════════════════════
       BATCH MANAGEMENT
    ══════════════════════════════════════════ */
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

    /* ══════════════════════════════════════════
       VALIDATION
    ══════════════════════════════════════════ */
    function validate() {
        const btn = $('efSaveBtn');
        if (mode === null && !isEdit) { btn.disabled = true; return; }
        if (mode === true)            { btn.disabled = !$('efSingleDate').value; return; }
        btn.disabled = !_collectBatches().length;
    }

    /* ══════════════════════════════════════════
       SAVE → API
    ══════════════════════════════════════════ */
    async function save() {
        const btn = $('efSaveBtn');
        btn.disabled  = true;
        btn.innerHTML = '<i class="bi bi-arrow-repeat" style="animation:ef-spin 0.7s linear infinite"></i> Saving...';

        let endpoint, method, payload;

        if (mode === true) {
            const date = $('efSingleDate').value;
            endpoint   = isEdit ? `/api/inventory/expiry/${productId}` : '/api/inventory/expiry/single';
            method     = isEdit ? 'PUT' : 'POST';
            payload    = { product_id: productId, type: 'single', expiry_date: date, status: _calcStatus(date) };
        } else {
            endpoint   = isEdit ? `/api/inventory/expiry/${productId}` : '/api/inventory/expiry/batch';
            method     = isEdit ? 'PUT' : 'POST';
            payload    = { product_id: productId, type: 'batch', batches: _collectBatches() };
        }

        try {
            const res  = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'Accept'      : 'application/json',
                },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                Inventory.onSaveSuccess(productId, data, isEdit);
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

    /* ══════════════════════════════════════════
       INLINE ERROR
    ══════════════════════════════════════════ */
    function _showError(msg) {
        let el = $('efErrorMsg');
        if (!el) {
            el = document.createElement('div');
            el.id        = 'efErrorMsg';
            el.className = 'ef-edit-banner show';
            el.style.cssText = 'background:hsla(0,70%,50%,0.08);border-color:hsla(0,70%,50%,0.3);color:hsl(0,60%,35%);margin-top:0.75rem;';
            $('efSaveBtn').insertAdjacentElement('afterend', el);
        }
        el.innerHTML     = `<i class="bi bi-exclamation-triangle-fill"></i> ${msg}`;
        el.style.display = 'flex';
        setTimeout(() => { if (el) el.style.display = 'none'; }, 5000);
    }

    /* ══════════════════════════════════════════
       EVENT LISTENERS SETUP
       — extracted to a named function so it can
         be called again after bfcache restore
    ══════════════════════════════════════════ */
    function _initListeners() {
        $('efBackdrop')?.addEventListener('click', e => { if (e.target === $('efBackdrop')) close(); });
        $('efCloseBtn')?.addEventListener('click', close);
        $('btnYes')?.addEventListener('click', () => selectMode(true));
        $('btnNo')?.addEventListener('click',  () => selectMode(false));
        $('efSingleDate')?.addEventListener('input', validate);
        $('efAddBatchBtn')?.addEventListener('click', addBatch);
        $('efSaveBtn')?.addEventListener('click', save);
    }

    document.addEventListener('DOMContentLoaded', _initListeners);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && _isOpen) close(); });

    // ── bfcache fix: إذا رجع المستخدم بزر الرجوع في المتصفح ──
    // المتصفح يستعيد الصفحة من الـ cache بدون إعادة تشغيل JS
    // pageshow يُطلق في هذه الحالة مع persisted = true
    window.addEventListener('pageshow', e => {
        if (e.persisted) {
            // أغلق الـ modal لو كان مفتوحاً وقت المغادرة
            if (_isOpen) close();
        }
    });

    /* ── Public API ── */
    return { open, openSingle, openBatch, close, selectMode, addBatch, removeBatch, updateBadge, validate, save };

})();