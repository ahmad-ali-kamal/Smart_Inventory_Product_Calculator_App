// resources/js/Components/Common/TableSkeleton.jsx
export function TableSkeleton({ rows = 5 }) {
    return (
        <div className="divide-y divide-[var(--border)]">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="grid grid-cols-[2fr_1fr_1fr_100px] gap-6 px-8 py-6 items-center">
                    <div className="flex items-center gap-4">
                        {/* صورة المنتج */}
                        <div className="w-14 h-14 rounded-2xl bg-[var(--muted)] animate-pulse" />
                        <div className="space-y-2">
                            {/* اسم المنتج والسكشن */}
                            <div className="h-4 w-48 bg-[var(--muted)] rounded animate-pulse" />
                            <div className="h-3 w-32 bg-[var(--muted)] opacity-60 rounded animate-pulse" />
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <div className="h-3 w-20 bg-[var(--muted)] opacity-40 rounded-full animate-pulse" />
                    </div>
                    <div className="flex justify-center">
                        <div className="h-3 w-24 bg-[var(--muted)] opacity-40 rounded-full animate-pulse" />
                    </div>
                    <div className="flex justify-end">
                        <div className="w-10 h-10 rounded-full bg-[var(--muted)] opacity-40 animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    );
}