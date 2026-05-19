/**
 * @file Dashboard.jsx
 * @module Pages/Harees
 *
 * @description
 * The main entry point for the Harees inventory-monitoring dashboard.
 * Renders three summary StatCards (Expired / Approaching / Safe) and the
 * MonitoredProductsTable below them.  Route-level access is enforced by the
 * `useHareesGuard` hook before any UI is painted.
 *
 * Data flow:
 *   useHareesStats  →  products, stats, autoDiscount, needsSetup flags
 *   PageShell       →  wraps the page in a consistent loading / error shell
 */

// ─── i18n strings ────────────────────────────────────────────────────────────
// Move these values to your JSON translation file and replace this object with
// a `useTranslation` call (or equivalent) when you are ready.
const t = {
    stat_expired_label:      'Expired',
    stat_expired_sub:        'Requires immediate action',
    stat_approaching_label:  'Approaching',
    stat_approaching_sub:    'Under close monitoring',
    stat_safe_label:         'Safe',
    stat_safe_sub:           'Stable inventory',
    setup_banner_description:
        'Set up your expiry thresholds first so products and batches can be tracked.',
};
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { AlertCircle, ShieldCheck, Clock } from 'lucide-react';
import useHareesGuard from '../../Hooks/useHareesGuard';
import PageShell from '../../Components/Common/PageShell';
import StatCard from '../../Components/Common/StatCard';
import SetupBanner from '../../Components/Common/Feedback/SetupBanner';
import MonitoredProductsTable from '../../Components/Harees/Dashboard/MonitoredProductsTable';
import { useHareesStats } from '../../Hooks/useHareesStats';

/**
 * Dashboard
 *
 * Top-level page component for the Harees expiry-monitoring feature.
 * Enforces route access, fetches aggregated inventory statistics, and
 * composes the page layout from reusable shell / card primitives.
 *
 * @component
 * @returns {JSX.Element} The fully rendered Harees dashboard page.
 *
 * @example
 * // Registered as a route in your router config:
 * <Route path="/harees" element={<Dashboard />} />
 */
export default function Dashboard() {
    // Guard: redirects unauthenticated / unauthorised users away from this page.
    useHareesGuard();

    /**
     * statusFilter controls which product-status subset the table displays.
     * Passed down to MonitoredProductsTable so the filter dropdown is a
     * controlled component owned here at the page level.
     *
     * @type {[string, Function]}
     */
    const [statusFilter, setStatusFilter] = useState('all');

    /**
     * Destructure everything the page needs from the centralised stats hook.
     *  - products      : flat list of monitored products (with nested batches)
     *  - stats         : { expiredCount, expiringSoon, validCount }
     *  - autoDiscount  : whether auto-discount is globally enabled
     *  - needsSetup    : true when required settings haven't been configured yet
     *  - isLoading     : forwarded to PageShell for skeleton / spinner rendering
     *  - isError       : forwarded to PageShell for error-state rendering
     *  - error         : the Error object (or null) forwarded to PageShell
     *  - refetch       : retry callback passed to PageShell's "Retry" button
     */
    const {
        products,
        stats,
        autoDiscount,
        needsSetup,
        isLoading,
        isError,
        error,
        refetch,
    } = useHareesStats();

    return (
        <PageShell isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
            <div className="space-y-10" dir="ltr">

                {/* ── Setup banner ──────────────────────────────────────────────
                    Shown only when the merchant has not yet configured expiry
                    thresholds.  The banner links directly to /harees/settings.
                ─────────────────────────────────────────────────────────────── */}
                {needsSetup && (
                    <SetupBanner
                        href="/harees/settings"
                        description={t.setup_banner_description}
                    />
                )}

                {/* ── Summary stat cards ────────────────────────────────────────
                    Three cards give the merchant an at-a-glance health overview
                    of their entire monitored inventory.
                ─────────────────────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Expired: batches that have already passed their expiry date */}
                    <StatCard
                        label={t.stat_expired_label}
                        value={stats.expiredCount}
                        icon={<AlertCircle className="w-5 h-5" />}
                        variant="critical"
                        sub={t.stat_expired_sub}
                    />

                    {/* Approaching: batches within the configured warning threshold */}
                    <StatCard
                        label={t.stat_approaching_label}
                        value={stats.expiringSoon}
                        icon={<Clock className="w-5 h-5" />}
                        variant="warning"
                        sub={t.stat_approaching_sub}
                    />

                    {/* Safe: batches well within their expiry date */}
                    <StatCard
                        label={t.stat_safe_label}
                        value={stats.validCount}
                        icon={<ShieldCheck className="w-5 h-5" />}
                        variant="success"
                        sub={t.stat_safe_sub}
                    />
                </div>

                {/* ── Monitored products table ───────────────────────────────────
                    Renders every tracked product with expandable batch rows.
                    statusFilter / onFilterChange wire the dropdown to local state.
                ─────────────────────────────────────────────────────────────── */}
                <MonitoredProductsTable
                    products={products}
                    autoDiscount={autoDiscount}
                    statusFilter={statusFilter}
                    onFilterChange={setStatusFilter}
                    needsSetup={needsSetup}
                />

            </div>
        </PageShell>
    );
}