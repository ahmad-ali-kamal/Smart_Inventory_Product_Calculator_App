// resources/js/Components/Mustashar/ProductTable.jsx

export default function ProductTable({ children, empty }) {
    const hasChildren = Array.isArray(children)
        ? children.some(Boolean)
        : Boolean(children);

    return (
        <div className="w-full">
            {/* ── Grid Header — always visible ────────────────── */}
            <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_120px] gap-4 px-8 py-3 bg-[var(--muted)]/40 border-b border-[var(--border)]">
                <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-left">
                    Product
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
                    <div className="py-20 text-center text-sm text-[var(--muted-foreground)] uppercase font-black tracking-widest opacity-40">
                        {empty ?? 'No products found.'}
                    </div>
                )}
            </div>
        </div>
    );
}