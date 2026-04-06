/**
 * inventory-dashboard.js
 * Dashboard — Dropdown Filter + Discount Buttons + Eye Toggle
 */
document.addEventListener('DOMContentLoaded', () => {

    /* ── State ── */
    let currentFilter = 'all';

    /* ── Filter Dropdown ── */
    const toggle  = document.getElementById('dashFilterToggle');
    const menu    = document.getElementById('dashFilterMenu');
    const chevron = document.getElementById('dashFilterChevron');
    const label   = document.getElementById('dashFilterLabel');

    toggle?.addEventListener('click', e => {
        e.stopPropagation();
        const isOpen = menu.classList.contains('open');
        menu.classList.toggle('open', !isOpen);
        chevron?.classList.toggle('open', !isOpen);
    });

    document.addEventListener('click', e => {
        if (!e.target.closest('#dashFilterDropdown')) {
            menu?.classList.remove('open');
            chevron?.classList.remove('open');
        }
    });

    menu?.addEventListener('click', e => {
        const btn = e.target.closest('.inv-filter-option');
        if (!btn) return;

        menu.querySelectorAll('.inv-filter-option').forEach(o => o.classList.remove('active'));
        btn.classList.add('active');
        label.textContent = btn.textContent.trim();
        menu.classList.remove('open');
        chevron?.classList.remove('open');

        currentFilter = btn.dataset.filter;
        _applyFilter();
    });

    /* ── Apply Filter ── */
    function _applyFilter() {
        let visible = 0;

        document.querySelectorAll('#dashBody tr[data-status]').forEach(row => {
            const show = currentFilter === 'all' || row.dataset.status === currentFilter;
            row.style.display = show ? '' : 'none';

            // أخفِ/أظهر صفوف الدفعات تبعاً للصف الأب
            const pid = row.dataset.id;
            if (pid) {
                document.querySelectorAll(`.batch-row[data-parent="${pid}"]`).forEach(r => {
                    if (!show) {
                        r.classList.remove('open');
                        r.style.display = 'none';
                        // reset eye icon
                        const eye = document.getElementById(`dash-eye-${pid}`);
                        if (eye) eye.className = 'bi bi-eye';
                    } else {
                        // أظهره فقط لو كان مفتوحاً
                        r.style.display = r.classList.contains('open') ? 'table-row' : 'none';
                    }
                });
            }

            if (show) visible++;
        });

        const empty = document.getElementById('filterEmpty');
        if (empty) empty.style.display = visible === 0 ? 'block' : 'none';
    }

    /* ── Eye Toggle — نفس منطق Products بالضبط ── */
    document.getElementById('dashBody')?.addEventListener('click', e => {

        // زر العين
        const eyeBtn = e.target.closest('.btn-eye');
        if (eyeBtn && eyeBtn.dataset.productId) {
            const productId = eyeBtn.dataset.productId;
            const rows      = document.querySelectorAll(`.batch-row[data-parent="${productId}"]`);
            const eye       = document.getElementById(`dash-eye-${productId}`);
            if (!rows.length) return;

            const isOpen = rows[0].classList.contains('open');
            rows.forEach(r => {
                r.classList.toggle('open', !isOpen);
                r.style.display = !isOpen ? 'table-row' : 'none';
            });
            if (eye) eye.className = !isOpen ? 'bi bi-eye-slash' : 'bi bi-eye';
            return;
        }

        // زر الخصم
        const discountBtn = e.target.closest('.btn-discount');
        if (discountBtn) {
            if (typeof DiscountForm === 'undefined') {
                console.warn('DiscountForm is not loaded');
                return;
            }
            DiscountForm.open(discountBtn.dataset.productId, discountBtn.dataset.productName);
        }
    });

});