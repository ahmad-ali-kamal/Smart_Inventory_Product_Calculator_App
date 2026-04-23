
<div class="ef-backdrop" id="efBackdrop">
    <div class="ef-card" id="efCard">

        <div class="ef-header">
            <div class="ef-header-left">
                <div class="ef-icon"><i class="bi bi-calendar-plus" id="efIcon"></i></div>
                <div>
                    <div class="ef-title" id="efTitle">Add Expiry Date</div>
                    <div class="ef-subtitle" id="efProductName">Product</div>
                </div>
            </div>
            <button class="ef-close" id="efCloseBtn" title="Close">
                <i class="bi bi-x-lg"></i>
            </button>
        </div>
        <div class="ef-divider"></div>

        <div class="ef-edit-banner" id="efEditBanner">
            <i class="bi bi-pencil-square"></i>
            <span>Edit mode — modifying existing expiry data</span>
        </div>

        <p class="ef-question">Do all quantities have the same expiry date?</p>
        <div class="ef-toggle">
            <button class="ef-toggle-btn" id="btnYes">
                <i class="bi bi-check-circle"></i> Yes
            </button>
            <button class="ef-toggle-btn" id="btnNo">
                <i class="bi bi-layers"></i> No — multiple batches
            </button>
        </div>
<div class="ef-qty-tracker" id="efQtyTracker">
    <span>
        <i class="bi bi-box-seam" style="font-size:0.78rem;"></i>
        Available: <strong id="efQtyAvail">—</strong> units
    </span>
    <span class="ef-qty-warn" id="efQtyWarn" style="display:none;">
        <i class="bi bi-exclamation-triangle-fill"></i>
        <span id="efQtyWarnMsg"></span>
    </span>
</div>
        <div class="ef-panel ef-panel-yes" id="panelYes">
            <p class="ef-panel-title"><i class="bi bi-calendar3"></i> Single Expiry Date</p>
           
            <label class="ef-label" for="efSingleDate">Expiry Date <span class="ef-status-badge" id="efSingleStatus"></span></label>
             <button class="ef-delete-btn ef-delete-btn--icon" id="efSingleDeleteBtn" type="button" disabled title="Delete expiry details">
                    <i class="bi bi-trash3"></i>
                </button>
            
            <input type="date" class="ef-input" id="efSingleDate">
<input type="hidden" id="efSingleBatchCode" value="">
<input type="hidden" id="efSingleBatchId" value="">
        </div>

        <div class="ef-panel ef-panel-no" id="panelNo">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
                <p class="ef-panel-title" style="margin:0;">
                    <i class="bi bi-layers"></i> Batch-Level Tracking
                </p>
                <button class="ef-add-batch" id="efAddBatchBtn">
                    <i class="bi bi-plus-lg"></i> Add Batch
                </button>
                <button class="ef-delete-btn ef-delete-btn--compact" id="efDeleteBtn" type="button" disabled>
                        <i class="bi bi-trash3"></i>
                        <span id="efDeleteBtnText">Delete All</span>
                    </button>
            </div>
            <div class="ef-batch-list" id="efBatchList"></div>
        </div>
<div class="ef-delete-confirm" id="efDeleteConfirm">
    <i class="bi bi-exclamation-triangle-fill"></i>
    <span>Are you sure you want to delete all data? Click <strong>Confirm &amp; Reset</strong> to proceed.</span>
</div>
        <div class="ef-action-row">
    <button class="ef-save" id="efSaveBtn" disabled>
        <i class="bi bi-floppy"></i> Save Expiry Information
    </button>
</div>
</div>