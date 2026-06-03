/**
 * @file InventoryTable.jsx
 * @module Components/Harees/Products
 *
 * @description
 * Presentational table wrapper for the Harees Products page.
 * Renders a styled, responsive table with a fixed set of column headers and
 * delegates each data row to `InventoryProductRow`.
 *
 * Column layout (6 columns):
 *   Product | Category | Status | Qty | Expiry Info | Action
 *
 * The column widths are defined in `WIDTHS` and applied inline so the
 * batch sub-rows inside `InventoryProductRow` can mirror the same proportions
 * via a matching CSS grid template.
 */

import Card from "../../Common/UI/Card";
import InventoryProductRow from "./InventoryProductRow";
import { useTranslation } from 'react-i18next';

/**
 * Table column header labels — order must match `WIDTHS`.
 * @type {string[]}
 */
const HEADER_KEYS = [
    'inventory_table.col_product',
    'inventory_table.col_category',
    'inventory_table.col_status',
    'inventory_table.col_qty',
    'inventory_table.col_expiry_info',
    'inventory_table.col_action',
];

/**
 * Column width percentages — order must match `HEADERS`.
 * Also used as the CSS grid template in the batch sub-rows inside
 * `InventoryProductRow` to keep columns visually aligned.
 *
 * @type {string[]}
 */
const WIDTHS = ["16%", "16%", "16%", "16%", "16%", "20%"];

/**
 * InventoryTable
 *
 * Renders a scrollable product table inside a Card shell.
 * Shows an empty-state row when `products` is empty.
 *
 * @component
 *
 * @param {Object}    props
 * @param {Array}     props.products   - Filtered array of product objects to display.
 *                                      Each object is passed directly to `InventoryProductRow`.
 * @param {Function}  props.onExpiry   - Callback invoked when the merchant clicks
 *                                      "Add / Edit Expiry Date" on a row.
 *                                      Receives the full product object as its argument.
 * @returns {JSX.Element}
 */
export default function InventoryTable({ products, onExpiry }) {
    const { t } = useTranslation('harees');

    return (
        <Card>
            {/* overflow-x-auto + min-w ensures the table is horizontally scrollable
                on narrow viewports without breaking the column proportions. */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[700px]">

                    {/* ── Column headers ──────────────────────────────────────── */}
                    <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--muted)]/20">
                            {HEADER_KEYS.map((k, i) => (
                                <th
                                    key={k}
                                    style={{ width: WIDTHS[i] }}
                                    className={`p-4 text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-wider ${
                                        i === 0 ? 'text-left' : 'text-center'
                                    }`}
                                >
                                    {t(k)}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    {/* ── Table body ───────────────────────────────────────────── */}
                    <tbody>
                        {products.length > 0 ? (
                            // Render one ProductRow (+ optional animated batch sub-rows) per product
                            products.map(product => (
                                <InventoryProductRow
                                    key={product.id}
                                    product={product}
                                    onExpiry={onExpiry}
                                />
                            ))
                        ) : (
                            // Empty state: no products match the current search / filter
                            <tr>
                                <td colSpan={6} className="py-16 text-center text-sm text-[var(--muted-foreground)]">
                                    {t('inventory_table.empty_message')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}