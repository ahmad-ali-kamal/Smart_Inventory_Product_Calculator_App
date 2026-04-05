/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!***************************************!*\
  !*** ./resources/js/notifications.js ***!
  \***************************************/
document.addEventListener('DOMContentLoaded', function () {
  var btn = document.getElementById('notifBtn');
  var dropdown = document.getElementById('notifDropdown');
  var list = document.getElementById('notifList');
  var badge = document.getElementById('notifBadge');
  var readAll = document.getElementById('notifReadAll');
  if (!btn) return;
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    var isOpen = dropdown.style.display === 'block';
    dropdown.style.display = isOpen ? 'none' : 'block';
    if (!isOpen) loadNotifications();
  });
  document.addEventListener('click', function () {
    if (dropdown) dropdown.style.display = 'none';
  });
  function loadNotifications() {
    list.innerHTML = '<div class="notif-loading">Loading...</div>';
    fetch('/inventory/notifications', {
      headers: {
        'Accept': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
      }
    }).then(function (r) {
      return r.json();
    }).then(function (data) {
      if (!data.length) {
        list.innerHTML = '<div class="notif-empty">No notifications yet</div>';
        return;
      }
      list.innerHTML = data.map(function (n) {
        var _n$data$message;
        return "\n                <div class=\"notif-item ".concat(!n.read_at ? 'unread' : '', "\" data-id=\"").concat(n.id, "\"\n                     onclick=\"markRead('").concat(n.id, "', this)\">\n                    <div class=\"notif-item-msg\">").concat((_n$data$message = n.data.message) !== null && _n$data$message !== void 0 ? _n$data$message : '', "</div>\n                    <div class=\"notif-item-time\">").concat(n.created_at, "</div>\n                </div>\n            ");
      }).join('');
    });
  }
  window.markRead = function (id, el) {
    fetch("/inventory/notifications/".concat(id, "/read"), {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        'Accept': 'application/json'
      }
    }).then(function () {
      el.classList.remove('unread');
      updateBadge();
    });
  };
  readAll === null || readAll === void 0 ? void 0 : readAll.addEventListener('click', function () {
    fetch('/inventory/notifications/read-all', {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        'Accept': 'application/json'
      }
    }).then(function () {
      document.querySelectorAll('.notif-item.unread').forEach(function (el) {
        return el.classList.remove('unread');
      });
      if (badge) badge.style.display = 'none';
    });
  });
  function updateBadge() {
    var unread = document.querySelectorAll('.notif-item.unread').length;
    if (badge) {
      badge.textContent = unread > 0 ? unread : '';
      badge.style.display = unread > 0 ? 'flex' : 'none';
    }
  }
});
/******/ })()
;