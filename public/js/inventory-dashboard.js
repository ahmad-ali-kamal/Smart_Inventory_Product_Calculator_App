/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!*********************************************!*\
  !*** ./resources/js/inventory-dashboard.js ***!
  \*********************************************/
/**
 * inventory-dashboard.js
 * Dashboard — Filter Tabs + Expand Button
 */
document.addEventListener('DOMContentLoaded', function () {
  var _document$querySelect;
  /* ── Filter Tabs ── */
  document.querySelectorAll('.filter-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      return _setFilter(tab);
    });
  });
  function _setFilter(activeTab) {
    var status = activeTab.dataset.filter;
    document.querySelectorAll('.filter-tab').forEach(function (t) {
      return t.classList.remove('active');
    });
    activeTab.classList.add('active');
    var visible = 0;
    document.querySelectorAll('.table-row[data-status]').forEach(function (row) {
      var show = status === 'all' || row.dataset.status === status;
      row.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    var empty = document.getElementById('filterEmpty');
    if (empty) empty.style.display = visible === 0 ? 'block' : 'none';
  }

  /* ── Expand Button Rotation ── */
  document.querySelectorAll('.expand-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      return btn.classList.toggle('expanded');
    });
  });

  /* ── Discount Buttons — read data attributes, no onclick needed ── */
  (_document$querySelect = document.querySelector('tbody')) === null || _document$querySelect === void 0 ? void 0 : _document$querySelect.addEventListener('click', function (e) {
    var btn = e.target.closest('.btn-discount');
    if (!btn) return;
    if (typeof DiscountForm === 'undefined') {
      console.warn('DiscountForm is not loaded');
      return;
    }
    DiscountForm.open(btn.dataset.productId, btn.dataset.productName);
  });
});
/******/ })()
;