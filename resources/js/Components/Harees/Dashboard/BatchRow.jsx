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
 * Discount logic:
 *  - "Yellow" / "approaching" batches show either:
 *      a) An "Auto-Discount Enabled" badge  (when `autoDiscount` is true), or
 *      b) A manual "Discount" button        (when `autoDiscount` is false).
 *  - Other statuses render nothing in the actions zone.
 *
 * The mutation state from `useApplyDiscount` is scoped to the product,
 * so `isPending` is shared across all batches; `isThisBatchLoading` narrows
 * the spinner to the specific batch row that is being submitted.
 */

// ─── i18n strings ────────────────────────────────────────────────────────────
// Move these values to your JSON translation file and replace this object with
// a `useTranslation` call (or equivalent) when you are ready.
const t = {
    no_batches:           'No batches available.',
    auto_discount_badge:  'Auto-Discount Enabled',
    btn_discount:         'Discount',
    btn_applying:         'Applying...',
    toast_success:        'Discount applied successfully',
    toast_error_fallback: 'An error occurred while applying the discount',
};
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { Tag, Calendar, Percent, BadgeCheck, Loader2 } from 'lucide-react';
import DiscountModal from '../DiscountModal';
import StatusBadge from '../StatusBadge';
import ProductAvatar from '../../Common/UI/ProductAvatar';
import { useApplyDiscount } from '../../../Hooks/useApplyDiscount';
import toast from 'react-hot-toast';

/**
 * BatchRow
 *
 * Renders one flex row per batch for the given product.  When a "Discount"
 * button is clicked the batch is stored in local state and a DiscountModal
 * is opened.  On successful submission the modal is closed; on failure the
 * error is surfaced via a toast.
 *
 * @component
 *
 * @param {Object}   props
 * @param {Object}   props.product              - Parent product object.
 * @param {number}   props.product.id           - Used as the `productId` scope for the mutation.
 * @param {string}   props.product.name         - Displayed inside each batch row and in the modal.
 * @param {string}   [props.product.image_url]  - Preferred product image.
 * @param {string}   [props.product.image]      - Fallback product image.
 * @param {Array}    props.product.batches      - List of batch objects to render.
 * @param {boolean}  props.autoDiscount         - When true, replaces the discount button with an
 *                                               informational "Auto-Discount Enabled" badge.
 * @returns {JSX.Element}
 */
export default function BatchRow({ product, autoDiscount }) {
    /**
     * Tracks which batch has its DiscountModal open.
     * `null` means no modal is currently visible.
     *
     * @type {[Object|null, Function]}
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
     * Submits the discount mutation, shows a success or error toast, and
     * closes the modal only on success.
     *
     * @async
     * @param {Object} params
     * @param {number} params.batchId      - ID of the batch receiving the discount.
     * @param {number} params.discountPct  - Discount percentage (1–99).
     * @param {string} params.endDate      - ISO date string for the discount expiry.
     * @returns {Promise<void>}
     */
    const handleApplyDiscount = async ({ batchId, discountPct, endDate }) => {
        try {
            await mutateAsync({ batchId, discountPct, endDate });
            toast.success(t.toast_success, { duration: 3000 });

            // Close the modal only after a confirmed successful response.
            setSelectedBatch(null);
        } catch (error) {
            // Surface the server-provided message or fall back to a generic string.
            toast.error(error.message || t.toast_error_fallback, {
                duration: 4000,
            });
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
                 *
                 * @type {boolean}
                 */
                const isThisBatchLoading = isPending && selectedBatch?.id === batch.id;

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
                                    {/* Batch code displayed with a tag icon for visual cue */}
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

                        {/* Zone 4 (25%): Discount action — only shown for approaching batches */}
                        <div className="w-[25%] py-3.5 px-4 flex justify-center">
                            {batch.status?.toLowerCase() === 'yellow' || batch.status?.toLowerCase() === 'approaching' ? (
                                autoDiscount ? (
                                    /* Auto-discount is on — inform the user, no manual action needed */
                                    <div
                                        className="inline-flex items-center justify-center gap-1.5 px-3 h-[28px] rounded-full border text-[9px] font-black uppercase tracking-wide"
                                        style={{
                                            color:       'var(--status-approaching-text)',
                                            background:  'var(--status-approaching-bg)',
                                            borderColor: 'var(--status-approaching-border)',
                                        }}
                                    >
                                        <BadgeCheck size={10} />
                                        {t.auto_discount_badge}
                                    </div>
                                ) : (
                                    /* Auto-discount is off — show the manual discount trigger button */
                                    <button
                                        onClick={() => setSelectedBatch(batch)}
                                        disabled={isPending} // Prevent double-submission while any request is pending
                                        className="w-[120px] h-[32px] flex items-center justify-center gap-1.5 rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/5 text-[var(--primary)] text-[10px] font-black uppercase hover:bg-[var(--primary)] hover:text-white transition-all disabled:opacity-50"
                                    >
                                        {/* Show spinner for the actively submitting batch; icon for all others */}
                                        {isThisBatchLoading ? (
                                            <Loader2 size={11} className="animate-spin" />
                                        ) : (
                                            <Percent size={11} />
                                        )}
                                        {isThisBatchLoading ? t.btn_applying : t.btn_discount}
                                    </button>
                                )
                            ) : null /* Non-approaching batches have no discount action */ }
                        </div>
                    </div>
                );
            })}

            {/* ── Discount modal ───────────────────────────────────────────────
                Mounted only when a batch is selected; unmounts on close so
                form state is automatically reset for the next interaction.
            ─────────────────────────────────────────────────────────────── */}
            {selectedBatch && (
                <DiscountModal
                    batch={selectedBatch}
                    product={product}
                    onClose={() => setSelectedBatch(null)}
                    onApply={handleApplyDiscount}
                    isLoading={isPending}
                />
            )}
        </>
    );
}