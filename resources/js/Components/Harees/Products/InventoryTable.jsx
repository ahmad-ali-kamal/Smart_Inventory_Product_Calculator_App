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

// ─── i18n strings ─────────────────────────────────────────────────────────────
// Move these values to your JSON translation file and replace this object with
// a `useTranslation` call (or equivalent) when you are ready.
const t = {
    col_product:     'Product',
    col_category:    'Category',
    col_status:      'Status',
    col_qty:         'Qty',
    col_expiry_info: 'Expiry Info',
    col_action:      'Action',
    empty_message:   'No products found.',
};
// ─────────────────────────────────────────────────────────────────────────────

import Card from "../../Common/UI/Card";
import InventoryProductRow from "./InventoryProductRow";

/**
 * Table column header labels — order must match `WIDTHS`.
 * @type {string[]}
 */
const HEADERS = [
    t.col_product,
    t.col_category,
    t.col_status,
    t.col_qty,
    t.col_expiry_info,
    t.col_action,
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
    return (
        <Card>
            {/* overflow-x-auto + min-w ensures the table is horizontally scrollable
                on narrow viewports without breaking the column proportions. */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[700px]">

                    {/* ── Column headers ──────────────────────────────────────── */}
                    <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--muted)]/20">
                            {HEADERS.map((h, i) => (
                                <th
                                    key={h}
                                    style={{ width: WIDTHS[i] }}
                                    className={`p-4 text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-wider ${
                                        i === 0 ? 'text-left' : 'text-center'
                                    }`}
                                >
                                    {h}
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
                                    {t.empty_message}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}