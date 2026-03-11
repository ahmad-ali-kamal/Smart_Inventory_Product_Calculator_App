{{--
    Partial : inventory/discountform.blade.php
    Include : @include('inventory.discountform')

    ── API Endpoints ──────────────────────────────────────
    APPLY AI     POST  /api/inventory/discount/ai
                 Body  { product_id }

    APPLY MANUAL POST  /api/inventory/discount/manual
                 Body  { product_id, percent, end_date }

    ── Success response ───────────────────────────────────
    { success: true, type: 'ai'|'manual', percent, end_date }

    ── After success ──────────────────────────────────────
    Calls Inventory.onDiscountSuccess(productId, data)
    defined in inventory-products.js

    ── JS wiring ─────────────────────────────────────────
    All buttons use id="" only — no onclick.
    inventory-discountform.js attaches all listeners on DOMContentLoaded.
--}}

<div class="ef-backdrop" id="dfBackdrop">
    <div class="ef-card" id="dfCard">

        {{-- Header --}}
        <div class="ef-header">
            <div class="ef-header-left">
                <div class="ef-icon"><i class="bi bi-percent"></i></div>
                <div>
                    <div class="ef-title">Discount Recommendation</div>
                    <div class="ef-subtitle" id="dfProductName">Product</div>
                </div>
            </div>
            <button class="ef-close" id="dfCloseBtn" title="Close">
                <i class="bi bi-x-lg"></i>
            </button>
        </div>
        <div class="ef-divider"></div>

        {{-- AI Panel --}}
        <div class="df-ai-panel">
            <div class="df-ai-panel-head">
                <i class="bi bi-stars"></i>
                <span>AI Analysis</span>
            </div>
            <p class="df-ai-body" id="dfAiBody"></p>
            <div class="df-ai-meta">
                <div class="df-ai-meta-item">
                    <span class="df-ai-meta-label">Recommended Discount</span>
                    <span class="df-ai-meta-value" id="dfAiPercent">20%</span>
                </div>
                <div class="df-ai-meta-divider"></div>
                <div class="df-ai-meta-item">
                    <span class="df-ai-meta-label">Applies To</span>
                    <span class="df-ai-meta-value">Yellow batches only</span>
                </div>
            </div>
        </div>

        {{-- Warning --}}
        <div class="df-warning">
            <i class="bi bi-info-circle-fill"></i>
            <span>
                <strong>Note:</strong> Discounts apply only to Yellow-status batches.
                Green inventory is always protected.
            </span>
        </div>

        {{-- Actions --}}
        <div class="df-actions">

            <button class="ef-save" id="dfAiBtn">
                <i class="bi bi-stars"></i>
                Apply AI Recommended Discount (<span id="dfAiBtnPercent">20%</span>)
            </button>

            <div class="df-or">
                <div class="df-or-line"></div>
                <span>or</span>
                <div class="df-or-line"></div>
            </div>

            <div id="dfManualToggleWrap">
                <button class="df-manual-toggle-btn" id="dfShowManualBtn">
                    <i class="bi bi-sliders"></i> Manual Discount Scheduling
                </button>
            </div>

            <div class="df-manual-panel" id="dfManualPanel">
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
                    <i class="bi bi-check2-circle"></i> Apply Manual Discount
                </button>
            </div>

        </div>

    </div>
</div>