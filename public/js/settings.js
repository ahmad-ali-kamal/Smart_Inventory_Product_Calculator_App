/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!**********************************!*\
  !*** ./resources/js/settings.js ***!
  \**********************************/
/**
 * settings.js
 * JS خاص بصفحة الإعدادات — live preview للحسابات
 */
document.addEventListener('DOMContentLoaded', function () {
  var coverageInput = document.getElementById('coverage_per_unit');
  var wasteInput = document.getElementById('waste_percentage');
  var placeholder = document.getElementById('preview-placeholder');
  var resultBlock = document.getElementById('preview-result');
  var formulaLine = document.getElementById('formula-line');
  var varRows = document.getElementById('var-rows');
  var resultNumber = document.getElementById('result-number');
  var AREA = 20;
  function varRow(name, value) {
    return "<div style=\"display:flex; align-items:center; gap:0.6rem;\">\n            <span style=\"font-family:'Courier New',monospace; font-size:0.72rem; font-weight:700; color:var(--mauve-deep); background:var(--mauve-soft); border:1px solid var(--mauve-border); border-radius:2rem; padding:0.15rem 0.7rem; min-width:72px; text-align:center;\">".concat(name, "</span>\n            <span style=\"font-size:0.72rem; color:var(--muted);\">=</span>\n            <span style=\"font-size:0.78rem; font-weight:600; color:var(--fg);\">").concat(value, "</span>\n        </div>");
  }
  function updatePreview() {
    var coverage = parseFloat(coverageInput.value);
    var waste = parseFloat(wasteInput.value);
    if (!coverage || !waste || coverage <= 0) {
      placeholder.style.display = 'block';
      resultBlock.style.display = 'none';
      return;
    }
    var wasteDecimal = waste / 100;
    var boxes = Math.ceil(AREA / coverage * (1 + wasteDecimal));
    formulaLine.innerHTML = "boxes = ceil( <span style=\"color:var(--mauve-deep);font-weight:700;\">area</span> &divide; <span style=\"color:var(--mauve-deep);font-weight:700;\">coverage</span> &times; (1 + <span style=\"color:var(--mauve-deep);font-weight:700;\">waste</span>) )";
    varRows.innerHTML = varRow('area', "".concat(AREA, " m\xB2")) + varRow('coverage', "".concat(coverage, " m\xB2 per box")) + varRow('waste', "".concat(wasteDecimal.toFixed(2), " (").concat(waste, "%)"));
    resultNumber.textContent = boxes;
    placeholder.style.display = 'none';
    resultBlock.style.display = 'flex';
  }
  if (coverageInput.value && wasteInput.value) updatePreview();
  coverageInput.addEventListener('input', updatePreview);
  wasteInput.addEventListener('input', updatePreview);
});
/******/ })()
;