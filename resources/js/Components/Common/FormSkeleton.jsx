// resources/js/Components/Common/Skeletons/FormSkeleton.jsx
export function FormSkeleton() {
    return (
        <div className="bg-[var(--card)] p-10 rounded-[2.5rem] border border-[var(--border)] animate-pulse space-y-10">
            <div className="space-y-4">
                <div className="h-5 w-40 bg-[var(--muted)] rounded-md" />
                <div className="h-12 w-full bg-[var(--muted)] opacity-40 rounded-2xl" />
            </div>
            <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="h-5 w-32 bg-[var(--muted)] rounded-md" />
                    <div className="h-12 w-full bg-[var(--muted)] opacity-40 rounded-2xl" />
                </div>
                <div className="space-y-4">
                    <div className="h-5 w-32 bg-[var(--muted)] rounded-md" />
                    <div className="h-12 w-full bg-[var(--muted)] opacity-40 rounded-2xl" />
                </div>
            </div>
            <div className="flex justify-end pt-4">
                <div className="h-12 w-44 bg-[var(--muted)] rounded-full" />
            </div>
        </div>
    );
}