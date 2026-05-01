import { useState, useRef, useEffect } from "react";
import { Search, SlidersHorizontal, RefreshCw, ChevronDown } from "lucide-react";
import Layout from '../../Components/Layout';
import useHareesGuard from '../../hooks/useHareesGuard';
import Card from '../../Components/UI/Card';
import InventoryProductRow from '../../Components/Harees/InventoryProductRow';
import ExpiryModal from '../../Components/Harees/ExpiryModal';
import LoadingState from '../../Components/Common/LoadingState';
import ErrorState from '../../Components/Common/ErrorState';
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
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null); // إضافة حالة الخطأ
const fetchProducts = () => {
        setLoading(true);
        setError(null);
        fetch('/harees/api/products',  {
            headers: { Accept: 'application/json' },
            credentials: 'include',
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to load products');
                return res.json();
            })
            .then(data => {
                setProducts(data.products || data.data || []);
            })
            .catch(err => {
                console.error('Products fetch error:', err);
                setError(err.message);
            })
            .finally(() => setLoading(false));
    };

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
                <LoadingState />
            </Layout>
    );
}

if (error) {
        return (
            <Layout>
                <ErrorState message={error} onRetry={fetchProducts} />
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
    
    <div className="flex-1" />

    {/* 1. البحث - تم توحيد الارتفاع h-9 ليطابق الأزرار */}
    <div className="flex items-center gap-2 px-3 h-9 rounded-xl bg-[var(--accent)] w-40 sm:w-48 border border-[var(--primary)]/5 focus-within:border-[var(--primary)]/20 transition-all">
        <Search size={14} className="text-[var(--primary)]/60 flex-shrink-0" />
        <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="bg-transparent text-xs text-[var(--primary)] outline-none border-none focus:ring-0 w-full placeholder:text-[var(--primary)]/40 caret-[var(--primary)] p-0" 
        />
    </div>

    {/* 2. الفلتر - تم تعديل العرض ليكون ثابتاً */}
<div className="relative" ref={filterRef}>
    <button
        onClick={() => setFilterOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-bold transition-all justify-between border 
            /* هنا التعديل الأساسي: العرض الثابت */
            w-[115px] 
            ${
            filterOpen || filter !== 'all'
                ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                : 'bg-[var(--accent)] text-[var(--primary)] border-[var(--primary)]/5'
        }`}
    >
        {/* نستخدم flex-1 و truncate لضمان عدم تحرك العناصر الداخلية */}
        <div className="flex items-center gap-1.5 overflow-hidden">
            <SlidersHorizontal size={13} className="flex-shrink-0" />
            <span className="truncate">{activeLabel}</span>
        </div>
        <ChevronDown 
            size={12} 
            className={`flex-shrink-0 transition-transform duration-200 ${filterOpen ? 'rotate-180' : ''}`} 
        />
    </button>

    {/* القائمة المنسدلة - يفضل جعل عرضها مطابقاً للزر */}
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

    {/* 3. زر المزامنة - هو بالفعل h-9 (أي 36px) */}
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
                        onSave={() => setExpiryTarget(null)}
                    />
                )}
            </div>
        </Layout>
    );
}