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
        const pid = row.dataset.id;
        const batchRows = pid 
            ? document.querySelectorAll(`.batch-row[data-parent="${pid}"]`) 
            : [];
        

        if (currentFilter === 'all') {
            // أظهر صف المنتج، أخفِ كل الباتشات
            row.style.display = '';
            batchRows.forEach(r => {
                r.classList.remove('open');
                r.style.display = 'none';
            });
            
            visible++;

        } else {
            // أخفِ صف المنتج الرئيسي
            row.style.display = 'none';

            // أظهر الباتشات المطابقة كـ "منتجات مستقلة"
            batchRows.forEach(r => {
                const match = r.dataset.batchStatus === currentFilter;
                r.style.display = match ? 'table-row' : 'none';
                r.classList.toggle('open', match);
                if (match) visible++;
            });
        }
    });

    const empty = document.getElementById('filterEmpty');
    if (empty) empty.style.display = visible === 0 ? 'block' : 'none';
}
    /* ── Eye Toggle — نفس منطق Products بالضبط ── */
    document.getElementById('dashBody')?.addEventListener('click', e => {

    // زر العين
    const eyeBtn = e.target.closest('.btn-eye');
    if (eyeBtn && eyeBtn.dataset.productId) {
        const productId   = eyeBtn.dataset.productId;
        const eye         = document.getElementById(`dash-eye-${productId}`);
        const allBatchRows = document.querySelectorAll(`.batch-row[data-parent="${productId}"]`);

        const targetRows = currentFilter === 'all'
            ? [...allBatchRows]
            : [...allBatchRows].filter(r => r.dataset.batchStatus === currentFilter);

        if (!targetRows.length) return;

        const isOpen = targetRows[0].style.display === 'table-row';

        // أغلق الكل أولاً
        allBatchRows.forEach(r => {
            r.classList.remove('open');
            r.style.display = 'none';
        });

        // افتح المطلوبة فقط لو كانت مغلقة
        if (!isOpen) {
            targetRows.forEach(r => {
                r.classList.add('open');
                r.style.display = 'table-row';
            });
            if (eye) eye.className = 'bi bi-eye-slash';
        } else {
            if (eye) eye.className = 'bi bi-eye';
        }
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