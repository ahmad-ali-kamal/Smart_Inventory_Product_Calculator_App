/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!********************************************!*\
  !*** ./resources/js/inventory-settings.js ***!
  \********************************************/
/**
 * inventory-settings.js
 * Settings Page — Drag & Drop, Threshold Badges, Toggle Switches
 *
 * Zero inline handlers — everything wired through DOMContentLoaded.
 * The blade uses data-bucket on drop-zones and data-category on pills;
 * no onclick / ondragstart / ondrop attributes needed anywhere.
 */
document.addEventListener('DOMContentLoaded', function () {
  /* ══════════════════════════════════════════
     DRAG & DROP — Category Mapping
  ══════════════════════════════════════════ */
  var draggedEl = null;
  var dragSource = null;

  // ── Attach drag listener to a single pill ──
  function _attachPillDrag(pill) {
    pill.addEventListener('dragstart', function (e) {
      var _pill$closest$dataset, _pill$closest;
      draggedEl = pill;
      dragSource = (_pill$closest$dataset = (_pill$closest = pill.closest('.drop-zone')) === null || _pill$closest === void 0 ? void 0 : _pill$closest.dataset.bucket) !== null && _pill$closest$dataset !== void 0 ? _pill$closest$dataset : null;
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(function () {
        return pill.style.opacity = '0.4';
      }, 0);
    });
  }

  // ── Drop-zone listeners ──
  document.querySelectorAll('.drop-zone').forEach(function (zone) {
    var target = zone.dataset.bucket;
    zone.addEventListener('dragover', function (e) {
      e.preventDefault();
      zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', function () {
      zone.classList.remove('drag-over');
    });
    zone.addEventListener('drop', function (e) {
      var _document$getElementB;
      e.preventDefault();
      zone.classList.remove('drag-over');
      if (!draggedEl || dragSource === target) {
        if (draggedEl) draggedEl.style.opacity = '';
        draggedEl = dragSource = null;
        return;
      }
      var prevSource = dragSource;
      draggedEl.style.opacity = '';
      (_document$getElementB = document.getElementById('list-' + target)) === null || _document$getElementB === void 0 ? void 0 : _document$getElementB.appendChild(draggedEl);
      _syncHiddenInputs(prevSource);
      _syncHiddenInputs(target);
      draggedEl = dragSource = null;
    });
  });

  // Attach drag listeners to all pills on page load
  document.querySelectorAll('.category-pill').forEach(_attachPillDrag);
  function _syncHiddenInputs(bucket) {
    document.querySelectorAll('.hid-' + bucket).forEach(function (el) {
      return el.remove();
    });
    document.querySelectorAll("#list-".concat(bucket, " .category-pill")).forEach(function (pill) {
      var inp = document.createElement('input');
      inp.type = 'hidden';
      inp.name = "category_mapping[".concat(bucket, "][]");
      inp.value = pill.dataset.category;
      inp.classList.add('hid-' + bucket);
      document.getElementById('settingsForm').appendChild(inp);
    });
  }

  /* ══════════════════════════════════════════
     THRESHOLD — Live Badge Update
  ══════════════════════════════════════════ */
  var _bucketMap = {
    short_term_days: 'shortTerm',
    medium_term_days: 'mediumTerm',
    long_term_days: 'longTerm'
  };
  document.querySelectorAll('.threshold-input').forEach(function (input) {
    input.addEventListener('input', function () {
      var key = _bucketMap[input.name];
      if (key) document.getElementById('badge-' + key).textContent = (input.value || '?') + 'd';
    });
  });

  /* ══════════════════════════════════════════
     TOGGLE SWITCHES — Automation
  ══════════════════════════════════════════ */
  function _toggleSwitch(id) {
    var btn = document.getElementById('toggle-' + id);
    if (!btn) return;
    var willBeOn = !btn.classList.contains('on');

    // mutual exclusion between auto and ai discounts
    if (willBeOn) {
      if (id === 'autodiscounts') _turnOff('aidiscounts');
      if (id === 'aidiscounts') _turnOff('autodiscounts');
    }
    btn.classList.toggle('on', willBeOn);
    document.getElementById('val-' + id).value = willBeOn ? 1 : 0;
    if (id === 'autodiscounts') _toggleDiscountPanel(willBeOn);
  }
  function _turnOff(id) {
    var btn = document.getElementById('toggle-' + id);
    if (!btn) return;
    btn.classList.remove('on');
    document.getElementById('val-' + id).value = 0;
    if (id === 'autodiscounts') _toggleDiscountPanel(false);
  }
  function _toggleDiscountPanel(show) {
    var panel = document.getElementById('discount-input-wrap');
    if (!panel) return;
    if (show) {
      panel.style.opacity = '0';
      panel.style.transform = 'translateY(-6px)';
      panel.style.display = 'block';
      requestAnimationFrame(function () {
        panel.style.opacity = '1';
        panel.style.transform = 'translateY(0)';
      });
    } else {
      panel.style.display = 'none';
    }
  }

  // Wire all toggle switches via data-toggle-id attribute (no onclick in blade)
  document.querySelectorAll('.toggle-switch[data-toggle-id]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      return _toggleSwitch(btn.dataset.toggleId);
    });
  });
});
/******/ })()
;