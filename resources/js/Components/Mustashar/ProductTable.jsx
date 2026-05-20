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
 * ✅ NEW: عمود "Waste %" أضيف بين Unit Coverage و Status.
 * الـ grid توسّع من 5→6 columns (بدون preview) و 6→7 (مع preview).
 *
 * Used by: Dashboard, Products
 */

// ── i18n strings ──────────────────────────────────────────────────────────────
const t = {
    col_product:       "Product",
    col_category:      "Category",
    col_unit_coverage: "Unit Coverage",
    col_waste:         "Waste %",        // ✅ NEW
    col_status:        "Status",
    col_active:        "Active",
    col_preview:       "Preview",
};

// ✅ UPDATED: كل تعريف grid أضيف له عمود 1fr للـ Waste
const COLS_WITH_PREVIEW    = "grid-cols-[220px_1fr_1fr_1fr_1fr_1fr_1fr]";
const COLS_WITHOUT_PREVIEW = "grid-cols-[220px_1fr_1fr_1fr_1fr_1fr]";

/**
 * ProductTable
 *
 * @param {object}    props
 * @param {React.ReactNode} props.children
 * @param {boolean}   [props.showPreview=false]
 *
 * @returns {JSX.Element}
 */
export default function ProductTable({ children, showPreview = false }) {
    return (
        <div className="w-full">

            {/* ── Column header ──────────────────────────────────────────────── */}
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
                {/* ✅ NEW */}
                <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-center">
                    {t.col_waste}
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

            {/* ── Row container ─────────────────────────────────────────────── */}
            <div className="divide-y divide-[var(--border)]">
                {children}
            </div>

        </div>
    );
}