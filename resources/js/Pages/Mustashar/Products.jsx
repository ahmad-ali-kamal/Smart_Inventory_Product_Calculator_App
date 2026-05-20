/**
 * @file Products.jsx
 * @module Pages/Mustashar
 *
 * The full product catalog page for the Mustashar app.
 *
 * Displays every product in the merchant's store with inline controls for:
 *   - Activating / deactivating a product via the Toggle switch.
 *   - Editing coverage per unit directly in the table row.
 *   - Filtering by search query or product category.
 *   - Triggering a full catalog sync from the Salla platform.
 *
 * Unlike the Dashboard, this page shows all products (active and inactive)
 * and applies no row animations on toggle — rows stay in place, only their
 * visual state changes.
 *
 * Used by: Inertia.js router (route: /mustashar/products)
 */

// ── i18n strings ──────────────────────────────────────────────────────────────
// Move to your translation JSON and replace with useTranslation() when ready.
const t = {
    setup_banner_description: "Set defaults once to configure all products instantly. You can still easily customize any product later.",
    toolbar_banner:           "Ready to start? Just set your product's coverage rate, turn on the toggle, and let your Al mustashar handle the rest!",
    search_placeholder:       "Search products...",
    empty_state:              "No products found.",
};

import useMustasharGuard from "../../Hooks/useMustasharGuard";
import PageShell from "../../Components/Common/PageShell";
import SetupBanner from "../../Components/Common/Feedback/SetupBanner";
import TableToolbar from "../../Components/Common/Controls/TableToolbar";
import Card from "../../Components/Common/UI/Card";
import ProductRow from "../../Components/Mustashar/ProductRow";
import ProductTable from "../../Components/Mustashar/ProductTable";
import { useProductsFilter } from "../../Hooks/useProductsFilter";
import { useSettingsStatus } from "../../Hooks/useProducts";
import { useToggleWithToast } from "../../Hooks/useToggleWithToast";

/**
 * Products
 *
 * Full catalog page component. Composes filtering, toggle, and settings-status
 * hooks and delegates all rendering to shared layout primitives.
 *
 * @returns {JSX.Element}
 */
export default function Products() {
    // Redirect the merchant away if the Mustashar app is not installed/active.
    useMustasharGuard();

    // Filtered product list and filter controls — order is always server order.
    const {
        sorted,
        search, setSearch,
        categoryFilter, setCategoryFilter,
        categoryOptions,
        isLoading, isError, error, refetch,
    } = useProductsFilter();

    // Determine whether the calculator has been configured at least once.
    // The setup banner is shown until the merchant saves settings for the first time.
    const { isLoading: settingsLoading, isConfigured } = useSettingsStatus();
    const needsSetup = !settingsLoading && !isConfigured;

    // Toggle handler reads coverage and active state directly from the React Query
    // cache — not from props — so validation is always accurate even when some
    // products are hidden by the current filter.
    const { handleToggle, isPending, variables } = useToggleWithToast();

    return (
        <PageShell isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
            <div className="space-y-6">

                {/* Setup prompt — shown only until the merchant saves settings once */}
                {needsSetup && (
                    <SetupBanner
                        href="/mustashar/settings"
                        description={t.setup_banner_description}
                    />
                )}

                {/* Toolbar: search input, category filter dropdown, and sync button */}
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
                    <ProductTable>
                        {sorted.length > 0 ? (
                            // Render one row per product in server order.
                            // `loading` is scoped to the row whose mutation is in-flight
                            // by comparing the mutation's `variables` to this product's id.
                            sorted.map((product) => (
                                <ProductRow
                                    key={product.id}
                                    product={product}
                                    onToggle={handleToggle}
                                    loading={isPending && variables === product.id}
                                />
                            ))
                        ) : (
                            // Static empty state — no animation needed since rows are
                            // never physically removed from the list on this page.
                            <div className="py-20 text-center text-sm text-[var(--muted-foreground)] uppercase font-black tracking-widest opacity-40">
                                {t.empty_state}
                            </div>
                        )}
                    </ProductTable>
                </Card>

            </div>
        </PageShell>
    );
}