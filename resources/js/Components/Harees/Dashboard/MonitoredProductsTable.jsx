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

// ─── i18n strings ────────────────────────────────────────────────────────────
// Move these values to your JSON translation file and replace this object with
// a `useTranslation` call (or equivalent) when you are ready.
const t = {
    panel_title:                 'Monitored Products',
    filter_all:                  'All',
    filter_expired:              'Expired',
    filter_approaching:          'Approaching',
    filter_safe:                 'Safe',
    col_product:                 'Product',
    col_status:                  'Status',
    col_expiry_info:             'Expiry Info',
    col_actions:                 'Actions',
    empty_needs_setup:           'Configure your settings to start monitoring products.',
    empty_no_items:              'No monitored items found.',
};
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { ListFilter } from 'lucide-react';
import DropdownFilter from '../../Common/Controls/DropdownFilter';
import ProductRow from './ProductRow';

/**
 * Available status filter options shown in the dropdown.
 * The `value` field is matched against batch statuses inside `filterProducts`.
 *
 * @type {Array<{ value: string, label: string }>}
 */
const STATUS_FILTERS = [
    { value: 'all',         label: t.filter_all         },
    { value: 'expired',     label: t.filter_expired     },
    { value: 'approaching', label: t.filter_approaching },
    { value: 'safe',        label: t.filter_safe        },
];

/**
 * filterProducts
 *
 * Pure helper that narrows a product list to only those containing at least
 * one batch whose status matches the requested filter.
 *
 * Normalisation note: the API may return either semantic strings
 * ("expired", "approaching", "safe", "valid") or colour codes
 * ("red", "yellow", "green"), so both variants are handled here.
 *
 * @param {Array<Object>} products     - Full list of monitored products.
 * @param {string}        statusFilter - One of: 'all' | 'expired' | 'approaching' | 'safe'.
 * @returns {Array<Object>} Filtered subset of products.
 */
function filterProducts(products, statusFilter) {
    // 'all' is a no-op; return the full list immediately.
    if (statusFilter === 'all') return products;

    return products.filter(product =>
        // Keep the product if ANY of its batches match the requested filter.
        (product.batches || []).some(batch => {
            const s = batch.status?.toLowerCase();
            if (statusFilter === 'expired')     return s === 'red'    || s === 'expired';
            if (statusFilter === 'approaching') return s === 'yellow' || s === 'approaching';
            if (statusFilter === 'safe')        return s === 'green'  || s === 'safe' || s === 'valid';
            return false;
        })
    );
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
 * @param {Array}     props.products        - Array of product objects (with nested `batches`).
 * @param {boolean}   props.autoDiscount    - Whether auto-discount is globally enabled;
 *                                            passed through to each ProductRow → BatchRow.
 * @param {string}    props.statusFilter    - Currently active filter value (controlled by parent).
 * @param {Function}  props.onFilterChange  - Callback invoked when the user picks a new filter.
 * @param {boolean}   props.needsSetup      - When true, hides the product list and shows a
 *                                            setup-required placeholder instead.
 * @returns {JSX.Element}
 */
export default function MonitoredProductsTable({
    products,
    autoDiscount,
    statusFilter,
    onFilterChange,
    needsSetup,
}) {
    // Apply the client-side filter before rendering rows.
    const filteredProducts = filterProducts(products, statusFilter);

    return (
        <div className="bg-[var(--card)] rounded-[20px] border border-[var(--border)] shadow-sm">

            {/* ── Panel header ───────────────────────────────────────────────
                Title + status dropdown side-by-side.
            ─────────────────────────────────────────────────────────────── */}
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--background)]/30">
                <div className="flex items-center gap-2">
                    <ListFilter className="w-4 h-4 text-[var(--primary)]" />
                    <h2 className="text-sm font-bold text-[var(--foreground)]">
                        {t.panel_title}
                    </h2>
                </div>
                <DropdownFilter
                    options={STATUS_FILTERS}
                    value={statusFilter}
                    onChange={onFilterChange}
                    width="w-[130px]"
                />
            </div>

            {/* ── Table ──────────────────────────────────────────────────────
                Three possible body states:
                  1. needsSetup  → prompt the user to complete settings
                  2. empty list  → no products match the active filter
                  3. normal list → one ProductRow per filtered product
            ─────────────────────────────────────────────────────────────── */}
            <div className="overflow-hidden rounded-b-[20px]">
                <table className="w-full border-collapse">
                    <thead className="bg-[var(--muted)]/50 border-b border-[var(--border)] text-left">
                        <tr className="text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] font-bold">
                            <th className="p-4 w-[25%]">{t.col_product}</th>
                            <th className="p-4 text-center w-[20%]">{t.col_status}</th>
                            <th className="p-4 text-center w-[30%]">{t.col_expiry_info}</th>
                            <th className="p-4 text-center w-[25%]">{t.col_actions}</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-[var(--border)]">
                        {needsSetup ? (
                            /* State 1: merchant hasn't configured thresholds yet */
                            <tr>
                                <td colSpan="4" className="p-10 text-center text-sm text-[var(--muted-foreground)]">
                                    {t.empty_needs_setup}
                                </td>
                            </tr>
                        ) : filteredProducts.length === 0 ? (
                            /* State 2: valid setup but the filter yields no results */
                            <tr>
                                <td colSpan="4" className="p-10 text-center text-sm text-[var(--muted-foreground)]">
                                    {t.empty_no_items}
                                </td>
                            </tr>
                        ) : (
                            /* State 3: render one row per filtered product */
                            filteredProducts.map(product => (
                                <ProductRow
                                    key={product.id}
                                    product={product}
                                    autoDiscount={autoDiscount}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}