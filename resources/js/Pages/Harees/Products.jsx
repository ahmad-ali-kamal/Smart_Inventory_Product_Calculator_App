// Pages/Harees/Products.jsx
import { useState, useMemo } from "react";
import useHareesGuard from '../../Hooks/useHareesGuard';
import PageShell from '../../Components/Common/PageShell';
import TableToolbar from '../../Components/Common/TableToolbar';
import Card from '../../Components/Common/Card';
import InventoryProductRow from '../../Components/Harees/InventoryProductRow';
import ExpiryModal from '../../Components/Harees/ExpiryModal';
import { useInventoryProducts } from "../../Hooks/useInventory";

const FILTER_OPTIONS = [
    { value: 'all',    label: 'All'    },
    { value: 'short',  label: 'Short'  },
    { value: 'medium', label: 'Medium' },
    { value: 'long',   label: 'Long'   },
];

export default function Products() {
    useHareesGuard();

    const [search, setSearch]             = useState("");
    const [filter, setFilter]             = useState('all');
    const [expiryTarget, setExpiryTarget] = useState(null);

    const { data, isLoading, isError, error, refetch } = useInventoryProducts();

    const products = useMemo(() => data?.products || data?.data || [], [data]);

    const handleExpirySave = async () => {
        await refetch();
    };

    const filtered = products.filter(p => {
        const matchesSearch =
            p.name?.toLowerCase().includes(search.toLowerCase()) ||
            p.salla_product_id?.toString().toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'all' || p.bucket_type === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <PageShell isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
            <div className="space-y-4">

                {/* ── Toolbar + Banner — خارج الـ Card ── */}
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

                {/* ── Table ── */}
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse min-w-[700px]">
                            <thead>
                                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/20">
                                    <th className="p-4 w-[16%] text-left   text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-wider">Product</th>
                                    <th className="p-4 w-[16%] text-center text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-wider">Category</th>
                                    <th className="p-4 w-[16%] text-center text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-wider">Status</th>
                                    <th className="p-4 w-[16%] text-center text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-wider">Qty</th>
                                    <th className="p-4 w-[16%] text-center text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-wider">Expiry Info</th>
                                    <th className="p-4 w-[20%] text-center text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length > 0 ? (
                                    filtered.map(product => (
                                        <InventoryProductRow
                                            key={product.id}
                                            product={product}
                                            onExpiry={setExpiryTarget}
                                        />
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center text-sm text-[var(--muted-foreground)]">
                                            No products found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {expiryTarget && (
                    <ExpiryModal
                        product={expiryTarget}
                        onClose={() => setExpiryTarget(null)}
                        onSave={handleExpirySave}
                    />
                )}

            </div>
        </PageShell>
    );
}