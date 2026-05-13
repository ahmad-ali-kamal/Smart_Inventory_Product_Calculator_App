/**
 * @file Dashboard.jsx
 * @module Pages/Mustashar
 *
 * @description
 * Main dashboard page for the Mustashar sub-app.
 *
 * Responsibilities:
 *  - Guards the route via `useMustasharGuard`.
 *  - Displays three stat cards: total products, activated products, and a
 *    live preview of the current calculator rules (coverage + waste).
 *  - Shows a `SetupBanner` when calculator settings have never been saved.
 *  - Renders the active-products table with animated row transitions via
 *    Framer Motion's `AnimatePresence`.
 *
 * Data flow:
 *   useActiveProducts   → allProducts / activeProducts lists
 *   useCalculatorSettings → coverage / waste values (via useCalcRules)
 *   useSettingsStatus   → isConfigured flag for the setup banner
 *   useToggleWithToast  → optimistic toggle handler with toast feedback
 */

import { Link } from '@inertiajs/react';
import useMustasharGuard from '../../Hooks/useMustasharGuard';
import PageShell from '../../Components/Common/PageShell';
import SetupBanner from '../../Components/Common/Feedback/SetupBanner';
import StatCard from '../../Components/Common/StatCard';
import ProductRow from '../../Components/Mustashar/ProductRow';
import ProductTable from '../../Components/Mustashar/ProductTable';
import { useActiveProducts, useCalculatorSettings, useSettingsStatus } from '../../Hooks/useProducts';
import { useToggleWithToast } from '../../Hooks/useToggleWithToast';
import { Package, CheckCircle2, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ---------------------------------------------------------------------------
// i18n strings — move these values to a JSON translation file when ready.
// ---------------------------------------------------------------------------
const t = {
    // Stat cards
    stat_total_label:     "Total Products",
    stat_total_sub:       "In your store",
    stat_activated_label: "Activated",
    stat_activated_sub:   "Live on storefront",

    // Setup banner
    setup_description: "Configure coverage per unit and waste percentage so the calculator can generate accurate results.",

    // Calculator rules labels (used in the settings-preview stat card)
    rule_coverage_label: "Coverage",
    rule_waste_label:    "Waste",
    rule_waste_suffix:   "% waste",

    // Product table
    table_empty: "No active products available",
};

// ---------------------------------------------------------------------------
// useCalcRules — private helper hook
// ---------------------------------------------------------------------------

/**
 * Derives a display-ready array of calculator rule entries from the persisted
 * settings. Returns an empty array while the settings query is still loading,
 * so the `StatCard` renders gracefully without special null handling at the
 * call site.
 *
 * @private
 * @returns {{ label: string, value: string }[]}
 */
function useCalcRules() {
    const { data: settings } = useCalculatorSettings();
    if (!settings) return [];
    return [
        { label: t.rule_coverage_label, value: `${Number(settings.coverage).toFixed(2)} m²` },
        { label: t.rule_waste_label,    value: `${Number(settings.waste).toFixed(0)}${t.rule_waste_suffix}` },
    ];
}

// ---------------------------------------------------------------------------
// Dashboard component
// ---------------------------------------------------------------------------

/**
 * Dashboard page for the Mustashar sub-app.
 * Aggregates product stats and surfaces the active-product list with
 * live toggle controls.
 *
 * @returns {JSX.Element}
 */
export default function Dashboard() {
    // Redirect unauthenticated or unauthorised visitors.
    useMustasharGuard();

    // Server state — full list and pre-filtered active subset.
    const { allProducts, activeProducts, isLoading, isError, error } = useActiveProducts();

    // Wraps useToggleProduct with toast notifications; `variables` holds the
    // id of the product whose toggle request is currently in-flight.
    const { handleToggle, isPending, variables } = useToggleWithToast(allProducts);

    // Formatted rule pairs for the settings-preview stat card.
    const calcRules = useCalcRules();

    // Show the setup banner only after the settings query has resolved and
    // confirmed that no settings have been saved yet.
    const { isLoading: settingsLoading, isConfigured } = useSettingsStatus();
    const needsSetup = !settingsLoading && !isConfigured;

    return (
        <PageShell isLoading={isLoading} isError={isError} error={error}>
            <div className="space-y-6">

                {/* Setup banner — visible only when calculator settings are missing */}
                {needsSetup && (
                    <SetupBanner
                        href="/mustashar/settings"
                        description={t.setup_description}
                    />
                )}

                {/* ── Stat cards row ─────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Total product count */}
                    <StatCard
                        label={t.stat_total_label}
                        value={allProducts.length}
                        icon={<Package className="w-4 h-4" />}
                        sub={t.stat_total_sub}
                    />

                    {/* Activated (live) product count */}
                    <StatCard
                        label={t.stat_activated_label}
                        value={activeProducts.length}
                        icon={<CheckCircle2 className="w-4 h-4" />}
                        sub={t.stat_activated_sub}
                    />

                    {/* Calculator rules preview — edit icon links to settings page */}
                    <StatCard type="settings_preview" rules={calcRules}>
                        <Link href="/mustashar/settings">
                            <Pencil size={15} className="text-[var(--primary)]" />
                        </Link>
                    </StatCard>
                </div>

                {/* ── Active products table ──────────────────────────────── */}
                <div className="bg-[var(--card)] rounded-[20px] border border-[var(--border)] overflow-hidden">
                    <ProductTable empty={t.table_empty} showPreview>
                        {activeProducts.length > 0 && (
                            <AnimatePresence mode="popLayout">
                                {activeProducts.map((product) => (
                                    // Each row animates in/out independently.
                                    // `layout` enables smooth reflow when rows are removed.
                                    <motion.div
                                        key={product.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0, x: -20 }}
                                    >
                                        <ProductRow
                                            product={product}
                                            onToggle={handleToggle}
                                            // Disable this row's toggle while its request is pending.
                                            loading={isPending && variables === product.id}
                                            showPreview
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </ProductTable>
                </div>

            </div>
        </PageShell>
    );
}