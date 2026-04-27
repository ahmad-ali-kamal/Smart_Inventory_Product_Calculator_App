/**
 * inventory-discountform.js
 * Discount Modal — Manual only
 *
 * APPLY MANUAL  POST  /api/inventory/discount/manual
 *               Body  { product_id, percent, end_date }
 *
 * Success callback: Inventory.onDiscountSuccess(productId, data)
 */
window.DiscountForm = (() => {

    let productId = null;
    let _isOpen   = false;

    const $ = id => document.getElementById(id);

    /* ══════ OPEN ══════ */
    function open(pid, productName) {
        productId = pid;

        $('dfProductName').textContent = productName;
        $('dfPercent').value           = '';
        $('dfEndDate').value           = '';
        $('dfManualBtn').disabled      = true;

        const err = $('dfErrorMsg');
        if (err) err.style.display = 'none';

        _isOpen = true;
        $('dfBackdrop').classList.add('open');
        document.body.classList.add('ef-open');
        document.body.style.overflow = 'hidden';
    }

    /* ══════ CLOSE ══════ */
    function close() {
        _isOpen   = false;
        productId = null;

        $('dfBackdrop').classList.remove('open');
        document.body.classList.remove('ef-open');
        document.body.style.overflow = '';

        $('dfPercent').value      = '';
        $('dfEndDate').value      = '';
        $('dfManualBtn').disabled = true;

        const err = $('dfErrorMsg');
        if (err) err.style.display = 'none';
    }

    /* ══════ VALIDATE ══════ */
    function _validate() {
        const p = parseInt($('dfPercent').value);
        const d = $('dfEndDate').value;
        $('dfManualBtn').disabled = !(p >= 1 && p <= 100 && d);
    }

    /* ══════ POST ══════ */
    async function _applyManual() {
        const btn         = $('dfManualBtn');
        const originalHtml = btn.innerHTML;
        btn.disabled  = true;
        btn.innerHTML = '<i class="bi bi-arrow-repeat" style="animation:ef-spin 0.7s linear infinite"></i> Applying...';

        try {
           // ✅ الرابط الصحيح
const res = await fetch(`/inventory/products/${productId}/discount`, {
    method : 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        'Accept'      : 'application/json',
    },
    // ✅ احذف product_id من الـ body (صار في الـ URL)
    body: JSON.stringify({
    discount_percentage : parseInt($('dfPercent').value),
    ends_at             : $('dfEndDate').value,
}),
});
            const data = await res.json();

            if (res.ok && data.success) {
                Inventory.onDiscountSuccess(productId, data);
                close();
            } else {
                _showError(data.message ?? 'Something went wrong. Please try again.');
            }
        } catch {
            _showError('Network error. Please check your connection and try again.');
        } finally {
            btn.disabled  = false;
            btn.innerHTML = originalHtml;
        }
    }

    /* ══════ ERROR ══════ */
    function _showError(msg) {
        let el = $('dfErrorMsg');
        if (!el) {
            el = document.createElement('div');
            el.id        = 'dfErrorMsg';
            el.className = 'ef-edit-banner show';
            el.style.cssText = 'background:var(--clr-red-bg);border-color:var(--clr-red-border);color:var(--clr-red-text);margin-top:0.75rem;';
            $('dfCard').appendChild(el);
        }
        el.innerHTML     = `<i class="bi bi-exclamation-triangle-fill"></i> ${msg}`;
        el.style.display = 'flex';
        setTimeout(() => { if (el) el.style.display = 'none'; }, 5000);
    }

    /* ══════ EVENTS ══════ */
    document.addEventListener('DOMContentLoaded', () => {
        $('dfBackdrop')?.addEventListener('click', e => {
            if (e.target === $('dfBackdrop')) close();
        });
        $('dfCloseBtn')?.addEventListener('click', close);
        $('dfManualBtn')?.addEventListener('click', _applyManual);
        $('dfPercent')?.addEventListener('input', _validate);
        $('dfEndDate')?.addEventListener('input', _validate);
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && _isOpen) close();
    });

    window.addEventListener('pageshow', e => {
        if (e.persisted && _isOpen) close();
    });

    return { open, close };

})();