/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!*********************************************!*\
  !*** ./resources/js/inventory-dashboard.js ***!
  \*********************************************/
/**
 * inventory-dashboard.js
 * Dashboard — Dropdown Filter + Discount Buttons + Eye Toggle
 */
document.addEventListener('DOMContentLoaded', function () {
  var _document$getElementB;
  /* ── State ── */
  var currentFilter = 'all';

  /* ── Filter Dropdown ── */
  var toggle = document.getElementById('dashFilterToggle');
  var menu = document.getElementById('dashFilterMenu');
  var chevron = document.getElementById('dashFilterChevron');
  var label = document.getElementById('dashFilterLabel');
  toggle === null || toggle === void 0 ? void 0 : toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    var isOpen = menu.classList.contains('open');
    menu.classList.toggle('open', !isOpen);
    chevron === null || chevron === void 0 ? void 0 : chevron.classList.toggle('open', !isOpen);
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('#dashFilterDropdown')) {
      menu === null || menu === void 0 ? void 0 : menu.classList.remove('open');
      chevron === null || chevron === void 0 ? void 0 : chevron.classList.remove('open');
    }
  });
  menu === null || menu === void 0 ? void 0 : menu.addEventListener('click', function (e) {
    var btn = e.target.closest('.inv-filter-option');
    if (!btn) return;
    menu.querySelectorAll('.inv-filter-option').forEach(function (o) {
      return o.classList.remove('active');
    });
    btn.classList.add('active');
    label.textContent = btn.textContent.trim();
    menu.classList.remove('open');
    chevron === null || chevron === void 0 ? void 0 : chevron.classList.remove('open');
    currentFilter = btn.dataset.filter;
    _applyFilter();
  });

  /* ── Apply Filter ── */
  function _applyFilter() {
    var visible = 0;
    document.querySelectorAll('#dashBody tr[data-status]').forEach(function (row) {
      var show = currentFilter === 'all' || row.dataset.status === currentFilter;
      row.style.display = show ? '' : 'none';

      // أخفِ/أظهر صفوف الدفعات تبعاً للصف الأب
      var pid = row.dataset.id;
      if (pid) {
        document.querySelectorAll(".batch-row[data-parent=\"".concat(pid, "\"]")).forEach(function (r) {
          if (!show) {
            r.classList.remove('open');
            r.style.display = 'none';
            // reset eye icon
            var eye = document.getElementById("dash-eye-".concat(pid));
            if (eye) eye.className = 'bi bi-eye';
          } else {
            // أظهره فقط لو كان مفتوحاً
            r.style.display = r.classList.contains('open') ? 'table-row' : 'none';
          }
        });
      }
      if (show) visible++;
    });
    var empty = document.getElementById('filterEmpty');
    if (empty) empty.style.display = visible === 0 ? 'block' : 'none';
  }

  /* ── Eye Toggle — نفس منطق Products بالضبط ── */
  (_document$getElementB = document.getElementById('dashBody')) === null || _document$getElementB === void 0 ? void 0 : _document$getElementB.addEventListener('click', function (e) {
    // زر العين
    var eyeBtn = e.target.closest('.btn-eye');
    if (eyeBtn && eyeBtn.dataset.productId) {
      var productId = eyeBtn.dataset.productId;
      var rows = document.querySelectorAll(".batch-row[data-parent=\"".concat(productId, "\"]"));
      var eye = document.getElementById("dash-eye-".concat(productId));
      if (!rows.length) return;
      var isOpen = rows[0].classList.contains('open');
      rows.forEach(function (r) {
        r.classList.toggle('open', !isOpen);
        r.style.display = !isOpen ? 'table-row' : 'none';
      });
      if (eye) eye.className = !isOpen ? 'bi bi-eye-slash' : 'bi bi-eye';
      return;
    }

    // زر الخصم
    var discountBtn = e.target.closest('.btn-discount');
    if (discountBtn) {
      if (typeof DiscountForm === 'undefined') {
        console.warn('DiscountForm is not loaded');
        return;
      }
      DiscountForm.open(discountBtn.dataset.productId, discountBtn.dataset.productName);
    }
  });
});
/******/ })()
;