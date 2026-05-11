// resources/js/Components/Mustashar/ProductTable.jsx

const COLS_WITH_PREVIEW    = 'grid-cols-[280px_1fr_1fr_1fr_1fr]';
const COLS_WITHOUT_PREVIEW = 'grid-cols-[280px_1fr_1fr_1fr]';

export default function ProductTable({ children, empty, showPreview = false }) {
    const hasChildren = Array.isArray(children)
        ? children.some(Boolean)
        : Boolean(children);

    return (
        <div className="w-full">
            {/* ── Grid Header ── */}
            <div
                className={`
                    hidden md:grid gap-4 px-8 py-3
                    bg-[var(--muted)]/40 border-b border-[var(--border)]
                    ${showPreview ? COLS_WITH_PREVIEW : COLS_WITHOUT_PREVIEW}
                `}
            >
                <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-left">
                    Product
                </span>
                <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-center">
                    Category
                </span>
                <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-center">
                    Status
                </span>
                <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-center">
                    Active
                </span>

                {/* عمود Preview — يظهر بس لما showPreview=true */}
                {showPreview && (
                    <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest text-center">
                        Preview
                    </span>
                )}
            </div>

            {/* ── Row Container ── */}
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