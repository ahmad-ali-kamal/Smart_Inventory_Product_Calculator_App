// resources/js/Components/Common/Skeletons/StatsSkeleton.jsx
export function StatsSkeleton({ cards = 3 }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: cards }).map((_, i) => (
                <div key={i} className="bg-[var(--card)] p-8 rounded-[2rem] border border-[var(--border)] animate-pulse space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="h-4 w-24 bg-[var(--muted)] rounded-md" />
                        <div className="w-10 h-10 bg-[var(--muted)] rounded-xl" />
                    </div>
                    <div className="h-8 w-32 bg-[var(--muted)] rounded-lg" />
                    <div className="h-3 w-40 bg-[var(--muted)] opacity-50 rounded-md" />
                </div>
            ))}
        </div>
    );
}