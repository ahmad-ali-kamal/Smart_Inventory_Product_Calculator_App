/**
 * inventory-products.js
 * Products Page — Filter, Batch Toggle, Form Bridge, Toast
 *
 * exposes window.Inventory because dateform.js and discountform.js
 * need to call back into this module after a successful save.
 *
 * Fixes:
 *   1. toggleBatch — eye icon state syncs correctly on every toggle
 *   2. bfcache fix via pageshow — filter re-applies on back navigation
 *   3. _applyFilter called on DOMContentLoaded to set correct initial count
 */
window.Inventory = (() => {

    /* ── State ── */
    let currentFilter = 'all';

    /* ══════════════════════════════════════════
       TOAST
    ══════════════════════════════════════════ */
    let _toastTimer = null;

    function _showToast(msg, type = 'add') {
        const toast = document.getElementById('invToast');
        const icon  = document.getElementById('invToastIcon');
        const msgEl = document.getElementById('invToastMsg');
        if (!toast) return;

        toast.className   = `inv-toast toast-${type}`;
        icon.className    = type === 'add' ? 'bi bi-check-circle-fill' : 'bi bi-pencil-square';
        msgEl.textContent = msg;
        toast.classList.add('show');

        clearTimeout(_toastTimer);
        _toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
    }

    /* ══════════════════════════════════════════
       TOGGLE BATCH ROWS
       eye icon: closed = bi-eye | open = bi-eye-slash
    ══════════════════════════════════════════ */
    function toggleBatch(productId) {
        const rows   = document.querySelectorAll(`.batch-row[data-parent="${productId}"]`);
        const eye    = document.getElementById(`eye-${productId}`);
        if (!rows.length) return;

        const isOpen = rows[0].classList.contains('open');

        rows.forEach(r => {
            r.classList.toggle('open', !isOpen);
            // show/hide the row — batch rows start as display:none
            r.style.display = !isOpen ? '' : 'none';
        });

        // icon: eye = "rows hidden", eye-slash = "rows visible"
        if (eye) eye.className = !isOpen ? 'bi bi-eye-slash' : 'bi bi-eye';
    }

    /* ══════════════════════════════════════════
       OPEN EXPIRY FORM
    ══════════════════════════════════════════ */
    function openForm(productId, productName) {
        const row = document.querySelector(`#invBody tr[data-id="${productId}"]`);
        if (!row) return;

        let batches = [];
        try { batches = JSON.parse(row.dataset.batches || '[]'); } catch (e) {}

        if (row.dataset.expiryType === 'single' || (batches.length === 0 && row.dataset.expiry)) {
            ExpiryForm.openSingle(productId, productName, row.dataset.expiry);
        } else {
            ExpiryForm.openBatch(productId, productName, batches);
        }
    }

    /* ══════════════════════════════════════════
       CALLED BY ExpiryForm AFTER SUCCESSFUL SAVE
    ══════════════════════════════════════════ */
    function onSaveSuccess(productId, payload, wasEdit) {
        const row        = document.querySelector(`#invBody tr[data-id="${productId}"]`);
        const expiryCell = document.getElementById(`expiry-cell-${productId}`);
        const actionBtn  = document.getElementById(`btn-expiry-${productId}`);
        if (!row) return;

        if (payload.type === 'single') {
            row.dataset.expiry     = payload.expiry_date;
            row.dataset.expiryType = 'single';
            row.dataset.batches    = '[]';
            expiryCell.innerHTML   = `
                <div class="exp-cell">
                    <i class="bi bi-calendar3" style="font-size:0.78rem;"></i>
                    <span style="color:var(--muted);">${payload.expiry_date}</span>
                </div>`;

        } else if (payload.type === 'batch' && payload.batches?.length) {
            const normalized = payload.batches.map(b => ({
                label: b.label, qty: b.qty, status: b.status,
                expiry: b.expiry_date ?? b.expiry,
            }));
            row.dataset.batches    = JSON.stringify(normalized);
            row.dataset.expiryType = 'batch';
            row.dataset.expiry     = '';
            const count            = payload.batches.length;
            expiryCell.innerHTML   = `
                <div class="exp-cell">
                    <button class="btn-eye" data-product-id="${productId}">
                        <i class="bi bi-eye" id="eye-${productId}"></i>
                    </button>
                    <span>${count} batch${count > 1 ? 'es' : ''}</span>
                </div>`;

            expiryCell.querySelector('.btn-eye')
                .addEventListener('click', () => toggleBatch(productId));
        }

        if (actionBtn) {
            actionBtn.className = 'btn-expiry is-edit';
            actionBtn.innerHTML = '<i class="bi bi-pencil-square"></i> Edit Expiry Date';
            const fresh = actionBtn.cloneNode(true);
            actionBtn.replaceWith(fresh);
            fresh.addEventListener('click', () =>
                openForm(productId, row.querySelector('.prod-name')?.textContent?.trim() ?? '')
            );
        }

        _showToast(
            wasEdit ? 'Expiry date updated successfully' : 'Expiry date added successfully',
            wasEdit ? 'edit' : 'add'
        );
    }

    /* ══════════════════════════════════════════
       CALLED BY DiscountForm AFTER SUCCESS
    ══════════════════════════════════════════ */
    function onDiscountSuccess(productId, data) {
        const row = document.querySelector(`#invBody tr[data-id="${productId}"]`);
        if (!row) return;

        let pill = row.querySelector('.disc-pill');
        if (!pill) {
            pill = document.createElement('div');
            pill.className = 'disc-pill';
            row.querySelector('.prod-name')?.insertAdjacentElement('afterend', pill);
        }
        pill.innerHTML = `<i class="bi bi-tag-fill"></i> ${data.percent}% &bull; Active`;

        _showToast('Discount applied successfully', 'add');
    }

    /* ══════════════════════════════════════════
       FILTER TABS
    ══════════════════════════════════════════ */
    function filter(btn) {
        currentFilter = btn.dataset.filter;
        document.querySelectorAll('.inv-filter-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        _applyFilter();
    }

    function _applyFilter() {
        let count = 0;

        document.querySelectorAll('#invBody tr[data-filter]:not(.batch-row)').forEach(row => {
            const visible = currentFilter === 'all' || row.dataset.filter === currentFilter;
            row.style.display = visible ? '' : 'none';
            if (visible) count++;

            // keep batch rows in sync with parent visibility
            const eyeEl = row.querySelector('[id^="eye-"]');
            if (eyeEl) {
                const pid = eyeEl.id.replace('eye-', '');
                document.querySelectorAll(`.batch-row[data-parent="${pid}"]`).forEach(r => {
                    if (!visible) {
                        r.classList.remove('open');
                        r.style.display = 'none';
                    } else {
                        // keep their current open/closed state
                        r.style.display = r.classList.contains('open') ? '' : 'none';
                    }
                });
            }
        });

        const footer = document.getElementById('invFooter');
        const empty  = document.getElementById('invEmpty');
        if (footer) footer.innerHTML = `<i class="bi bi-box-seam"></i> Showing ${count} products from your Salla store`;
        if (empty)  empty.style.display = count === 0 ? 'block' : 'none';
    }

    /* ══════════════════════════════════════════
       EVENT DELEGATION
    ══════════════════════════════════════════ */
    function _initListeners() {
        // Filter tabs
        document.querySelectorAll('.inv-filter-tab').forEach(tab => {
            tab.addEventListener('click', () => filter(tab));
        });

        // Expiry + batch-edit + eye buttons — single delegated listener on tbody
        document.getElementById('invBody')?.addEventListener('click', e => {
            const expiryBtn = e.target.closest('.btn-expiry, .btn-edit-batch');
            if (expiryBtn) {
                openForm(expiryBtn.dataset.productId, expiryBtn.dataset.productName);
                return;
            }
            const eyeBtn = e.target.closest('.btn-eye');
            if (eyeBtn && eyeBtn.dataset.productId) {
                toggleBatch(eyeBtn.dataset.productId);
            }
        });

        // apply filter on load to set correct footer count
        _applyFilter();
    }

    document.addEventListener('DOMContentLoaded', _initListeners);

    // ── bfcache fix: re-apply filter state after back navigation ──
    window.addEventListener('pageshow', e => {
        if (e.persisted) {
            // restore active filter tab UI
            const activeTab = document.querySelector(`.inv-filter-tab[data-filter="${currentFilter}"]`);
            if (activeTab) {
                document.querySelectorAll('.inv-filter-tab').forEach(t => t.classList.remove('active'));
                activeTab.classList.add('active');
            }
            _applyFilter();
        }
    });

    /* ── Public API ── */
    return { toggleBatch, openForm, onSaveSuccess, onDiscountSuccess, filter };

})();