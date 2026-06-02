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

import React, { useState } from 'react';
import { Eye, EyeOff, Pencil, PlusCircle } from 'lucide-react';
import RowActionButton from '../../Common/RowActionButton';
import ProductAvatar from '../../Common/UI/ProductAvatar';
import { normalizeStatus, getStatusStyle } from '../StatusBadge';
import { useTranslation } from 'react-i18next';

/**
 * Shared Tailwind classes for the status / category pill badges.
 * Defined as a constant to avoid repeating the same long string in two places
 * (product row + each batch sub-row).
 *
 * @type {string}
 */
const PILL =
    'inline-flex items-center justify-center w-[110px] h-[26px] rounded-full text-[9px] font-black uppercase border transition-all duration-200';

/**
 * InventoryProductRow
 *
 * A `<tr>` pair: the primary product row and a hidden accordion `<tr>` that
 * expands to show individual batch detail rows when toggled.
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
 * @param {Array}    [props.product.batches]          - Array of batch objects for this product.
 * @param {Function} props.onExpiry                   - Called with the full product object when
 *                                                     the merchant clicks Add / Edit Expiry Date.
 * @returns {JSX.Element} A React fragment containing two `<tr>` elements.
 */
export default function InventoryProductRow({ product, onExpiry }) {
    const { t } = useTranslation('harees');

    /**
     * getStatusConfig
     *
     * Maps a normalised status label to its display config (inline style + label).
     * Delegates colour token resolution to `getStatusStyle` from StatusBadge so
     * the two components always stay visually in sync.
     *
     * @param {'Expired'|'Approaching'|'Safe'} normalizedStatus
     * @returns {{ style: Object, label: string }}
     */
    const getStatusConfig = (normalizedStatus) => {
        const config = {
            Expired:     { style: getStatusStyle('Expired'),     label: t('status_badge.expired') },
            Approaching: { style: getStatusStyle('Approaching'), label: t('status_badge.approaching') },
            Safe:        { style: getStatusStyle('Safe'),        label: t('status_badge.safe') },
        };
        // Default to Safe for any unmapped value
        return config[normalizedStatus] || config.Safe;
    };

    /**
     * Controls accordion visibility for the batch detail sub-rows.
     * `false` = collapsed (default), `true` = expanded.
     *
     * @type {[boolean, Function]}
     */
    const [showBatches, setShowBatches] = useState(false);

    // ── Normalise batch data ──────────────────────────────────────────────────
    // Map raw API batch objects to a lean, consistent shape so the render
    // section never needs to handle multiple field-name variants.
    const batches = (product.batches || []).map(b => ({
        id:         b.id,
        code:       b.batch_code || b.code || '-',
        qty:        b.quantity ?? b.qty ?? 0,
        expiryDate: b.expiry_date || b.expiryDate || '-',
        status:     b.status || 'green',
    }));

    const hasBatches  = batches.length > 0;
    const totalQty    = product.quantity ?? product.dbQty ?? 0;

    // Sum of quantities across all recorded batches (may differ from totalQty
    // when not all stock has been assigned to a batch yet).
    const assignedQty = batches.reduce((sum, b) => sum + (parseInt(b.qty) || 0), 0);

    // ── Worst-status derivation ───────────────────────────────────────────────
    // Reduce all batch statuses to the single most severe one so the product
    // row always reflects the most urgent situation in its batch set.
    const worstStatus = (() => {
        if (!hasBatches) return 'Safe';
        const priorities = { red: 3, yellow: 2, green: 1 };
        const worst = batches.reduce((acc, b) => {
            const p = priorities[b.status?.toLowerCase()] || 1;
            return p > (priorities[acc] || 1) ? b.status : acc;
        }, 'green');
        return normalizeStatus(worst);
    })();

    return (
        <>
            {/* ── Primary product row ──────────────────────────────────────── */}
            <tr className="border-b border-[var(--border)] hover:bg-[var(--accent)]/5 transition-colors group">

                {/* Col 1: Product avatar + name + Salla ID */}
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

                {/* Col 2: Category label */}
                <td className="p-4 text-center text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest">
                    {product.category}
                </td>

                {/* Col 3: Worst-status pill derived from all batch statuses */}
                <td className="p-4 text-center">
                    {(() => {
                        const config = getStatusConfig(worstStatus);
                        return <span className={PILL} style={config.style}>{config.label}</span>;
                    })()}
                </td>

                {/* Col 4: Total stock / assigned stock
                    Format: "totalQty / assignedQty" when batches exist, else just "totalQty".
                    The slash and assignedQty are conditionally rendered. */}
                <td className="p-4 text-center">
                    <span className="px-3 py-0.5 rounded-full bg-[var(--accent)] text-[var(--primary)] text-[11px] font-bold border tabular-nums">
                        {totalQty}
                        {hasBatches && (
                            <><span className="text-[var(--primary)]/50 mx-0.5">/</span>{assignedQty}</>
                        )}
                    </span>
                </td>

                {/* Col 5: Batch accordion toggle
                    Shows a RowActionButton with the batch count when batches exist;
                    falls back to a dash when no batches have been recorded. */}
                <td className="p-4 text-center">
                    {hasBatches ? (
                        <RowActionButton
                            onClick={() => setShowBatches(v => !v)}
                            icon={showBatches ? <EyeOff size={12} /> : <Eye size={12} />}
                        >
                            {batches.length}{' '}
                            {batches.length === 1
                                ? t('inventory_product_row.btn_batch_singular')
                                : t('inventory_product_row.btn_batch_plural')}
                        </RowActionButton>
                    ) : (
                        <span className="text-[11px] text-[var(--muted-foreground)]">
                            {t('inventory_product_row.btn_no_batches')}
                        </span>
                    )}
                </td>

                {/* Col 6: Add / Edit expiry action — icon and label differ based on hasBatches */}
                <td className="p-4 text-center">
                    <RowActionButton
                        onClick={() => onExpiry(product)}
                        icon={hasBatches ? <Pencil size={11} /> : <PlusCircle size={11} />}
                    >
                        {hasBatches
                            ? t('inventory_product_row.btn_edit_expiry')
                            : t('inventory_product_row.btn_add_expiry')}
                    </RowActionButton>
                </td>
            </tr>

            {/* ── Animated batch sub-rows accordion ───────────────────────────
                CSS grid-rows trick (0fr → 1fr) animates height without JS.
                `overflow-hidden` clips content while the height transitions.
                Each sub-row mirrors the 6-column grid template from WIDTHS.
            ─────────────────────────────────────────────────────────────── */}
            <tr>
                <td colSpan={6} className="p-0 border-none">
                    <div className={`grid transition-all duration-500 ease-in-out ${
                        showBatches ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}>
                        <div className="overflow-hidden">
                            {batches.map((batch) => {
                                const status = normalizeStatus(batch.status);
                                const config = getStatusConfig(status);
                                return (
                                    <div
                                        key={batch.id}
                                        className="grid bg-[var(--accent)]/5 border-b border-[var(--border)]"
                                        style={{ gridTemplateColumns: '16% 16% 16% 16% 16% 20%' }}
                                    >
                                        {/* Batch code — indented to align under the product name */}
                                        <div className="pl-10 py-3.5 text-[12px] text-[var(--muted-foreground)]">
                                            <span className="font-bold text-[var(--foreground)]">
                                                {t('inventory_product_row.batch_label')}
                                            </span>{' '}
                                            {batch.code}
                                        </div>

                                        {/* Category — repeated from parent for visual alignment */}
                                        <div className="flex items-center justify-center text-[11px] font-black text-[var(--muted-foreground)] uppercase tracking-widest">
                                            {product.category}
                                        </div>

                                        {/* Batch-level status pill */}
                                        <div className="flex items-center justify-center">
                                            <span className={PILL} style={config.style}>{config.label}</span>
                                        </div>

                                        {/* Batch quantity */}
                                        <div className="flex items-center justify-center text-[12px]">
                                            {batch.qty}
                                        </div>

                                        {/* Batch expiry date */}
                                        <div className="flex items-center justify-center text-[12px] text-[var(--muted-foreground)]">
                                            {batch.expiryDate}
                                        </div>

                                        {/* Action column — empty for sub-rows */}
                                        <div />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </td>
            </tr>
        </>
    );
}