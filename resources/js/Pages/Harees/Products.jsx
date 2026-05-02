import { useState, useRef, useEffect } from "react";
import { Search, SlidersHorizontal, RefreshCw, ChevronDown } from "lucide-react";
import Layout from '../../Components/Layout';
import useHareesGuard from '../../hooks/useHareesGuard';
import Card from '../../Components/UI/Card';
import InventoryProductRow from '../../Components/Harees/InventoryProductRow';
import ExpiryModal from '../../Components/Harees/ExpiryModal';
import LoadingState from '../../Components/Common/LoadingState';
import ErrorState from '../../Components/Common/ErrorState';

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

    const handleSync = async () => {
        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.content;
            const res = await fetch('/harees/api/products/sync', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Sync failed');
            window.location.reload();
        } catch (err) {
            console.error('Sync error:', err);
            alert('فشل مزامنة المنتجات');
        }
    };

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
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState(null);

    const fetchProducts = () => {
        setLoading(true);
        setError(null);
        fetch('/harees/api/products', {
            headers: { Accept: 'application/json' },
            credentials: 'include',
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to load products');
                return res.json();
            })
            .then(data => setProducts(data.products || data.data || []))
            .catch(err => { console.error(err); setError(err.message); })
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchProducts(); }, []);

    // ── بعد حفظ أو حذف الـ Expiry: نحدث المنتج في الـ state محلياً ──
    const handleExpirySave = (productId, responseData) => {
        if (!responseData) { setExpiryTarget(null); return; }

        setProducts(prev => prev.map(p => {
            if (p.id !== productId) return p;

            // حذف كامل (reset) — نفرّغ الباتشات
            if (responseData.reset) {
                return { ...p, batches: [] };
            }

            // single batch
            if (responseData.type === 'single') {
                return {
                    ...p,
                    batches: [{
                        id: responseData.batch_id,
                        batch_code: responseData.batch_code,
                        quantity: p.quantity ?? p.dbQty ?? 0,
                        status: responseData.status || 'green',
                        expiry_date: responseData.expiry_date || null,
                    }],
                };
            }

            // multiple batches
            if (responseData.batches && responseData.batches.length > 0) {
                return {
                    ...p,
                    batches: responseData.batches.map(b => ({
                        id: b.id,
                        batch_code: b.batch_code,
                        quantity: b.qty,
                        status: b.status || 'green',
                        expiry_date: b.expiry_date,
                    })),
                };
            }

            return p;
        }));

        setExpiryTarget(null);
    };

    const filtered = products.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return <Layout><LoadingState /></Layout>;
    }

    if (error) {
        return <Layout><ErrorState message={error} onRetry={fetchProducts} /></Layout>;
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
                        <div className="flex-1" />

                        <div className="flex items-center gap-2 px-3 h-9 rounded-xl bg-[var(--accent)] w-40 sm:w-48 border border-[var(--primary)]/5 focus-within:border-[var(--primary)]/20 transition-all">
                            <Search size={14} className="text-[var(--primary)]/60 flex-shrink-0" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search..."
                                className="bg-transparent text-xs text-[var(--primary)] outline-none border-none focus:ring-0 w-full placeholder:text-[var(--primary)]/40 caret-[var(--primary)] p-0"
                            />
                        </div>

                        <div className="relative" ref={filterRef}>
                            <button
                                onClick={() => setFilterOpen(o => !o)}
                                className={`flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-bold transition-all justify-between border w-[115px] ${
                                    filterOpen || filter !== 'all'
                                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                                        : 'bg-[var(--accent)] text-[var(--primary)] border-[var(--primary)]/5'
                                }`}
                            >
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                    <SlidersHorizontal size={13} className="flex-shrink-0" />
                                    <span className="truncate">{activeLabel}</span>
                                </div>
                                <ChevronDown
                                    size={12}
                                    className={`flex-shrink-0 transition-transform duration-200 ${filterOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {filterOpen && (
                                <div className="absolute right-0 mt-2 w-full bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg z-50 overflow-hidden">
                                    {FILTER_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => { setFilter(opt.value); setFilterOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
                                                filter === opt.value
                                                    ? 'bg-[var(--accent)] text-[var(--primary)]'
                                                    : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)]/50'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleSync}
                            className="h-9 w-9 rounded-xl bg-[var(--accent)] text-[var(--primary)] hover:opacity-80 transition-opacity flex items-center justify-center border border-[var(--primary)]/5 flex-shrink-0"
                        >
                            <RefreshCw size={14} />
                        </button>
                    </div>

                    {/* ── Table ── */}
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
        </Layout>
    );
}