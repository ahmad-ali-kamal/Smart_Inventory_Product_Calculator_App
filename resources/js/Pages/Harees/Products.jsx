// Pages/Harees/Products.jsx
import { useState, useMemo } from "react";
import useHareesGuard from '../../Hooks/useHareesGuard';
import PageShell from '../../Components/Common/PageShell';
import Card from '../../Components/Common/Card';
import InventoryProductRow from '../../Components/Harees/InventoryProductRow';
import ExpiryModal from '../../Components/Harees/ExpiryModal';
import { useInventoryProducts } from "../../Hooks/useInventory";
import SearchInput from '../../Components/Common/SearchInput';
import DropdownFilter from '../../Components/Common/DropdownFilter';
import SyncButton from '../../Components/Common/SyncButton';

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

                <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-[var(--accent)] border border-[var(--primary)]/10 text-[var(--primary)] text-sm font-medium">
                    <span className="w-6 h-6 flex items-center justify-center bg-white rounded-full shadow-sm text-[var(--primary)] flex-shrink-0">ℹ</span>
                    <span>
                        Click <strong>"Add Expiry Date"</strong> to start tracking expiry dates,
                        and click <strong>"Batch"</strong> to view each batch's details.
                    </span>
                </div>

                <Card>
                    <div className="flex items-center gap-2 p-4 border-b border-[var(--border)]">
                        <div className="flex-1" />
                        <SearchInput value={search} onChange={setSearch} placeholder="Search..." sanitize={true} />
                        <DropdownFilter options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
                        <SyncButton endpoint="/harees/api/products/sync" onSyncSuccess={() => refetch()} />
                    </div>

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