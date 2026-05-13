/**
 * @file LoadingState.jsx
 * @module Components/Common/Feedback
 *
 * @description
 * Full-page skeleton loader displayed by <PageShell> while a page's primary
 * data is being fetched. Mirrors the structural layout of most list
 * pages (page header + action button + data table) so the UI feels stable
 * during loading instead of blank.
 *
 * All skeleton blocks pulse via Tailwind's `animate-pulse` utility and use
 * the `--muted` CSS variable so the effect adapts correctly in both light
 * and dark themes.
 *
 * No props required — this is a pure presentational component.
 *
 * @example
 * // Used automatically by PageShell when isLoading is true:
 * <PageShell isLoading={true} …>…</PageShell>
 *
 * // Or used standalone:
 * if (isLoading) return <LoadingState />;
 */

import { TableSkeleton } from '../Skeleton/TableSkeleton';

/**
 * LoadingState
 *
 * @returns {JSX.Element} A skeleton representation of the standard list-page layout.
 */
export default function LoadingState() {
    return (
        <div className="p-6 space-y-6">

            {/* ── Page header skeleton ── */}
            <div className="flex justify-between items-center mb-8">

                {/* Left: page title + subtitle placeholders */}
                <div className="space-y-3">
                    <div className="h-6 w-40 bg-[var(--muted)] rounded-lg animate-pulse" />
                    <div className="h-4 w-64 bg-[var(--muted)] opacity-50 rounded-md animate-pulse" />
                </div>

                {/* Right: primary action button placeholder */}
                <div className="h-11 w-36 bg-[var(--muted)] rounded-full animate-pulse" />
            </div>

            {/*
             * ── Data table skeleton ──
             * Outer wrapper mirrors the Card used by real table pages.
             * --card / --border CSS variables ensure correct light/dark rendering.
             */}
            <div className="bg-[var(--card)] rounded-[2rem] border border-[var(--border)] overflow-hidden shadow-sm">

                {/* Column header row placeholder */}
                <div className="bg-[var(--muted)] bg-opacity-20 px-8 py-4 border-b border-[var(--border)]">
                    <div className="h-4 w-full bg-[var(--muted)] rounded animate-pulse" />
                </div>

                {/* Table body rows — delegated to the shared TableSkeleton primitive */}
                <TableSkeleton rows={6} />
            </div>
        </div>
    );
}