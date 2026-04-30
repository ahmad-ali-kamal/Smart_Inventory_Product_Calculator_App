import { useState, useRef, useEffect } from "react";
import { Search, SlidersHorizontal, RefreshCw, ChevronDown } from "lucide-react";
import Layout from '../../Components/Layout';
import useHareesGuard from '../../hooks/useHareesGuard';
import Card from '../../Components/UI/Card';
import InventoryProductRow from '../../Components/Harees/InventoryProductRow';
import ExpiryModal from '../../Components/Harees/ExpiryModal';

const MOCK_PRODUCTS = [
    {
        id: 'PRD-001',
        name: 'Paracetamol 500mg',
        sku: 'PCM-500',
        category: 'Medicines',
        image: 'https://placehold.co/40x40/e0f2fe/0284c7?text=P',
        dbQty: 120,
        formQty: 30,
        batches: [
            { id: 1, code: 'B-001', status: 'Expired', qty: 20,  expiryDate: '2025-11-01' },
            { id: 2, code: 'B-002', status: 'Valid',   qty: 100, expiryDate: '2027-03-15' },
        ],
    },
    {
        id: 'PRD-002',
        name: 'Vitamin C 1000mg',
        sku: 'VTC-1000',
        category: 'Supplements',
        image: 'https://placehold.co/40x40/fef9c3/ca8a04?text=V',
        dbQty: 85,
        formQty: 0,
        batches: [
            { id: 3, code: 'B-003', status: 'Approaching', qty: 85, expiryDate: '2026-07-20' },
        ],
    },
    {
        id: 'PRD-003',
        name: 'Ibuprofen 400mg',
        sku: 'IBU-400',
        category: 'Medicines',
        image: 'https://placehold.co/40x40/f0fdf4/16a34a?text=I',
        dbQty: 200,
        formQty: 50,
        batches: [
            { id: 4, code: 'B-004', status: 'Valid', qty: 200, expiryDate: '2028-01-10' },
        ],
    },
];

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
    const [filterOpen, setFilterOpen]     = useState(false);
    const [expiryTarget, setExpiryTarget] = useState(null);
    const filterRef                       = useRef(null);

    useEffect(() => {
        function handleClick(e) {
            if (filterRef.current && !filterRef.current.contains(e.target)) {
                setFilterOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
    fetch('/harees/api/products',  {
        headers: {
            Accept: 'application/json',
        },
        credentials: 'include',
    })
        .then(res => res.json())
        .then(data => {
            setProducts(data.products || data.data || []);
        })
        .catch(err => console.error('Products fetch error:', err))
        .finally(() => setLoading(false));
}, []);

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
    );
    if (loading) {
    return (
        <Layout>
            <div className="p-10 text-center text-sm text-[var(--muted-foreground)]">
                Loading products...
            </div>
        </Layout>
    );
}

    const activeLabel = FILTER_OPTIONS.find(o => o.value === filter)?.label ?? 'All';

    return (
        <Layout>
            <div className="space-y-4">

                {/* Banner */}
                <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-[var(--accent)] border border-[var(--primary)]/10 text-[var(--primary)] text-sm font-medium">
                    <span className="w-6 h-6 flex items-center justify-center bg-white rounded-full shadow-sm text-[var(--primary)] flex-shrink-0">ℹ</span>
                    <span>
    Click <strong>"Add Expiry Date"</strong> to start tracking expiry dates, 
    and click <strong>"Batch"</strong> to view each batch's details.
</span>
                </div>

                <Card>
                    {/* ── Toolbar ── */}
                    <div className="flex items-center gap-2 p-4 border-b border-[var(--border)]">

                        {/* Title + count */}
                        <div className="flex items-center gap-2 mr-auto">
                            <span className="text-sm font-bold text-[var(--foreground)] uppercase tracking-tight">Products</span>
                            
                        </div>

                        {/* Search — no border at all, just accent bg + purple text */}
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--accent)] w-60">
                            <Search size={14} className="text-[var(--primary)] flex-shrink-0" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Quick find product..."
                                className="bg-transparent text-xs text-[var(--primary)] focus:outline-none w-full placeholder:text-[var(--primary)]/50 caret-[var(--primary)]"
                            />
                        </div>

                        {/* Filter dropdown */}
                        <div className="relative" ref={filterRef}>
                            <button
                                onClick={() => setFilterOpen(o => !o)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                    filterOpen || filter !== 'all'
                                        ? 'bg-[var(--primary)] text-white'
                                        : 'bg-[var(--accent)] text-[var(--primary)]'
                                }`}
                            >
                                <SlidersHorizontal size={13} />
                                {activeLabel}
                                <ChevronDown size={12} className={`transition-transform duration-200 ${filterOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {filterOpen && (
                                <div className="absolute right-0 mt-2 w-36 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg z-50 overflow-hidden">
                                    {FILTER_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => { setFilter(opt.value); setFilterOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
                                                filter === opt.value
                                                    ? 'bg-[var(--accent)] text-[var(--primary)]'
                                                    : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)]/50 hover:text-[var(--foreground)]'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Refresh */}
                        <button className="p-2 rounded-xl bg-[var(--accent)] text-[var(--primary)] hover:opacity-80 transition-opacity">
                            <RefreshCw size={14} />
                        </button>
                    </div>

                    {/* ── Table ── */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse min-w-[700px]">
                            <thead>
                                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/20">
                                    <th className="p-4 w-[25%] text-left   text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-wider">Product</th>
                                    <th className="p-4 w-[15%] text-center text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-wider">Category</th>
                                    <th className="p-4 w-[15%] text-center text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-wider">Status</th>
                                    <th className="p-4 w-[15%] text-center text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-wider">Qty</th>
                                    <th className="p-4 w-[15%] text-center text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-wider">Expiry Info</th>
                                    <th className="p-4 w-[15%] text-center text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-wider">Action</th>
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
                        onSave={() => setExpiryTarget(null)}
                    />
                )}
            </div>
        </Layout>
    );
}