/**
 * @file ProductRow.jsx
 * @module Components/Harees/Dashboard
 *
 * @description
 * Renders a single product row inside the MonitoredProductsTable.
 * The row is interactive: clicking "View Batches" toggles an animated
 * accordion beneath the product row that mounts the BatchRow component.
 *
 * Layout (5-column table):
 *   [Product] [Status] [Expiry Info – batch count summary] [Discount Status] [Actions]
 *
 * The Expiry Info cell at the product level shows a batch count chip
 * (e.g. "3 Batches") so the row is never visually empty while the
 * accordion is collapsed.  Per-batch expiry dates appear inside the
 * expanded BatchRow accordion.
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Tag, Calendar, Loader2, Plus, Trash2, AlertTriangle } from 'lucide-react';
import DiscountModal from '../DiscountModal';
import StatusBadge from '../StatusBadge';
import ProductAvatar from '../../Common/UI/ProductAvatar';
import { useApplyDiscount } from '../../../hooks/useApplyDiscount';
import { useDeleteBatch } from '../../../hooks/useInventory';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

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

/**
 * ProductRow
 *
 * Renders a single table row with product + batch info inline.
 * Since each product has at most one batch, the accordion is removed.
 *
 * @component
 *
 * @param {Object}  props
 * @param {Object}  props.product               - Product data object.
 * @param {Array}   props.product.batches       - Array of batch objects (at most one).
 * @param {boolean} props.autoDiscount          - Global auto-discount toggle.
 * @param {number}  props.autoDiscountPercent   - Configured auto-discount percentage.
 * @param {boolean} props.autoHide              - Global auto-hide toggle.
 * @returns {JSX.Element}
 */
export default function ProductRow({ product, autoDiscount, autoDiscountPercent, autoHide }) {
    const { t } = useTranslation('harees');
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [confirmDeleteBatchId, setConfirmDeleteBatchId] = useState(null);
    const { mutateAsync, isPending } = useApplyDiscount(product.id);
    const deleteBatchMutation = useDeleteBatch();

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

    const batch = (product.batches || [])[0];
    const hasExistingDiscount = (b) => !!(b.discount_percentage || b.latest_discount?.discount_percentage);
    const getDiscountPct = (b) => b.discount_percentage || b.latest_discount?.discount_percentage || 0;

    if (!batch) {
        return (
            <tr>
                <td colSpan={5} className="py-4 px-6 text-[11px] text-[var(--muted-foreground)] text-center">
                    {t('batch_row.no_batches')}
                </td>
            </tr>
        );
    }

    const expiryDate = batch.expiry_date || batch.expiryDate || '—';
    const isThisBatchLoading = isPending && selectedBatch?.id === batch.id;
    const existingPct = getDiscountPct(batch);
    const discountType = batch.discount_type;
    const batchStatus = batch.status?.toLowerCase();
    const isApproaching = batchStatus === 'yellow' || batchStatus === 'approaching';
    const isExpired = batchStatus === 'red' || batchStatus === 'expired';
    const isSafe = batchStatus === 'green' || batchStatus === 'safe' || batchStatus === 'valid';

    return (
        <>
            <tr className="group hover:bg-[var(--accent)]/5 transition-all">
                <td className="py-3.5 px-4">
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
                </td>

                <td className="py-3.5 px-4 text-center">
                    <StatusBadge status={batch.status} size="md" />
                </td>

                <td className="py-3.5 px-4 text-center">
                    <span className="text-[12px] font-bold flex items-center justify-center gap-1.5 text-[var(--foreground)]">
                        <Calendar size={11} className="opacity-50" />
                        {expiryDate}
                    </span>
                </td>

                <td className="py-3.5 px-4 text-center">
                    {discountType && (
                        <span
                            className={PILL_BASE}
                            style={{
                                color: 'var(--muted-foreground)',
                                background: 'color-mix(in srgb, var(--muted-foreground) 6%, transparent)',
                                borderColor: 'color-mix(in srgb, var(--muted-foreground) 18%, transparent)',
                            }}
                        >
                            {t(`batch_row.${discountType}`)}
                        </span>
                    )}
                </td>

                <td className="py-3.5 px-4 text-center">
                    <div className="flex justify-center items-center gap-2">
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
                                            color: 'var(--status-approaching-text)',
                                            background: 'var(--status-approaching-bg)',
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
                                            color: 'var(--status-approaching-text)',
                                            background: 'var(--status-approaching-bg)',
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
                                                color: 'var(--primary)',
                                                background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
                                                borderColor: 'color-mix(in srgb, var(--primary) 20%, transparent)',
                                            }}
                                        >
                                            {t('batch_row.auto_hidden_badge')}
                                        </span>
                                    ) : (
                                        <span
                                            className={PILL_BASE}
                                            style={{
                                                color: 'var(--muted-foreground)',
                                                background: 'color-mix(in srgb, var(--muted-foreground) 6%, transparent)',
                                                borderColor: 'color-mix(in srgb, var(--muted-foreground) 18%, transparent)',
                                                opacity: 0.65,
                                            }}
                                        >
                                            {t('batch_row.auto_hide_disabled_badge')}
                                        </span>
                                    )
                                ) : !isApproaching && isSafe ? (
                                    <span className="text-[var(--muted-foreground)] text-sm font-medium select-none text-center">
                                        —
                                    </span>
                                ) : null}
                            </>
                        )}
                    </div>
                </td>
            </tr>

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