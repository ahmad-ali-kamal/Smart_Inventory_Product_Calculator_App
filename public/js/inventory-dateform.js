/**
 * inventory-dateform.js - Fixed Version
 * تم تعديل المسارات لتعمل مع web.php وحل مشكلة الـ 404 والـ Unauthenticated
 */
window.ExpiryForm = (function () {
    /* ── الحالة (State) ── */
    var productId = null;
    var mode = null; // true = single | false = batch
    var isEdit = false;
    var batchCount = 0;
    var _isOpen = false;

    /* ── مساعد الـ DOM ── */
    var $ = function (id) { return document.getElementById(id); };

    /* ── حساب الحالة (ألوان) ── */
    function _calcStatus(dateStr) {
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var days = Math.floor((new Date(dateStr) - today) / 86400000);
        if (days < 0) return 'red';
        if (days <= 7) return 'yellow';
        return 'green';
    }

    function _statusBadgeHtml(status, idx) {
        var map = {
            green: ['ef-s-green', 'Safe'],
            yellow: ['ef-s-yellow', 'Approaching'],
            red: ['ef-s-red', 'Expired']
        };
        var res = map[status] || ['', ''];
        return `<span class="ef-status-badge ${res[0]}" id="bStatus-${idx}">
                    <i class="bi bi-circle-fill" style="font-size:0.4rem"></i> ${res[1]}
                </span>`;
    }

    function updateBadge(idx) {
        var dateEl = $("bDate-" + idx);
        var badge = $("bStatus-" + idx);
        if (!dateEl || !badge) return;
        badge.outerHTML = dateEl.value ? _statusBadgeHtml(_calcStatus(dateEl.value), idx) : `<span class="ef-status-badge" id="bStatus-${idx}"></span>`;
    }

    function _reset(productName) {
        mode = null;
        batchCount = 0;
        $('efProductName').textContent = productName || '';
        $('btnYes').className = 'ef-toggle-btn';
        $('btnNo').className = 'ef-toggle-btn';
        $('panelYes').classList.remove('show');
        $('panelNo').classList.remove('show');
        $('efSingleDate').value = '';
        $('efBatchList').innerHTML = '';
        $('efSaveBtn').disabled = true;
        var err = $('efErrorMsg');
        if (err) err.style.display = 'none';
    }

    function _buildBatchItem(prefill) {
        prefill = prefill || {};
        batchCount++;
        var idx = batchCount;
        var item = document.createElement('div');
        item.className = 'ef-batch-item';
        item.id = "efBatch-" + idx;
        var status = prefill.expiry ? _calcStatus(prefill.expiry) : null;
        var badgeHtml = status ? _statusBadgeHtml(status, idx) : `<span class="ef-status-badge" id="bStatus-${idx}"></span>`;
        
        item.innerHTML = `
            <div class="ef-batch-head">
                <span class="ef-batch-lbl" id="bLbl-${idx}">
                    <i class="bi bi-layers" style="font-size:0.78rem;color:var(--mauve)"></i>
                    Batch ${idx} ${badgeHtml}
                </span>
                <button class="ef-batch-remove" data-idx="${idx}" title="Remove">
                    <i class="bi bi-trash3"></i>
                </button>
            </div>
            <div class="ef-batch-grid">
                <div>
                    <label class="ef-label">Quantity</label>
                    <input type="number" class="ef-input" id="bQty-${idx}" min="1" value="${prefill.qty || ''}" placeholder="0">
                </div>
                <div>
                    <label class="ef-label">Expiry Date</label>
                    <input type="date" class="ef-input" id="bDate-${idx}" value="${prefill.expiry || ''}">
                </div>
            </div>`;

        item.querySelector('.ef-batch-remove').addEventListener('click', function () { removeBatch(idx); });
        item.querySelector("#bQty-" + idx).addEventListener('input', validate);
        item.querySelector("#bDate-" + idx).addEventListener('input', function () {
            updateBadge(idx);
            validate();
        });
        return item;
    }

    function _reNumber() {
        document.querySelectorAll('#efBatchList .ef-batch-item').forEach(function (item, i) {
            var lbl = item.querySelector('.ef-batch-lbl');
            if (!lbl) return;
            var badge = lbl.querySelector('.ef-status-badge');
            lbl.innerHTML = `<i class="bi bi-layers" style="font-size:0.78rem;color:var(--mauve)"></i> Batch ${i + 1} `;
            if (badge) lbl.appendChild(badge);
        });
    }

    function _collectBatches() {
        var batches = [];
        document.querySelectorAll('#efBatchList .ef-batch-item').forEach(function (item, i) {
            var id = item.id.replace('efBatch-', '');
            var qty = parseInt($("bQty-" + id).value) || 0;
            var dt = $("bDate-" + id).value;
            if (qty > 0 && dt) {
                batches.push({
                    batch_code: "B" + (i + 1) + "-" + Date.now(),
                    quantity: qty,
                    expiry_date: dt
                });
            }
        });
        return batches;
    }

    function _show() {
        _isOpen = true;
        $('efBackdrop').classList.add('open');
        document.body.classList.add('ef-open');
        document.body.style.overflow = 'hidden';
    }

    function close() {
        _isOpen = false;
        $('efBackdrop').classList.remove('open');
        document.body.classList.remove('ef-open');
        document.body.style.overflow = '';
        _reset();
    }

    function open(pid, productName) {
        productId = pid; isEdit = false; _reset(productName);
        $('efTitle').textContent = 'Add Expiry Date';
        _show();
    }

    function openSingle(pid, productName, dateValue) {
        productId = pid; isEdit = true; mode = true; _reset(productName);
        $('efTitle').textContent = 'Edit Expiry Date';
        $('btnYes').className = 'ef-toggle-btn active-yes';
        $('panelYes').classList.add('show');
        $('efSingleDate').value = dateValue || '';
        validate();
        _show();
    }

    function openBatch(pid, productName, prefillBatches) {
        productId = pid;
        prefillBatches = prefillBatches || [];
        isEdit = prefillBatches.length > 0;
        mode = false;
        _reset(productName);
        $('efTitle').textContent = isEdit ? 'Edit Expiry Date' : 'Add Expiry Date';
        $('btnNo').className = 'ef-toggle-btn active-no';
        $('panelNo').classList.add('show');
        var list = $('efBatchList');
        (prefillBatches.length ? prefillBatches : [{}]).forEach(function (b) {
            list.appendChild(_buildBatchItem(b));
        });
        validate();
        _show();
    }

    function selectMode(isSingle) {
        mode = isSingle;
        $('btnYes').className = 'ef-toggle-btn' + (isSingle ? ' active-yes' : '');
        $('btnNo').className = 'ef-toggle-btn' + (!isSingle ? ' active-no' : '');
        $('panelYes').classList.toggle('show', isSingle);
        $('panelNo').classList.toggle('show', !isSingle);
        if (!isSingle && $('efBatchList').children.length === 0) {
            $('efBatchList').appendChild(_buildBatchItem());
        }
        validate();
    }

    function addBatch() {
        $('efBatchList').appendChild(_buildBatchItem());
        _reNumber();
        validate();
    }

    function removeBatch(idx) {
        var el = $("efBatch-" + idx);
        if (el) el.remove();
        _reNumber();
        validate();
    }

    function validate() {
        var btn = $('efSaveBtn');
        if (mode === null) { btn.disabled = true; return; }
        if (mode === true) { btn.disabled = !$('efSingleDate').value; return; }
        btn.disabled = !_collectBatches().length;
    }

    /* ══════════════════════════════════════════
       الدالة المسؤولة عن الحفظ (التعديل الجذري)
    ══════════════════════════════════════════ */
    async function save() {
        var btn = $('efSaveBtn');
        btn.disabled = true;
        btn.innerHTML = 'Saving...';

        // 🏆 الرابط الصحيح المتوافق مع web.php (بدون كلمة api)
        var endpoint = '/inventory/expiry/batch';
        
        var payload = {
            product_id: productId,
            same_expiry: mode === true
        };

        if (mode === true) {
            payload.single_batch = {
                expiry_date: $('efSingleDate').value,
                batch_code: 'S-' + productId
            };
        } else {
            payload.batches = _collectBatches();
        }

        try {
            var res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    // 🏆 جلب مفتاح الحماية CSRF ضروري جداً
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify(payload)
            });

            var data = await res.json();

            if (res.ok && data.success) {
                // استدعاء دالة النجاح في الملف الآخر لتحديث الجدول
                if (window.Inventory && window.Inventory.onSaveSuccess) {
                    window.Inventory.onSaveSuccess(productId, data, isEdit);
                }
                close();
            } else {
                _showError(data.message || 'فشل في الحفظ، حاول مرة أخرى.');
            }
        } catch (err) {
            _showError('خطأ في الاتصال، تأكد من تسجيل دخولك.');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-floppy"></i> Save Expiry Information';
        }
    }

    function _showError(msg) {
        var el = $('efErrorMsg');
        if (!el) {
            el = document.createElement('div');
            el.id = 'efErrorMsg';
            el.style.cssText = 'color:red; margin-top:10px; font-size:0.85rem;';
            $('efSaveBtn').insertAdjacentElement('afterend', el);
        }
        el.textContent = msg;
        el.style.display = 'block';
    }

    function _initListeners() {
        $('efBackdrop')?.addEventListener('click', function (e) { if (e.target === $('efBackdrop')) close(); });
        $('efCloseBtn')?.addEventListener('click', close);
        $('btnYes')?.addEventListener('click', function () { selectMode(true); });
        $('btnNo')?.addEventListener('click', function () { selectMode(false); });
        $('efSingleDate')?.addEventListener('input', validate);
        $('efAddBatchBtn')?.addEventListener('click', addBatch);
        $('efSaveBtn')?.addEventListener('click', save);
    }

    document.addEventListener('DOMContentLoaded', _initListeners);
    
    return {
        open: open, openSingle: openSingle, openBatch: openBatch,
        close: close, selectMode: selectMode, addBatch: addBatch,
        removeBatch: removeBatch, updateBadge: updateBadge, validate: validate, save: save
    };
})();