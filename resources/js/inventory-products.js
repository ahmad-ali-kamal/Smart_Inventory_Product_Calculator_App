/**
 * inventory-products.js
 * Products Page — Filter, Batch Toggle, Form Bridge, Toast
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
    ══════════════════════════════════════════ */
    function toggleBatch(productId) {
        const rows = document.querySelectorAll(`.batch-row[data-parent="${productId}"]`);
        const eye  = document.getElementById(`eye-${productId}`);
        if (!rows.length) return;

        const isOpen = rows[0].classList.contains('open');

        rows.forEach(r => {
            r.classList.toggle('open', !isOpen);
            r.style.display = !isOpen ? 'table-row' : 'none';
        });

        if (eye) eye.className = !isOpen ? 'bi bi-eye-slash' : 'bi bi-eye';
    }

    /* ══════════════════════════════════════════
       HELPER — build a single batch <tr>
       6 columns: batch-code | (empty) | status | qty | date | (empty)
       مخفية من البداية دائماً
    ══════════════════════════════════════════ */
    function _buildBatchRow(productId, b, category = '') {
    const statusClass = b.status || 'green';
    const statusText  = statusClass === 'red' ? 'Expired'
                      : statusClass === 'yellow' ? 'Approaching' : 'Safe';

    const tr = document.createElement('tr');
    tr.className      = 'batch-row';
    tr.dataset.parent = productId;
    tr.style.display  = 'none';

    tr.innerHTML = `
        <td>
            <div class="prod-cell">
                <span class="batch-label-field">
                    <i class="bi bi-layers"></i> ${b.batch_code || 'N/A'}
                </span>
            </div>
        </td>
        <td><span class="b-cat">${category}</span></td>
        <td><span class="badge b-${statusClass}">${statusText}</span></td>
        <td style="color:var(--muted);">${b.qty ?? b.quantity ?? 0} units</td>
        <td>
            <div class="exp-cell">
                <i class="bi bi-calendar3" style="font-size:0.78rem;"></i>
                <span style="color:var(--muted);">${b.expiry ?? b.expiry_date ?? 'No Date'}</span>
            </div>
        </td>
        <td></td>`;

    return tr;
}

    /* ══════════════════════════════════════════
       OPEN EXPIRY FORM
    ══════════════════════════════════════════ */
    function openForm(productId, productName) {
        const row = document.querySelector(`#invBody tr[data-id="${productId}"]`);
        if (!row) return;

        let batches = [];
        try { batches = JSON.parse(row.dataset.batches || '[]'); } catch (e) {}

        const threshold = parseInt(row.dataset.threshold) || 14;

        if (row.dataset.originalType === 'single' || row.dataset.expiryType === 'single' || (batches.length === 0 && row.dataset.expiry)) {
            const b = batches[0];
            ExpiryForm.openSingle(productId, productName, b?.expiry ?? row.dataset.expiry, b?.batch_code ?? row.dataset.batchCode, threshold);
        } else if (row.dataset.expiryType === 'batch' || batches.length > 0) {
            ExpiryForm.openBatch(productId, productName, batches, threshold);
        } else {
            ExpiryForm.open(productId, productName, threshold);
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
        const category = row.querySelector('td:nth-child(2) .b-cat')?.textContent?.trim() ?? '';

        row.dataset.originalType = payload.type;

        // تحديث خانة Status
        const statusCell = row.querySelector('td:nth-child(3)');
        if (statusCell && payload.status) {
            const statusMap = {
                green:  ['b-green',  'Safe'],
                yellow: ['b-yellow', 'Approaching'],
                red:    ['b-red',    'Expired'],
            };
            const [cls, label] = statusMap[payload.status] ?? ['b-none', 'No expiry set'];
            statusCell.innerHTML = `<span class="badge ${cls}">${label}</span>`;
            const qtyCell = row.querySelector('td:nth-child(4)');
if (qtyCell) {
    const sallaQty = parseInt(row.dataset.sallaQty) || 0;
    const newUsedQty = (payload.batches ?? [{ quantity: payload.quantity }])
        .reduce((sum, b) => sum + (b.qty ?? b.quantity ?? 0), 0);
    row.dataset.usedQty = newUsedQty;
    qtyCell.innerHTML = sallaQty > 0 
        ? `<span class="qty-pill">${newUsedQty} / ${sallaQty}</span>`
        : `<span style="color:var(--muted)">—</span>`;
}
        }

        // احذف الـ batch rows القديمة
        document.querySelectorAll(`.batch-row[data-parent="${productId}"]`).forEach(r => r.remove());

        if (payload.type === 'single') {
            const singleBatch = [{
                batch_code: payload.batch_code,
                qty:        payload.quantity,
                status:     payload.status,
                expiry:     payload.expiry_date,
            }];
            row.dataset.batches    = JSON.stringify(singleBatch);
            row.dataset.expiryType = 'batch';
            row.dataset.expiry     = '';

            expiryCell.innerHTML = `
                <div class="exp-cell">
                    <button class="btn-eye" data-product-id="${productId}">
                        <i class="bi bi-eye" id="eye-${productId}"></i>
                    </button>
                    <span>1 batch</span>
                </div>`;

            row.insertAdjacentElement('afterend', _buildBatchRow(productId, {
    batch_code: payload.batch_code,
    qty:        payload.quantity,
    status:     payload.status,
    expiry:     payload.expiry_date,
}, category));

        } else if (payload.type === 'batch' && payload.batches?.length) {
            const normalized = payload.batches.map(b => ({
                label:      b.label,
                qty:        b.qty,
                status:     b.status,
                expiry:     (b.expiry_date ?? b.expiry ?? '').substring(0, 10),
                batch_code: b.batch_code ?? null,
            }));

            row.dataset.batches    = JSON.stringify(normalized);
            row.dataset.expiryType = 'batch';
            row.dataset.expiry     = '';

            const count          = payload.batches.length;
            expiryCell.innerHTML = `
                <div class="exp-cell">
                    <button class="btn-eye" data-product-id="${productId}">
                        <i class="bi bi-eye" id="eye-${productId}"></i>
                    </button>
                    <span>${count} batch</span>
                </div>`;

            let lastRow = row;
            normalized.forEach(b => {
    const tr = _buildBatchRow(productId, b, category);
                lastRow.insertAdjacentElement('afterend', tr);
                lastRow = tr;
            });
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
       FILTER — DROPDOWN
    ══════════════════════════════════════════ */
    function _applyFilter() {
        let count = 0;

        document.querySelectorAll('#invBody tr[data-filter]:not(.batch-row)').forEach(row => {
            const visible = currentFilter === 'all' || row.dataset.filter === currentFilter;
            row.style.display = visible ? '' : 'none';
            if (visible) count++;

            const pid = row.dataset.id;
            if (pid) {
                document.querySelectorAll(`.batch-row[data-parent="${pid}"]`).forEach(r => {
                    if (!visible) {
                        r.classList.remove('open');
                        r.style.display = 'none';
                    } else {
                        r.style.display = r.classList.contains('open') ? 'table-row' : 'none';
                    }
                });
            }
        });

        _updateFooter();
    }

    function toggleFilterMenu() {
        const menu    = document.getElementById('filterMenu');
        const chevron = document.getElementById('filterChevron');
        if (!menu) return;
        const isOpen = menu.classList.contains('open');
        menu.classList.toggle('open', !isOpen);
        chevron?.classList.toggle('open', !isOpen);
    }

    function selectFilter(btn) {
        document.querySelectorAll('.inv-filter-option').forEach(o => o.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('filterLabel').textContent = btn.textContent.trim();
        document.getElementById('filterMenu').classList.remove('open');
        document.getElementById('filterChevron')?.classList.remove('open');
        currentFilter = btn.dataset.filter;
        _applyFilter();
    }
    function _updateFooter() {
    const count  = document.querySelectorAll('#invBody tr[data-filter]:not(.batch-row)').length;
    const footer = document.getElementById('invFooter');
    const empty  = document.getElementById('invEmpty');
    if (footer) footer.innerHTML = `<i class="bi bi-box-seam"></i> Showing ${count} products from your Salla store`;
    if (empty)  empty.style.display = count === 0 ? 'block' : 'none';
}

    /* ══════════════════════════════════════════
       EVENT DELEGATION
    ══════════════════════════════════════════ */
    function _initListeners() {
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

        document.addEventListener('click', e => {
            if (!e.target.closest('#filterDropdown')) {
                document.getElementById('filterMenu')?.classList.remove('open');
                document.getElementById('filterChevron')?.classList.remove('open');
            }
        });

        _updateFooter();
    }

    document.addEventListener('DOMContentLoaded', _initListeners);

    window.addEventListener('pageshow', e => {
        if (e.persisted) {
           _updateFooter();
        }
    });

    window.toggleFilterMenu = toggleFilterMenu;
    window.selectFilter     = selectFilter;

    return {
        toggleBatch,
        openForm,
        onSaveSuccess,
        onDiscountSuccess,
    };

})();
