/**
 * inventory-settings.js
 * Settings Page — Drag & Drop, Threshold Badges, Toggle Switches
 *
 * Zero inline handlers — everything wired through DOMContentLoaded.
 * The blade uses data-bucket on drop-zones and data-category on pills;
 * no onclick / ondragstart / ondrop attributes needed anywhere.
 */
document.addEventListener('DOMContentLoaded', () => {

    /* ══════════════════════════════════════════
       DRAG & DROP — Category Mapping
    ══════════════════════════════════════════ */
    let draggedEl  = null;
    let dragSource = null;

    // ── Attach drag listener to a single pill ──
    function _attachPillDrag(pill) {
        pill.addEventListener('dragstart', e => {
            draggedEl  = pill;
            dragSource = pill.closest('.drop-zone')?.dataset.bucket ?? null;
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => pill.style.opacity = '0.4', 0);
        });
    }

    // ── Drop-zone listeners ──
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

    // Attach drag listeners to all pills on page load
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
    ══════════════════════════════════════════ */
    const _bucketMap = {
        short_term_days:  'shortTerm',
        medium_term_days: 'mediumTerm',
        long_term_days:   'longTerm',
    };

    document.querySelectorAll('.threshold-input').forEach(input => {
        input.addEventListener('input', () => {
            const key = _bucketMap[input.name];
            if (key) document.getElementById('badge-' + key).textContent = (input.value || '?') + 'd';
        });
    });

    /* ══════════════════════════════════════════
       TOGGLE SWITCHES — Automation
    ══════════════════════════════════════════ */
    function _toggleSwitch(id) {
        const btn = document.getElementById('toggle-' + id);
        if (!btn) return;
        const willBeOn = !btn.classList.contains('on');

        // mutual exclusion between auto and ai discounts
        if (willBeOn) {
            if (id === 'autodiscounts') _turnOff('aidiscounts');
            if (id === 'aidiscounts')   _turnOff('autodiscounts');
        }

        btn.classList.toggle('on', willBeOn);
        document.getElementById('val-' + id).value = willBeOn ? 1 : 0;

        if (id === 'autodiscounts') _toggleDiscountPanel(willBeOn);
    }

    function _turnOff(id) {
        const btn = document.getElementById('toggle-' + id);
        if (!btn) return;
        btn.classList.remove('on');
        document.getElementById('val-' + id).value = 0;
        if (id === 'autodiscounts') _toggleDiscountPanel(false);
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

    // Wire all toggle switches via data-toggle-id attribute (no onclick in blade)
    document.querySelectorAll('.toggle-switch[data-toggle-id]').forEach(btn => {
        btn.addEventListener('click', () => _toggleSwitch(btn.dataset.toggleId));
    });

});