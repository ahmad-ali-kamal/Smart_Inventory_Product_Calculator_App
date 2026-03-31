/**
 * inventory-settings.js
 * Settings Page — Drag & Drop, Threshold Badges, Toggle Switches
 */
document.addEventListener('DOMContentLoaded', () => {

    /* ══════════════════════════════════════════
       DRAG & DROP — Category Mapping
    ══════════════════════════════════════════ */
    let draggedEl  = null;
    let dragSource = null;

    function _attachPillDrag(pill) {
        pill.addEventListener('dragstart', e => {
            draggedEl  = pill;
            dragSource = pill.closest('.drop-zone')?.dataset.bucket ?? null;
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => pill.style.opacity = '0.4', 0);
        });
    }

    document.querySelectorAll('.drop-zone').forEach(zone => {
        const target = zone.dataset.bucket;

        zone.addEventListener('dragover', e => {
            e.preventDefault();
            zone.classList.add('drag-over');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });

        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('drag-over');

            if (!draggedEl || dragSource === target) {
                if (draggedEl) draggedEl.style.opacity = '';
                draggedEl = dragSource = null;
                return;
            }

            const prevSource = dragSource;
            draggedEl.style.opacity = '';

            document.getElementById('list-' + target)?.appendChild(draggedEl);
            _syncHiddenInputs(prevSource);
            _syncHiddenInputs(target);

            draggedEl = dragSource = null;
        });
    });

    document.querySelectorAll('.category-pill').forEach(_attachPillDrag);

    function _syncHiddenInputs(bucket) {
        document.querySelectorAll('.hid-' + bucket).forEach(el => el.remove());
        document.querySelectorAll(`#list-${bucket} .category-pill`).forEach(pill => {
            const inp = document.createElement('input');
            inp.type  = 'hidden';
            inp.name  = `category_mapping[${bucket}][]`;
            inp.value = pill.dataset.category;
            inp.classList.add('hid-' + bucket);
            document.getElementById('settingsForm').appendChild(inp);
        });
    }

    /* ══════════════════════════════════════════
       THRESHOLD — Live Badge Update
       ✅ تم التصحيح: short/medium/long بدل shortTerm/mediumTerm/longTerm
    ══════════════════════════════════════════ */
    const _bucketMap = {
        short_term_days:  'short',
        medium_term_days: 'medium',
        long_term_days:   'long',
    };

    document.querySelectorAll('.threshold-input').forEach(input => {
        input.addEventListener('input', () => {
            const key = _bucketMap[input.name];
            if (key) document.getElementById('badge-' + key).textContent = (input.value || '?') + 'd';
        });
    });

    /* ══════════════════════════════════════════
       TOGGLE SWITCHES — Automation
       ✅ تم حذف كل مراجع aidiscounts
    ══════════════════════════════════════════ */
    function _toggleSwitch(id) {
        const btn = document.getElementById('toggle-' + id);
        if (!btn) return;
        const willBeOn = !btn.classList.contains('on');

        btn.classList.toggle('on', willBeOn);
        document.getElementById('val-' + id).value = willBeOn ? 1 : 0;

        if (id === 'autodiscounts') _toggleDiscountPanel(willBeOn);
    }

    function _toggleDiscountPanel(show) {
        const panel = document.getElementById('discount-input-wrap');
        if (!panel) return;
        if (show) {
            panel.style.opacity   = '0';
            panel.style.transform = 'translateY(-6px)';
            panel.style.display   = 'block';
            requestAnimationFrame(() => {
                panel.style.opacity   = '1';
                panel.style.transform = 'translateY(0)';
            });
        } else {
            panel.style.display = 'none';
        }
    }

    document.querySelectorAll('.toggle-switch[data-toggle-id]').forEach(btn => {
        btn.addEventListener('click', () => _toggleSwitch(btn.dataset.toggleId));
    });

});