/**
 * @file ProductRow.jsx
 * @module Components/Harees/Dashboard
 *
 * @description
 * Renders a single product row inside the MonitoredProductsTable.
 * The row is interactive: clicking "View Batches" toggles an animated
 * accordion beneath the product row that mounts the BatchRow component.
 *
 * Layout (4-column table):
 *   [Product] [Status] [Expiry Info – batch count summary] [Actions]
 *
 * The Expiry Info cell at the product level shows a batch count chip
 * (e.g. "3 Batches") so the row is never visually empty while the
 * accordion is collapsed.  Per-batch expiry dates appear inside the
 * expanded BatchRow accordion.
 */

// ─── i18n strings ────────────────────────────────────────────────────────────
const t = {
    btn_view_batches:  'View Batches',
    btn_hide_batches:  'Hide Batches',
    /** @param {number} n */
    batch_count: (n) => `${n} ${n === 1 ? 'Batch' : 'Batches'}`,
};
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import RowActionButton from '../../Common/RowActionButton';
import BatchRow from './BatchRow';
import StatusBadge from '../StatusBadge';
import ProductAvatar from '../../Common/UI/ProductAvatar';

/**
 * ProductRow
 *
 * A table-row pair: the primary product row and a hidden accordion row that
 * reveals batch-level details when the merchant clicks "View Batches".
 *
 * @component
 *
 * @param {Object}  props
 * @param {Object}  props.product               - Product data object.
 * @param {number}  props.product.id            - Unique product identifier.
 * @param {string}  props.product.name          - Display name of the product.
 * @param {string}  [props.product.image_url]   - Remote image URL (preferred).
 * @param {string}  [props.product.image]       - Fallback image path.
 * @param {string}  props.product.salla_product_id - External Salla platform ID shown as a sub-label.
 * @param {string}  props.product.status        - Aggregate product status ("red"|"yellow"|"green"|…).
 * @param {Array}   props.product.batches       - Array of batch objects belonging to this product.
 * @param {boolean} props.autoDiscount          - Forwarded to BatchRow to conditionally render
 *                                               the "Auto-Discount Enabled" badge vs. the manual
 *                                               discount button.
 * @param {number}  props.autoDiscountPercent   - Forwarded to BatchRow so the auto-discount badge
 *                                               can display the configured percentage.
 * @param {boolean}  props.autoHide               - Forwarded to BatchRow to show the correct
 *                                               badge for expired batches (auto-hidden vs disabled).
 * @param {string}  props.statusFilter          - The active filter value from the parent table
 *                                               ('all' | 'expired' | 'approaching' | 'safe').
 *                                               When not 'all', the product header row is hidden
 *                                               and the batch accordion is expanded automatically
 *                                               so only the matching batches are visible.
 * @returns {JSX.Element} A React fragment containing two <tr> elements.
 */
export default function ProductRow({ product, autoDiscount, autoDiscountPercent, autoHide, statusFilter }) {
    /**
     * True when the user has picked a specific status filter (anything other
     * than 'all').  In this mode the product header row is hidden and the
     * batch accordion is always expanded so only the matching batches show.
     *
     * @type {boolean}
     */
    const isFiltering = statusFilter !== 'all';

    /**
     * Controls accordion visibility.
     * `false` = batches hidden (default), `true` = batches expanded.
     * Ignored when `isFiltering` is true — the accordion is always open then.
     *
     * @type {[boolean, Function]}
     */
    const [showBatches, setShowBatches] = useState(false);

    /**
     * Reset the manual accordion toggle every time the active filter changes.
     * Without this, a row that was expanded under one filter would remain
     * expanded (or half-open) when the user switches to a different filter,
     * producing inconsistent open/closed states across filter transitions.
     */
    useEffect(() => {
        setShowBatches(false);
    }, [statusFilter]);

    /**
     * The effective expanded state of the accordion.
     * Forced to `true` whenever a specific filter is active so the matching
     * batches are immediately visible without a manual "View Batches" click.
     *
     * @type {boolean}
     */
    const batchesOpen = isFiltering || showBatches;

    return (
        <>
            {/* ── Primary product row ──────────────────────────────────────── 
                Hidden when a specific status filter is active; in that mode
                only the matching batch rows are shown (no product header).
            ─────────────────────────────────────────────────────────────── */}
            {!isFiltering && (
            <tr className="group hover:bg-[var(--accent)]/5 transition-all border-b border-[var(--border)]">

                {/* Cell 1: Product avatar + name + Salla ID */}
                <td className="py-3.5 px-4 w-[25%]">
                    <div className="flex items-center gap-2.5">
                        <ProductAvatar
                            src={product.image_url || product.image}
                            name={product.name}
                            size={40}
                        />
                        <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-[var(--foreground)] text-[12px] leading-tight">
                                {product.name}
                            </span>
                            {/* Monospaced external ID for quick scanning */}
                            <span className="text-[10px] text-[var(--muted-foreground)] font-mono opacity-80">
                                {product.salla_product_id}
                            </span>
                        </div>
                    </div>
                </td>

                {/* Cell 2: Aggregate product status badge */}
                <td className="py-3.5 px-4 text-center w-[20%]">
                    <StatusBadge status={product.status} size="md" />
                </td>

                {/* Cell 3: Expiry info — batch count at the product level (plain text, no badge).
                    Shows how many batches belong to this product so the cell
                    is never empty while the accordion is collapsed.
                    Per-batch expiry dates appear inside the expanded accordion. */}
                <td className="py-3.5 px-4 text-center w-[30%]">
                    {(() => {
                        const count = (product.batches || []).length;
                        if (count === 0) return null;
                        return (
                            <span className="text-[11px] font-bold text-[var(--muted-foreground)]">
                                {t.batch_count(count)}
                            </span>
                        );
                    })()}
                </td>

                {/* Cell 4: Toggle button to show/hide the batch accordion */}
                <td className="py-3.5 px-4 w-[25%]">
                    <div className="flex justify-center">
                        <RowActionButton
                            onClick={() => setShowBatches(!showBatches)}
                            variant={showBatches ? 'active' : 'default'}
                            icon={
                                /* Rotate the Eye icon 180° when expanded to hint at collapse */
                                <Eye
                                    size={12}
                                    className={`transition-transform duration-300 ${showBatches ? 'rotate-180' : ''}`}
                                />
                            }
                            className="w-[120px] h-[32px]"
                        >
                            {showBatches ? t.btn_hide_batches : t.btn_view_batches}
                        </RowActionButton>
                    </div>
                </td>
            </tr>
            )}

            {/* ── Accordion / expandable batch row ────────────────────────────
                Uses CSS grid-rows transition (0fr → 1fr) for a smooth
                height animation without JavaScript layout calculations.
                `overflow-hidden` on the inner div is required for the
                grid-rows trick to clip the content while animating.
                When `isFiltering` is true, `batchesOpen` is forced to true
                so batches render immediately with no animation delay.
            ─────────────────────────────────────────────────────────────── */}
            <tr>
                <td colSpan="4" className="p-0 border-none">
                    <div className={`grid transition-all duration-500 ease-in-out ${
                        batchesOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}>
                        <div className="overflow-hidden">
                            <div className="bg-[var(--background)]/30">
                                <BatchRow
                                    product={product}
                                    autoDiscount={autoDiscount}
                                    autoDiscountPercent={autoDiscountPercent}
                                    autoHide={autoHide}
                                />
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        </>
    );
}