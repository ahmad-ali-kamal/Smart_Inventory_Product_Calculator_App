/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!********************************************!*\
  !*** ./resources/js/inventory-dateform.js ***!
  \********************************************/
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _iterableToArrayLimit(arr, i) { var _i = null == arr ? null : "undefined" != typeof Symbol && arr[Symbol.iterator] || arr["@@iterator"]; if (null != _i) { var _s, _e, _x, _r, _arr = [], _n = !0, _d = !1; try { if (_x = (_i = _i.call(arr)).next, 0 === i) { if (Object(_i) !== _i) return; _n = !1; } else for (; !(_n = (_s = _x.call(_i)).done) && (_arr.push(_s.value), _arr.length !== i); _n = !0); } catch (err) { _d = !0, _e = err; } finally { try { if (!_n && null != _i["return"] && (_r = _i["return"](), Object(_r) !== _r)) return; } finally { if (_d) throw _e; } } return _arr; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
/**
 * inventory-dateform.js
 * Expiry Date Modal — Add / Edit (single date or batch-level)
 */
window.ExpiryForm = function () {
  var productId = null;
  var mode = null;
  var isEdit = false;
  var batchCount = 0;
  var _isOpen = false;
  var _threshold = 14;
  var _sallaQty = 0;
  var _usedQty = 0;
  var _userStarted = false; // يمنع التحذير قبل أول إدخال

  /* ── DOM helper ── */
  var $ = function $(id) {
    return document.getElementById(id);
  };

  /* ══════════════════════════════════════════
     STATUS HELPERS
  ══════════════════════════════════════════ */
  function _calcStatus(dateStr) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var days = Math.floor((new Date(dateStr) - today) / 86400000);
    if (days <= 0) return 'red';
    if (days <= _threshold) return 'yellow';
    return 'green';
  }
  function _statusBadgeHtml(status, idx) {
    var _map$status;
    var map = {
      green: ['ef-s-green', 'Safe'],
      yellow: ['ef-s-yellow', 'Approaching'],
      red: ['ef-s-red', 'Expired']
    };
    var _ref = (_map$status = map[status]) !== null && _map$status !== void 0 ? _map$status : ['', ''],
      _ref2 = _slicedToArray(_ref, 2),
      cls = _ref2[0],
      label = _ref2[1];
    return "<span class=\"ef-status-badge ".concat(cls, "\" id=\"bStatus-").concat(idx, "\">\n            <i class=\"bi bi-circle-fill\" style=\"font-size:0.4rem\"></i> ").concat(label, "\n        </span>");
  }

  /* ══════════════════════════════════════════
     BADGE UPDATE
  ══════════════════════════════════════════ */
  function updateBadge(idx) {
    var dateEl = $("bDate-".concat(idx));
    var badge = $("bStatus-".concat(idx));
    if (!dateEl || !badge) return;
    badge.outerHTML = dateEl.value ? _statusBadgeHtml(_calcStatus(dateEl.value), idx) : "<span class=\"ef-status-badge\" id=\"bStatus-".concat(idx, "\"></span>");
  }
  function _updateSingleStatus() {
    var dateEl = $('efSingleDate');
    var statusEl = $('efSingleStatus');
    if (!statusEl) return;
    if (!(dateEl !== null && dateEl !== void 0 && dateEl.value)) {
      statusEl.className = 'ef-status-badge';
      statusEl.innerHTML = '';
      return;
    }
    var s = _calcStatus(dateEl.value);
    var map = {
      green: ['ef-s-green', 'Safe'],
      yellow: ['ef-s-yellow', 'Approaching'],
      red: ['ef-s-red', 'Expired']
    };
    var _map$s = _slicedToArray(map[s], 2),
      cls = _map$s[0],
      label = _map$s[1];
    statusEl.className = "ef-status-badge ".concat(cls);
    statusEl.innerHTML = "<i class=\"bi bi-circle-fill\" style=\"font-size:0.4rem\"></i> ".concat(label);
  }

  /* ══════════════════════════════════════════
     QTY TRACKER
  ══════════════════════════════════════════ */
  function _getRemainingQty() {
    var entered = 0;
    document.querySelectorAll('#efBatchList .ef-batch-item').forEach(function (item) {
      var _$;
      var id = item.id.replace('efBatch-', '');
      entered += parseInt((_$ = $("bQty-".concat(id))) === null || _$ === void 0 ? void 0 : _$.value) || 0;
    });
    return _sallaQty - _usedQty - entered;
  }
  function _updateQtyTracker() {
    var avail = $('efQtyAvail');
    var warn = $('efQtyWarn');
    var msg = $('efQtyWarnMsg');
    if (!avail) return;

    // في حالة single mode نعرض الكمية الكلية فقط
    if (mode === true) {
      avail.textContent = _sallaQty;
      if (warn) warn.style.display = 'none';
      return;
    }
    var remaining = _getRemainingQty();
    avail.textContent = remaining >= 0 ? remaining : 0;
    if (!warn || !msg) return;
    if (remaining < 0) {
      // تجاوز — أحمر (يظهر دائماً)
      msg.textContent = "Exceeded by ".concat(Math.abs(remaining), " units \u2014 reduce batch quantities");
      warn.className = 'ef-qty-warn ef-qty-over';
      warn.style.display = 'flex';
    } else if (remaining === 0 && _userStarted) {
      // مكتمل — أخضر (بعد إدخال فقط)
      msg.textContent = '✓ All units assigned — ready to save';
      warn.className = 'ef-qty-warn ef-qty-full';
      warn.style.display = 'flex';
    } else if (remaining <= 3 && _userStarted) {
      // قليل — برتقالي (بعد إدخال فقط)
      msg.textContent = "Only ".concat(remaining, " unit").concat(remaining > 1 ? 's' : '', " left to assign");
      warn.className = 'ef-qty-warn ef-qty-low';
      warn.style.display = 'flex';
    } else {
      warn.style.display = 'none';
    }
  }

  /* ══════════════════════════════════════════
     RESET — clears DOM + state completely
  ══════════════════════════════════════════ */
  function _reset(productName) {
    mode = null;
    batchCount = 0;
    _userStarted = false;
    $('efProductName').textContent = productName !== null && productName !== void 0 ? productName : '';
    $('btnYes').className = 'ef-toggle-btn';
    $('btnNo').className = 'ef-toggle-btn';
    $('panelYes').classList.remove('show');
    $('panelNo').classList.remove('show');
    $('efSingleDate').value = '';
    $('efSingleBatchCode').value = '';
    $('efBatchList').innerHTML = '';
    $('efSaveBtn').disabled = true;

    // تحديث عرض الكمية الكلية
    var avail = $('efQtyAvail');
    if (avail) avail.textContent = _sallaQty > 0 ? _sallaQty : '—';
    var warn = $('efQtyWarn');
    if (warn) warn.style.display = 'none';
    var err = $('efErrorMsg');
    if (err) err.style.display = 'none';
  }

  /* ══════════════════════════════════════════
     BATCH ITEM BUILDER
  ══════════════════════════════════════════ */
  function _buildBatchItem() {
    var _prefill$status, _prefill$qty, _prefill$expiry, _prefill$batch_code;
    var prefill = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    batchCount++;
    var idx = batchCount;
    var status = (_prefill$status = prefill.status) !== null && _prefill$status !== void 0 ? _prefill$status : prefill.expiry ? _calcStatus(prefill.expiry) : null;
    var item = document.createElement('div');
    item.className = 'ef-batch-item';
    item.id = "efBatch-".concat(idx);
    var badgeHtml = status ? _statusBadgeHtml(status, idx) : "<span class=\"ef-status-badge\" id=\"bStatus-".concat(idx, "\"></span>");
    item.innerHTML = "\n    <div class=\"ef-batch-head\">\n        <span class=\"ef-batch-lbl\" id=\"bLbl-".concat(idx, "\">\n            <i class=\"bi bi-layers\" style=\"font-size:0.78rem;color:var(--mauve)\"></i>\n            Batch ").concat(idx, " ").concat(badgeHtml, "\n        </span>\n        <button class=\"ef-batch-remove\" data-idx=\"").concat(idx, "\" title=\"Remove\">\n            <i class=\"bi bi-trash3\"></i>\n        </button>\n    </div>\n    <div class=\"ef-batch-grid\">\n        <div>\n            <label class=\"ef-label\">Quantity</label>\n            <input type=\"number\" class=\"ef-input\" id=\"bQty-").concat(idx, "\" min=\"1\"\n                   value=\"").concat((_prefill$qty = prefill.qty) !== null && _prefill$qty !== void 0 ? _prefill$qty : '', "\" placeholder=\"0\">\n        </div>\n        <div>\n            <label class=\"ef-label\">Expiry Date</label>\n            <input type=\"date\" class=\"ef-input\" id=\"bDate-").concat(idx, "\"\n                   value=\"").concat((_prefill$expiry = prefill.expiry) !== null && _prefill$expiry !== void 0 ? _prefill$expiry : '', "\">\n        </div>\n    </div>\n    <input type=\"hidden\" id=\"bCode-").concat(idx, "\" value=\"").concat((_prefill$batch_code = prefill.batch_code) !== null && _prefill$batch_code !== void 0 ? _prefill$batch_code : '', "\">");
    item.querySelector('.ef-batch-remove').addEventListener('click', function () {
      return removeBatch(idx);
    });
    item.querySelector("#bQty-".concat(idx)).addEventListener('input', function () {
      _userStarted = true;
      _updateQtyTracker();
      validate();
    });
    item.querySelector("#bDate-".concat(idx)).addEventListener('input', function () {
      updateBadge(idx);
      validate();
    });
    return item;
  }

  /* ── Re-number batch labels after removal ── */
  function _reNumber() {
    document.querySelectorAll('#efBatchList .ef-batch-item').forEach(function (item, i) {
      var lbl = item.querySelector('.ef-batch-lbl');
      var badge = lbl === null || lbl === void 0 ? void 0 : lbl.querySelector('.ef-status-badge');
      if (!lbl) return;
      lbl.innerHTML = "<i class=\"bi bi-layers\" style=\"font-size:0.78rem;color:var(--mauve)\"></i> Batch ".concat(i + 1, " ");
      if (badge) lbl.appendChild(badge);
    });
  }

  /* ── Collect batch payload ── */
  function _collectBatches() {
    var batches = [];
    document.querySelectorAll('#efBatchList .ef-batch-item').forEach(function (item) {
      var _$2, _$3;
      var id = item.id.replace('efBatch-', '');
      var qty = parseInt((_$2 = $("bQty-".concat(id))) === null || _$2 === void 0 ? void 0 : _$2.value) || 0;
      var dt = (_$3 = $("bDate-".concat(id))) === null || _$3 === void 0 ? void 0 : _$3.value;
      if (qty > 0 && dt) {
        var _$4;
        batches.push({
          qty: qty,
          expiry_date: dt,
          batch_code: ((_$4 = $("bCode-".concat(id))) === null || _$4 === void 0 ? void 0 : _$4.value) || null,
          status: _calcStatus(dt)
        });
      }
    });
    return batches;
  }

  /* ══════════════════════════════════════════
     SHOW / CLOSE
  ══════════════════════════════════════════ */
  function _show() {
    _isOpen = true;
    $('efBackdrop').classList.add('open');
    document.body.classList.add('ef-open');
    document.body.style.overflow = 'hidden';
    // تحديث الـ tracker بعد الفتح مباشرة
    _updateQtyTracker();
  }
  function close() {
    _isOpen = false;
    $('efBackdrop').classList.remove('open');
    document.body.classList.remove('ef-open');
    document.body.style.overflow = '';
    productId = null;
    mode = null;
    isEdit = false;
    batchCount = 0;
    _threshold = 14;
    _sallaQty = 0;
    _usedQty = 0;
    _userStarted = false;
    $('btnYes').className = 'ef-toggle-btn';
    $('btnNo').className = 'ef-toggle-btn';
    $('panelYes').classList.remove('show');
    $('panelNo').classList.remove('show');
    $('efSingleDate').value = '';
    $('efBatchList').innerHTML = '';
    $('efSaveBtn').disabled = true;
    $('efEditBanner').classList.remove('show');
    var avail = $('efQtyAvail');
    if (avail) avail.textContent = '—';
    var warn = $('efQtyWarn');
    if (warn) warn.style.display = 'none';
    var err = $('efErrorMsg');
    if (err) err.style.display = 'none';
  }

  /* ══════════════════════════════════════════
     OPEN VARIANTS
  ══════════════════════════════════════════ */
  function open(pid, productName) {
    var threshold = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 14;
    productId = pid;
    isEdit = false;
    _threshold = threshold;
    var row = document.querySelector("#invBody tr[data-id=\"".concat(pid, "\"]"));
    _sallaQty = parseInt(row === null || row === void 0 ? void 0 : row.dataset.sallaQty) || 0;
    _usedQty = 0;
    _reset(productName);
    $('efTitle').textContent = 'Add Expiry Date';
    $('efIcon').className = 'bi bi-calendar-plus';
    $('efEditBanner').classList.remove('show');
    _show();
  }
  function openSingle(pid, productName, dateValue, batchCode) {
    var threshold = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 14;
    productId = pid;
    isEdit = true;
    _threshold = threshold;
    var row = document.querySelector("#invBody tr[data-id=\"".concat(pid, "\"]"));
    _sallaQty = parseInt(row === null || row === void 0 ? void 0 : row.dataset.sallaQty) || 0;
    _usedQty = 0;
    _reset(productName);
    mode = true;
    $('efTitle').textContent = 'Edit Expiry Date';
    $('efIcon').className = 'bi bi-pencil-square';
    $('efEditBanner').classList.add('show');
    $('btnYes').className = 'ef-toggle-btn active-yes';
    $('panelYes').classList.add('show');
    $('efSingleDate').value = dateValue !== null && dateValue !== void 0 ? dateValue : '';
    $('efSingleBatchCode').value = batchCode !== null && batchCode !== void 0 ? batchCode : '';
    validate();
    _updateSingleStatus();
    _show();
  }
  function openBatch(pid, productName) {
    var prefillBatches = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
    var threshold = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 14;
    productId = pid;
    isEdit = prefillBatches.length > 0;
    _threshold = threshold;
    var row = document.querySelector("#invBody tr[data-id=\"".concat(pid, "\"]"));
    _sallaQty = parseInt(row === null || row === void 0 ? void 0 : row.dataset.sallaQty) || 0;
    _usedQty = 0;
    _reset(productName);
    mode = false;
    $('efTitle').textContent = isEdit ? 'Edit Expiry Date' : 'Add Expiry Date';
    $('efIcon').className = isEdit ? 'bi bi-pencil-square' : 'bi bi-calendar-plus';
    isEdit ? $('efEditBanner').classList.add('show') : $('efEditBanner').classList.remove('show');
    $('btnNo').className = 'ef-toggle-btn active-no';
    $('panelNo').classList.add('show');
    var list = $('efBatchList');
    (prefillBatches.length ? prefillBatches : [{}]).forEach(function (b) {
      return list.appendChild(_buildBatchItem(b));
    });
    validate();
    _show();
  }

  /* ══════════════════════════════════════════
     MODE TOGGLE
  ══════════════════════════════════════════ */
  function selectMode(isSingle) {
    mode = isSingle;
    $('btnYes').className = 'ef-toggle-btn' + (isSingle ? ' active-yes' : '');
    $('btnNo').className = 'ef-toggle-btn' + (!isSingle ? ' active-no' : '');
    $('panelYes').classList.toggle('show', isSingle);
    $('panelNo').classList.toggle('show', !isSingle);
    if (!isSingle && $('efBatchList').children.length === 0) {
      $('efBatchList').appendChild(_buildBatchItem());
    }
    _updateQtyTracker();
    validate();
  }

  /* ══════════════════════════════════════════
     BATCH MANAGEMENT
  ══════════════════════════════════════════ */
  function addBatch() {
    $('efBatchList').appendChild(_buildBatchItem());
    _reNumber();
    _updateQtyTracker();
    validate();
  }
  function removeBatch(idx) {
    var _$5;
    (_$5 = $("efBatch-".concat(idx))) === null || _$5 === void 0 ? void 0 : _$5.remove();
    _reNumber();
    _updateQtyTracker();
    validate();
  }

  /* ══════════════════════════════════════════
     VALIDATION
  ══════════════════════════════════════════ */
  function validate() {
    var btn = $('efSaveBtn');
    _updateQtyTracker();
    if (mode === null && !isEdit) {
      btn.disabled = true;
      return;
    }
    if (mode === true) {
      btn.disabled = !$('efSingleDate').value;
      return;
    }
    var batches = _collectBatches();
    var remaining = _getRemainingQty();
    if (!batches.length) {
      btn.disabled = true;
      return;
    }
    if (remaining < 0) {
      btn.disabled = true;
      return;
    }
    if (remaining > 0) {
      btn.disabled = true;
      return;
    }
    btn.disabled = false;
  }

  /* ══════════════════════════════════════════
     SAVE → API
  ══════════════════════════════════════════ */
  function save() {
    return _save.apply(this, arguments);
  }
  /* ══════════════════════════════════════════
     INLINE ERROR
  ══════════════════════════════════════════ */
  function _save() {
    _save = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
      var btn, collectedBatches, endpoint, payload, _$13, date, res, data, successPayload, _data$message;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            btn = $('efSaveBtn');
            btn.disabled = true;
            btn.innerHTML = '<i class="bi bi-arrow-repeat" style="animation:ef-spin 0.7s linear infinite"></i> Saving...';
            collectedBatches = mode === false ? _collectBatches() : [];
            if (mode === true) {
              date = $('efSingleDate').value;
              endpoint = "/inventory/products/".concat(productId, "/expiry");
              payload = {
                product_id: productId,
                same_expiry: true,
                single_batch: {
                  expiry_date: date,
                  batch_code: ((_$13 = $('efSingleBatchCode')) === null || _$13 === void 0 ? void 0 : _$13.value) || null
                }
              };
            } else {
              endpoint = "/inventory/products/".concat(productId, "/expiry");
              payload = {
                product_id: productId,
                same_expiry: false,
                batches: collectedBatches.map(function (b) {
                  return {
                    expiry_date: b.expiry_date,
                    quantity: b.qty,
                    batch_code: b.batch_code || null
                  };
                })
              };
            }
            _context.prev = 5;
            _context.next = 8;
            return fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                'Accept': 'application/json'
              },
              body: JSON.stringify(payload)
            });
          case 8:
            res = _context.sent;
            _context.next = 11;
            return res.json();
          case 11:
            data = _context.sent;
            if (res.ok && data.success) {
              successPayload = mode === true ? {
                type: 'single',
                expiry_date: payload.single_batch.expiry_date,
                batch_code: data.batch_code,
                status: data.status,
                quantity: data.quantity
              } : {
                type: 'batch',
                batches: data.batches,
                status: data.status
              };
              Inventory.onSaveSuccess(productId, successPayload, isEdit);
              close();
            } else {
              _showError((_data$message = data.message) !== null && _data$message !== void 0 ? _data$message : 'Something went wrong. Please try again.');
            }
            _context.next = 18;
            break;
          case 15:
            _context.prev = 15;
            _context.t0 = _context["catch"](5);
            _showError('Network error. Please check your connection and try again.');
          case 18:
            _context.prev = 18;
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-floppy"></i> Save Expiry Information';
            validate();
            return _context.finish(18);
          case 23:
          case "end":
            return _context.stop();
        }
      }, _callee, null, [[5, 15, 18, 23]]);
    }));
    return _save.apply(this, arguments);
  }
  function _showError(msg) {
    var el = $('efErrorMsg');
    if (!el) {
      el = document.createElement('div');
      el.id = 'efErrorMsg';
      el.className = 'ef-edit-banner show';
      el.style.cssText = 'background:hsla(0,70%,50%,0.08);border-color:hsla(0,70%,50%,0.3);color:hsl(0,60%,35%);margin-top:0.75rem;';
      $('efSaveBtn').insertAdjacentElement('afterend', el);
    }
    el.innerHTML = "<i class=\"bi bi-exclamation-triangle-fill\"></i> ".concat(msg);
    el.style.display = 'flex';
    setTimeout(function () {
      if (el) el.style.display = 'none';
    }, 5000);
  }

  /* ══════════════════════════════════════════
     EVENT LISTENERS
  ══════════════════════════════════════════ */
  function _initListeners() {
    var _$6, _$7, _$8, _$9, _$10, _$11, _$12;
    (_$6 = $('efBackdrop')) === null || _$6 === void 0 ? void 0 : _$6.addEventListener('click', function (e) {
      if (e.target === $('efBackdrop')) close();
    });
    (_$7 = $('efCloseBtn')) === null || _$7 === void 0 ? void 0 : _$7.addEventListener('click', close);
    (_$8 = $('btnYes')) === null || _$8 === void 0 ? void 0 : _$8.addEventListener('click', function () {
      return selectMode(true);
    });
    (_$9 = $('btnNo')) === null || _$9 === void 0 ? void 0 : _$9.addEventListener('click', function () {
      return selectMode(false);
    });
    (_$10 = $('efSingleDate')) === null || _$10 === void 0 ? void 0 : _$10.addEventListener('input', function () {
      _updateSingleStatus();
      validate();
    });
    (_$11 = $('efAddBatchBtn')) === null || _$11 === void 0 ? void 0 : _$11.addEventListener('click', addBatch);
    (_$12 = $('efSaveBtn')) === null || _$12 === void 0 ? void 0 : _$12.addEventListener('click', save);
  }
  document.addEventListener('DOMContentLoaded', _initListeners);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && _isOpen) close();
  });
  window.addEventListener('pageshow', function (e) {
    if (e.persisted && _isOpen) close();
  });

  /* ── Public API ── */
  return {
    open: open,
    openSingle: openSingle,
    openBatch: openBatch,
    close: close,
    selectMode: selectMode,
    addBatch: addBatch,
    removeBatch: removeBatch,
    updateBadge: updateBadge,
    validate: validate,
    save: save
  };
}();
/******/ })()
;