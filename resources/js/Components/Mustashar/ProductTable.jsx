/**
 * @file ProductTable.jsx
 * @module Components/Mustashar
 *
 * Pure layout shell for the Mustashar product list. Renders a sticky
 * column-header row and a bordered row container that accepts `children`
 * (individual `ProductRow` instances).
 *
 * Design philosophy — single responsibility:
 *   This component intentionally owns **no data, no state, and no empty-state
 *   UI**. Those responsibilities belong to each consumer:
 *
 *   - **Dashboard**  — animated empty state via Framer Motion `AnimatePresence`.
 *   - **Products**   — static empty message; no animation needed.
 *
 * Grid layout:
 *   The Tailwind grid class is chosen at render time based on `showPreview`:
 *   | showPreview | Columns                                              |
 *   |-------------|------------------------------------------------------|
 *   | false       | Product · Category · Unit Coverage · Waste % · Status · Active (6 cols) |
 *   | true        | + Preview (7 cols)                                   |
 *
 * Used by: Dashboard, Products
 */

import { useTranslation } from 'react-i18next';
// ── Grid column definitions ───────────────────────────────────────────────────
// Must stay in sync with the matching constants in ProductRow.jsx.
// First column (220 px) is fixed-width for the product avatar + name;
// remaining columns share available space equally via `1fr`.
const COLS_WITH_PREVIEW    = "grid-cols-[minmax(140px,220px)_1fr_1fr_1fr_1fr_1fr_1fr]";
const COLS_WITHOUT_PREVIEW = "grid-cols-[minmax(140px,220px)_1fr_1fr_1fr_1fr_1fr]";

/**
 * ProductTable
 *
 * @param {object}            props
 * @param {React.ReactNode}   props.children     - One or more `ProductRow` elements.
 * @param {boolean}           [props.showPreview=false] - When true, renders the
 *                                                        "Preview" column (Dashboard only).
 *
 * @returns {JSX.Element}
 */
export default function ProductTable({ children, showPreview = false }) {
     const { t } = useTranslation('mustashar');
    return (
        <div className="w-full overflow-x-auto">
            <div className="min-w-[650px]">

            {/* ── Column header ──────────────────────────────────────────────── */}
            <div
                className={`
                    grid gap-2 lg:gap-4 px-4 lg:px-8 py-3
                    bg-[var(--muted)]/40 border-b border-[var(--border)]
                    ${showPreview ? COLS_WITH_PREVIEW : COLS_WITHOUT_PREVIEW}
                `}
            >
                <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest ltr:text-left rtl:text-right">
                {t('product_table.col_product')}
                </span>
                <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-center">
                  {t('product_table.col_category')}
                </span>
                <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-center">
                    {t('product_table.col_unit_coverage')}
                </span>
                {/* Waste % column — always visible regardless of showPreview */}
                <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-center">
                    {t('product_table.col_waste')}
                </span>
                <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-center">
                    {t('product_table.col_status')}
                </span>
                <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-center">
                    {t('product_table.col_active')}
                </span>
                {/* Preview column — Dashboard only */}
                {showPreview && (
                    <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-center">
                        {t('product_table.col_preview')}
                    </span>
                )}
            </div>

            {/* ── Row container ─────────────────────────────────────────────── */}
            <div className="divide-y divide-[var(--border)]">
                {children}
            </div>

            </div>
        </div>
    );
}