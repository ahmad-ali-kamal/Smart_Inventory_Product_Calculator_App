/**
 * @file ProductTable.jsx
 * @module Components/Mustashar
 *
 * @description
 * Layout shell that wraps a list of `ProductRow` components inside a
 * consistent grid-header / row-container structure.
 *
 * Responsibilities:
 *  - Renders a sticky column header row that matches the grid layout of its
 *    child rows (with or without the optional "Preview" column).
 *  - Detects whether any renderable children were passed and falls back to a
 *    centred empty-state message when the list is empty.
 *  - Owns no data-fetching or business logic — all content is injected via
 *    `children` and configuration props.
 *
 * Column grid (mirrors ProductRow constants):
 *  Without preview: [280px  1fr  1fr  1fr]
 *  With    preview: [280px  1fr  1fr  1fr  1fr]
 *
 * Used by: Dashboard.jsx (showPreview=true), Products.jsx (showPreview=false)
 */

// ---------------------------------------------------------------------------
// i18n strings — move these values to a JSON translation file when ready.
// ---------------------------------------------------------------------------
const t = {
    // Column header labels
    col_product:  "Product",
    col_category: "Category",
    col_status:   "Status",
    col_active:   "Active",
    col_preview:  "Preview",

    // Empty state fallback (overridden by the `empty` prop at the call site)
    empty_default: "No products found.",
};

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

/** Grid columns when the preview link column is visible (Dashboard). */
const COLS_WITH_PREVIEW    = 'grid-cols-[280px_1fr_1fr_1fr_1fr]';

/** Grid columns when the preview link column is hidden (Products page). */
const COLS_WITHOUT_PREVIEW = 'grid-cols-[280px_1fr_1fr_1fr]';

/**
 * Table shell that renders a column header and a scrollable row container
 * for product lists.
 *
 * @param {object}          props
 * @param {React.ReactNode} props.children        — `ProductRow` elements to render.
 *                                                  An empty or falsy children tree
 *                                                  triggers the empty state.
 * @param {string}          [props.empty]         — Custom empty-state message shown
 *                                                  when no children are renderable.
 * @param {boolean}         [props.showPreview=false] — When `true`, adds a fifth
 *                                                  "Preview" column to the header.
 * @returns {JSX.Element}
 */
export default function ProductTable({ children, empty, showPreview = false }) {
    // Support both a single child and an array of children (e.g. wrapped in AnimatePresence).
    // A child is considered present only if it is truthy (filters out null / undefined entries).
    const hasChildren = Array.isArray(children)
        ? children.some(Boolean)
        : Boolean(children);

    return (
        <div className="w-full">

            {/* ── Grid header ────────────────────────────────────────── */}
            {/* Hidden on small screens; columns mirror the ProductRow grid. */}
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
                    {t.col_status}
                </span>
                <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-center">
                    {t.col_active}
                </span>

                {/* Preview column header — rendered only when showPreview=true */}
                {showPreview && (
                    <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-center">
                        {t.col_preview}
                    </span>
                )}
            </div>

            {/* ── Row container ──────────────────────────────────────── */}
            {/* `divide-y` draws a separator between consecutive rows. */}
            <div className="divide-y divide-[var(--border)] overflow-hidden">
                {hasChildren ? (
                    children
                ) : (
                    // Empty state — shown when the filtered list is empty or
                    // no products have been loaded yet.
                    <div className="py-20 text-center text-sm text-[var(--muted-foreground)] uppercase font-black tracking-widest opacity-40">
                        {empty ?? t.empty_default}
                    </div>
                )}
            </div>

        </div>
    );
}