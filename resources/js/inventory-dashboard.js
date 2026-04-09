/**
 * inventory-dashboard.js
 * Dashboard — Filter Tabs + Expand Button
 */
document.addEventListener('DOMContentLoaded', () => {

    /* ── Filter Tabs ── */
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => _setFilter(tab));
    });

    function _setFilter(activeTab) {
        const status = activeTab.dataset.filter;

        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        activeTab.classList.add('active');

        let visible = 0;
        document.querySelectorAll('.table-row[data-status]').forEach(row => {
            const show = status === 'all' || row.dataset.status === status;
            row.style.display = show ? '' : 'none';
            if (show) visible++;
        });

        const empty = document.getElementById('filterEmpty');
        if (empty) empty.style.display = visible === 0 ? 'block' : 'none';
    }

    /* ── Expand Button Rotation ── */
    document.querySelectorAll('.expand-btn').forEach(btn => {
        btn.addEventListener('click', () => btn.classList.toggle('expanded'));
    });

    /* ── Discount Buttons — read data attributes, no onclick needed ── */
    document.querySelector('tbody')?.addEventListener('click', e => {
        const btn = e.target.closest('.btn-discount');
        if (!btn) return;
        if (typeof DiscountForm === 'undefined') {
            console.warn('DiscountForm is not loaded');
            return;
        }
        DiscountForm.open(
            btn.dataset.productId,
            btn.dataset.productName
        );
    });

});