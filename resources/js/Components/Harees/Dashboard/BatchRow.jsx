/**
 * @file BatchRow.jsx
 * @module Components/Harees
 *
 * @description
 * Renders the expandable batch list for a single product inside the
 * MonitoredProductsTable accordion.
 *
 * Each batch is shown as a horizontal flex row with five zones that
 * mirror the parent table's column widths (25 / 15 / 20 / 20 / 20 %).
 *
 * Discount Status zone — localized badge driven by `discount_type`:
 *   'pending' | 'auto_discounted' | 'manually_discounted'
 *
 * Actions zone — unified visual language (all items share the same pill shape,
 * height 28 px, rounded-full, same font size and padding; only colour/content
 * differs per status):
 *
 *   Approaching + discount_type 'pending'           → pill-btn  "+ Add Discount"   (primary)
 *   Approaching + discount_type 'auto_discounted'   → pill  "{pct}% Auto-Discount"   (yellow palette)
 *   Approaching + discount_type 'manually_discounted' → pill  "{pct}% Manual Discount" (yellow palette)
 *   Expired + autoHide ON  → pill  "Auto-hide enabled"        (primary/purple palette — matches discount btn)
 *   Expired + autoHide OFF → pill  "Auto-hide Disabled" (muted/grey + opacity:0.65 — looks disabled)
 *   Safe        → centred "—" dash
 *
 * Toast differentiation:
 *  - First-time apply  → "Discount applied successfully"
 *  - Edit (update)     → "Discount updated successfully"
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Tag, Calendar, Loader2, Plus, Trash2, AlertTriangle } from 'lucide-react';
import DiscountModal from '../DiscountModal';
import StatusBadge from '../StatusBadge';
import ProductAvatar from '../../Common/UI/ProductAvatar';
import { useApplyDiscount } from '../../../Hooks/useApplyDiscount';
import { useDeleteBatch } from '../../../Hooks/useInventory';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

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
// kept in sync with StatusBadge (h-[26px] px-4 rounded-full text-[9px]) so
// action pills and status badges have the same visual weight.
const PILL_BASE = [
    'flex items-center justify-center gap-1.5',
    'h-[26px] px-4 w-full rounded-full border',
    'text-[8px] sm:text-[9px] font-black uppercase tracking-wide whitespace-nowrap',
].join(' ');

const BTN_BASE = [
    'flex items-center justify-center gap-1.5',
    'h-[26px] px-4 w-full rounded-full border',
    'text-[8px] sm:text-[9px] font-black uppercase tracking-wide whitespace-nowrap',
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
    const { t } = useTranslation('harees');
    /**
     * Tracks which batch has its DiscountModal open.
     * `null` means no modal is currently visible.
     */
    const [selectedBatch, setSelectedBatch] = useState(null);

    /**
     * Tracks which batch is awaiting delete confirmation.
     * `null` means no confirmation is active.
     */
    const [confirmDeleteBatchId, setConfirmDeleteBatchId] = useState(null);

    /**
     * Mutation hook scoped to this product's ID.
     * `isPending` is true while any discount request for this product is in-flight.
     */
    const { mutateAsync, isPending } = useApplyDiscount(product.id);

    /**
     * Delete batch mutation — invalidates dashboard + products caches.
     */
    const deleteBatchMutation = useDeleteBatch();

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
    /**
     * handleDeleteBatch
     *
     * Deletes a batch and shows a success/error toast.
     * Resets the confirmation state on completion.
     */
    const handleDeleteBatch = async (batchId) => {
        try {
            await deleteBatchMutation.mutateAsync({ batchId });
            toast.success(t('batch_row.toast_batch_deleted'), { duration: 3000 });
        } catch (error) {
            toast.error(error.userMessage || error.message || t('batch_row.toast_delete_error'), { duration: 4000 });
        } finally {
            setConfirmDeleteBatchId(null);
        }
    };

    const handleApplyDiscount = async ({ batchId, discountPct, endDate, isEdit }) => {
        try {
            await mutateAsync({ batchId, discountPct, endDate });
            toast.success(isEdit ? t('batch_row.toast_updated') : t('batch_row.toast_added'), { duration: 3000 });
            setSelectedBatch(null);
        } catch (error) {
            toast.error(error.message || t('batch_row.toast_error_fallback'), { duration: 4000 });
        }
    };

    const productBatches = product.batches || [];
    const batch = productBatches[0];

    if (!batch) {
        return (
            <div className="py-4 px-6 text-[11px] text-[var(--muted-foreground)] text-center">
                {t('batch_row.no_batches')}
            </div>
        );
    }

    const expiryDate = batch.expiry_date || batch.expiryDate || '—';
    const isThisBatchLoading = isPending && selectedBatch?.id === batch.id;
    const hasDiscount = hasExistingDiscount(batch);
    const existingPct = getDiscountPct(batch);
    const discountType = batch.discount_type;
    const batchStatus = batch.status?.toLowerCase();
    const isApproaching = batchStatus === 'yellow' || batchStatus === 'approaching';
    const isExpired = batchStatus === 'red' || batchStatus === 'expired';
    const isSafe = batchStatus === 'green' || batchStatus === 'safe' || batchStatus === 'valid';

    return (
        <>
            <div className="flex items-center border-b border-[var(--border)] last:border-0 hover:bg-[var(--accent)]/5 transition-all">
                <div className="flex-1 py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                        <ProductAvatar
                            src={product.image_url || product.image}
                            name={product.name}
                            size={40}
                        />
                        <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-[12px] font-bold text-[var(--foreground)] truncate">
                                {product.name}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 py-3.5 px-4 flex justify-center">
                    <StatusBadge status={batch.status} size="md" />
                </div>

                <div className="flex-1 py-3.5 px-4 flex justify-center">
                    <span className="text-[12px] font-bold flex items-center justify-center gap-1.5 w-full text-[var(--foreground)]">
                        <Calendar size={11} className="opacity-50" />
                        {expiryDate}
                    </span>
                </div>

                <div className="flex-1 py-3.5 px-4 flex justify-center">
                    {discountType && (
                        <span
                            className={PILL_BASE}
                            style={{
                                color:       'var(--muted-foreground)',
                                background:  'color-mix(in srgb, var(--muted-foreground) 6%, transparent)',
                                borderColor: 'color-mix(in srgb, var(--muted-foreground) 18%, transparent)',
                            }}
                        >
                            {t(`batch_row.${discountType}`)}
                        </span>
                    )}
                </div>

                <div className="flex-1 py-3.5 px-4 flex justify-center items-center gap-2">
                    {confirmDeleteBatchId === batch.id ? (
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => handleDeleteBatch(batch.id)}
                                disabled={deleteBatchMutation.isPending}
                                className={`${BTN_BASE} border-red-400/30 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-400 text-[8px] px-2`}
                            >
                                {deleteBatchMutation.isPending ? (
                                    <Loader2 size={8} className="animate-spin" />
                                ) : (
                                    <AlertTriangle size={8} />
                                )}
                                {t('batch_row.btn_confirm_delete')}
                            </button>
                            <button
                                onClick={() => setConfirmDeleteBatchId(null)}
                                className={`${BTN_BASE} border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]/10 text-[8px] px-2`}
                            >
                                {t('batch_row.btn_cancel_delete')}
                            </button>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => setConfirmDeleteBatchId(batch.id)}
                                className="flex items-center justify-center w-[26px] h-[26px] rounded-full text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                                title={t('batch_row.btn_delete_batch')}
                            >
                                <Trash2 size={11} />
                            </button>

                            {isApproaching && batch.discount_type === 'pending' && (
                                <button
                                    onClick={() => setSelectedBatch(batch)}
                                    disabled={isPending}
                                    className={`${BTN_BASE} border-[var(--primary)]/20 bg-[var(--primary)]/5 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)]`}
                                >
                                    {isThisBatchLoading ? (
                                        <Loader2 size={10} className="animate-spin" />
                                    ) : (
                                        <Plus size={10} />
                                    )}
                                    {isThisBatchLoading
                                        ? t('batch_row.btn_applying')
                                        : t('batch_row.btn_add_discount')
                                    }
                                </button>
                            )}

                            {isApproaching && batch.discount_type === 'auto_discounted' && (
                                <span
                                    className={PILL_BASE}
                                    style={{
                                        color:       'var(--status-approaching-text)',
                                        background:  'var(--status-approaching-bg)',
                                        borderColor: 'var(--status-approaching-border)',
                                    }}
                                >
                                    <Tag size={10} />
                                    {autoDiscountPercent}% {t('batch_row.auto_discount_badge')}
                                </span>
                            )}

                            {isApproaching && batch.discount_type === 'manually_discounted' && (
                                <span
                                    className={PILL_BASE}
                                    style={{
                                        color:       'var(--status-approaching-text)',
                                        background:  'var(--status-approaching-bg)',
                                        borderColor: 'var(--status-approaching-border)',
                                    }}
                                >
                                    <Tag size={10} />
                                    {existingPct}% {t('batch_row.manual_discount')}
                                </span>
                            )}

                            {!isApproaching && isExpired ? (
                                autoHide ? (
                                    <span
                                        className={PILL_BASE}
                                        style={{
                                            color:       'var(--primary)',
                                            background:  'color-mix(in srgb, var(--primary) 8%, transparent)',
                                            borderColor: 'color-mix(in srgb, var(--primary) 20%, transparent)',
                                        }}
                                    >
                                        {t('batch_row.auto_hidden_badge')}
                                    </span>
                                ) : (
                                    <span
                                        className={PILL_BASE}
                                        style={{
                                            color:       'var(--muted-foreground)',
                                            background:  'color-mix(in srgb, var(--muted-foreground) 6%, transparent)',
                                            borderColor: 'color-mix(in srgb, var(--muted-foreground) 18%, transparent)',
                                            opacity:     0.65,
                                        }}
                                    >
                                        {t('batch_row.auto_hide_disabled_badge')}
                                    </span>
                                )
                            ) : !isApproaching && isSafe ? (
                                <span className="text-[var(--muted-foreground)] text-sm font-medium select-none w-full text-center">
                                    —
                                </span>
                            ) : null}
                        </>
                    )}
                </div>
            </div>

            {selectedBatch && createPortal(
                <DiscountModal
                    batch={selectedBatch}
                    product={product}
                    isEdit={hasExistingDiscount(selectedBatch)}
                    existingPct={getDiscountPct(selectedBatch)}
                    onClose={() => setSelectedBatch(null)}
                    onApply={handleApplyDiscount}
                    isLoading={isPending}
                />,
                document.body
            )}
        </>
    );
}