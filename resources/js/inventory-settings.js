/**
 * inventory-settings.js
 * Settings Page — Drag & Drop, Threshold Badges, Toggle Switches
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Initializing Inventory Settings...');

    /* ══════════════════════════════════════════
       PAGE INIT — Verify pills are in correct buckets
    ══════════════════════════════════════════ */
    ['short', 'medium', 'long'].forEach(bucket => {
        const list = document.getElementById('list-' + bucket);
        if (list) {
            const count = list.querySelectorAll('.category-pill').length;
            console.log(`  Bucket "${bucket}": ${count} pills`);
        }
    });

    const mappingInputs = document.querySelectorAll('input[name^="category_mapping"]');
    console.log(`  Pre-loaded hidden inputs: ${mappingInputs.length}`);

    /* ══════════════════════════════════════════
       DRAG & DROP — Category Mapping
    ══════════════════════════════════════════ */
    let draggedEl  = null;
    let dragSource = null;

    function _attachPillDrag(pill) {
        // ✅ تجنب إضافة listener مكرر
        if (pill.dataset.dragAttached) return;
        pill.dataset.dragAttached = '1';

        pill.addEventListener('dragstart', e => {
            draggedEl  = pill;
            // ✅ نحدد المصدر من أقرب drop-zone أو unmapped list
            dragSource = pill.closest('[data-bucket]')?.dataset.bucket ?? null;
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => pill.style.opacity = '0.4', 0);
        });

        // ✅ dragend لإعادة الـ opacity في حال انتهى الدراج خارج zone
        pill.addEventListener('dragend', () => {
            pill.style.opacity = '';
        });
    }

    document.querySelectorAll('.drop-zone').forEach(zone => {
        const target = zone.dataset.bucket;

        zone.addEventListener('dragover', e => {
            e.preventDefault();
            zone.classList.add('drag-over');
        });

        zone.addEventListener('dragleave', e => {
            // ✅ تجنب الـ flicker عند المرور على child elements
            if (!zone.contains(e.relatedTarget)) {
                zone.classList.remove('drag-over');
            }
        });

        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('drag-over');

            if (!draggedEl) return;

            // ✅ السماح بالنقل من unmapped إلى أي bucket والعكس
            if (dragSource === target) {
                draggedEl.style.opacity = '';
                draggedEl = dragSource = null;
                return;
            }

            const prevSource = dragSource;
            draggedEl.style.opacity = '';

            // ✅ نضيف الـ pill للقائمة الصحيحة داخل الـ zone
            const targetList = document.getElementById('list-' + target) ?? zone;
            targetList.appendChild(draggedEl);

            // ✅ نعيد تفعيل الدراج على الـ pill بعد نقله (مهم!)
            _attachPillDrag(draggedEl);

            // ✅ نزامن الـ hidden inputs للمصدر والهدف
            if (prevSource && prevSource !== 'unmapped') _syncHiddenInputs(prevSource);
            if (target !== 'unmapped') _syncHiddenInputs(target);

            // ✅ إخفاء رسالة "كل التصنيفات تم توزيعها" إذا عاد pill للـ unmapped
            _syncUnmappedEmptyState();

            draggedEl = dragSource = null;
        });
    });

    // ✅ تفعيل الدراج على كل الـ pills الموجودة عند التحميل
    document.querySelectorAll('.category-pill').forEach(_attachPillDrag);

    function _syncHiddenInputs(bucket) {
        // ✅ Only sync known mapping buckets to avoid sending 'unmapped' or unexpected buckets
        const allowed = ['short', 'medium', 'long'];
        if (allowed.indexOf(bucket) === -1) return;

        // ✅ حذف الـ inputs القديمة لهذا الـ bucket
        document.querySelectorAll('.hid-' + bucket).forEach(el => el.remove());

        // ✅ إضافة input لكل pill موجود في الـ list
        document.querySelectorAll(`#list-${bucket} .category-pill`).forEach(pill => {
            const inp = document.createElement('input');
            inp.type  = 'hidden';
            inp.name  = `category_mapping[${bucket}][]`;
            inp.value = pill.dataset.category;
            inp.classList.add('hid-' + bucket);
            document.getElementById('hiddenInputsContainer').appendChild(inp);
        });
    }

    function _syncUnmappedEmptyState() {
        const unmappedList = document.getElementById('list-unmapped');
        if (!unmappedList) return;

        const pills = unmappedList.querySelectorAll('.category-pill');
        let emptyMsg = unmappedList.querySelector('.empty-state-msg');

        if (pills.length === 0) {
            if (!emptyMsg) {
                emptyMsg = document.createElement('div');
                emptyMsg.className = 'empty-state-msg';
                emptyMsg.style.cssText = 'color: var(--muted); font-size: 0.9rem; width: 100%; text-align: center;';
                emptyMsg.textContent = '🎉 كل التصنيفات الحالية تم توزيعها بنجاح.';
                unmappedList.appendChild(emptyMsg);
            }
        } else {
            emptyMsg?.remove();
        }
    }

    /* ══════════════════════════════════════════
       THRESHOLD — Live Badge Update
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
                panel.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
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

    /* ══════════════════════════════════════════
       FORM SUBMIT — Sync all hidden inputs
    ══════════════════════════════════════════ */
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', function (e) {
            console.log('📤 Form submission detected — preparing category mappings...');
            
            // ✅ CRITICAL: Remove ALL old hidden mapping inputs first
            // This prevents stale data from the Blade template interfering
            document.querySelectorAll('input[name^="category_mapping"]').forEach(inp => {
                inp.remove();
            });
            console.log('  🗑️ Cleared all old category_mapping inputs');
            
            // ✅ Now recreate fresh hidden inputs from current DOM state
            ['short', 'medium', 'long'].forEach(bucket => {
                const list = document.getElementById('list-' + bucket);
                if (!list) {
                    console.warn(`  ⚠️ List not found for bucket: ${bucket}`);
                    return;
                }
                
                const pills = list.querySelectorAll('.category-pill');
                console.log(`  📝 Creating inputs for "${bucket}" with ${pills.length} categories`);
                
                pills.forEach((pill, index) => {
                    const inp = document.createElement('input');
                    inp.type = 'hidden';
                    inp.name = `category_mapping[${bucket}][]`;
                    inp.value = pill.dataset.category;
                    settingsForm.appendChild(inp);
                    console.log(`    ✓ Added: ${pill.dataset.category} → ${bucket}`);
                });
            });
            
            // ✅ Final verification before submit
            setTimeout(() => {
                const mappingInputs = document.querySelectorAll('input[name^="category_mapping"]');
                console.log(`✅ Total inputs ready to send: ${mappingInputs.length}`);
                
                const byBucket = { short: 0, medium: 0, long: 0 };
                mappingInputs.forEach(inp => {
                    const match = inp.name.match(/category_mapping\[(short|medium|long)\]/);
                    if (match) {
                        byBucket[match[1]]++;
                        console.log(`  - ${inp.name}: "${inp.value}"`);
                    }
                });
                
                console.log(`📊 Final breakdown - Short: ${byBucket.short}, Medium: ${byBucket.medium}, Long: ${byBucket.long}`);
            }, 10);
        });
    }

});