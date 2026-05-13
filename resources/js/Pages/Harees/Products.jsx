// resources/js/Pages/Harees/Products.jsx
import { useState } from "react";
import useHareesGuard from '../../Hooks/useHareesGuard';
import PageShell from '../../Components/Common/PageShell';
import SetupBanner from '../../Components/Common/Feedback/SetupBanner';
import TableToolbar from '../../Components/Common/Controls/TableToolbar';
import ExpiryModal from '../../Components/Harees/ExpiryModal';
import InventoryTable from '../../Components/Harees/Products/InventoryTable';
import { useInventoryProductsFilter, FILTER_OPTIONS } from '../../Hooks/useInventoryProductsFilter';
import { useHareesStats } from '../../Hooks/useHareesStats';

export default function Products() {
    useHareesGuard();

    const [expiryTarget, setExpiryTarget] = useState(null);

    const { needsSetup } = useHareesStats();

    const {
        filtered,
        search, setSearch,
        filter, setFilter,
        isLoading, isError, error, refetch,
    } = useInventoryProductsFilter();

    return (
        <PageShell isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
            <div className="space-y-4">

                {needsSetup && (
                    <SetupBanner
                        href="/harees/settings"
                        description="Set up your expiry thresholds first so products and batches can be tracked."
                    />
                )}

                <TableToolbar
                    banner="Add expiry dates to track freshness and avoid waste, then tap Batch to review each batch's details and remaining stock."
                    search={search}
                    onSearch={setSearch}
                    filterOptions={FILTER_OPTIONS}
                    filterValue={filter}
                    onFilter={setFilter}
                    syncEndpoint="/harees/api/products/sync"
                    onSyncSuccess={() => refetch()}
                />

                <InventoryTable products={filtered} onExpiry={setExpiryTarget} />

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