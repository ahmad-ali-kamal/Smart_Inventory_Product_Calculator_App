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

// ── i18n strings ──────────────────────────────────────────────────────────────
// Move to your translation JSON and replace with useTranslation() when ready.
const t = {
    col_product:       "Product",
    col_category:      "Category",
    col_unit_coverage: "Unit Coverage",
    col_waste:         "Waste %",
    col_status:        "Status",
    col_active:        "Active",
    col_preview:       "Preview",
};

// ── Grid column definitions ───────────────────────────────────────────────────
// Must stay in sync with the matching constants in ProductRow.jsx.
// First column (220 px) is fixed-width for the product avatar + name;
// remaining columns share available space equally via `1fr`.
const COLS_WITH_PREVIEW    = "grid-cols-[220px_1fr_1fr_1fr_1fr_1fr_1fr]";
const COLS_WITHOUT_PREVIEW = "grid-cols-[220px_1fr_1fr_1fr_1fr_1fr]";

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
    return (
        <div className="w-full">

            {/* ── Column header ──────────────────────────────────────────────── *
             *  Hidden on mobile (md:grid) — rows render as stacked cards below  *
             *  the md breakpoint via ProductRow's own responsive styles.         *
             * ─────────────────────────────────────────────────────────────────  */}
            <div
                className={`
                    hidden md:grid gap-4 px-8 py-3
                    bg-[var(--muted)]/40 border-b border-[var(--border)]
                    ${showPreview ? COLS_WITH_PREVIEW : COLS_WITHOUT_PREVIEW}
                `}
            >
                <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-left">
                    {t.col_product}
                </span>
                <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-center">
                    {t.col_category}
                </span>
                <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-center">
                    {t.col_unit_coverage}
                </span>
                {/* Waste % column — always visible regardless of showPreview */}
                <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-center">
                    {t.col_waste}
                </span>
                <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-center">
                    {t.col_status}
                </span>
                <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-center">
                    {t.col_active}
                </span>
                {/* Preview column — Dashboard only */}
                {showPreview && (
                    <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-center">
                        {t.col_preview}
                    </span>
                )}
            </div>

            {/* ── Row container ─────────────────────────────────────────────── *
             *  Thin dividers between rows are handled by Tailwind's            *
             *  divide-y utility; no margin/padding is added to children.       *
             * ─────────────────────────────────────────────────────────────────  */}
            <div className="divide-y divide-[var(--border)]">
                {children}
            </div>

        </div>
    );
}