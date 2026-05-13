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

// ─── i18n strings ─────────────────────────────────────────────────────────────
// Move these values to your JSON translation file and replace this object with
// a `useTranslation` call (or equivalent) when you are ready.
const t = {
    setup_banner_description:
        'Set up your expiry thresholds first so products and batches can be tracked.',
    toolbar_banner:
        'Add expiry dates to track freshness and avoid waste, then tap Batch to review each batch\'s details and remaining stock.',
};
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import useHareesGuard from '../../Hooks/useHareesGuard';
import PageShell from '../../Components/Common/PageShell';
import SetupBanner from '../../Components/Common/Feedback/SetupBanner';
import TableToolbar from '../../Components/Common/Controls/TableToolbar';
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
        filtered,
        search, setSearch,
        filter, setFilter,
        isLoading, isError, error, refetch,
    } = useInventoryProductsFilter();

    return (
        <PageShell isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
            <div className="space-y-4">

                {/* ── Setup banner ───────────────────────────────────────────────
                    Only visible when the merchant hasn't configured thresholds.
                    Links directly to /harees/settings.
                ─────────────────────────────────────────────────────────────── */}
                {needsSetup && (
                    <SetupBanner
                        href="/harees/settings"
                        description={t.setup_banner_description}
                    />
                )}

                {/* ── Table toolbar ──────────────────────────────────────────────
                    Houses the search input, status filter dropdown, and sync
                    button.  `onSyncSuccess` triggers a refetch so new products
                    pulled from Salla appear immediately without a page reload.
                ─────────────────────────────────────────────────────────────── */}
                <TableToolbar
                    banner={t.toolbar_banner}
                    search={search}
                    onSearch={setSearch}
                    filterOptions={FILTER_OPTIONS}
                    filterValue={filter}
                    onFilter={setFilter}
                    syncEndpoint="/harees/api/products/sync"
                    onSyncSuccess={() => refetch()}
                />

                {/* ── Product table ──────────────────────────────────────────────
                    Renders the filtered product list.  `onExpiry` stores the
                    clicked product in local state, which mounts the ExpiryModal.
                ─────────────────────────────────────────────────────────────── */}
                <InventoryTable products={filtered} onExpiry={setExpiryTarget} />

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