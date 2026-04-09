/**
 * inventory-dateform.js
 * Expiry Date Modal — Add / Edit (single date or batch-level)
 */
window.ExpiryForm = (() => {

let productId  = null;
let mode       = null;
let isEdit     = false;
let batchCount = 0;
let _isOpen    = false;
let _threshold = 14;
let _sallaQty     = 0;
let _usedQty      = 0;
let _userStarted  = false;  // يمنع التحذير قبل أول إدخال

    /* ── DOM helper ── */
    const $ = id => document.getElementById(id);

    /* ══════════════════════════════════════════
       STATUS HELPERS
    ══════════════════════════════════════════ */
    function _calcStatus(dateStr) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const days  = Math.floor((new Date(dateStr) - today) / 86400000);
        if (days <= 0) return 'red';
        if (days <= _threshold) return 'yellow';
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

    function _updateSingleStatus() {
        const dateEl   = $('efSingleDate');
        const statusEl = $('efSingleStatus');
        if (!statusEl) return;

        if (!dateEl?.value) {
            statusEl.className = 'ef-status-badge';
            statusEl.innerHTML = '';
            return;
        }

        const s = _calcStatus(dateEl.value);
        const map = {
            green:  ['ef-s-green',  'Safe'],
            yellow: ['ef-s-yellow', 'Approaching'],
            red:    ['ef-s-red',    'Expired'],
        };
        const [cls, label] = map[s];
        statusEl.className = `ef-status-badge ${cls}`;
        statusEl.innerHTML = `<i class="bi bi-circle-fill" style="font-size:0.4rem"></i> ${label}`;
    }

    /* ══════════════════════════════════════════
       QTY TRACKER
    ══════════════════════════════════════════ */
    function _getRemainingQty() {
        let entered = 0;
        document.querySelectorAll('#efBatchList .ef-batch-item').forEach(item => {
            const id  = item.id.replace('efBatch-', '');
            entered  += parseInt($(`bQty-${id}`)?.value) || 0;
        });
        return _sallaQty - _usedQty - entered;
    }

    function _updateQtyTracker() {
        const avail = $('efQtyAvail');
        const warn  = $('efQtyWarn');
        const msg   = $('efQtyWarnMsg');
        if (!avail) return;

        // في حالة single mode نعرض الكمية الكلية فقط
        if (mode === true) {
            avail.textContent = _sallaQty;
            if (warn) warn.style.display = 'none';
            return;
        }

        const remaining = _getRemainingQty();
        avail.textContent = remaining >= 0 ? remaining : 0;

        if (!warn || !msg) return;

        if (remaining < 0) {
            // تجاوز — أحمر (يظهر دائماً)
            msg.textContent    = `Exceeded by ${Math.abs(remaining)} units — reduce batch quantities`;
            warn.className     = 'ef-qty-warn ef-qty-over';
            warn.style.display = 'flex';
        } else if (remaining === 0 && _userStarted) {
            // مكتمل — أخضر (بعد إدخال فقط)
            msg.textContent    = '✓ All units assigned — ready to save';
            warn.className     = 'ef-qty-warn ef-qty-full';
            warn.style.display = 'flex';
        } else if (remaining <= 3 && _userStarted) {
            // قليل — برتقالي (بعد إدخال فقط)
            msg.textContent    = `Only ${remaining} unit${remaining > 1 ? 's' : ''} left to assign`;
            warn.className     = 'ef-qty-warn ef-qty-low';
            warn.style.display = 'flex';
        } else {
            warn.style.display = 'none';
        }
    }

    /* ══════════════════════════════════════════
       RESET — clears DOM + state completely
    ══════════════════════════════════════════ */
    function _reset(productName) {
        mode          = null;
        batchCount    = 0;
        _userStarted  = false;

        $('efProductName').textContent = productName ?? '';
        $('btnYes').className          = 'ef-toggle-btn';
        $('btnNo').className           = 'ef-toggle-btn';
        $('panelYes').classList.remove('show');
        $('panelNo').classList.remove('show');
        $('efSingleDate').value        = '';
        $('efSingleBatchCode').value   = '';
        $('efBatchList').innerHTML     = '';
        $('efSaveBtn').disabled        = true;

        // تحديث عرض الكمية الكلية
        const avail = $('efQtyAvail');
        if (avail) avail.textContent = _sallaQty > 0 ? _sallaQty : '—';

        const warn = $('efQtyWarn');
        if (warn) warn.style.display = 'none';

        const err = $('efErrorMsg');
        if (err) err.style.display = 'none';
    }

    /* ══════════════════════════════════════════
       BATCH ITEM BUILDER
    ══════════════════════════════════════════ */
    function _buildBatchItem(prefill = {}) {
        batchCount++;
        const idx = batchCount;

        const status = prefill.status
            ?? (prefill.expiry ? _calcStatus(prefill.expiry) : null);

        const item = document.createElement('div');
        item.className = 'ef-batch-item';
        item.id        = `efBatch-${idx}`;

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
    </div>
    <input type="hidden" id="bCode-${idx}" value="${prefill.batch_code ?? ''}">`;

        item.querySelector('.ef-batch-remove')
            .addEventListener('click', () => removeBatch(idx));
        item.querySelector(`#bQty-${idx}`)
            .addEventListener('input', () => { _userStarted = true; _updateQtyTracker(); validate(); });
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
        document.querySelectorAll('#efBatchList .ef-batch-item').forEach((item) => {
            const id  = item.id.replace('efBatch-', '');
            const qty = parseInt($(`bQty-${id}`)?.value) || 0;
            const dt  = $(`bDate-${id}`)?.value;
            if (qty > 0 && dt) {
                batches.push({
                    qty,
                    expiry_date: dt,
                    batch_code:  $(`bCode-${id}`)?.value || null,
                    status:      _calcStatus(dt),
                });
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
        // تحديث الـ tracker بعد الفتح مباشرة
        _updateQtyTracker();
    }

    function close() {
        _isOpen = false;
        $('efBackdrop').classList.remove('open');
        document.body.classList.remove('ef-open');
        document.body.style.overflow = '';

        productId     = null;
        mode          = null;
        isEdit        = false;
        batchCount    = 0;
        _threshold    = 14;
        _sallaQty     = 0;
        _usedQty      = 0;
        _userStarted  = false;

        $('btnYes').className = 'ef-toggle-btn';
        $('btnNo').className  = 'ef-toggle-btn';
        $('panelYes').classList.remove('show');
        $('panelNo').classList.remove('show');
        $('efSingleDate').value    = '';
        $('efBatchList').innerHTML = '';
        $('efSaveBtn').disabled    = true;
        $('efEditBanner').classList.remove('show');

        const avail = $('efQtyAvail');
        if (avail) avail.textContent = '—';

        const warn = $('efQtyWarn');
        if (warn) warn.style.display = 'none';

        const err = $('efErrorMsg');
        if (err) err.style.display = 'none';
    }

    /* ══════════════════════════════════════════
       OPEN VARIANTS
    ══════════════════════════════════════════ */
    function open(pid, productName, threshold = 14) {
        productId  = pid;
        isEdit     = false;
        _threshold = threshold;
        const row  = document.querySelector(`#invBody tr[data-id="${pid}"]`);
        _sallaQty  = parseInt(row?.dataset.sallaQty) || 0;
        _usedQty   = 0;
        _reset(productName);
        $('efTitle').textContent = 'Add Expiry Date';
        $('efIcon').className    = 'bi bi-calendar-plus';
        $('efEditBanner').classList.remove('show');
        _show();
    }

    function openSingle(pid, productName, dateValue, batchCode, threshold = 14) {
        productId  = pid;
        isEdit     = true;
        _threshold = threshold;
        const row  = document.querySelector(`#invBody tr[data-id="${pid}"]`);
        _sallaQty  = parseInt(row?.dataset.sallaQty) || 0;
        _usedQty   = 0;
        _reset(productName);
        mode = true;
        $('efTitle').textContent   = 'Edit Expiry Date';
        $('efIcon').className      = 'bi bi-pencil-square';
        $('efEditBanner').classList.add('show');
        $('btnYes').className      = 'ef-toggle-btn active-yes';
        $('panelYes').classList.add('show');
        $('efSingleDate').value      = dateValue ?? '';
        $('efSingleBatchCode').value = batchCode ?? '';
        validate();
        _updateSingleStatus();
        _show();
    }

    function openBatch(pid, productName, prefillBatches = [], threshold = 14) {
        productId  = pid;
        isEdit     = prefillBatches.length > 0;
        _threshold = threshold;
        const row  = document.querySelector(`#invBody tr[data-id="${pid}"]`);
        _sallaQty  = parseInt(row?.dataset.sallaQty) || 0;
        _usedQty   = 0;
        _reset(productName);
        mode = false;
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
        _updateQtyTracker();
        validate();
    }

    /* ══════════════════════════════════════════
       BATCH MANAGEMENT
    ══════════════════════════════════════════ */
    function addBatch() {
        $('efBatchList').appendChild(_buildBatchItem());
        _reNumber();
        _updateQtyTracker();
        validate();
    }

    function removeBatch(idx) {
        $(`efBatch-${idx}`)?.remove();
        _reNumber();
        _updateQtyTracker();
        validate();
    }

    /* ══════════════════════════════════════════
       VALIDATION
    ══════════════════════════════════════════ */
    function validate() {
        const btn = $('efSaveBtn');
        _updateQtyTracker();

        if (mode === null && !isEdit) { btn.disabled = true; return; }

        if (mode === true) {
            btn.disabled = !$('efSingleDate').value;
            return;
        }

        const batches   = _collectBatches();
        const remaining = _getRemainingQty();

        if (!batches.length)   { btn.disabled = true;  return; }
        if (remaining < 0)     { btn.disabled = true;  return; }
        if (remaining > 0)     { btn.disabled = true;  return; }

        btn.disabled = false;
    }

    /* ══════════════════════════════════════════
       SAVE → API
    ══════════════════════════════════════════ */
    async function save() {
        const btn = $('efSaveBtn');
        btn.disabled  = true;
        btn.innerHTML = '<i class="bi bi-arrow-repeat" style="animation:ef-spin 0.7s linear infinite"></i> Saving...';

        const collectedBatches = mode === false ? _collectBatches() : [];
        let endpoint, payload;

        if (mode === true) {
            const date = $('efSingleDate').value;
            endpoint   = `/inventory/products/${productId}/expiry`;
            payload    = {
                product_id:   productId,
                same_expiry:  true,
                single_batch: {
                    expiry_date: date,
                    batch_code:  $('efSingleBatchCode')?.value || null,
                },
            };
        } else {
            endpoint = `/inventory/products/${productId}/expiry`;
            payload  = {
                product_id:  productId,
                same_expiry: false,
                batches:     collectedBatches.map(b => ({
                    expiry_date: b.expiry_date,
                    quantity:    b.qty,
                    batch_code:  b.batch_code || null,
                })),
            };
        }

        try {
            const res  = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'Accept'      : 'application/json',
                },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                const successPayload = mode === true
                    ? {
                        type:        'single',
                        expiry_date: payload.single_batch.expiry_date,
                        batch_code:  data.batch_code,
                        status:      data.status,
                        quantity:    data.quantity,
                    }
                    : {
                        type:    'batch',
                        batches: data.batches,
                        status:  data.status,
                    };
                Inventory.onSaveSuccess(productId, successPayload, isEdit);
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
       EVENT LISTENERS
    ══════════════════════════════════════════ */
    function _initListeners() {
        $('efBackdrop')?.addEventListener('click', e => { if (e.target === $('efBackdrop')) close(); });
        $('efCloseBtn')?.addEventListener('click', close);
        $('btnYes')?.addEventListener('click', () => selectMode(true));
        $('btnNo')?.addEventListener('click',  () => selectMode(false));
        $('efSingleDate')?.addEventListener('input', () => {
            _updateSingleStatus();
            validate();
        });
        $('efAddBatchBtn')?.addEventListener('click', addBatch);
        $('efSaveBtn')?.addEventListener('click', save);
    }

    document.addEventListener('DOMContentLoaded', _initListeners);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && _isOpen) close(); });

    window.addEventListener('pageshow', e => {
        if (e.persisted && _isOpen) close();
    });

    /* ── Public API ── */
    return { open, openSingle, openBatch, close, selectMode, addBatch, removeBatch, updateBadge, validate, save };

})();
