/**
 * @file ProductTable.jsx
 * @module Components/Mustashar
 *
 * Pure layout shell for the product list. Renders a sticky column-header row
 * and a bordered row container. It intentionally owns no data, no state, and
 * no empty-state UI — those responsibilities belong to each consumer:
 *
 *   - Dashboard  — animated empty state via Framer Motion AnimatePresence.
 *   - Products   — static empty message; no animation needed.
 *
 * Keeping the empty state out of this component prevents the double-render
 * conflict that arose when Dashboard's AnimatePresence always passed a truthy
 * child, causing the built-in empty check to never trigger.
 *
 * Used by: Dashboard, Products
 */

// ── i18n strings ──────────────────────────────────────────────────────────────
// Move to your translation JSON and replace with useTranslation() when ready.
const t = {
    col_product:       "Product",
    col_category:      "Category",
    col_unit_coverage: "Unit Coverage",
    col_status:        "Status",
    col_active:        "Active",
    col_preview:       "Preview",
};

// Column grid definitions — kept at module scope to avoid recreation on re-render.
const COLS_WITH_PREVIEW    = "grid-cols-[280px_1fr_1fr_1fr_1fr_1fr]";
const COLS_WITHOUT_PREVIEW = "grid-cols-[280px_1fr_1fr_1fr_1fr]";

/**
 * ProductTable
 *
 * @param {object}    props
 * @param {React.ReactNode} props.children      - Row nodes (ProductRow or animated wrappers).
 * @param {boolean}   [props.showPreview=false] - When true, renders the Preview column header
 *                                                and expands the grid to 6 columns.
 *
 * @returns {JSX.Element}
 */
export default function ProductTable({ children, showPreview = false }) {
    return (
        <div className="w-full">

            {/* ── Column header ─────────────────────────────────────────────────
                Hidden on mobile (hidden md:grid) — the responsive card layout
                on small screens makes explicit headers redundant.
            ──────────────────────────────────────────────────────────────────── */}
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
                <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-center">
                    {t.col_status}
                </span>
                <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-center">
                    {t.col_active}
                </span>
                {showPreview && (
                    <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-center">
                        {t.col_preview}
                    </span>
                )}
            </div>

            {/* ── Row container ─────────────────────────────────────────────────
                divide-y draws borders between direct children.
                AnimatedRow wrappers collapse to height:0 during exit — the border
                on a zero-height wrapper is invisible because overflow:hidden on the
                wrapper clips it, and divide-y only draws *between* elements so the
                last visible row never gets a phantom bottom border.
            ──────────────────────────────────────────────────────────────────── */}
            <div className="divide-y divide-[var(--border)]">
                {children}
            </div>

        </div>
    );
}
