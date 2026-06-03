/**
 * @file ErrorState.jsx
 * @module Components/Common
 *
 * @description
 * Full-page empty state displayed by <PageShell> when a data fetch fails.
 * Shared across Mustashar and Harees — any page that uses <PageShell> gets
 * this automatically when `isError` is true.
 *
 * Distinct from <ErrorBoundary>:
 *   - <ErrorState>    → handles *async* failures (network, API, React Query).
 *   - <ErrorBoundary> → handles *render-time* JavaScript exceptions.
 *
 * The `message` prop allows each page to surface a context-specific error
 * string (e.g. from React Query's `error.message`). When omitted, a
 * generic fallback message is shown.
 *
 * The `onRetry` callback is typically React Query's `refetch` function,
 * wired through <PageShell>.
 *
 * @example
 * // Used automatically via PageShell — no manual wiring needed:
 * <PageShell isError={isError} error={error} onRetry={refetch}>…</PageShell>
 *
 * @example
 * // Standalone usage with a custom message:
 * <ErrorState
 *   message="Could not load batch records."
 *   onRetry={refetch}
 * />
 */

import { AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * ErrorState
 *
 * @param {Object}   props
 * @param {string}   [props.message]  - Context-specific error description surfaced from
 *                                      the failed request (e.g. `error?.message`).
 *                                      Falls back to a generic message when omitted.
 * @param {Function} [props.onRetry]  - Callback fired when the user clicks "Try Again".
 *                                      Typically React Query's `refetch`.
 * @returns {JSX.Element}
 */
export default function ErrorState({ message, onRetry }) {
    const { t } = useTranslation('shared');

    return (
        <div className="flex flex-col items-center justify-center py-32 px-6 text-center animate-in fade-in duration-500">

            {/* Error icon badge — neutral muted style matching <LoadingState> */}
            <div className="w-20 h-20 bg-[var(--muted)] bg-opacity-50 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-6 border border-[var(--border)]">
                <AlertCircle className="w-10 h-10 text-[var(--muted-foreground)] opacity-60" strokeWidth={1.5} />
            </div>

            {/* Heading */}
            <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">
                {t('error_state.heading')}
            </h3>

            {/* Error message — uses prop value when provided, generic fallback otherwise */}
            <p className="text-[var(--muted-foreground)] max-w-sm mb-10 text-sm leading-relaxed">
                {message || t('error_state.default_message')}
            </p>

            {/*
             * Retry button — inverted foreground/background for maximum contrast.
             * Pill shape (rounded-full) differentiates it from regular action buttons.
             */}
            <button
                onClick={onRetry}
                className="flex items-center gap-2 px-8 py-3 bg-[var(--foreground)] text-[var(--background)] rounded-full text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-black/5"
            >
                <RefreshCw className="w-4 h-4" />
                {t('error_state.cta_label')}
            </button>
        </div>
    );
}