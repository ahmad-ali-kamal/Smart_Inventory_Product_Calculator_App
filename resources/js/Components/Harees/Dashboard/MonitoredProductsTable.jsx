/**
 * @file MonitoredProductsTable.jsx
 * @module Components/Harees/Dashboard
 *
 * @description
 * Renders the full "Monitored Products" panel: a header with a dropdown
 * filter and a table whose rows are composed from `ProductRow` components.
 *
 * Filtering is intentionally kept pure and co-located with this component
 * (`filterProducts`) so the logic stays close to where it is consumed.
 * The parent page (`Dashboard`) owns the `statusFilter` state so that the
 * selected filter value can be shared with other parts of the page if needed.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ListFilter } from 'lucide-react';
import DropdownFilter from '../../Common/Controls/DropdownFilter';
import Pagination, { ITEMS_PER_PAGE } from '../../Common/Controls/Pagination';
import ProductRow from './ProductRow';
import { useTranslation } from 'react-i18next';

/**
 * Available status filter options shown in the dropdown.
 * The `value` field is matched against batch statuses inside `filterProducts`.
 *
 * @type {Array<{ value: string, label: string }>}
 */
function getStatusFilters(t) {
    return [
        { value: 'all',         label: t('monitored_products_table.filter_all') },
        { value: 'expired',     label: t('monitored_products_table.filter_expired') },
        { value: 'approaching', label: t('monitored_products_table.filter_approaching') },
        { value: 'safe',        label: t('monitored_products_table.filter_safe') },
    ];
}

/**
 * filterProducts
 *
 * Pure helper that narrows a product list AND their nested batches to only
 * those batches whose status matches the requested filter.  Products that end
 * up with zero matching batches are excluded from the returned list entirely.
 *
 * Normalisation note: the API may return either semantic strings
 * ("expired", "approaching", "safe", "valid") or colour codes
 * ("red", "yellow", "green"), so both variants are handled here.
 *
 * @param {Array<Object>} products     - Full list of monitored products.
 * @param {string}        statusFilter - One of: 'all' | 'expired' | 'approaching' | 'safe'.
 * @returns {Array<Object>} Filtered subset of products, each with only the
 *                          batches that match the active filter.
 */
function filterProducts(products, statusFilter) {
    // 'all' is a no-op; return the full list immediately.
    if (statusFilter === 'all') return products;

    /** Returns true when a single batch's status satisfies the active filter. */
    function batchMatches(batch) {
        const s = batch.status?.toLowerCase();
        if (statusFilter === 'expired')     return s === 'red'    || s === 'expired';
        if (statusFilter === 'approaching') return s === 'yellow' || s === 'approaching';
        if (statusFilter === 'safe')        return s === 'green'  || s === 'safe' || s === 'valid';
        return false;
    }

    const result = [];

    for (const product of products) {
        // Keep only the batches that match the requested filter.
        const matchingBatches = (product.batches || []).filter(batchMatches);

        // Exclude the product entirely when none of its batches match.
        if (matchingBatches.length === 0) continue;

        // Shallow-clone the product and replace its batches array with the
        // filtered subset so the original data object is never mutated.
        result.push({ ...product, batches: matchingBatches });
    }

    return result;
}

/**
 * MonitoredProductsTable
 *
 * Displays a filterable table of monitored products.  Each row is delegated
 * to `ProductRow`, which handles the expandable batch sub-rows.
 *
 * @component
 *
 * @param {Object}    props
 * @param {Array}     props.products              - Array of product objects (with nested `batches`).
 * @param {boolean}   props.autoDiscount          - Whether auto-discount is globally enabled;
 *                                                  passed through to each ProductRow → BatchRow.
 * @param {number}    props.autoDiscountPercent   - Configured auto-discount percentage;
 *                                                  forwarded to BatchRow for badge display.
 * @param {boolean}   props.autoHide               - Whether auto-hide is enabled for expired products;
 *                                                  forwarded to BatchRow for expired badge display.
 * @param {string}    props.statusFilter          - Currently active filter value (controlled by parent).
 * @param {Function}  props.onFilterChange        - Callback invoked when the user picks a new filter.
 * @param {boolean}   props.needsSetup            - When true, hides the product list and shows a
 *                                                  setup-required placeholder instead.
 * @returns {JSX.Element}
 */
