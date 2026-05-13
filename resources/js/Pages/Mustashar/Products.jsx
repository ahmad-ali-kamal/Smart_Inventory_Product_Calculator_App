/**
 * @file Products.jsx
 * @module Pages/Mustashar
 *
 * @description
 * Full product management page for the Mustashar sub-app.
 *
 * Responsibilities:
 *  - Guards the route via `useMustasharGuard`.
 *  - Provides live search and category filtering through `useProductsFilter`.
 *  - Shows a `SetupBanner` when calculator settings have never been saved.
 *  - Renders every product (active and inactive) in a sortable, filterable
 *    table with animated row transitions via Framer Motion.
 *  - Exposes a sync button (via `TableToolbar`) to pull the latest product
 *    catalogue from Salla.
 *
 * Sorting convention (enforced by useProductsFilter):
 *  Active products rise to the top of the list; inactive products appear
 *  faded below them to highlight catalogue gaps at a glance.
 *
 * Data flow:
 *   useProductsFilter   → sorted list + search / filter state
 *   useSettingsStatus   → isConfigured flag for the setup banner
 *   useToggleWithToast  → optimistic toggle handler with toast feedback
 */

import useMustasharGuard from '../../Hooks/useMustasharGuard';
import PageShell from '../../Components/Common/PageShell';
import SetupBanner from '../../Components/Common/Feedback/SetupBanner';
import TableToolbar from '../../Components/Common/Controls/TableToolbar';
import Card from '../../Components/Common/UI/Card';
import ProductRow from '../../Components/Mustashar/ProductRow';
import ProductTable from '../../Components/Mustashar/ProductTable';
import { useProductsFilter } from '../../Hooks/useProductsFilter';
import { useSettingsStatus } from '../../Hooks/useProducts';
import { useToggleWithToast } from '../../Hooks/useToggleWithToast';
import { motion, AnimatePresence } from 'framer-motion';

// ---------------------------------------------------------------------------
// i18n strings — move these values to a JSON translation file when ready.
// ---------------------------------------------------------------------------
const t = {
    // Setup banner
    setup_description: "Configure coverage per unit and waste percentage so the calculator can generate accurate results.",

    // Toolbar
    toolbar_banner:      "Active products sort to the top so they can be spotted fast; inactive ones appear faded to easily highlight catalog gaps.",
    search_placeholder:  "Search products...",

    // Product table
    table_empty: "All products are inactive. Activate products to include them in calculations.",
};

/**
 * Product management page for the Mustashar sub-app.
 * Lists all store products with search, category filter, and toggle controls.
 *
 * @returns {JSX.Element}
 */
export default function Products() {
    // Redirect unauthenticated or unauthorised visitors.
    useMustasharGuard();

    // `sorted` is the filtered + sorted product array derived from the full list.
    const {
        sorted,
        search, setSearch,
        categoryFilter, setCategoryFilter,
        categoryOptions,
        isLoading, isError, error, refetch,
    } = useProductsFilter();

    // Show the setup banner only after the settings query resolves and confirms
    // that no settings have been persisted yet.
    const { isLoading: settingsLoading, isConfigured } = useSettingsStatus();
    const needsSetup = !settingsLoading && !isConfigured;

    // `variables` holds the id of the product whose toggle is currently in-flight,
    // allowing the matching row to show a loading state.
    const { handleToggle, isPending, variables } = useToggleWithToast(sorted);

    return (
        <PageShell isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
            <div className="space-y-6">

                {/* Setup banner — visible only when calculator settings are missing */}
                {needsSetup && (
                    <SetupBanner
                        href="/mustashar/settings"
                        description={t.setup_description}
                    />
                )}

                {/* ── Toolbar: search, category filter, and Salla sync ──── */}
                <TableToolbar
                    banner={t.toolbar_banner}
                    search={search}
                    onSearch={setSearch}
                    filterOptions={categoryOptions}
                    filterValue={categoryFilter}
                    onFilter={setCategoryFilter}
                    syncEndpoint="/mustashar/api/products/sync"
                    onSyncSuccess={() => refetch()}
                    placeholder={t.search_placeholder}
                    filterWidth="w-[130px]"
                />

                {/* ── Products table ─────────────────────────────────────── */}
                <Card>
                    <ProductTable empty={t.table_empty}>
                        <AnimatePresence mode="popLayout">
                            {sorted.map(product => (
                                // Spring animation on entry/exit gives rows a natural
                                // feel when the list re-sorts after a toggle.
                                <motion.div
                                    key={product.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 300,
                                        damping: 30,
                                        opacity: { duration: 0.2 },
                                    }}
                                >
                                    <ProductRow
                                        product={product}
                                        onToggle={handleToggle}
                                        // Show a loading state only on the row whose
                                        // toggle request is currently in-flight.
                                        loading={isPending && variables === product.id}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </ProductTable>
                </Card>

            </div>
        </PageShell>
    );
}