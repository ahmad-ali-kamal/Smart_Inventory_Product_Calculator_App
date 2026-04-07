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
       eye icon: closed = bi-eye | open = bi-eye-slash
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
       OPEN EXPIRY FORM
    ══════════════════════════════════════════ */
    // بعد — أضف قراءة threshold وابعثه مع كل open
function openForm(productId, productName) {
    const row = document.querySelector(`#invBody tr[data-id="${productId}"]`);
    if (!row) return;

    let batches = [];
    try { batches = JSON.parse(row.dataset.batches || '[]'); } catch (e) {}

    const threshold = parseInt(row.dataset.threshold) || 14;  // ← جديد

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
        row.dataset.originalType = payload.type;
        const statusCell = row.querySelector('td:nth-child(3)');
if (statusCell && payload.status) {
    const statusMap = {
        green:  ['b-green',  'Safe'],
        yellow: ['b-yellow', 'Approaching'],
        red:    ['b-red',    'Expired'],
    };
    const [cls, label] = statusMap[payload.status] ?? ['b-none', 'No expiry set'];
    statusCell.innerHTML = `<span class="badge ${cls}">${label}</span>`;
}
if (payload.type === 'single') {
    document.querySelectorAll(`.batch-row[data-parent="${productId}"]`).forEach(r => r.remove());
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
            <span>Single</span>
        </div>`;
    const statusClass = payload.status || 'green';
    const statusText  = statusClass === 'red' ? 'Expired' : statusClass === 'yellow' ? 'Approaching' : 'Safe';
    const tr = document.createElement('tr');
    tr.className      = 'batch-row';
    tr.dataset.parent = productId;
    tr.innerHTML = `
        <td><div class="batch-indent"><span class="batch-label-field"><i class="bi bi-layers"></i> ${payload.batch_code || 'N/A'}</span></div></td>
        <td style="color:var(--muted);">${payload.quantity} units</td>
        <td><span class="badge b-${statusClass}">${statusText}</span></td>
        <td><div class="exp-cell"><i class="bi bi-calendar3" style="font-size:0.78rem;"></i><span style="color:var(--muted);">${payload.expiry_date}</span></div></td>
        <td></td>`;
    row.insertAdjacentElement('afterend', tr);
      
       }else if (payload.type === 'batch' && payload.batches?.length) {
            // ❗ احذف أي batch rows قديمة
document.querySelectorAll(`.batch-row[data-parent="${productId}"]`)
    .forEach(r => r.remove());
            const normalized = payload.batches.map(b => ({
    label:      b.label,
    qty:        b.qty,
    status:     b.status,
    expiry: (b.expiry_date ?? b.expiry ?? '').substring(0, 10),
    batch_code: b.batch_code ?? null,
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
       let lastRow = row;

normalized.forEach((b) => {
    const tr = document.createElement('tr');
    tr.className = 'batch-row';
    tr.dataset.parent = productId;

    const statusClass = b.status || 'green';
    const statusText =
        statusClass === 'red' ? 'Expired' :
        statusClass === 'yellow' ? 'Approaching' : 'Safe';

    tr.innerHTML = `
        <td>
            <div class="batch-indent">
                <span class="batch-label-field">
                    <i class="bi bi-layers"></i>
                   ${b.batch_code || 'N/A'}
                </span>
            </div>
        </td>

        <td style="color:var(--muted);">
            ${b.qty} units
        </td>

        <td>
            <span class="badge b-${statusClass}">
                ${statusText}
            </span>
        </td>

        <td>
            <div class="exp-cell">
                <i class="bi bi-calendar3" style="font-size:0.78rem;"></i>
                <span style="color:var(--muted);">
                   ${b.expiry || 'No Date'}
                </span>
            </div>
        </td>

        <td></td>
    `;

    // 👇 هذا يخلي الصفوف تطلع تحت بعض بشكل مرتب
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
       FILTER — DROPDOWN (الجديد)
    ══════════════════════════════════════════ */
    function _applyFilter() {
    let count = 0;

    document.querySelectorAll('#invBody tr[data-filter]:not(.batch-row)').forEach(row => {
        const visible = currentFilter === 'all' || row.dataset.filter === currentFilter;
        row.style.display = visible ? '' : 'none';
        if (visible) count++;

        // ← البحث عن product id من data-id مباشرة
        const pid = row.dataset.id;
        if (pid) {
            document.querySelectorAll(`.batch-row[data-parent="${pid}"]`).forEach(r => {
                if (!visible) {
                    r.classList.remove('open');
                    r.style.display = 'none';
                } else {
                    // جديد
if (r.classList.contains('open')) {
    r.style.display = 'table-row';
} else {
    r.style.display = 'none';
}
                }
            });
        }
    });

    const footer = document.getElementById('invFooter');
    const empty  = document.getElementById('invEmpty');
    if (footer) footer.innerHTML = `<i class="bi bi-box-seam"></i> Showing ${count} products from your Salla store`;
    if (empty)  empty.style.display = count === 0 ? 'block' : 'none';
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
        // تحديث active state في القائمة
        document.querySelectorAll('.inv-filter-option').forEach(o => o.classList.remove('active'));
        btn.classList.add('active');

        // تحديث نص الزر
        document.getElementById('filterLabel').textContent = btn.textContent.trim();

        // إغلاق القائمة
        document.getElementById('filterMenu').classList.remove('open');
        document.getElementById('filterChevron')?.classList.remove('open');

        // ← الحل: تحديث currentFilter مباشرة ثم تطبيق الفلتر
        currentFilter = btn.dataset.filter;
        _applyFilter();
    }


    /* ══════════════════════════════════════════
       EVENT DELEGATION
    ══════════════════════════════════════════ */
    function _initListeners() {
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

    // إغلاق القائمة عند الضغط خارجها
    document.addEventListener('click', e => {
        if (!e.target.closest('#filterDropdown')) {
            document.getElementById('filterMenu')?.classList.remove('open');
            document.getElementById('filterChevron')?.classList.remove('open');
        }
    });

    // apply filter on load
   // count on load only
const count = document.querySelectorAll('#invBody tr[data-filter]:not(.batch-row)').length;
const footer = document.getElementById('invFooter');
const empty  = document.getElementById('invEmpty');
if (footer) footer.innerHTML = `<i class="bi bi-box-seam"></i> Showing ${count} products from your Salla store`;
if (empty)  empty.style.display = count === 0 ? 'block' : 'none';
}

    document.addEventListener('DOMContentLoaded', _initListeners);

    // ── bfcache fix: re-apply filter state after back navigation ──
  window.addEventListener('pageshow', e => {
    if (e.persisted) {
        const count = document.querySelectorAll('#invBody tr[data-filter]:not(.batch-row)').length;
        const footer = document.getElementById('invFooter');
        const empty  = document.getElementById('invEmpty');
        if (footer) footer.innerHTML = `<i class="bi bi-box-seam"></i> Showing ${count} products from your Salla store`;
        if (empty)  empty.style.display = count === 0 ? 'block' : 'none';
    }
});
    /* ── كشف الدوال للـ window ── */
    window.toggleFilterMenu = toggleFilterMenu;
    window.selectFilter     = selectFilter;

    /* ── Public API ── */
    return {
        toggleBatch,
        openForm,
        onSaveSuccess,
        onDiscountSuccess,
    };

})();