// resources/js/Components/Common/LoadingState.jsx
import { TableSkeleton } from './TableSkeleton';

export default function LoadingState() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center mb-8">
                <div className="space-y-3">
                    <div className="h-6 w-40 bg-[var(--muted)] rounded-lg animate-pulse" />
                    <div className="h-4 w-64 bg-[var(--muted)] opacity-50 rounded-md animate-pulse" />
                </div>
                <div className="h-11 w-36 bg-[var(--muted)] rounded-full animate-pulse" />
            </div>

            {/* الحاوية تتبع لون الـ Card الخاص بك في الدارك واللايت */}
            <div className="bg-[var(--card)] rounded-[2rem] border border-[var(--border)] overflow-hidden shadow-sm">
                <div className="bg-[var(--muted)] bg-opacity-20 px-8 py-4 border-b border-[var(--border)]">
                    <div className="h-4 w-full bg-[var(--muted)] rounded animate-pulse" />
                </div>
                <TableSkeleton rows={6} />
            </div>
        </div>
    );
}