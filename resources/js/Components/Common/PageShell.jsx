/**
 * @file PageShell.jsx
 * @module Components/Common
 *
 * @description
 * Top-level page wrapper for all admin pages.
 * Handles three rendering states in a single place so individual pages
 * don't need to repeat the same loading / error / boundary boilerplate:
 *
 *  1. **Loading** — renders <LoadingState /> inside the shared Layout.
 *  2. **Error**   — renders <ErrorState /> with an optional retry callback.
 *  3. **Ready**   — renders children inside <ErrorBoundary> to catch
 *                   unexpected runtime errors gracefully.
 *
 * Pair with a React Query `useQuery` call: pass `isLoading`, `isError`,
 * `error`, and `refetch` directly as props.
 *
 * @example
 * const { data, isLoading, isError, error, refetch } = useQuery(…);
 *
 * return (
 *   <PageShell isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
 *     <ProductsTable data={data} />
 *   </PageShell>
 * );
 */

import Layout from '../../Layouts/Layout';
import LoadingState from './Feedback/LoadingState';
import ErrorState from './Feedback/ErrorState';
import ErrorBoundary from './ErrorBoundary';

/**
 * PageShell
 *
 * @param {Object}           props
 * @param {boolean}          props.isLoading   - True while the page's primary data is being fetched.
 * @param {boolean}          props.isError     - True when the data fetch has failed.
 * @param {Error|null}       props.error       - The Error object returned by React Query (or null).
 * @param {Function}         [props.onRetry]   - Optional callback passed to <ErrorState> for
 *                                               the "Try again" button (e.g. React Query's `refetch`).
 * @param {React.ReactNode}  props.children    - Page content rendered when data is available.
 * @returns {JSX.Element}
 */
export default function PageShell({ isLoading, isError, error, onRetry, children }) {

    /* ── State 1: Data is still loading ── */
    if (isLoading) {
        return <Layout><LoadingState /></Layout>;
    }

    /* ── State 2: Data fetch failed ── */
    
           if (isError) {
    console.log('[PageShell] error object:', error);
    console.log('[PageShell] userMessage:', error?.userMessage);
    console.log('[PageShell] status:', error?.response?.status);

    return (
        <Layout>
            <ErrorState error={error} onRetry={onRetry} />
        </Layout>
    );
}
    

    /* ── State 3: Data is ready — render children inside an error boundary ── */
    return (
        <Layout>
            {/*
             * ErrorBoundary catches any JavaScript errors that occur inside the
             * children subtree during render, preventing a full white-screen crash.
             */}
            <ErrorBoundary>
                {children}
            </ErrorBoundary>
        </Layout>
    );
}