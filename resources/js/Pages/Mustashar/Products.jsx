// resources/js/Pages/Calculator/Products.jsx
import { useState, useMemo, useRef, useEffect } from 'react';
import Layout from '../../Components/Layout';
import useMustasharGuard from '../../Hooks/useMustasharGuard';
import Card from '../../Components/UI/Card';
import ProductRow from '../../Components/Mustashar/ProductRow';
import ProductTable from '../../Components/Mustashar/ProductTable';
import { useAllProducts } from '../../Hooks/useProducts';
import { useToggleWithToast } from '../../Hooks/useToggleWithToast';  // ← الهوك الموحد
import LoadingState from '../../Components/Common/LoadingState';
import ErrorState from '../../Components/Common/ErrorState';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, SlidersHorizontal, RefreshCw } from 'lucide-react';

export default function Products() {
    useMustasharGuard();

    const { products = [], isLoading, isError, error, refetch } = useAllProducts();

    // ← هوك موحد — حذفنا useToggleProduct و handleToggle المحلي
    const { handleToggle, isPending, variables } = useToggleWithToast(products);

    const [filter, setFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [search, setSearch] = useState('');
    const categoryRef = useRef(null);

    const handleSync = async () => {
    try {
        const token = document.querySelector('meta[name="csrf-token"]')?.content;

        const res = await fetch('/mustashar/api/products/sync', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'X-CSRF-TOKEN': token,
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'include',
        });

        const text = await res.text();
        console.log('SYNC STATUS:', res.status);
        console.log('SYNC RESPONSE:', text);

        if (!res.ok) throw new Error(text || 'Sync failed');

window.location.reload();

       
    } catch (err) {
        console.error('Sync error:', err);
        alert('فشل مزامنة المنتجات');
    }
};

    useEffect(() => {
        function handleClick(e) {
            if (categoryRef.current && !categoryRef.current.contains(e.target)) {
                setCategoryOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const activeCount   = useMemo(() => products.filter((p) => p.active).length, [products]);
    const inactiveCount = products.length - activeCount;

    const categories = useMemo(
        () => ['All', ...new Set(products.map((p) => p.category || 'Uncategorized'))],
        [products]
    );

    const sorted = useMemo(() => {
        return [...products]
            .filter((p) => {
                const matchFilter =
                    filter === 'all' || (filter === 'active' ? p.active : !p.active);
                const matchCat =
                    categoryFilter === 'All' || p.category === categoryFilter;
                const name = p.name || '';
                const product_id = p.salla_product_id || '';
                const matchSearch =
                    search === '' ||
                    name.toLowerCase().includes(search.toLowerCase()) ||
                    product_id.toLowerCase().includes(search.toLowerCase());
                return matchFilter && matchCat && matchSearch;
            })
            .sort((a, b) => (a.active === b.active ? 0 : a.active ? -1 : 1));
    }, [products, filter, categoryFilter, search]);

    // ── Loading / Error guards ────────────────────────────────────────────────
    if (isLoading) return <Layout><LoadingState message="Loading products…" /></Layout>;
    if (isError)   return <Layout><ErrorState message={error?.message ?? 'Failed to load products.'} onRetry={refetch} /></Layout>;

    return (
        <Layout>
            <div className="space-y-6">

                {/* ── Page Header ──────────────────────────────────── */}
                <div>
                    <h1 className="text-2xl font-semibold text-[var(--foreground)]">Products</h1>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        Manage product activation for the smart calculator.
                    </p>
                </div>

                {/* ── Info Banner ──────────────────────────────────── */}
                <div className="flex items-start gap-3 bg-[var(--secondary)] border border-[var(--border)] rounded-xl px-4 py-3">
                    <svg
                        className="w-4 h-4 text-[var(--primary)] mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <p className="text-sm">
                        <span className="font-semibold text-[var(--foreground)]">Activation Guide: </span>
                        <span className="text-[var(--muted-foreground)]">
                            Active products are highlighted and sorted to the top. Inactive products appear
                            faded so you can spot gaps at a glance.
                        </span>
                    </p>
                </div>

                {/* ── Filter Bar ───────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {/* Status tabs */}
                    <div className="flex items-center border border-[var(--border)] rounded-full p-1 gap-1 bg-[var(--card)]">
                        {[
                            { key: 'all',      label: 'All',      count: products.length },
                            { key: 'active',   label: 'Active',   count: activeCount },
                            { key: 'inactive', label: 'Inactive', count: inactiveCount },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setFilter(tab.key)}
                                className={`px-3 py-1 rounded-full text-sm transition-colors flex items-center gap-1.5 ${
                                    filter === tab.key
                                        ? 'bg-[var(--muted)] text-[var(--foreground)] font-medium'
                                        : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                                }`}
                            >
                                {tab.label}{' '}
                                <span className="text-xs">{tab.count}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex-1" />

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                        <input
                            type="text"
                            placeholder="Quick find product..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 text-sm bg-[var(--card)] border border-[var(--border)] rounded-full text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] w-52"
                        />
                    </div>

                    {/* Category filter */}
                    <div className="relative" ref={categoryRef}>
                        <button
                            onClick={() => setCategoryOpen(o => !o)}
                            className={`flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-bold transition-all justify-between border w-[130px] ${
                                categoryOpen || categoryFilter !== 'All'
                                    ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                                    : 'bg-[var(--accent)] text-[var(--primary)] border-[var(--primary)]/5'
                            }`}
                        >
                            <div className="flex items-center gap-1.5 overflow-hidden">
                                <SlidersHorizontal size={13} className="flex-shrink-0" />
                                <span className="truncate">{categoryFilter}</span>
                            </div>
                            <ChevronDown
                                size={12}
                                className={`flex-shrink-0 transition-transform duration-200 ${categoryOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {categoryOpen && (
                            <div className="absolute right-0 mt-2 w-full bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg z-50 overflow-hidden">
                                {categories.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => { setCategoryFilter(c); setCategoryOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
                                            categoryFilter === c
                                                ? 'bg-[var(--accent)] text-[var(--primary)]'
                                                : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)]/50'
                                        }`}
                                    >
                                        {c}
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

                {/* ── Products Table ───────────────────────────────── */}
                <Card>
                    <ProductTable empty="All products are inactive. Activate products to include them in calculations.">
                        <AnimatePresence mode="popLayout">
                            {sorted.map((product) => (
                                <motion.div
                                    key={product.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 30,
                                        opacity: { duration: 0.2 }
                                    }}
                                >
                                    <ProductRow
                                        product={product}
                                        onToggle={handleToggle}
                                        loading={isPending && variables === product.id}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </ProductTable>
                </Card>

            </div>
        </Layout>
    );
}