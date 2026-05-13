/**
 * @file ErrorBoundary.jsx
 * @module Components/Common
 *
 * @description
 * React class-based error boundary shared across Mustashar and Harees.
 * Catches any JavaScript error thrown during rendering inside its subtree,
 * prevents a full white-screen crash, and replaces the broken subtree with
 * a user-friendly fallback card containing a "Refresh Page" button.
 *
 * Must be a class component — React's error boundary API (`getDerivedStateFromError`
 * and `componentDidCatch`) is not available in function components.
 *
 * Mounted once per page by <PageShell>. Do NOT nest ErrorBoundaries unless
 * you need isolated recovery zones within a single page.
 *
 * Recovery strategy: `window.location.reload()` — a full page reload is the
 * safest approach since the component tree may be in an inconsistent state
 * after an unhandled render error.
 *
 * @example
 * // Used automatically by PageShell — no manual setup needed in most pages.
 * <ErrorBoundary>
 *   <MyPageContent />
 * </ErrorBoundary>
 */

// ─── i18n strings ────────────────────────────────────────────────────────────
// Move to your JSON locale file when ready (e.g. en.json → "error_boundary": { … })
const t = {
    /** Main heading shown in the error fallback card */
    heading: 'Something went wrong',
    /** Body text explaining what happened and suggesting a next step */
    description: 'The system encountered an unexpected issue. Please try refreshing the page or come back later.',
    /** Label for the page-refresh action button */
    cta_label: 'Refresh Page',
};
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

/**
 * ErrorBoundary
 *
 * @extends React.Component
 *
 * @prop {React.ReactNode} children - The subtree to protect. Rendered normally
 *                                    when no error has been caught.
 */
export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        /** @type {{ hasError: boolean }} */
        this.state = { hasError: false };
    }

    /**
     * React lifecycle — called during rendering when a descendant throws.
     * Returns the state update that triggers the fallback UI on the next render.
     * Runs during the render phase, so it must be a pure function with no side effects.
     *
     * @returns {{ hasError: true }}
     */
    static getDerivedStateFromError() {
        return { hasError: true };
    }

    /**
     * React lifecycle — called after the error boundary has rendered the fallback.
     * Safe place for side effects such as logging to an error tracking service.
     *
     * NOTE: The method is named `componentDidCatch` in the React API.
     * The current implementation uses `componentCatch` — rename to `componentDidCatch`
     * to activate proper React error reporting.
     *
     * @param {Error}                error - The thrown error object.
     * @param {React.ErrorInfo}      info  - Contains `componentStack` string for debugging.
     */
    componentCatch(error, info) {
        // Replace with an error tracking call (e.g. Sentry.captureException) in production
        console.error("ErrorBoundary caught an error:", error, info);
    }

    /**
     * Recovery handler — performs a full page reload to reset the component tree.
     * Bound as a class field arrow function to avoid manual `.bind(this)` in the constructor.
     */
    handleReset = () => {
        window.location.reload();
    };

    render() {
        /* ── Fallback UI — shown when a render error has been caught ── */
        if (this.state.hasError) {
            return (
                <div className="min-h-[400px] flex items-center justify-center p-6 bg-[var(--background)]">
                    <div className="max-w-md w-full bg-[var(--card)] border border-[var(--border)] rounded-[2rem] p-10 text-center shadow-sm transition-colors duration-300">

                        {/* Error icon badge — soft red in both light and dark themes */}
                        <div className="w-16 h-16 rounded-2xl bg-red-50/50 dark:bg-red-950/20 flex items-center justify-center mx-auto mb-6 border border-red-100 dark:border-red-900/30">
                            <AlertCircle size={32} className="text-red-500 opacity-90" />
                        </div>

                        {/* Heading */}
                        <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">
                            {t.heading}
                        </h2>

                        {/* Explanatory body text */}
                        <p className="text-sm text-[var(--muted-foreground)] mb-8 leading-relaxed">
                            {t.description}
                        </p>

                        {/* Full-width refresh CTA */}
                        <button
                            onClick={this.handleReset}
                            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[var(--primary)] text-white font-semibold hover:brightness-95 active:scale-[0.98] transition-all shadow-sm"
                        >
                            <RefreshCw size={18} />
                            {t.cta_label}
                        </button>
                    </div>
                </div>
            );
        }

        /* ── Happy path — render the protected subtree normally ── */
        return this.props.children;
    }
}