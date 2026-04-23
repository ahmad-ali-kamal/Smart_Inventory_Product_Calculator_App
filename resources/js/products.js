/**
 * products.js
 * Toggle + Client-side search + Status filter + Sync spinner
 */
(function () {
    'use strict';

    const CSRF = document.querySelector('meta[name="csrf-token"]')?.content ?? '';

    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────

    function ensureToastWrap() {
        let wrap = document.querySelector('.toast-wrap');
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.className = 'toast-wrap';
            document.body.appendChild(wrap);
        }
        return wrap;
    }

    function showToast(message, type = 'success', ttlMs = 2600) {
        if (window.MerchantUI?.toast) {
            window.MerchantUI.toast(message, type);
            return;
        }

        const wrap  = ensureToastWrap();
        const toast = document.createElement('div');
        toast.className  = `toast ${type}`;
        toast.textContent = message;
        wrap.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('show'));
        window.setTimeout(() => {
            toast.classList.remove('show');
            window.setTimeout(() => toast.remove(), 350);
        }, ttlMs);
    }

    function updateRow(row, isEnabled) {
        const icon       = row.querySelector('.product-icon');
        const nameSpan   = row.querySelector('td:first-child span[id^="name-"]');
        const catBadge   = row.querySelector('.cat-badge');
        const statusCell = row.querySelector('td[id^="status-cell-"]');

        icon.classList.toggle('active',   isEnabled);
        icon.classList.toggle('inactive', !isEnabled);

        if (nameSpan) nameSpan.style.color = isEnabled ? 'var(--fg)' : 'var(--muted)';
        if (catBadge) catBadge.classList.toggle('inactive', !isEnabled);

        if (statusCell) {
            statusCell.innerHTML = isEnabled
                ? `<div class="cell-center"><span class="status-active"><span class="status-dot"></span> Active</span></div>`
                : `<div class="cell-center"><span class="status-inactive">Inactive</span></div>`;
        }

        row.dataset.status = isEnabled ? 'active' : 'inactive';
    }

    function getUrl() {
        return new URL(window.location.href);
    }

    // ─────────────────────────────────────────────
    // State — يجب أن تكون فوق أي استخدام
    // ─────────────────────────────────────────────
    const searchInput = document.getElementById('searchInput');
    const emptyState  = document.getElementById('emptySearchState');
    const rows        = Array.from(document.querySelectorAll('.table-row[data-product-name]'));

    const filterToggle  = document.getElementById('filterToggle');
    const filterMenu    = document.getElementById('filterMenu');
    const filterChevron = document.getElementById('filterChevron');
    const filterLabel   = document.getElementById('filterLabel');

    // قراءة الفلتر الأولي من الـ URL (يُطبَّق server-side عند أول تحميل)
    let currentFilter = getUrl().searchParams.get('filter') ?? 'all';

    // ─────────────────────────────────────────────
    // applyFilter — مصدر الحقيقة الوحيد للـ search + filter
    // ─────────────────────────────────────────────
    function applyFilter() {
        const query   = searchInput ? searchInput.value.toLowerCase().trim() : '';
        let   visible = 0;

        rows.forEach(function (row) {
            const name        = row.dataset.productName ?? '';
            const statusMatch = currentFilter === 'all' || row.dataset.status === currentFilter;
            const nameMatch   = name.includes(query);
            const show        = statusMatch && nameMatch;

            row.classList.toggle('hidden-row', !show);
            if (show) visible++;
        });

        if (emptyState) {
            emptyState.style.display = visible === 0 ? 'block' : 'none';
        }
    }

    // ─────────────────────────────────────────────
    // Toggle switch
    // ─────────────────────────────────────────────
    document.querySelectorAll('.product-toggle').forEach(function (checkbox) {
        checkbox.addEventListener('change', async function () {
            const switchLabel       = this.closest('.switch');
            const url               = this.dataset.toggleUrl;
            const row               = this.closest('.table-row');
            const optimisticEnabled = this.checked;

            updateRow(row, optimisticEnabled);
            switchLabel.classList.add('loading');

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN':     CSRF,
                        'Accept':           'application/json',
                        'Content-Type':     'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (!response.ok) throw new Error('Server error ' + response.status);
                const data = await response.json();

                if (data.success) {
                    this.checked = data.is_enabled;
                    updateRow(row, data.is_enabled);
                    applyFilter();
                    showToast(
                        data.is_enabled ? 'Product Activated' : 'Product Deactivated',
                        data.is_enabled ? 'success' : 'info'
                    );
                } else {
                    throw new Error(data.message ?? 'Failed');
                }
            } catch (err) {
                this.checked = !optimisticEnabled;
                updateRow(row, !optimisticEnabled);
                showToast(
                    "We're having trouble saving your changes. Please try again shortly.",
                    'error'
                );
            } finally {
                switchLabel.classList.remove('loading');
            }
        });
    });

    // ─────────────────────────────────────────────
    // Search — client-side, no reload
    // ─────────────────────────────────────────────
    if (searchInput) {
        searchInput.addEventListener('input', applyFilter);
    }

    // ─────────────────────────────────────────────
    // Filter dropdown — client-side, no reload
    // ─────────────────────────────────────────────

    // مزامنة الـ label عند أول تحميل لو فيه فلتر في الـ URL
    if (filterLabel && currentFilter !== 'all') {
        const labels = { active: 'Active', inactive: 'Inactive' };
        filterLabel.textContent = labels[currentFilter] ?? 'Filter';
    }

    if (filterToggle && filterMenu) {

        // فتح / إغلاق الـ dropdown
        filterToggle.addEventListener('click', function () {
            const isOpen = filterMenu.classList.toggle('open');
            filterChevron?.classList.toggle('open', isOpen);
            filterToggle.setAttribute('aria-expanded', String(isOpen));
        });

        // اختيار فلتر
        filterMenu.querySelectorAll('.inv-filter-option').forEach(function (btn) {
            btn.addEventListener('click', function () {
                filterMenu.querySelectorAll('.inv-filter-option').forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                const chosen   = this.dataset.filter;
                const labelMap = { all: 'Filter', active: 'Active', inactive: 'Inactive' };
                if (filterLabel) filterLabel.textContent = labelMap[chosen] ?? 'Filter';

                filterMenu.classList.remove('open');
                filterChevron?.classList.remove('open');
                filterToggle.setAttribute('aria-expanded', 'false');

                currentFilter = chosen;
                applyFilter();
            });
        });

        // إغلاق عند الضغط خارج الـ dropdown
        document.addEventListener('click', function (e) {
            if (!filterToggle.contains(e.target) && !filterMenu.contains(e.target)) {
                filterMenu.classList.remove('open');
                filterChevron?.classList.remove('open');
                filterToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // تطبيق الفلتر الأولي عند تحميل الصفحة
    applyFilter();

    // ─────────────────────────────────────────────
    // Sync button — spinning icon feedback
    // ─────────────────────────────────────────────
    const syncForm = document.getElementById('syncForm');
    const syncIcon = document.getElementById('syncIcon');

    if (syncForm && syncIcon) {
        syncForm.addEventListener('submit', function () {
            syncIcon.style.animation = 'spin 0.8s linear infinite';
            syncForm.querySelector('button').disabled = true;
        });
    }

})();