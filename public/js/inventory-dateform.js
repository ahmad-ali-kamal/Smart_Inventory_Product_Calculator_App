/**
 * ============================================================================
 * FILE: inventory-dateform.js
 * PROJECT: QUANTIX / Harees Engine
 * DEVELOPER: Developer A
 * DESCRIPTION: 
 * Advanced Expiry Date Modal & Inventory Reconciliation logic.
 * Supports Single Mode, Batch Mode (Scenario 1), and Variants Mode (Scenario 2).
 * ============================================================================
 */

window.ExpiryForm = (() => {

    /* ════════════════════════════════════════════════════════════════════════
       1. STATE MANAGEMENT (إدارة الحالة الشاملة)
    ════════════════════════════════════════════════════════════════════════ */
    const State = {
        productId: null,
        productName: '',
        mode: null,          // 'single', 'batch', 'variants'
        isEdit: false,
        batchCount: 0,
        isOpen: false,
        threshold: 14,
        sallaQty: 0,
        usedQty: 0,
        userStarted: false,
        
        // متغيرات السيناريو 2 (الخيارات المتعددة)
        hasVariants: false,
        variantsList: [],
        globalExpiryDate: ''
    };

    /* ════════════════════════════════════════════════════════════════════════
       2. DOM HELPERS & DYNAMIC STYLES (مساعدات الواجهة والتنسيقات)
    ════════════════════════════════════════════════════════════════════════ */
    
    /**
     * دالة مساعدة لاختصار جلب العناصر
     * @param {string} id 
     * @returns {HTMLElement|null}
     */
    const $ = id => document.getElementById(id);

    /**
     * حقن التنسيقات الخاصة بجدول الفارييشنز برمجياً
     * لضمان عدم الحاجة لتعديل ملفات CSS خارجية
     */
    function _injectStyles() {
        if ($('ef-dynamic-styles')) return;
        const style = document.createElement('style');
        style.id = 'ef-dynamic-styles';
        style.innerHTML = `
            .ef-variants-container {
                margin-top: 1.5rem;
                background: rgba(255,255,255,0.02);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 16px;
                overflow: hidden;
            }
            .ef-global-date-wrapper {
                padding: 1.5rem;
                background: rgba(192, 132, 252, 0.05);
                border-bottom: 1px solid rgba(255,255,255,0.08);
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            .ef-global-date-wrapper label {
                font-size: 0.9rem;
                color: #c084fc;
                font-weight: 700;
            }
            .ef-variants-grid {
                width: 100%;
                border-collapse: collapse;
            }
            .ef-variants-grid th {
                text-align: left;
                padding: 1rem 1.5rem;
                font-size: 0.85rem;
                color: rgba(255,255,255,0.4);
                border-bottom: 1px solid rgba(255,255,255,0.05);
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            .ef-variants-grid td {
                padding: 1rem 1.5rem;
                border-bottom: 1px solid rgba(255,255,255,0.03);
                vertical-align: middle;
            }
            .ef-variants-grid tr:last-child td {
                border-bottom: none;
            }
            .ef-variant-name {
                font-size: 1rem;
                color: #fff;
                font-weight: 500;
            }
            .ef-variant-current-qty {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: rgba(255,255,255,0.1);
                color: rgba(255,255,255,0.8);
                border-radius: 8px;
                min-width: 40px;
                height: 30px;
                font-size: 0.85rem;
                font-weight: 700;
            }
            .ef-input-v-qty {
                width: 100px;
                background: rgba(0,0,0,0.3);
                border: 1px solid rgba(255,255,255,0.15);
                border-radius: 8px;
                padding: 8px 12px;
                color: #fff;
                font-size: 0.95rem;
                transition: all 0.2s;
            }
            .ef-input-v-qty:focus {
                border-color: #c084fc;
                outline: none;
                box-shadow: 0 0 0 3px rgba(192,132,252,0.2);
            }
            .ef-loading-variants {
                padding: 4rem 2rem;
                text-align: center;
                color: rgba(255,255,255,0.5);
            }
            .ef-spin-icon {
                font-size: 2rem;
                color: #c084fc;
                animation: ef-spin 1s linear infinite;
                margin-bottom: 1rem;
                display: inline-block;
            }
            @keyframes ef-spin {
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    /* ════════════════════════════════════════════════════════════════════════
       3. LOGIC & CALCULATIONS (المنطق والحسابات)
    ════════════════════════════════════════════════════════════════════════ */
    
    /**
     * حساب حالة الدفعة بناءً على التاريخ
     * @param {string} dateStr 
     * @returns {string|null} 'red', 'yellow', 'green'
     */
    function _calcStatus(dateStr) {
        if (!dateStr) return null;
        const today = new Date(); 
        today.setHours(0, 0, 0, 0);
        
        const targetDate = new Date(dateStr);
        const diffTime = targetDate - today;
        const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (days <= 0) return 'red';
        if (days <= State.threshold) return 'yellow';
        return 'green';
    }

    /**
     * توليد كود HTML للشارة الملونة
     * @param {string} status 
     * @param {number|string} idx 
     * @returns {string} HTML markup
     */
    function _statusBadgeHtml(status, idx) {
        const map = {
            green:  { cls: 'ef-s-green',  lbl: 'Safe' },
            yellow: { cls: 'ef-s-yellow', lbl: 'Approaching' },
            red:    { cls: 'ef-s-red',    lbl: 'Expired' },
        };
        const st = map[status];
        if (!st) return `<span class="ef-status-badge" id="bStatus-${idx}"></span>`;
        
        return `
            <span class="ef-status-badge ${st.cls}" id="bStatus-${idx}">
                <i class="bi bi-circle-fill" style="font-size:0.4rem"></i> ${st.lbl}
            </span>
        `;
    }

    /**
     * تحديث شارة الدفعة في الواجهة (للسيناريو 1)
     */
    function updateBadge(idx) {
        const dateEl = $(`bDate-${idx}`);
        const badge  = $(`bStatus-${idx}`);
        if (!dateEl || !badge) return;
        
        badge.outerHTML = dateEl.value
            ? _statusBadgeHtml(_calcStatus(dateEl.value), idx)
            : `<span class="ef-status-badge" id="bStatus-${idx}"></span>`;
    }

    /**
     * تحديث الشارة للنمط الفردي (Single Mode)
     */
    function _updateSingleStatus() {
        const dateEl   = $('efSingleDate');
        const statusEl = $('efSingleStatus');
        if (!statusEl) return;

        if (!dateEl || !dateEl.value) {
            statusEl.className = 'ef-status-badge';
            statusEl.innerHTML = '';
            return;
        }

        const s = _calcStatus(dateEl.value);
        const map = {
            green:  ['ef-s-green',  'Safe'],
            yellow: ['ef-s-yellow', 'Approaching'],
            red:    ['ef-s-red',    'Expired'],
        };
        const [cls, label] = map[s] || ['', ''];
        statusEl.className = `ef-status-badge ${cls}`;
        statusEl.innerHTML = `<i class="bi bi-circle-fill" style="font-size:0.4rem"></i> ${label}`;
    }

    /* ════════════════════════════════════════════════════════════════════════
       4. QUANTITY RECONCILIATION & TRACKING (تسوية ومراقبة الكميات)
    ════════════════════════════════════════════════════════════════════════ */
    
    /**
     * يحسب الكمية المتبقية للتوزيع بناءً على النمط الحالي
     * @returns {number}
     */
    function _getRemainingQty() {
        let entered = 0;
        
        if (State.mode === 'variants' && State.hasVariants) {
            // Scenario 2: جمع الكميات من حقول الفارييشنز
            document.querySelectorAll('.v-qty-input').forEach(input => {
                entered += parseInt(input.value) || 0;
            });
        } else if (State.mode === 'batch') {
            // Scenario 1: جمع الكميات من الدفعات العادية
            document.querySelectorAll('#efBatchList .ef-batch-item').forEach(item => {
                const id = item.id.replace('efBatch-', '');
                entered += parseInt($(`bQty-${id}`)?.value) || 0;
            });
        }
        
        return State.sallaQty - State.usedQty - entered;
    }

    /**
     * يدير عرض التنبيهات البصرية للكمية المتبقية
     */
    function _updateQtyTracker() {
        const avail = $('efQtyAvail');
        const warn  = $('efQtyWarn');
        const msg   = $('efQtyWarnMsg');
        
        if (!avail) return;

        // في النمط الفردي لا نحتاج لمراقبة التوزيع
        if (State.mode === 'single') {
            avail.textContent = State.sallaQty;
            if (warn) warn.style.display = 'none';
            return;
        }

        const remaining = _getRemainingQty();
        avail.textContent = remaining >= 0 ? remaining : 0;

        if (!warn || !msg) return;

        if (remaining < 0) {
            // تجاوز الكمية المتاحة (أحمر)
            msg.textContent    = `Exceeded by ${Math.abs(remaining)} units — reduce input quantities`;
            warn.className     = 'ef-qty-warn ef-qty-over';
            warn.style.display = 'flex';
        } else if (remaining === 0 && State.userStarted) {
            // توزيع مكتمل (أخضر)
            msg.textContent    = '✓ All units perfectly assigned — ready to save';
            warn.className     = 'ef-qty-warn ef-qty-full';
            warn.style.display = 'flex';
        } else if (remaining <= 3 && State.userStarted && remaining > 0) {
            // كمية قليلة متبقية (أصفر)
            msg.textContent    = `Only ${remaining} unit${remaining > 1 ? 's' : ''} left to assign`;
            warn.className     = 'ef-qty-warn ef-qty-low';
            warn.style.display = 'flex';
        } else {
            // الوضع الطبيعي
            warn.style.display = 'none';
        }
    }

    /* ════════════════════════════════════════════════════════════════════════
       5. SCENARIO 2: VARIANTS FETCHING & RENDERING (التعامل مع الخيارات)
    ════════════════════════════════════════════════════════════════════════ */
    
    /**
     * جلب الفارييشنز من السيرفر (السيناريو 2)
     * إذا لم يجد، يعود للسيناريو 1 العادي بصمت.
     * @param {string|number} pid 
     */
    async function _fetchVariants(pid) {
        const listContainer = $('efBatchList');
        if (!listContainer) return;

        // عرض مؤشر التحميل
        listContainer.innerHTML = `
            <div class="ef-loading-variants">
                <i class="bi bi-arrow-repeat ef-spin-icon"></i>
                <p>Syncing product variants from Salla...</p>
            </div>
        `;

        try {
            // API لجلب الخيارات من الباك إند
            const response = await fetch(`/inventory/products/${pid}/variants`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();

            if (data.success && data.variants && data.variants.length > 0) {
                // تفعيل السيناريو 2: المنتج لديه خيارات مسبقة
                State.hasVariants = true;
                State.variantsList = data.variants;
                State.mode = 'variants';
                _renderVariantsGrid(data.variants);
            } else {
                // تفعيل السيناريو 1: منتج عادي بلا خيارات
                State.hasVariants = false;
                State.mode = 'batch';
                listContainer.innerHTML = '';
                addBatch();
            }
        } catch (error) {
            console.error('[Harees Engine] Fetch Variants Error:', error);
            // Fallback to scenario 1 on error
            State.hasVariants = false;
            State.mode = 'batch';
            listContainer.innerHTML = '';
            addBatch();
        }
        
        _updateQtyTracker();
        validate();
    }

    /**
     * بناء شبكة الخيارات التفاعلية (الجدول) للسيناريو 2
     * @param {Array} variants 
     */
    function _renderVariantsGrid(variants) {
        const container = $('efBatchList');
        
        let html = `
            <div class="ef-variants-container">
                <div class="ef-global-date-wrapper">
                    <label><i class="bi bi-calendar-event"></i> Global Batch Expiry Date</label>
                    <input type="date" class="ef-input" id="vGlobalDate" style="width: 100%; max-width: 300px;">
                </div>
                <table class="ef-variants-grid">
                    <thead>
                        <tr>
                            <th>Variant Name</th>
                            <th>Current Qty</th>
                            <th>New Batch Qty</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        variants.forEach(v => {
            html += `
                <tr>
                    <td>
                        <div class="ef-variant-name">${v.name}</div>
                        <div style="font-size:0.75rem; color:rgba(255,255,255,0.3)">SKU: ${v.sku || 'N/A'}</div>
                    </td>
                    <td>
                        <span class="ef-variant-current-qty">${v.quantity}</span>
                    </td>
                    <td>
                        <input type="number" class="ef-input-v-qty v-qty-input" 
                               data-vid="${v.id}" data-max="${v.quantity}" 
                               placeholder="0" min="0">
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = html;

        // ربط الأحداث للحقول الجديدة
        const globalDateInput = $('vGlobalDate');
        if (globalDateInput) {
            globalDateInput.addEventListener('input', (e) => {
                State.globalExpiryDate = e.target.value;
                validate();
            });
        }

        document.querySelectorAll('.v-qty-input').forEach(input => {
            input.addEventListener('input', () => {
                State.userStarted = true;
                _updateQtyTracker();
                validate();
            });
        });
    }

    /* ════════════════════════════════════════════════════════════════════════
       6. SCENARIO 1: BATCH ITEM BUILDER (بناء دفعات السيناريو الأول)
    ════════════════════════════════════════════════════════════════════════ */
    
    /**
     * بناء عنصر إدخال لدفعة واحدة
     * @param {Object} prefill 
     * @returns {HTMLElement}
     */
    function _buildBatchItem(prefill = {}) {
        State.batchCount++;
        const idx = State.batchCount;

        const status = prefill.status ?? (prefill.expiry ? _calcStatus(prefill.expiry) : null);

        const item = document.createElement('div');
        item.className = 'ef-batch-item';
        item.id        = `efBatch-${idx}`;

        const badgeHtml = status
            ? _statusBadgeHtml(status, idx)
            : `<span class="ef-status-badge" id="bStatus-${idx}"></span>`;

        item.innerHTML = `
            <div class="ef-batch-head">
                <span class="ef-batch-lbl" id="bLbl-${idx}">
                    <i class="bi bi-layers" style="font-size:0.78rem;color:var(--mauve)"></i>
                    Batch ${idx} ${badgeHtml}
                </span>
                <button class="ef-batch-remove" data-idx="${idx}" title="Remove Batch">
                    <i class="bi bi-trash3"></i>
                </button>
            </div>
            <div class="ef-batch-grid">
                <div>
                    <label class="ef-label">Quantity</label>
                    <input type="number" class="ef-input" id="bQty-${idx}" min="1"
                           value="${prefill.qty ?? ''}" placeholder="0">
                </div>
                <div>
                    <label class="ef-label">Expiry Date</label>
                    <input type="date" class="ef-input" id="bDate-${idx}"
                           value="${prefill.expiry ?? ''}">
                </div>
            </div>
            <input type="hidden" id="bCode-${idx}" value="${prefill.batch_code ?? ''}">
            <input type="hidden" id="bId-${idx}"   value="${prefill.id ?? ''}">
        `;

        // ربط الأحداث
        item.querySelector('.ef-batch-remove').addEventListener('click', () => removeBatch(idx));
        
        item.querySelector(`#bQty-${idx}`).addEventListener('input', () => { 
            State.userStarted = true; 
            _updateQtyTracker(); 
            validate(); 
        });
        
        item.querySelector(`#bDate-${idx}`).addEventListener('input', () => { 
            updateBadge(idx); 
            validate(); 
        });

        return item;
    }

    /**
     * إعادة ترقيم الدفعات بعد الحذف
     */
    function _reNumber() {
        document.querySelectorAll('#efBatchList .ef-batch-item').forEach((item, i) => {
            const lbl   = item.querySelector('.ef-batch-lbl');
            const badge = lbl?.querySelector('.ef-status-badge');
            if (!lbl) return;
            lbl.innerHTML = `<i class="bi bi-layers" style="font-size:0.78rem;color:var(--mauve)"></i> Batch ${i + 1} `;
            if (badge) lbl.appendChild(badge);
        });
    }

    /**
     * تجميع بيانات الدفعات للسيناريو 1 لإرسالها
     * @returns {Array}
     */
    function _collectBatches() {
        const batches = [];
        document.querySelectorAll('#efBatchList .ef-batch-item').forEach((item) => {
            const id  = item.id.replace('efBatch-', '');
            const qty = parseInt($(`bQty-${id}`)?.value) || 0;
            const dt  = $(`bDate-${id}`)?.value;
            
            if (qty > 0 && dt) {
                batches.push({
                    id:          $(`bId-${id}`)?.value || null,
                    qty:         qty,
                    expiry_date: dt,
                    batch_code:  $(`bCode-${id}`)?.value || null,
                    status:      _calcStatus(dt),
                });
            }
        });
        return batches;
    }

    /* ════════════════════════════════════════════════════════════════════════
       7. LIFECYCLE & MODAL CONTROLS (إدارة النافذة)
    ════════════════════════════════════════════════════════════════════════ */
    
    /**
     * تفريغ وتصفير المودال بالكامل
     */
    function _reset(productName) {
        State.mode          = null;
        State.batchCount    = 0;
        State.userStarted   = false;
        State.hasVariants   = false;
        State.variantsList  = [];
        State.globalExpiryDate = '';

        const nameEl = $('efProductName');
        if(nameEl) nameEl.textContent = productName ?? '';
        
        const btnYes = $('btnYes');
        const btnNo = $('btnNo');
        if(btnYes) btnYes.className = 'ef-toggle-btn';
        if(btnNo) btnNo.className  = 'ef-toggle-btn';
        
        const panelYes = $('panelYes');
        const panelNo = $('panelNo');
        if(panelYes) panelYes.classList.remove('show');
        if(panelNo) panelNo.classList.remove('show');
        
        if($('efSingleDate')) $('efSingleDate').value = '';
        if($('efSingleBatchCode')) $('efSingleBatchCode').value = '';
        
        const batchList = $('efBatchList');
        if(batchList) batchList.innerHTML = '';
        
        const saveBtn = $('efSaveBtn');
        if(saveBtn) saveBtn.disabled = true;

        const avail = $('efQtyAvail');
        if (avail) avail.textContent = State.sallaQty > 0 ? State.sallaQty : '—';

        const warn = $('efQtyWarn');
        if (warn) warn.style.display = 'none';

        const err = $('efErrorMsg');
        if (err) err.style.display = 'none';
        
        _injectStyles(); // حقن التنسيقات عند التصفير لضمان وجودها
    }

    /**
     * إظهار النافذة المنبثقة
     */
    function _show() {
        State.isOpen = true;
        const backdrop = $('efBackdrop');
        if(backdrop) backdrop.classList.add('open');
        document.body.classList.add('ef-open');
        document.body.style.overflow = 'hidden';
        _updateQtyTracker();
    }

    /**
     * إغلاق النافذة
     */
    function close() {
        State.isOpen = false;
        const backdrop = $('efBackdrop');
        if (backdrop) backdrop.classList.remove('open');
        
        document.body.classList.remove('ef-open');
        document.body.style.overflow = '';

        _reset('');
        
        const editBanner = $('efEditBanner');
        if (editBanner) editBanner.classList.remove('show');
    }

    /* ════════════════════════════════════════════════════════════════════════
       8. PUBLIC METHODS (الواجهة البرمجية المفتوحة)
    ════════════════════════════════════════════════════════════════════════ */
    
    /**
     * فتح المودال لإضافة دفعة جديدة (نقطة الدخول الرئيسية)
     */
    function open(pid, productName, threshold = 14) {
        State.productId  = pid;
        State.isEdit     = false;
        State.threshold  = threshold;
        
        const row = document.querySelector(`#invBody tr[data-id="${pid}"]`);
        State.sallaQty = parseInt(row?.dataset.sallaQty) || 0;
        State.usedQty  = 0;
        
        _reset(productName);
        
        const titleEl = $('efTitle');
        const iconEl = $('efIcon');
        const editBanner = $('efEditBanner');
        
        if(titleEl) titleEl.textContent = 'Add Expiry Date';
        if(iconEl) iconEl.className    = 'bi bi-calendar-plus';
        if(editBanner) editBanner.classList.remove('show');
        
        _show();
    }

    /**
     * فتح المودال في وضع التعديل الفردي
     */
    function openSingle(pid, productName, dateValue, batchCode, threshold = 14, batchId = null) {
        State.productId  = pid;
        State.isEdit     = true;
        State.threshold  = threshold;
        
        const row = document.querySelector(`#invBody tr[data-id="${pid}"]`);
        State.sallaQty = parseInt(row?.dataset.sallaQty) || 0;
        State.usedQty  = 0;
        
        _reset(productName);
        State.mode = 'single'; 
        
        if($('efTitle')) $('efTitle').textContent   = 'Edit Expiry Date';
        if($('efIcon')) $('efIcon').className      = 'bi bi-pencil-square';
        if($('efEditBanner')) $('efEditBanner').classList.add('show');
        if($('btnYes')) $('btnYes').className      = 'ef-toggle-btn active-yes';
        if($('panelYes')) $('panelYes').classList.add('show');
        
        if ($('efSingleDate')) $('efSingleDate').value = dateValue ?? '';
        if ($('efSingleBatchCode')) $('efSingleBatchCode').value = batchCode ?? '';
        if ($('efSingleBatchId')) $('efSingleBatchId').value = batchId ?? '';
        
        validate();
        _updateSingleStatus();
        _show();
    }

    /**
     * فتح المودال في وضع تعديل الدفعات المتعددة
     */
    function openBatch(pid, productName, prefillBatches = [], threshold = 14) {
        State.productId  = pid;
        State.isEdit     = prefillBatches.length > 0;
        State.threshold  = threshold;
        
        const row = document.querySelector(`#invBody tr[data-id="${pid}"]`);
        State.sallaQty = parseInt(row?.dataset.sallaQty) || 0;
        State.usedQty  = 0;
        
        _reset(productName);
        State.mode = 'batch';
        
        if($('efTitle')) $('efTitle').textContent = State.isEdit ? 'Edit Expiry Date' : 'Add Expiry Date';
        if($('efIcon')) $('efIcon').className    = State.isEdit ? 'bi bi-pencil-square' : 'bi bi-calendar-plus';
        
        if ($('efEditBanner')) {
            State.isEdit ? $('efEditBanner').classList.add('show') : $('efEditBanner').classList.remove('show');
        }
        
        if($('btnNo')) $('btnNo').className = 'ef-toggle-btn active-no';
        if($('panelNo')) $('panelNo').classList.add('show');

        const list = $('efBatchList');
        if(list) {
            if (prefillBatches.length) {
                prefillBatches.forEach(b => list.appendChild(_buildBatchItem(b)));
            } else {
                // تفعيل منطق السيناريو 2 لجلب الخيارات
                _fetchVariants(pid);
            }
        }

        validate();
        _show();
    }

    /* ════════════════════════════════════════════════════════════════════════
       9. ACTIONS & VALIDATION (التفاعلات والتحقق)
    ════════════════════════════════════════════════════════════════════════ */
    
    function selectMode(isSingle) {
        // تحديد النمط بناءً على وجود فارييشنز أو لا
        State.mode = isSingle ? 'single' : (State.hasVariants ? 'variants' : 'batch');
        
        if($('btnYes')) $('btnYes').className = 'ef-toggle-btn' + (isSingle  ? ' active-yes' : '');
        if($('btnNo')) $('btnNo').className  = 'ef-toggle-btn' + (!isSingle ? ' active-no'  : '');
        
        if($('panelYes')) $('panelYes').classList.toggle('show', isSingle);
        if($('panelNo')) $('panelNo').classList.toggle('show', !isSingle);
        
        if (!isSingle) {
            const listContainer = $('efBatchList');
            if (listContainer && listContainer.children.length === 0) {
                _fetchVariants(State.productId);
            }
        }
        
        _updateQtyTracker();
        validate();
    }

    function addBatch() {
        if (State.mode !== 'batch') return; // منع الإضافة في حالة السيناريو 2
        const list = $('efBatchList');
        if(list) list.appendChild(_buildBatchItem());
        _reNumber();
        _updateQtyTracker();
        validate();
    }

    function removeBatch(idx) {
        $(`efBatch-${idx}`)?.remove();
        _reNumber();
        _updateQtyTracker();
        validate();
    }

    function validate() {
        const btn = $('efSaveBtn');
        if (!btn) return;
        
        _updateQtyTracker();

        if (!State.mode && !State.isEdit) { 
            btn.disabled = true; 
            return; 
        }

        if (State.mode === 'single') {
            btn.disabled = !$('efSingleDate').value;
            return;
        }

        const remaining = _getRemainingQty();

        if (State.mode === 'variants') {
            const globalDate = $('vGlobalDate')?.value;
            let hasInput = false;
            document.querySelectorAll('.v-qty-input').forEach(i => {
                if (parseInt(i.value) > 0) hasInput = true;
            });
            
            if (!globalDate || !hasInput || remaining < 0) {
                btn.disabled = true;
            } else {
                btn.disabled = false;
            }
            return;
        }

        if (State.mode === 'batch') {
            const batches = _collectBatches();
            if (!batches.length || remaining !== 0) { 
                btn.disabled = true;  
            } else {
                btn.disabled = false;
            }
            return;
        }
    }

    /* ════════════════════════════════════════════════════════════════════════
       10. SERVER COMMUNICATION (التواصل مع السيرفر)
    ════════════════════════════════════════════════════════════════════════ */
    
    async function save() {
        const btn = $('efSaveBtn');
        if (!btn) return;
        
        btn.disabled  = true;
        btn.innerHTML = '<i class="bi bi-arrow-repeat ef-spin"></i> Processing...';

        let endpoint = `/inventory/products/${State.productId}/expiry`;
        let payload = {
            product_id:  State.productId,
            same_expiry: State.mode === 'single',
            scenario:    State.mode
        };

        if (State.mode === 'single') {
            payload.single_batch = {
                expiry_date: $('efSingleDate').value,
                batch_code:  $('efSingleBatchCode')?.value || null,
                batch_id:    $('efSingleBatchId')?.value   || null,
            };
        } 
        else if (State.mode === 'variants') {
            payload.global_expiry = $('vGlobalDate').value;
            payload.variants_data = Array.from(document.querySelectorAll('.v-qty-input'))
                .filter(input => parseInt(input.value) > 0)
                .map(input => ({
                    variant_id: input.dataset.vid,
                    quantity: parseInt(input.value)
                }));
        } 
        else if (State.mode === 'batch') {
            const collectedBatches = _collectBatches();
            payload.batches = collectedBatches.map(b => ({
                id:          b.id || null, 
                expiry_date: b.expiry_date,
                quantity:    b.qty,
                batch_code:  b.batch_code || null,
            }));
        }

        try {
            const res  = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                    'Accept'      : 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(payload),
            });
            
            const data = await res.json();

            if (res.ok && data.success) {
                if (typeof Inventory !== 'undefined' && Inventory.onSaveSuccess) {
                    const successPayload = (State.mode === 'single')
                        ? {
                            type:        'single',
                            expiry_date: payload.single_batch.expiry_date,
                            batch_code:  data.batch_code,
                            status:      data.status,
                            quantity:    data.quantity,
                        }
                        : {
                            type:    State.mode,
                            batches: data.batches || [],
                            status:  data.status,
                        };
                        
                    Inventory.onSaveSuccess(State.productId, successPayload, State.isEdit);
                }
                close();
            } else {
                _showError(data.message ?? 'Server processing failed.');
            }
        } catch (err) {
            console.error('[Harees] Save Error:', err);
            _showError('Network error. Please check your connection.');
        } finally {
            btn.disabled  = false;
            btn.innerHTML = '<i class="bi bi-floppy"></i> Save Expiry Information';
            validate();
        }
    }

    function _showError(msg) {
        let el = $('efErrorMsg');
        if (!el) {
            el = document.createElement('div');
            el.id        = 'efErrorMsg';
            el.className = 'ef-edit-banner show';
            el.style.cssText = 'background:hsla(0,70%,50%,0.08);border-color:hsla(0,70%,50%,0.3);color:hsl(0,60%,35%);margin-top:0.75rem;';
            const btn = $('efSaveBtn');
            if(btn) btn.insertAdjacentElement('afterend', el);
        }
        el.innerHTML     = `<i class="bi bi-exclamation-triangle-fill"></i> ${msg}`;
        el.style.display = 'flex';
        setTimeout(() => { if (el) el.style.display = 'none'; }, 6000);
    }

    /* ════════════════════════════════════════════════════════════════════════
       11. INITIALIZATION & EVENT LISTENERS
    ════════════════════════════════════════════════════════════════════════ */
    
    function _initListeners() {
        $('efBackdrop')?.addEventListener('click', e => { 
            if (e.target === $('efBackdrop')) close(); 
        });
        
        $('efCloseBtn')?.addEventListener('click', close);
        
        $('btnYes')?.addEventListener('click', () => selectMode(true));
        $('btnNo')?.addEventListener('click',  () => selectMode(false));
        
        $('efSingleDate')?.addEventListener('input', () => {
            _updateSingleStatus();
            validate();
        });
        
        $('efAddBatchBtn')?.addEventListener('click', addBatch);
        $('efSaveBtn')?.addEventListener('click', save);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _initListeners);
    } else {
        _initListeners();
    }
    
    document.addEventListener('keydown', e => { 
        if (e.key === 'Escape' && State.isOpen) close(); 
    });

    window.addEventListener('pageshow', e => {
        if (e.persisted && State.isOpen) close();
    });

    /* ════════════════════════════════════════════════════════════════════════
       12. PUBLIC EXPORTS (تهيئة الواجهة المفتوحة)
    ════════════════════════════════════════════════════════════════════════ */
    return { 
        open, 
        openSingle, 
        openBatch, 
        close, 
        selectMode, 
        addBatch, 
        removeBatch, 
        updateBadge, 
        validate, 
        save 
    };

})();