export default function MonitoredProductsTable({
    products,
    autoDiscount,
    autoDiscountPercent,
    autoHide,
    statusFilter,
    onFilterChange,
    needsSetup,
}) {
    const { t } = useTranslation('harees');
    // Apply the client-side filter before rendering rows.
    const filteredProducts = filterProducts(products, statusFilter);

    // ── Pagination ──────────────────────────────────────────────────────────
    const [page, setPage] = useState(1);
    useEffect(() => { setPage(1); }, [statusFilter]);
    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
    const safePage = Math.min(page, totalPages);
    const paginatedProducts = useMemo(
        () => filteredProducts.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE),
        [filteredProducts, safePage],
    );

    return (
        <div className="bg-[var(--card)] rounded-[20px] border border-[var(--border)] shadow-sm">

            {/* ── Panel header ───────────────────────────────────────────────
                Title + status dropdown side-by-side.
            ─────────────────────────────────────────────────────────────── */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--background)]/30">
                <div className="flex items-center gap-2">
                    <ListFilter className="w-4 h-4 text-[var(--primary)]" />
                    <h2 className="text-sm font-bold text-[var(--foreground)]">
                        {t('monitored_products_table.panel_title')}
                    </h2>
                </div>
                <DropdownFilter
                    options={getStatusFilters(t)}
                    value={statusFilter}
                    onChange={onFilterChange}
                    width="w-32"
                />
            </div>

            {/* ── Table ──────────────────────────────────────────────────────
                Three possible body states:
                  1. needsSetup  → prompt the user to complete settings
                  2. empty list  → no products match the active filter
                  3. normal list → one ProductRow per filtered product
            ─────────────────────────────────────────────────────────────── */}
            <div className="overflow-x-auto rounded-b-[20px]">
                <table className="w-full table-fixed border-collapse min-w-[700px]">
                    <thead className="bg-[var(--muted)]/50 border-b border-[var(--border)] text-start">
                        <tr className="text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] font-bold">
                            <th className="p-2 sm:p-4">{t('monitored_products_table.col_product')}</th>
                            <th className="p-2 sm:p-4 text-center">{t('monitored_products_table.col_status')}</th>
                            <th className="p-2 sm:p-4 text-center">{t('monitored_products_table.col_expiry_info')}</th>
                            <th className="p-2 sm:p-4 text-center">{t('monitored_products_table.discount_status')}</th>
                            <th className="p-2 sm:p-4 text-center">{t('monitored_products_table.col_actions')}</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-[var(--border)]">
                        {needsSetup ? (
                            /* State 1: merchant hasn't configured thresholds yet */
                            <tr>
                                <td colSpan="5" className="p-10 text-center text-sm text-[var(--muted-foreground)]">
                                    {t('monitored_products_table.empty_needs_setup')}
                                </td>
                            </tr>
                        ) : filteredProducts.length === 0 ? (
                            /* State 2: valid setup but the filter yields no results */
                            <tr>
                                <td colSpan="5" className="p-10 text-center text-sm text-[var(--muted-foreground)]">
                                    {t('monitored_products_table.empty_no_items')}
                                </td>
                            </tr>
                        ) : (
                            /* State 3: render one row per filtered product.
                               The composite key (`statusFilter-id`) causes React to fully
                               unmount and remount each ProductRow whenever the active filter
                               changes.  This guarantees the accordion's `showBatches` state
                               resets to `false` instantly — with no visible close animation —
                               instead of animating shut after the filter switch. */
                            paginatedProducts.map(product => (
                                <ProductRow
                                    key={`${statusFilter}-${product.id}`}
                                    product={product}
                                    autoDiscount={autoDiscount}
                                    autoDiscountPercent={autoDiscountPercent}
                                    autoHide={autoHide}
                                    statusFilter={statusFilter}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
    );
}