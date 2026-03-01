/**
 * products.js
 * JS خاص بصفحة المنتجات — toggle + search
 */
(function () {
    const CSRF = document.querySelector('meta[name="csrf-token"]')?.content ?? '';

    // ── Toast ──
    function showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast     = document.createElement('div');
        const icon      = type === 'success' ? 'bi-check-circle-fill' : 'bi-x-circle-fill';
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="bi ${icon}"></i> ${message}`;
        container.appendChild(toast);
        requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
    }

    // ── Update row UI ──
    function updateRow(row, isEnabled) {
        const icon       = row.querySelector('.product-icon');
        const nameSpan   = row.querySelector('td:first-child span');
        const catBadge   = row.querySelector('.cat-badge');
        const statusCell = row.querySelector('td:nth-child(3)');

        icon.classList.toggle('active',   isEnabled);
        icon.classList.toggle('inactive', !isEnabled);
        nameSpan.style.color = isEnabled ? 'var(--fg)' : 'var(--muted)';
        catBadge.classList.toggle('inactive', !isEnabled);
        statusCell.innerHTML = isEnabled
            ? `<span class="status-active"><span class="status-dot"></span> Active</span>`
            : `<span class="status-inactive">Inactive</span>`;
    }

    // ── Toggle handler ──
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
                if (!response.ok) throw new Error('Server error');
                const data = await response.json();
                if (data.success) {
                    this.checked = data.is_enabled;
                    updateRow(row, data.is_enabled);
                    showToast(data.message ?? (data.is_enabled ? 'Product activated' : 'Product deactivated'));
                } else {
                    throw new Error(data.message ?? 'Failed');
                }
            } catch (err) {
                this.checked = !optimisticEnabled;
                updateRow(row, !optimisticEnabled);
                showToast('Something went wrong. Please try again.', 'error');
            } finally {
                switchLabel.classList.remove('loading');
            }
        });
    });

    // ── Search ──
    const searchInput = document.getElementById('searchInput');
    const emptyState  = document.getElementById('emptySearchState');
    const rows        = document.querySelectorAll('.table-row[data-product-name]');

    searchInput.addEventListener('input', function () {
        const query   = this.value.toLowerCase().trim();
        let   visible = 0;
        rows.forEach(function (row) {
            const match = (row.dataset.productName ?? '').includes(query);
            row.classList.toggle('hidden-row', !match);
            if (match) visible++;
        });
        emptyState.style.display = visible === 0 ? 'block' : 'none';
    });

})();