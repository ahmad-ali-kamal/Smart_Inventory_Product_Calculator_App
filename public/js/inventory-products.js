/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!********************************************!*\
  !*** ./resources/js/inventory-products.js ***!
  \********************************************/
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _iterableToArrayLimit(arr, i) { var _i = null == arr ? null : "undefined" != typeof Symbol && arr[Symbol.iterator] || arr["@@iterator"]; if (null != _i) { var _s, _e, _x, _r, _arr = [], _n = !0, _d = !1; try { if (_x = (_i = _i.call(arr)).next, 0 === i) { if (Object(_i) !== _i) return; _n = !1; } else for (; !(_n = (_s = _x.call(_i)).done) && (_arr.push(_s.value), _arr.length !== i); _n = !0); } catch (err) { _d = !0, _e = err; } finally { try { if (!_n && null != _i["return"] && (_r = _i["return"](), Object(_r) !== _r)) return; } finally { if (_d) throw _e; } } return _arr; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
/**
 * inventory-products.js
 * Products Page — Filter, Batch Toggle, Form Bridge, Toast
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
      r.style.display = !isOpen ? 'table-row' : 'none';
    });
    if (eye) eye.className = !isOpen ? 'bi bi-eye-slash' : 'bi bi-eye';
  }

  /* ══════════════════════════════════════════
     OPEN EXPIRY FORM
  ══════════════════════════════════════════ */
  // بعد — أضف قراءة threshold وابعثه مع كل open
  function openForm(productId, productName) {
    var row = document.querySelector("#invBody tr[data-id=\"".concat(productId, "\"]"));
    if (!row) return;
    var batches = [];
    try {
      batches = JSON.parse(row.dataset.batches || '[]');
    } catch (e) {}
    var threshold = parseInt(row.dataset.threshold) || 14; // ← جديد

    if (row.dataset.originalType === 'single' || row.dataset.expiryType === 'single' || batches.length === 0 && row.dataset.expiry) {
      var _b$expiry, _b$batch_code;
      var b = batches[0];
      ExpiryForm.openSingle(productId, productName, (_b$expiry = b === null || b === void 0 ? void 0 : b.expiry) !== null && _b$expiry !== void 0 ? _b$expiry : row.dataset.expiry, (_b$batch_code = b === null || b === void 0 ? void 0 : b.batch_code) !== null && _b$batch_code !== void 0 ? _b$batch_code : row.dataset.batchCode, threshold);
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
    var _payload$batches;
    var row = document.querySelector("#invBody tr[data-id=\"".concat(productId, "\"]"));
    var expiryCell = document.getElementById("expiry-cell-".concat(productId));
    var actionBtn = document.getElementById("btn-expiry-".concat(productId));
    if (!row) return;
    row.dataset.originalType = payload.type;
    var statusCell = row.querySelector('td:nth-child(3)');
    if (statusCell && payload.status) {
      var _statusMap$payload$st;
      var statusMap = {
        green: ['b-green', 'Safe'],
        yellow: ['b-yellow', 'Approaching'],
        red: ['b-red', 'Expired']
      };
      var _ref = (_statusMap$payload$st = statusMap[payload.status]) !== null && _statusMap$payload$st !== void 0 ? _statusMap$payload$st : ['b-none', 'No expiry set'],
        _ref2 = _slicedToArray(_ref, 2),
        cls = _ref2[0],
        label = _ref2[1];
      statusCell.innerHTML = "<span class=\"badge ".concat(cls, "\">").concat(label, "</span>");
    }
    if (payload.type === 'single') {
      document.querySelectorAll(".batch-row[data-parent=\"".concat(productId, "\"]")).forEach(function (r) {
        return r.remove();
      });
      var singleBatch = [{
        batch_code: payload.batch_code,
        qty: payload.quantity,
        status: payload.status,
        expiry: payload.expiry_date
      }];
      row.dataset.batches = JSON.stringify(singleBatch);
      row.dataset.expiryType = 'batch';
      row.dataset.expiry = '';
      expiryCell.innerHTML = "\n        <div class=\"exp-cell\">\n            <button class=\"btn-eye\" data-product-id=\"".concat(productId, "\">\n                <i class=\"bi bi-eye\" id=\"eye-").concat(productId, "\"></i>\n            </button>\n            <span>Single</span>\n        </div>");
      var statusClass = payload.status || 'green';
      var statusText = statusClass === 'red' ? 'Expired' : statusClass === 'yellow' ? 'Approaching' : 'Safe';
      var tr = document.createElement('tr');
      tr.className = 'batch-row';
      tr.dataset.parent = productId;
      tr.innerHTML = "\n        <td><div class=\"batch-indent\"><span class=\"batch-label-field\"><i class=\"bi bi-layers\"></i> ".concat(payload.batch_code || 'N/A', "</span></div></td>\n        <td style=\"color:var(--muted);\">").concat(payload.quantity, " units</td>\n        <td><span class=\"badge b-").concat(statusClass, "\">").concat(statusText, "</span></td>\n        <td><div class=\"exp-cell\"><i class=\"bi bi-calendar3\" style=\"font-size:0.78rem;\"></i><span style=\"color:var(--muted);\">").concat(payload.expiry_date, "</span></div></td>\n        <td></td>");
      row.insertAdjacentElement('afterend', tr);
    } else if (payload.type === 'batch' && (_payload$batches = payload.batches) !== null && _payload$batches !== void 0 && _payload$batches.length) {
      // ❗ احذف أي batch rows قديمة
      document.querySelectorAll(".batch-row[data-parent=\"".concat(productId, "\"]")).forEach(function (r) {
        return r.remove();
      });
      var normalized = payload.batches.map(function (b) {
        var _ref3, _b$expiry_date, _b$batch_code2;
        return {
          label: b.label,
          qty: b.qty,
          status: b.status,
          expiry: ((_ref3 = (_b$expiry_date = b.expiry_date) !== null && _b$expiry_date !== void 0 ? _b$expiry_date : b.expiry) !== null && _ref3 !== void 0 ? _ref3 : '').substring(0, 10),
          batch_code: (_b$batch_code2 = b.batch_code) !== null && _b$batch_code2 !== void 0 ? _b$batch_code2 : null
        };
      });
      row.dataset.batches = JSON.stringify(normalized);
      row.dataset.expiryType = 'batch';
      row.dataset.expiry = '';
      var count = payload.batches.length;
      expiryCell.innerHTML = "\n                <div class=\"exp-cell\">\n                    <button class=\"btn-eye\" data-product-id=\"".concat(productId, "\">\n                        <i class=\"bi bi-eye\" id=\"eye-").concat(productId, "\"></i>\n                    </button>\n                    <span>").concat(count, " batch").concat(count > 1 ? 'es' : '', "</span>\n                </div>");
      var lastRow = row;
      normalized.forEach(function (b) {
        var tr = document.createElement('tr');
        tr.className = 'batch-row';
        tr.dataset.parent = productId;
        var statusClass = b.status || 'green';
        var statusText = statusClass === 'red' ? 'Expired' : statusClass === 'yellow' ? 'Approaching' : 'Safe';
        tr.innerHTML = "\n        <td>\n            <div class=\"batch-indent\">\n                <span class=\"batch-label-field\">\n                    <i class=\"bi bi-layers\"></i>\n                   ".concat(b.batch_code || 'N/A', "\n                </span>\n            </div>\n        </td>\n\n        <td style=\"color:var(--muted);\">\n            ").concat(b.qty, " units\n        </td>\n\n        <td>\n            <span class=\"badge b-").concat(statusClass, "\">\n                ").concat(statusText, "\n            </span>\n        </td>\n\n        <td>\n            <div class=\"exp-cell\">\n                <i class=\"bi bi-calendar3\" style=\"font-size:0.78rem;\"></i>\n                <span style=\"color:var(--muted);\">\n                   ").concat(b.expiry || 'No Date', "\n                </span>\n            </div>\n        </td>\n\n        <td></td>\n    ");

        // 👇 هذا يخلي الصفوف تطلع تحت بعض بشكل مرتب
        lastRow.insertAdjacentElement('afterend', tr);
        lastRow = tr;
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
     FILTER — DROPDOWN (الجديد)
  ══════════════════════════════════════════ */
  function _applyFilter() {
    var count = 0;
    document.querySelectorAll('#invBody tr[data-filter]:not(.batch-row)').forEach(function (row) {
      var visible = currentFilter === 'all' || row.dataset.filter === currentFilter;
      row.style.display = visible ? '' : 'none';
      if (visible) count++;

      // ← البحث عن product id من data-id مباشرة
      var pid = row.dataset.id;
      if (pid) {
        document.querySelectorAll(".batch-row[data-parent=\"".concat(pid, "\"]")).forEach(function (r) {
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
    var footer = document.getElementById('invFooter');
    var empty = document.getElementById('invEmpty');
    if (footer) footer.innerHTML = "<i class=\"bi bi-box-seam\"></i> Showing ".concat(count, " products from your Salla store");
    if (empty) empty.style.display = count === 0 ? 'block' : 'none';
  }
  function toggleFilterMenu() {
    var menu = document.getElementById('filterMenu');
    var chevron = document.getElementById('filterChevron');
    if (!menu) return;
    var isOpen = menu.classList.contains('open');
    menu.classList.toggle('open', !isOpen);
    chevron === null || chevron === void 0 ? void 0 : chevron.classList.toggle('open', !isOpen);
  }
  function selectFilter(btn) {
    var _document$getElementB;
    // تحديث active state في القائمة
    document.querySelectorAll('.inv-filter-option').forEach(function (o) {
      return o.classList.remove('active');
    });
    btn.classList.add('active');

    // تحديث نص الزر
    document.getElementById('filterLabel').textContent = btn.textContent.trim();

    // إغلاق القائمة
    document.getElementById('filterMenu').classList.remove('open');
    (_document$getElementB = document.getElementById('filterChevron')) === null || _document$getElementB === void 0 ? void 0 : _document$getElementB.classList.remove('open');

    // ← الحل: تحديث currentFilter مباشرة ثم تطبيق الفلتر
    currentFilter = btn.dataset.filter;
    _applyFilter();
  }

  /* ══════════════════════════════════════════
     EVENT DELEGATION
  ══════════════════════════════════════════ */
  function _initListeners() {
    var _document$getElementB2;
    // Expiry + batch-edit + eye buttons — single delegated listener on tbody
    (_document$getElementB2 = document.getElementById('invBody')) === null || _document$getElementB2 === void 0 ? void 0 : _document$getElementB2.addEventListener('click', function (e) {
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

    // إغلاق القائمة عند الضغط خارجها
    document.addEventListener('click', function (e) {
      if (!e.target.closest('#filterDropdown')) {
        var _document$getElementB3, _document$getElementB4;
        (_document$getElementB3 = document.getElementById('filterMenu')) === null || _document$getElementB3 === void 0 ? void 0 : _document$getElementB3.classList.remove('open');
        (_document$getElementB4 = document.getElementById('filterChevron')) === null || _document$getElementB4 === void 0 ? void 0 : _document$getElementB4.classList.remove('open');
      }
    });

    // apply filter on load
    // count on load only
    var count = document.querySelectorAll('#invBody tr[data-filter]:not(.batch-row)').length;
    var footer = document.getElementById('invFooter');
    var empty = document.getElementById('invEmpty');
    if (footer) footer.innerHTML = "<i class=\"bi bi-box-seam\"></i> Showing ".concat(count, " products from your Salla store");
    if (empty) empty.style.display = count === 0 ? 'block' : 'none';
  }
  document.addEventListener('DOMContentLoaded', _initListeners);

  // ── bfcache fix: re-apply filter state after back navigation ──
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      var count = document.querySelectorAll('#invBody tr[data-filter]:not(.batch-row)').length;
      var footer = document.getElementById('invFooter');
      var empty = document.getElementById('invEmpty');
      if (footer) footer.innerHTML = "<i class=\"bi bi-box-seam\"></i> Showing ".concat(count, " products from your Salla store");
      if (empty) empty.style.display = count === 0 ? 'block' : 'none';
    }
  });
  /* ── كشف الدوال للـ window ── */
  window.toggleFilterMenu = toggleFilterMenu;
  window.selectFilter = selectFilter;

  /* ── Public API ── */
  return {
    toggleBatch: toggleBatch,
    openForm: openForm,
    onSaveSuccess: onSaveSuccess,
    onDiscountSuccess: onDiscountSuccess
  };
}();
/******/ })()
;