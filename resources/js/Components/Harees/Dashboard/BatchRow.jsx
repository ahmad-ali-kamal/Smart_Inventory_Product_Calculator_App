/**
 * @file BatchRow.jsx
 * @module Components/Harees
 *
 * @description
 * Renders the expandable batch list for a single product inside the
 * MonitoredProductsTable accordion.
 *
 * Each batch is shown as a horizontal flex row with four zones that
 * mirror the parent table's column widths (25 / 20 / 30 / 25 %).
 *
 * Actions zone — unified visual language (all items share the same pill shape,
 * height 28 px, rounded-full, same font size and padding; only colour/content
 * differs per status):
 *
 *   Approaching + autoDiscount ON  → pill  "{pct}% Auto-Discount"   (yellow palette)
 *   Approaching + autoDiscount OFF, no discount → pill-btn  "+ Add Discount"   (primary)
 *   Approaching + autoDiscount OFF, has discount →
 *       yellow pct pill  +  pill-btn  "✎ Edit Discount"  (primary)
 *   Expired + autoHide ON  → pill  "Auto-hide enabled"        (primary/purple palette — matches discount btn)
 *   Expired + autoHide OFF → pill  "Auto-hide Disabled" (muted/grey + opacity:0.65 — looks disabled)
 *   Safe        → centred "—" dash
 *
 * Toast differentiation:
 *  - First-time apply  → "Discount applied successfully"
 *  - Edit (update)     → "Discount updated successfully"
 */

// ─── i18n strings ────────────────────────────────────────────────────────────
const t = {
    no_batches:                'No batches available.',
    auto_discount_badge:       'Auto-Discount',
    auto_hidden_badge:         'Auto-hide enabled',
    auto_hide_disabled_badge:  'Auto-hide Disabled',
    btn_add_discount:          'Add Discount',
    btn_edit_discount:         'Edit Discount',
    btn_applying:              'Applying...',
    toast_added:               'Discount applied successfully',
    toast_updated:             'Discount updated successfully',
    toast_error_fallback:      'An error occurred while applying the discount',
};
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { Tag, Calendar, Loader2, Plus, Edit } from 'lucide-react';
import DiscountModal from '../DiscountModal';
import StatusBadge from '../StatusBadge';
import ProductAvatar from '../../Common/UI/ProductAvatar';
import { useApplyDiscount } from '../../../Hooks/useApplyDiscount';
import toast from 'react-hot-toast';

/**
 * hasExistingDiscount
 *
 * Returns true when a batch already has a manual discount applied.
 * Checks both `discount_percentage` (direct field) and `latest_discount`
 * (relationship object from BatchDiscount model) to handle both API shapes.
 *
 * @param {Object} batch - Batch object from the API.
 * @returns {boolean}
 */
function hasExistingDiscount(batch) {
    if (batch.discount_percentage != null && batch.discount_percentage > 0) return true;
    if (batch.latest_discount?.discount_percentage > 0)                     return true;
    return false;
}

/**
 * getDiscountPct
 *
 * Resolves the stored discount percentage for a batch.
 * Returns 0 when no discount exists.
 *
 * @param {Object} batch - Batch object from the API.
 * @returns {number}
 */
function getDiscountPct(batch) {
    return batch.discount_percentage
        || batch.latest_discount?.discount_percentage
        || 0;
}

// ─── Shared pill / badge styling ─────────────────────────────────────────────
// PILL_BASE  : informational (non-interactive) badges
// BTN_BASE   : interactive action buttons
//
// Height, padding, border-radius, and font are identical across both so the
// Actions column looks uniform at every status.  The values are intentionally
// kept in sync with StatusBadge (h-[26px] px-3 rounded-full text-[9px]) so
// action pills and status badges have the same visual weight.
const PILL_BASE = [
    'inline-flex items-center justify-center gap-1.5',
    'h-[26px] px-3 min-w-[140px] rounded-full border',
    'text-[9px] font-black uppercase tracking-wide whitespace-nowrap',
].join(' ');

const BTN_BASE = [
    'inline-flex items-center justify-center gap-1.5',
    'h-[26px] px-3 min-w-[140px] rounded-full border',
    'text-[9px] font-black uppercase tracking-wide whitespace-nowrap',
    'transition-all disabled:opacity-50 cursor-pointer',
].join(' ');
// ─────────────────────────────────────────────────────────────────────────────

