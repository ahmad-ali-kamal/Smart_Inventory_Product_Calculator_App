/**
 * @file InventoryProductRow.jsx
 * @module Components/Harees/Products
 *
 * @description
 * Renders a single product row in the InventoryTable, plus an animated
 * accordion that reveals per-batch detail rows when toggled.
 *
 * Row layout (6 columns matching InventoryTable's WIDTHS):
 *   [Product] [Category] [Status] [Qty] [Expiry Info] [Action]
 *
 * Status derivation:
 *   The displayed status reflects the *worst* batch status for the product
 *   (red > yellow > green) so a product with even one expired batch is
 *   immediately flagged at the product level.
 *
 * Quantity display:
 *   Shows "totalQty / assignedQty" when batches exist, or just "totalQty"
 *   when no batches have been recorded yet.
 *
 * Accordion:
 *   Uses the same CSS grid-rows trick as ProductRow.jsx to animate the
 *   batch sub-rows open/closed without layout thrashing.
 */

import React from 'react';
import { Pencil, PlusCircle } from 'lucide-react';
import RowActionButton from '../../Common/RowActionButton';
import ProductAvatar from '../../Common/UI/ProductAvatar';
import { normalizeStatus, getStatusStyle } from '../StatusBadge';
import { useTranslation } from 'react-i18next';

/**
 * Shared Tailwind classes for the status / category pill badges.
 *
 * @type {string}
 */
const PILL =
    'inline-flex items-center justify-center px-2.5 md:px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase border transition-all duration-200 min-w-[85px]';

/**
 * InventoryProductRow
 *
 * A single product row with inline batch details (no accordion).
 * Since each product has at most one batch, the batch sub-row accordion
 * is removed and batch info is rendered inline.
 *
 * @component
 *
 * @param {Object}   props
 * @param {Object}   props.product                    - Product data object.
 * @param {number}   props.product.id                 - Unique product identifier.
 * @param {string}   props.product.name               - Display name.
 * @param {string}   [props.product.image_url]        - Preferred image URL.
 * @param {string}   [props.product.image]            - Fallback image path.
 * @param {string}   props.product.salla_product_id   - External Salla ID shown as sub-label.
 * @param {string}   [props.product.category]         - Product category label.
 * @param {number}   [props.product.quantity]         - Total stock from Salla (preferred field).
 * @param {number}   [props.product.dbQty]            - Fallback total stock field.
 * @param {Array}    [props.product.batches]          - Array of batch objects (at most one).
 * @param {Function} props.onExpiry                   - Called with the full product object when
 *                                                     the merchant clicks Add / Edit Expiry Date.
 * @returns {JSX.Element}
 */
export default function InventoryProductRow({ product, onExpiry }) {
    const { t } = useTranslation('harees');

    const getStatusConfig = (normalizedStatus) => {
        const config = {
            Expired:     { style: getStatusStyle('Expired'),     label: t('status_badge.expired') },
            Approaching: { style: getStatusStyle('Approaching'), label: t('status_badge.approaching') },
            Safe:        { style: getStatusStyle('Safe'),        label: t('status_badge.safe') },
        };
        return config[normalizedStatus] || config.Safe;
    };

    const batch = (product.batches || [])[0];
    const hasBatch = !!batch;
    const totalQty = product.quantity ?? product.dbQty ?? 0;
    const batchStatus = hasBatch ? normalizeStatus(batch.status) : 'Safe';
    const statusConfig = getStatusConfig(batchStatus);

    return (
        <tr className="border-b border-[var(--border)] hover:bg-[var(--accent)]/5 transition-colors group">
            <td className="p-4">
                <div className="flex items-center gap-3">
                    <ProductAvatar
                        src={product.image_url || product.image}
                        name={product.name}
                        size={40}
                        radius="rounded-lg"
                    />
                    <div>
                        <div className="text-sm font-bold">{product.name}</div>
                        <div className="text-[10px] text-[var(--muted-foreground)]/70">
                            {product.salla_product_id}
                        </div>
                    </div>
                </div>
            </td>

            <td className="p-4 text-center text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest">
                {product.category}
            </td>

            <td className="p-4 text-center">
                <span className={PILL} style={statusConfig.style}>{statusConfig.label}</span>
            </td>

            <td className="p-4 text-center">
                <span className="px-3 py-0.5 rounded-full bg-[var(--accent)] text-[var(--primary)] text-[11px] font-bold border tabular-nums">
                    {totalQty}
                </span>
            </td>

            <td className="p-4 text-center">
                {hasBatch ? (
                    <span className="text-[11px] text-[var(--foreground)] font-bold tabular-nums">
                        {batch.expiry_date || batch.expiryDate || '-'}
                    </span>
                ) : (
                    <span className="text-[11px] text-[var(--muted-foreground)]">
                        {t('inventory_product_row.btn_no_batches')}
                    </span>
                )}
            </td>

            <td className="p-4 text-center">
                <RowActionButton
                    onClick={() => onExpiry(product)}
                    icon={hasBatch ? <Pencil size={11} /> : <PlusCircle size={11} />}
                >
                    {hasBatch
                        ? t('inventory_product_row.btn_edit_expiry')
                        : t('inventory_product_row.btn_add_expiry')}
                </RowActionButton>
            </td>
        </tr>
    );
}