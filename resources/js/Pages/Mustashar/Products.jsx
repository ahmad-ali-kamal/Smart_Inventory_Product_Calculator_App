// resources/js/Pages/Calculator/Products.jsx
import { useState, useMemo } from 'react';
import Layout from '../../Components/Layout';
import useMustasharGuard from '../../hooks/useMustasharGuard';
import Card from '../../Components/UI/Card';
import ProductRow from '../../Components/Mustashar/ProductRow';
import ProductTable from '../../Components/Mustashar/ProductTable';
import { useAllProducts } from '../../hooks/useProducts';
import { useToggleWithToast } from '../../hooks/useToggleWithToast';  // ← الهوك الموحد
import LoadingState from '../../Components/Common/LoadingState';
import ErrorState from '../../Components/Common/ErrorState';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown } from 'lucide-react';

export default function Products() {
    useMustasharGuard();

    const { products = [], isLoading, isError, error, refetch } = useAllProducts();

    // ← هوك موحد — حذفنا useToggleProduct و handleToggle المحلي
    const { handleToggle, isPending, variables } = useToggleWithToast(products);

    const [filter, setFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [search, setSearch] = useState('');

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
                const sku  = p.sku  || '';
                const matchSearch =
                    search === '' ||
                    name.toLowerCase().includes(search.toLowerCase()) ||
                    sku.toLowerCase().includes(search.toLowerCase());
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
                    <div className="relative">
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="appearance-none pl-3 pr-8 py-2 text-sm bg-[var(--card)] border border-[var(--border)] rounded-full text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] cursor-pointer"
                        >
                            {categories.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)] pointer-events-none" />
                    </div>
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