/**
 * BatchRow
 *
 * Renders one flex row per batch for the given product.
 *
 * @component
 *
 * @param {Object}   props
 * @param {Object}   props.product                  - Parent product object.
 * @param {number}   props.product.id               - productId scope for the mutation.
 * @param {string}   props.product.name             - Displayed in each row and in the modal.
 * @param {string}   [props.product.image_url]      - Preferred product image.
 * @param {string}   [props.product.image]          - Fallback product image.
 * @param {Array}    props.product.batches          - List of batch objects to render.
 * @param {boolean}  props.autoDiscount             - Global auto-discount toggle (from settings).
 * @param {number}   props.autoDiscountPercent      - Configured auto-discount percentage.
 * @param {boolean}  props.autoHide                 - Global auto-hide toggle (from settings).
 *                                                   true  → expired batches show "Auto-hidden"
 *                                                   false → expired batches show "Auto-hide Disabled"
 * @returns {JSX.Element}
 */
export default function BatchRow({ product, autoDiscount, autoDiscountPercent, autoHide }) {
    /**
     * Tracks which batch has its DiscountModal open.
     * `null` means no modal is currently visible.
     */
    const [selectedBatch, setSelectedBatch] = useState(null);

    /**
     * Mutation hook scoped to this product's ID.
     * `isPending` is true while any discount request for this product is in-flight.
     */
    const { mutateAsync, isPending } = useApplyDiscount(product.id);

    /**
     * handleApplyDiscount
     *
     * Submits the discount mutation, shows a differentiated success or error
     * toast (add vs. edit), and closes the modal only on success.
     *
     * @async
     * @param {Object}  p
     * @param {number}  p.batchId      - Batch receiving the discount.
     * @param {number}  p.discountPct  - Discount percentage (1–99).
     * @param {string}  p.endDate      - ISO date string for discount expiry.
     * @param {boolean} p.isEdit       - True when updating an existing discount.
     */
    const handleApplyDiscount = async ({ batchId, discountPct, endDate, isEdit }) => {
        try {
            await mutateAsync({ batchId, discountPct, endDate });
            toast.success(isEdit ? t.toast_updated : t.toast_added, { duration: 3000 });
            setSelectedBatch(null);
        } catch (error) {
            toast.error(error.message || t.toast_error_fallback, { duration: 4000 });
        }
    };

    const productBatches = product.batches || [];

    // Empty state: product exists but has no batch records yet.
    if (productBatches.length === 0) {
        return (
            <div className="py-4 px-6 text-[11px] text-[var(--muted-foreground)] text-center">
                {t.no_batches}
            </div>
        );
    }

    return (
        <>
            {productBatches.map(batch => {
                // Normalise batch code and expiry date fields regardless of API shape.
                const batchCode  = batch.batch_code  || batch.batchNo    || '—';
                const expiryDate = batch.expiry_date  || batch.expiryDate || '—';

                /**
                 * Scope the global `isPending` flag to this specific batch row so
                 * only the button that triggered the request shows a spinner.
                 */
                const isThisBatchLoading = isPending && selectedBatch?.id === batch.id;

                /**
                 * Discount state for this specific batch.
                 */
                const hasDiscount = hasExistingDiscount(batch);
                const existingPct = getDiscountPct(batch);

                // Normalise status for reliable comparisons.
                const batchStatus   = batch.status?.toLowerCase();
                const isApproaching = batchStatus === 'yellow' || batchStatus === 'approaching';
                const isExpired     = batchStatus === 'red'    || batchStatus === 'expired';
                const isSafe        = batchStatus === 'green'  || batchStatus === 'safe' || batchStatus === 'valid';

                return (
                    <div
                        key={batch.id}
                        className="flex items-center border-b border-[var(--border)] last:border-0 hover:bg-[var(--accent)]/5 transition-all"
                    >
                        {/* Zone 1 (25%): Product avatar + name + batch code */}
                        <div className="w-[25%] py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                                <ProductAvatar
                                    src={product.image_url || product.image}
                                    name={product.name}
                                    size={40}
                                />
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[12px] font-bold text-[var(--foreground)] truncate">
                                        {product.name}
                                    </span>
                                    <span className="text-[11px] font-bold flex items-center gap-1 text-[var(--muted-foreground)]">
                                        <Tag size={10} className="text-[var(--primary)] opacity-50" />
                                        {batchCode}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Zone 2 (20%): Batch-level status badge */}
                        <div className="w-[20%] py-3.5 px-4 flex justify-center">
                            <StatusBadge status={batch.status} size="md" />
                        </div>

                        {/* Zone 3 (30%): Human-readable expiry date */}
                        <div className="w-[30%] py-3.5 px-4 flex justify-center">
                            <span className="text-[12px] font-bold flex items-center gap-1.5 text-[var(--foreground)]">
                                <Calendar size={11} className="opacity-50" />
                                {expiryDate}
                            </span>
                        </div>

                        {/* ── Zone 4 (25%): Actions ──────────────────────────────────────────
                            Design rule: every element in this column uses PILL_BASE or BTN_BASE
                            so height, border-radius, font, and padding are always identical.
                            Only colour tokens and content text differ between states.
                        ─────────────────────────────────────────────────────────────────── */}
                        <div className="w-[25%] py-3.5 px-4 flex justify-center items-center gap-2">

                            {isApproaching ? (
                                autoDiscount ? (

                                    /* ── Approaching + Auto-discount ON ──────────────────────────
                                       Informational pill — yellow palette, no interaction.
                                    ─────────────────────────────────────────────────────────── */
                                    <span
                                        className={PILL_BASE}
                                        style={{
                                            color:       'var(--status-approaching-text)',
                                            background:  'var(--status-approaching-bg)',
                                            borderColor: 'var(--status-approaching-border)',
                                        }}
                                    >
                                        <Tag size={10} aria-hidden="true" />
                                        {autoDiscountPercent}% {t.auto_discount_badge}
                                    </span>

                                ) : (

                                    /* ── Approaching + Auto-discount OFF ─────────────────────────
                                       Optional yellow pct pill (when discount exists) + action btn.
                                       Both share PILL_BASE/BTN_BASE so they sit on the same baseline.
                                    ─────────────────────────────────────────────────────────── */
                                    <>
                                        {hasDiscount && (
                                            <span
                                                className={`${PILL_BASE} !min-w-0 !px-2.5`}
                                                style={{
                                                    color:       'var(--status-approaching-text)',
                                                    background:  'var(--status-approaching-bg)',
                                                    borderColor: 'var(--status-approaching-border)',
                                                }}
                                            >
                                                <Tag size={9} aria-hidden="true" />
                                                {existingPct}%
                                            </span>
                                        )}

                                        <button
                                            onClick={() => setSelectedBatch(batch)}
                                            disabled={isPending}
                                            className={`${BTN_BASE} border-[var(--primary)]/20 bg-[var(--primary)]/5 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)]`}
                                        >
                                            {isThisBatchLoading ? (
                                                <Loader2 size={10} className="animate-spin" aria-hidden="true" />
                                            ) : hasDiscount ? (
                                                <Edit size={10} aria-hidden="true" />
                                            ) : (
                                                <Plus size={10} aria-hidden="true" />
                                            )}
                                            {isThisBatchLoading
                                                ? t.btn_applying
                                                : hasDiscount
                                                    ? t.btn_edit_discount
                                                    : t.btn_add_discount
                                            }
                                        </button>
                                    </>
                                )

                            ) : isExpired ? (
                                autoHide ? (

                                    /* ── Expired + Auto-hide ON ───────────────────────────────────
                                       Pill styled like the discount btn (primary/purple palette)
                                       to match the visual weight of Add/Edit Discount pills.
                                       Signals the feature is active — colour matches primary.
                                    ─────────────────────────────────────────────────────────── */
                                    <span
                                        className={PILL_BASE}
                                        style={{
                                            color:       'var(--primary)',
                                            background:  'color-mix(in srgb, var(--primary) 8%, transparent)',
                                            borderColor: 'color-mix(in srgb, var(--primary) 20%, transparent)',
                                        }}
                                    >
                                        {t.auto_hidden_badge}
                                    </span>

                                ) : (

                                    /* ── Expired + Auto-hide OFF ──────────────────────────────────
                                       Same pill shape but visually "disabled" — grey/muted palette
                                       to signal the feature is turned off, no action available.
                                    ─────────────────────────────────────────────────────────── */
                                    <span
                                        className={PILL_BASE}
                                        style={{
                                            color:       'var(--muted-foreground)',
                                            background:  'color-mix(in srgb, var(--muted-foreground) 6%, transparent)',
                                            borderColor: 'color-mix(in srgb, var(--muted-foreground) 18%, transparent)',
                                            opacity:     0.65,
                                        }}
                                    >
                                        {t.auto_hide_disabled_badge}
                                    </span>
                                )

                            ) : isSafe ? (

                                /* ── Safe (green) batches ─────────────────────────────────────
                                   Em-dash centred; no interaction needed.
                                ─────────────────────────────────────────────────────────── */
                                <span className="text-[var(--muted-foreground)] text-sm font-medium select-none">
                                    —
                                </span>

                            ) : null /* Unknown / future status — render nothing */}

                        </div>
                    </div>
                );
            })}

            {/* ── Discount modal ───────────────────────────────────────────────
                Mounted only when a batch is selected; unmounts on close so
                form state is automatically reset for the next interaction.
                `isEdit` is derived here and forwarded to the modal so it can
                pre-populate the form and pass the flag back through `onApply`.
            ─────────────────────────────────────────────────────────────── */}
            {selectedBatch && (
                <DiscountModal
                    batch={selectedBatch}
                    product={product}
                    isEdit={hasExistingDiscount(selectedBatch)}
                    existingPct={getDiscountPct(selectedBatch)}
                    onClose={() => setSelectedBatch(null)}
                    onApply={handleApplyDiscount}
                    isLoading={isPending}
                />
            )}
        </>
    );
}