{{--
    Partial : inventory/discountform.blade.php
    Include : @include('inventory.discountform')

    APPLY MANUAL  POST  /api/inventory/discount/manual
                  Body  { product_id, percent, end_date }

    Success → Inventory.onDiscountSuccess(productId, data)
--}}

<div class="ef-backdrop" id="dfBackdrop">
    <div class="ef-card" id="dfCard">

        {{-- Header --}}
        <div class="ef-header">
            <div class="ef-header-left">
                <div class="ef-icon"><i class="bi bi-percent"></i></div>
                <div>
                    <div class="ef-title">Apply Discount</div>
                    <div class="ef-subtitle" id="dfProductName">Product</div>
                </div>
            </div>
            <button class="ef-close" id="dfCloseBtn" title="Close">
                <i class="bi bi-x-lg"></i>
            </button>
        </div>

        <div class="ef-divider"></div>

        {{-- Warning --}}
        <div class="df-warning">
            <i class="bi bi-info-circle-fill"></i>
            <span>
                <strong>Note:</strong> Discounts apply only to Yellow-status batches.
                Green inventory is always protected.
            </span>
        </div>

        {{-- Manual Form --}}
        <div class="df-manual-panel show" id="dfManualPanel">
            <p class="ef-panel-title"><i class="bi bi-sliders"></i> Manual Configuration</p>
            <div class="ef-batch-grid" style="margin-bottom:1rem;">
                <div>
                    <label class="ef-label" for="dfPercent">Discount Percentage</label>
                    <div style="position:relative;">
                        <input type="number" class="ef-input" id="dfPercent"
                               min="1" max="100" placeholder="20">
                        <span class="df-input-suffix">%</span>
                    </div>
                </div>
                <div>
                    <label class="ef-label" for="dfEndDate">End Date</label>
                    <input type="date" class="ef-input" id="dfEndDate">
                </div>
            </div>
            <button class="ef-save" id="dfManualBtn" disabled>
                <i class="bi bi-check2-circle"></i> Apply Discount
            </button>
        </div>

    </div>
</div>