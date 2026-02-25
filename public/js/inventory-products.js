/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!********************************************!*\
  !*** ./resources/js/inventory-products.js ***!
  \********************************************/
/**
 * inventory-products.js
 * Products Page — Filter, Batch Toggle, Form Bridge, Toast
 *
 * exposes window.Inventory because dateform.js and discountform.js
 * need to call back into this module after a successful save.
 *
 * Fixes:
 *   1. toggleBatch — eye icon state syncs correctly on every toggle
 *   2. bfcache fix via pageshow — filter re-applies on back navigation
 *   3. _applyFilter called on DOMContentLoaded to set correct initial count
 */
window.Inventory = function () {
  /* ── State ── */
  var currentFilter = 'all';

  /* ══════════════════════════════════════════
     TOAST
  ══════════════════════════════════════════ */
  var _toastTimer = null;
  function _showToast(msg) {
    var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'add';
    var toast = document.getElementById('invToast');
    var icon = document.getElementById('invToastIcon');
    var msgEl = document.getElementById('invToastMsg');
    if (!toast) return;
    toast.className = "inv-toast toast-".concat(type);
    icon.className = type === 'add' ? 'bi bi-check-circle-fill' : 'bi bi-pencil-square';
    msgEl.textContent = msg;
    toast.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () {
      return toast.classList.remove('show');
    }, 3500);
  }

  /* ══════════════════════════════════════════
     TOGGLE BATCH ROWS
     eye icon: closed = bi-eye | open = bi-eye-slash
  ══════════════════════════════════════════ */
  function toggleBatch(productId) {
    var rows = document.querySelectorAll(".batch-row[data-parent=\"".concat(productId, "\"]"));
    var eye = document.getElementById("eye-".concat(productId));
    if (!rows.length) return;
    var isOpen = rows[0].classList.contains('open');
    rows.forEach(function (r) {
      r.classList.toggle('open', !isOpen);
      // show/hide the row — batch rows start as display:none
      r.style.display = !isOpen ? '' : 'none';
    });

    // icon: eye = "rows hidden", eye-slash = "rows visible"
    if (eye) eye.className = !isOpen ? 'bi bi-eye-slash' : 'bi bi-eye';
  }

  /* ══════════════════════════════════════════
     OPEN EXPIRY FORM
  ══════════════════════════════════════════ */
  function openForm(productId, productName) {
    var row = document.querySelector("#invBody tr[data-id=\"".concat(productId, "\"]"));
    if (!row) return;
    var batches = [];
    try {
      batches = JSON.parse(row.dataset.batches || '[]');
    } catch (e) {}
    if (row.dataset.expiryType === 'single' || batches.length === 0 && row.dataset.expiry) {
      ExpiryForm.openSingle(productId, productName, row.dataset.expiry);
    } else {
      ExpiryForm.openBatch(productId, productName, batches);
    }
  }

  /* ══════════════════════════════════════════
     CALLED BY ExpiryForm AFTER SUCCESSFUL SAVE
  ══════════════════════════════════════════ */
  function onSaveSuccess(productId, payload, wasEdit) {
    var _payload$batches;
    var row = document.querySelector("#invBody tr[data-id=\"".concat(productId, "\"]"));
    var expiryCell = document.getElementById("expiry-cell-".concat(productId));
    var actionBtn = document.getElementById("btn-expiry-".concat(productId));
    if (!row) return;
    if (payload.type === 'single') {
      row.dataset.expiry = payload.expiry_date;
      row.dataset.expiryType = 'single';
      row.dataset.batches = '[]';
      expiryCell.innerHTML = "\n                <div class=\"exp-cell\">\n                    <i class=\"bi bi-calendar3\" style=\"font-size:0.78rem;\"></i>\n                    <span style=\"color:var(--muted);\">".concat(payload.expiry_date, "</span>\n                </div>");
    } else if (payload.type === 'batch' && (_payload$batches = payload.batches) !== null && _payload$batches !== void 0 && _payload$batches.length) {
      var normalized = payload.batches.map(function (b) {
        var _b$expiry_date;
        return {
          label: b.label,
          qty: b.qty,
          status: b.status,
          expiry: (_b$expiry_date = b.expiry_date) !== null && _b$expiry_date !== void 0 ? _b$expiry_date : b.expiry
        };
      });
      row.dataset.batches = JSON.stringify(normalized);
      row.dataset.expiryType = 'batch';
      row.dataset.expiry = '';
      var count = payload.batches.length;
      expiryCell.innerHTML = "\n                <div class=\"exp-cell\">\n                    <button class=\"btn-eye\" data-product-id=\"".concat(productId, "\">\n                        <i class=\"bi bi-eye\" id=\"eye-").concat(productId, "\"></i>\n                    </button>\n                    <span>").concat(count, " batch").concat(count > 1 ? 'es' : '', "</span>\n                </div>");
      expiryCell.querySelector('.btn-eye').addEventListener('click', function () {
        return toggleBatch(productId);
      });
    }
    if (actionBtn) {
      actionBtn.className = 'btn-expiry is-edit';
      actionBtn.innerHTML = '<i class="bi bi-pencil-square"></i> Edit Expiry Date';
      var fresh = actionBtn.cloneNode(true);
      actionBtn.replaceWith(fresh);
      fresh.addEventListener('click', function () {
        var _row$querySelector$te, _row$querySelector;
        return openForm(productId, (_row$querySelector$te = (_row$querySelector = row.querySelector('.prod-name')) === null || _row$querySelector === void 0 || (_row$querySelector = _row$querySelector.textContent) === null || _row$querySelector === void 0 ? void 0 : _row$querySelector.trim()) !== null && _row$querySelector$te !== void 0 ? _row$querySelector$te : '');
      });
    }
    _showToast(wasEdit ? 'Expiry date updated successfully' : 'Expiry date added successfully', wasEdit ? 'edit' : 'add');
  }

  /* ══════════════════════════════════════════
     CALLED BY DiscountForm AFTER SUCCESS
  ══════════════════════════════════════════ */
  function onDiscountSuccess(productId, data) {
    var row = document.querySelector("#invBody tr[data-id=\"".concat(productId, "\"]"));
    if (!row) return;
    var pill = row.querySelector('.disc-pill');
    if (!pill) {
      var _row$querySelector2;
      pill = document.createElement('div');
      pill.className = 'disc-pill';
      (_row$querySelector2 = row.querySelector('.prod-name')) === null || _row$querySelector2 === void 0 ? void 0 : _row$querySelector2.insertAdjacentElement('afterend', pill);
    }
    pill.innerHTML = "<i class=\"bi bi-tag-fill\"></i> ".concat(data.percent, "% &bull; Active");
    _showToast('Discount applied successfully', 'add');
  }

  /* ══════════════════════════════════════════
     FILTER TABS
  ══════════════════════════════════════════ */
  function filter(btn) {
    currentFilter = btn.dataset.filter;
    document.querySelectorAll('.inv-filter-tab').forEach(function (t) {
      return t.classList.remove('active');
    });
    btn.classList.add('active');
    _applyFilter();
  }
  function _applyFilter() {
    var count = 0;
    document.querySelectorAll('#invBody tr[data-filter]:not(.batch-row)').forEach(function (row) {
      var visible = currentFilter === 'all' || row.dataset.filter === currentFilter;
      row.style.display = visible ? '' : 'none';
      if (visible) count++;

      // keep batch rows in sync with parent visibility
      var eyeEl = row.querySelector('[id^="eye-"]');
      if (eyeEl) {
        var pid = eyeEl.id.replace('eye-', '');
        document.querySelectorAll(".batch-row[data-parent=\"".concat(pid, "\"]")).forEach(function (r) {
          if (!visible) {
            r.classList.remove('open');
            r.style.display = 'none';
          } else {
            // keep their current open/closed state
            r.style.display = r.classList.contains('open') ? '' : 'none';
          }
        });
      }
    });
    var footer = document.getElementById('invFooter');
    var empty = document.getElementById('invEmpty');
    if (footer) footer.innerHTML = "<i class=\"bi bi-box-seam\"></i> Showing ".concat(count, " products from your Salla store");
    if (empty) empty.style.display = count === 0 ? 'block' : 'none';
  }

  /* ══════════════════════════════════════════
     EVENT DELEGATION
  ══════════════════════════════════════════ */
  function _initListeners() {
    var _document$getElementB;
    // Filter tabs
    document.querySelectorAll('.inv-filter-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        return filter(tab);
      });
    });

    // Expiry + batch-edit + eye buttons — single delegated listener on tbody
    (_document$getElementB = document.getElementById('invBody')) === null || _document$getElementB === void 0 ? void 0 : _document$getElementB.addEventListener('click', function (e) {
      var expiryBtn = e.target.closest('.btn-expiry, .btn-edit-batch');
      if (expiryBtn) {
        openForm(expiryBtn.dataset.productId, expiryBtn.dataset.productName);
        return;
      }
      var eyeBtn = e.target.closest('.btn-eye');
      if (eyeBtn && eyeBtn.dataset.productId) {
        toggleBatch(eyeBtn.dataset.productId);
      }
    });

    // apply filter on load to set correct footer count
    _applyFilter();
  }
  document.addEventListener('DOMContentLoaded', _initListeners);

  // ── bfcache fix: re-apply filter state after back navigation ──
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      // restore active filter tab UI
      var activeTab = document.querySelector(".inv-filter-tab[data-filter=\"".concat(currentFilter, "\"]"));
      if (activeTab) {
        document.querySelectorAll('.inv-filter-tab').forEach(function (t) {
          return t.classList.remove('active');
        });
        activeTab.classList.add('active');
      }
      _applyFilter();
    }
  });

  /* ── Public API ── */
  return {
    toggleBatch: toggleBatch,
    openForm: openForm,
    onSaveSuccess: onSaveSuccess,
    onDiscountSuccess: onDiscountSuccess,
    filter: filter
  };
}();
/******/ })()
;