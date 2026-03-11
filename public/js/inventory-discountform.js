/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!************************************************!*\
  !*** ./resources/js/inventory-discountform.js ***!
  \************************************************/
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) keys.push(key); return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
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
window.DiscountForm = function () {
  /* ── State ── */
  var productId = null;
  var aiPercent = 20;
  var _isOpen = false;

  /* ── DOM helper ── */
  var $ = function $(id) {
    return document.getElementById(id);
  };

  /* ══════════════════════════════════════════
     OPEN
  ══════════════════════════════════════════ */
  function open(pid, productName) {
    var recommendedPercent = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 20;
    productId = pid;
    aiPercent = recommendedPercent;
    $('dfProductName').textContent = productName;
    $('dfAiPercent').textContent = aiPercent + '%';
    $('dfAiBtnPercent').textContent = aiPercent + '%';
    $('dfAiBody').innerHTML = "<strong>".concat(productName, "</strong> is likely to expire before being sold at the current rate. ") + "A <strong>".concat(aiPercent, "% discount</strong> is recommended to clear this batch.");

    // reset manual panel to collapsed state
    $('dfManualPanel').classList.remove('show');
    $('dfManualToggleWrap').style.display = '';
    $('dfPercent').value = '';
    $('dfEndDate').value = '';
    $('dfManualBtn').disabled = true;

    // clear any lingering error
    var err = $('dfErrorMsg');
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
    _isOpen = false;
    productId = null;
    aiPercent = 20;
    $('dfBackdrop').classList.remove('open');
    document.body.classList.remove('ef-open');
    document.body.style.overflow = '';

    // reset DOM for next open
    $('dfManualPanel').classList.remove('show');
    $('dfManualToggleWrap').style.display = '';
    $('dfPercent').value = '';
    $('dfEndDate').value = '';
    $('dfManualBtn').disabled = true;
    var err = $('dfErrorMsg');
    if (err) err.style.display = 'none';
  }

  /* ── Show manual panel ── */
  function _showManual() {
    $('dfManualToggleWrap').style.display = 'none';
    $('dfManualPanel').classList.add('show');
  }

  /* ── Validate manual fields ── */
  function _validate() {
    var p = parseInt($('dfPercent').value);
    var d = $('dfEndDate').value;
    $('dfManualBtn').disabled = !(p >= 1 && p <= 100 && d);
  }

  /* ══════════════════════════════════════════
     GENERIC POST HELPER
  ══════════════════════════════════════════ */
  function _post(_x, _x2, _x3, _x4) {
    return _post2.apply(this, arguments);
  }
  function _post2() {
    _post2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(endpoint, payload, btn, originalHtml) {
      var res, data, _data$message;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            btn.disabled = true;
            btn.innerHTML = '<i class="bi bi-arrow-repeat" style="animation:ef-spin 0.7s linear infinite"></i> Applying...';
            _context.prev = 2;
            _context.next = 5;
            return fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                'Accept': 'application/json'
              },
              body: JSON.stringify(payload)
            });
          case 5:
            res = _context.sent;
            _context.next = 8;
            return res.json();
          case 8:
            data = _context.sent;
            if (res.ok && data.success) {
              Inventory.onDiscountSuccess(productId, data);
              close();
            } else {
              _showError((_data$message = data.message) !== null && _data$message !== void 0 ? _data$message : 'Something went wrong. Please try again.');
            }
            _context.next = 15;
            break;
          case 12:
            _context.prev = 12;
            _context.t0 = _context["catch"](2);
            _showError('Network error. Please check your connection and try again.');
          case 15:
            _context.prev = 15;
            btn.disabled = false;
            btn.innerHTML = originalHtml;
            return _context.finish(15);
          case 19:
          case "end":
            return _context.stop();
        }
      }, _callee, null, [[2, 12, 15, 19]]);
    }));
    return _post2.apply(this, arguments);
  }
  function _applyAi() {
    _post('/api/inventory/discount/ai', {
      product_id: productId
    }, $('dfAiBtn'), "<i class=\"bi bi-stars\"></i> Apply AI Recommended Discount (".concat(aiPercent, "%)"));
  }
  function _applyManual() {
    _post('/api/inventory/discount/manual', {
      product_id: productId,
      percent: parseInt($('dfPercent').value),
      end_date: $('dfEndDate').value
    }, $('dfManualBtn'), '<i class="bi bi-check2-circle"></i> Apply Manual Discount');
  }

  /* ══════════════════════════════════════════
     INLINE ERROR
  ══════════════════════════════════════════ */
  function _showError(msg) {
    var el = $('dfErrorMsg');
    if (!el) {
      el = document.createElement('div');
      el.id = 'dfErrorMsg';
      el.className = 'ef-edit-banner show';
      el.style.cssText = 'background:hsla(0,70%,50%,0.08);border-color:hsla(0,70%,50%,0.3);color:hsl(0,60%,35%);margin-top:0.75rem;';
      $('dfCard').appendChild(el);
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
  document.addEventListener('DOMContentLoaded', function () {
    var _$, _$2, _$3, _$4, _$5, _$6, _$7;
    (_$ = $('dfBackdrop')) === null || _$ === void 0 ? void 0 : _$.addEventListener('click', function (e) {
      if (e.target === $('dfBackdrop')) close();
    });
    (_$2 = $('dfCloseBtn')) === null || _$2 === void 0 ? void 0 : _$2.addEventListener('click', close);
    (_$3 = $('dfAiBtn')) === null || _$3 === void 0 ? void 0 : _$3.addEventListener('click', _applyAi);
    (_$4 = $('dfManualBtn')) === null || _$4 === void 0 ? void 0 : _$4.addEventListener('click', _applyManual);
    (_$5 = $('dfShowManualBtn')) === null || _$5 === void 0 ? void 0 : _$5.addEventListener('click', _showManual);
    (_$6 = $('dfPercent')) === null || _$6 === void 0 ? void 0 : _$6.addEventListener('input', _validate);
    (_$7 = $('dfEndDate')) === null || _$7 === void 0 ? void 0 : _$7.addEventListener('input', _validate);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && _isOpen) close();
  });

  // ── bfcache fix ──
  window.addEventListener('pageshow', function (e) {
    if (e.persisted && _isOpen) close();
  });

  /* ── Public API ── */
  return {
    open: open,
    close: close
  };
}();
/******/ })()
;