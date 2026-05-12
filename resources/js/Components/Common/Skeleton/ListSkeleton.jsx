// resources/js/Components/Common/Skeletons/ListSkeleton.jsx
export function ListSkeleton({ items = 4 }) {
    return (
        <div className="space-y-4 animate-pulse">
            {Array.from({ length: items }).map((_, i) => (
                <div key={i} className="flex items-center gap-6 p-5 bg-[var(--card)] bg-opacity-50 rounded-2xl border border-[var(--border)]">
                    <div className="w-12 h-12 bg-[var(--muted)] rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-1/3 bg-[var(--muted)] rounded" />
                        <div className="h-3 w-2/3 bg-[var(--muted)] opacity-60 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}