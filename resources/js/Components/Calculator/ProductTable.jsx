// resources/js/Components/Calculator/ProductTable.jsx

/**
 * ProductTable — renders the grid header and wraps rows in a divided list.
 *
 * Props:
 *  - children : React nodes (ProductRow components)
 *  - empty    : ReactNode — rendered when there are no children
 */
export default function ProductTable({ children, empty }) {
    const hasChildren = Array.isArray(children)
        ? children.some(Boolean)
        : Boolean(children);

    return (
        <div className="w-full">
            {/* ── Synchronized Grid Header ────────────────────── */}
            <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_120px] gap-4 px-8 py-3 bg-[var(--muted)]/40 border-b border-[var(--border)]">
                <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-left">
                    Engine Identity
                </span>
                <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-center">
                    Category
                </span>
                <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-center">
                    Status
                </span>
                <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-right">
                    Active
                </span>
            </div>

            {/* ── Row Container ───────────────────────────────── */}
            <div className="divide-y divide-[var(--border)] overflow-hidden">
                {hasChildren ? (
                    children
                ) : (
                    empty ?? (
                        <div className="py-20 text-center text-sm text-[var(--muted-foreground)] uppercase font-black tracking-widest opacity-40">
                            No engines found.
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
