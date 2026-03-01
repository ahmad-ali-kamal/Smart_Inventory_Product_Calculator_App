/**
 * inventory-discountform.js
 * Discount Modal — AI Recommended + Manual Scheduling
 *
 * API Endpoints:
 *   APPLY AI     POST  /api/inventory/discount/ai      { product_id }
 *   APPLY MANUAL POST  /api/inventory/discount/manual  { product_id, percent, end_date }
 *
 * Success callback: Inventory.onDiscountSuccess(productId, data)
 *
 * Fixes:
 *   1. close() resets state + DOM fully so re-opening always works
 *   2. pageshow listener handles bfcache restore
 */
window.DiscountForm = (() => {

    /* ── State ── */
    let productId = null;
    let aiPercent = 20;
    let _isOpen   = false;

    /* ── DOM helper ── */
    const $ = id => document.getElementById(id);

    /* ══════════════════════════════════════════
       OPEN
    ══════════════════════════════════════════ */
    function open(pid, productName, recommendedPercent = 20) {
        productId = pid;
        aiPercent = recommendedPercent;

        $('dfProductName').textContent  = productName;
        $('dfAiPercent').textContent    = aiPercent + '%';
        $('dfAiBtnPercent').textContent = aiPercent + '%';
        $('dfAiBody').innerHTML =
            `<strong>${productName}</strong> is likely to expire before being sold at the current rate. ` +
            `A <strong>${aiPercent}% discount</strong> is recommended to clear this batch.`;

        // reset manual panel to collapsed state
        $('dfManualPanel').classList.remove('show');
        $('dfManualToggleWrap').style.display = '';
        $('dfPercent').value      = '';
        $('dfEndDate').value      = '';
        $('dfManualBtn').disabled = true;

        // clear any lingering error
        const err = $('dfErrorMsg');
        if (err) err.style.display = 'none';

        _isOpen = true;
        $('dfBackdrop').classList.add('open');
        document.body.classList.add('ef-open');
        document.body.style.overflow = 'hidden';
    }

    /* ══════════════════════════════════════════
       CLOSE — full reset so re-open always works
    ══════════════════════════════════════════ */
    function close() {
        _isOpen   = false;
        productId = null;
        aiPercent = 20;

        $('dfBackdrop').classList.remove('open');
        document.body.classList.remove('ef-open');
        document.body.style.overflow = '';

        // reset DOM for next open
        $('dfManualPanel').classList.remove('show');
        $('dfManualToggleWrap').style.display = '';
        $('dfPercent').value      = '';
        $('dfEndDate').value      = '';
        $('dfManualBtn').disabled = true;

        const err = $('dfErrorMsg');
        if (err) err.style.display = 'none';
    }

    /* ── Show manual panel ── */
    function _showManual() {
        $('dfManualToggleWrap').style.display = 'none';
        $('dfManualPanel').classList.add('show');
    }

    /* ── Validate manual fields ── */
    function _validate() {
        const p = parseInt($('dfPercent').value);
        const d = $('dfEndDate').value;
        $('dfManualBtn').disabled = !(p >= 1 && p <= 100 && d);
    }

    /* ══════════════════════════════════════════
       GENERIC POST HELPER
    ══════════════════════════════════════════ */
    async function _post(endpoint, payload, btn, originalHtml) {
        btn.disabled  = true;
        btn.innerHTML = '<i class="bi bi-arrow-repeat" style="animation:ef-spin 0.7s linear infinite"></i> Applying...';

        try {
            const res  = await fetch(endpoint, {
                method : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'Accept'      : 'application/json',
                },
                body: JSON.stringify(payload),
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

    function _applyAi() {
        _post(
            '/api/inventory/discount/ai',
            { product_id: productId },
            $('dfAiBtn'),
            `<i class="bi bi-stars"></i> Apply AI Recommended Discount (${aiPercent}%)`
        );
    }

    function _applyManual() {
        _post(
            '/api/inventory/discount/manual',
            { product_id: productId, percent: parseInt($('dfPercent').value), end_date: $('dfEndDate').value },
            $('dfManualBtn'),
            '<i class="bi bi-check2-circle"></i> Apply Manual Discount'
        );
    }

    /* ══════════════════════════════════════════
       INLINE ERROR
    ══════════════════════════════════════════ */
    function _showError(msg) {
        let el = $('dfErrorMsg');
        if (!el) {
            el = document.createElement('div');
            el.id        = 'dfErrorMsg';
            el.className = 'ef-edit-banner show';
            el.style.cssText = 'background:hsla(0,70%,50%,0.08);border-color:hsla(0,70%,50%,0.3);color:hsl(0,60%,35%);margin-top:0.75rem;';
            $('dfCard').appendChild(el);
        }
        el.innerHTML     = `<i class="bi bi-exclamation-triangle-fill"></i> ${msg}`;
        el.style.display = 'flex';
        setTimeout(() => { if (el) el.style.display = 'none'; }, 5000);
    }

    /* ══════════════════════════════════════════
       EVENT LISTENERS
    ══════════════════════════════════════════ */
    document.addEventListener('DOMContentLoaded', () => {
        $('dfBackdrop')?.addEventListener('click', e => { if (e.target === $('dfBackdrop')) close(); });
        $('dfCloseBtn')?.addEventListener('click', close);
        $('dfAiBtn')?.addEventListener('click', _applyAi);
        $('dfManualBtn')?.addEventListener('click', _applyManual);
        $('dfShowManualBtn')?.addEventListener('click', _showManual);
        $('dfPercent')?.addEventListener('input', _validate);
        $('dfEndDate')?.addEventListener('input', _validate);
    });

    document.addEventListener('keydown', e => { if (e.key === 'Escape' && _isOpen) close(); });

    // ── bfcache fix ──
    window.addEventListener('pageshow', e => {
        if (e.persisted && _isOpen) close();
    });

    /* ── Public API ── */
    return { open, close };

})();