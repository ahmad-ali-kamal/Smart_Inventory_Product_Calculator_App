document.addEventListener('DOMContentLoaded', function() {
    const btn      = document.getElementById('notifBtn');
    const dropdown = document.getElementById('notifDropdown');
    const list     = document.getElementById('notifList');
    const badge    = document.getElementById('notifBadge');
    const readAll  = document.getElementById('notifReadAll');

    if (!btn) return;

    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const isOpen = dropdown.style.display === 'block';
        dropdown.style.display = isOpen ? 'none' : 'block';
        if (!isOpen) loadNotifications();
    });

    document.addEventListener('click', function() {
        if (dropdown) dropdown.style.display = 'none';
    });

    function loadNotifications() {
        list.innerHTML = '<div class="notif-loading">Loading...</div>';
        fetch('/inventory/notifications', {
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
            }
        })
        .then(r => r.json())
        .then(data => {
            if (!data.length) {
                list.innerHTML = '<div class="notif-empty">No notifications yet</div>';
                return;
            }
            list.innerHTML = data.map(n => `
                <div class="notif-item ${!n.read_at ? 'unread' : ''}" data-id="${n.id}"
                     onclick="markRead('${n.id}', this)">
                    <div class="notif-item-msg">${n.data.message ?? ''}</div>
                    <div class="notif-item-time">${n.created_at}</div>
                </div>
            `).join('');
        });
    }

    window.markRead = function(id, el) {
        fetch(`/inventory/notifications/${id}/read`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                'Accept': 'application/json'
            }
        }).then(() => {
            el.classList.remove('unread');
            updateBadge();
        });
    };

    readAll?.addEventListener('click', function() {
        fetch('/inventory/notifications/read-all', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                'Accept': 'application/json'
            }
        }).then(() => {
            document.querySelectorAll('.notif-item.unread')
                .forEach(el => el.classList.remove('unread'));
            if (badge) badge.style.display = 'none';
        });
    });

    function updateBadge() {
        const unread = document.querySelectorAll('.notif-item.unread').length;
        if (badge) {
            badge.textContent = unread > 0 ? unread : '';
            badge.style.display = unread > 0 ? 'flex' : 'none';
        }
    }
});