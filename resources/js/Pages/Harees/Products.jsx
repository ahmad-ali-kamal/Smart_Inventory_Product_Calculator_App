/**
 * @file Products.jsx
 * @module Pages/Harees
 *
 * @description
 * The Harees Products page — lets merchants manage expiry dates for their
 * Salla inventory.  It combines a filterable product table with an inline
 * ExpiryModal that opens when the merchant clicks "Add / Edit Expiry Date"
 * on any row.
 *
 * Data flow:
 *   useInventoryProductsFilter  →  filtered product list + search / filter state
 *   useHareesStats              →  needsSetup flag (gates the SetupBanner)
 *   ExpiryModal                 →  opened with `expiryTarget` (product object)
 *                                  closed by setting `expiryTarget` back to null
 */
import { useTranslation } from 'react-i18next';
import { useState } from "react";
import useHareesGuard from '../../Hooks/useHareesGuard';
import PageShell from '../../Components/Common/PageShell';
import SetupBanner from '../../Components/Common/Feedback/SetupBanner';
import TableToolbar from '../../Components/Common/Controls/TableToolbar';
import Pagination from '../../Components/Common/Controls/Pagination';
import ExpiryModal from '../../Components/Harees/ExpiryModal';
import InventoryTable from '../../Components/Harees/Products/InventoryTable';
import { useInventoryProductsFilter, FILTER_OPTIONS } from '../../Hooks/useInventoryProductsFilter';
import { useHareesStats } from '../../Hooks/useHareesStats';

/**
 * Products
 *
 * Page component for the Harees expiry-management feature.
 * Enforces route access via `useHareesGuard`, then composes the toolbar,
 * product table, and expiry modal into a single managed view.
 *
 * @component
 * @returns {JSX.Element} The fully rendered Products page.
 *
 * @example
 * // Registered as a route:
 * <Route path="/harees/products" element={<Products />} />
 */
export default function Products() {
       const { t } = useTranslation('harees');
    // Guard: redirects unauthenticated / unauthorised users away from this page.
    useHareesGuard();

    /**
     * The product currently targeted for expiry editing.
     * `null` means the ExpiryModal is closed.
     * Set to a product object to open the modal for that product.
     *
     * @type {[Object|null, Function]}
     */
    const [expiryTarget, setExpiryTarget] = useState(null);

    // Only the needsSetup flag is needed from the stats hook here;
    // the rest of the stats are consumed on the Dashboard page.
    const { needsSetup } = useHareesStats();

    /**
     * Destructure search / filter state and the derived product list from the
     * filter hook.  `refetch` is wired to both the SyncButton (via TableToolbar)
     * and the ExpiryModal's `onSave` callback so the table refreshes after any
     * change.
     */
    const {
        paginated,
        page, setPage,
        totalPages,
        search, setSearch,
        filter, setFilter,
        isLoading, isError, error, refetch,
    } = useInventoryProductsFilter();

    /**
     * Translate filter options based on current locale
     */
    const translatedFilterOptions = FILTER_OPTIONS.map(opt => ({
        value: opt.value,
        label: t(`products.filter_${opt.value}`)
    }));

    return (
        <PageShell isLoading={isLoading} isError={isError} error={error} context="products" onRetry={refetch}>
            <div className="space-y-4">

                {/* ── Setup banner ───────────────────────────────────────────────
                    Only visible when the merchant hasn't configured thresholds.
                    Links directly to /harees/settings.
                ─────────────────────────────────────────────────────────────── */}
                {needsSetup && (
                    <SetupBanner
                        href="/harees/settings"
                      description={t('products.setup_banner_description')}
                    />
                )}

                {/* ── Table toolbar ──────────────────────────────────────────────
                    Houses the search input, status filter dropdown, and sync
                    button.  `onSyncSuccess` triggers a refetch so new products
                    pulled from Salla appear immediately without a page reload.
                ─────────────────────────────────────────────────────────────── */}
                <TableToolbar
                    banner={t('products.toolbar_banner')}
                    search={search}
                    onSearch={setSearch}
                    filterOptions={translatedFilterOptions}
                    filterValue={filter}
                    onFilter={setFilter}
                    syncEndpoint="/harees/api/products/sync"
                    onSyncSuccess={() => refetch()}
                />

                {/* ── Product table ──────────────────────────────────────────────
                    Renders the filtered product list.  `onExpiry` stores the
                    clicked product in local state, which mounts the ExpiryModal.
                ─────────────────────────────────────────────────────────────── */}
                <InventoryTable products={paginated} onExpiry={setExpiryTarget} />

                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

                {/* ── Expiry modal ───────────────────────────────────────────────
                    Mounted conditionally — unmounts on close so all form state
                    resets automatically for the next interaction.
                    `onSave` calls `refetch` so the table reflects the change
                    immediately after the modal closes.
                ─────────────────────────────────────────────────────────────── */}
                {expiryTarget && (
                    <ExpiryModal
                        product={expiryTarget}
                        onClose={() => setExpiryTarget(null)}
                        onSave={refetch}
                    />
                )}
            </div>
        </PageShell>
    );
}