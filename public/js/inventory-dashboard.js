/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!*********************************************!*\
  !*** ./resources/js/inventory-dashboard.js ***!
  \*********************************************/
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
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
      var pid = row.dataset.id;
      var batchRows = pid ? document.querySelectorAll(".batch-row[data-parent=\"".concat(pid, "\"]")) : [];
      if (currentFilter === 'all') {
        // أظهر صف المنتج، أخفِ كل الباتشات
        row.style.display = '';
        batchRows.forEach(function (r) {
          r.classList.remove('open');
          r.style.display = 'none';
        });
        visible++;
      } else {
        // أخفِ صف المنتج الرئيسي
        row.style.display = 'none';

        // أظهر الباتشات المطابقة كـ "منتجات مستقلة"
        batchRows.forEach(function (r) {
          var match = r.dataset.batchStatus === currentFilter;
          r.style.display = match ? 'table-row' : 'none';
          r.classList.toggle('open', match);
          if (match) visible++;
        });
      }
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
      var eye = document.getElementById("dash-eye-".concat(productId));
      var allBatchRows = document.querySelectorAll(".batch-row[data-parent=\"".concat(productId, "\"]"));
      var targetRows = currentFilter === 'all' ? _toConsumableArray(allBatchRows) : _toConsumableArray(allBatchRows).filter(function (r) {
        return r.dataset.batchStatus === currentFilter;
      });
      if (!targetRows.length) return;
      var isOpen = targetRows[0].style.display === 'table-row';

      // أغلق الكل أولاً
      allBatchRows.forEach(function (r) {
        r.classList.remove('open');
        r.style.display = 'none';
      });

      // افتح المطلوبة فقط لو كانت مغلقة
      if (!isOpen) {
        targetRows.forEach(function (r) {
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