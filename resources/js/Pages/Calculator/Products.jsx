// resources/js/Pages/Calculator/Products.jsx
import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import Layout from '../../Components/Layout';
import Card from '../../Components/UI/Card';
import ProductRow from '../../Components/Calculator/ProductRow';
import ProductTable from '../../Components/Calculator/ProductTable';
import { useAllProducts, useToggleProduct } from '../../hooks/useProducts';
import LoadingState from '../../Components/Common/LoadingState'; // Fixed Path
import ErrorState from '../../Components/Common/ErrorState';     // Fixed Path

import { Search, ChevronDown } from 'lucide-react';

export default function Products() {
    // داخل صفحة Products.jsx
const { products, isLoading, isError, error, refetch } = useAllProducts();

if (isLoading) return <LoadingState />;
    
   // داخل ملف Products.jsx

if (isError) return (
    <Layout>
        <div className="p-6">
            <Card>
                <ErrorState 
                    error={error} // نمرر الخطأ كاملاً هنا
                    onRetry={() => refetch()} 
                />
            </Card>
        </div>
    </Layout>
);

    const [filter, setFilter]             = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [search, setSearch]             = useState('');

    // ── Derived counts (based on raw products before status filter) ──────────
    const activeCount   = useMemo(() => products.filter((p) => p.active).length, [products]);
    const inactiveCount = products.length - activeCount;

    const categories = useMemo(
        () => ['All', ...new Set(products.map((p) => p.category))],
        [products]
    );

    /**
     * sorted — filtered + sorted list:
     *  1. Apply status / category / search filters.
     *  2. Active products always float to the top.
     */
    const sorted = useMemo(() => {
        return [...products]
            .filter((p) => {
                const matchFilter =
                    filter === 'all' ||
                    (filter === 'active' ? p.active : !p.active);
                const matchCat =
                    categoryFilter === 'All' || p.category === categoryFilter;
                const matchSearch =
                    search === '' ||
                    p.name.toLowerCase().includes(search.toLowerCase()) ||
                    p.sku.toLowerCase().includes(search.toLowerCase());
                return matchFilter && matchCat && matchSearch;
            })
            .sort((a, b) => (a.active === b.active ? 0 : a.active ? -1 : 1));
    }, [products, filter, categoryFilter, search]);

    // ── Toggle handler with toast feedback ───────────────────────────────────
    // Mirrors the legacy showToast + optimistic updateRow pattern.
    // The optimistic update lives in useToggleProduct (onMutate).
    // Here we only fire the mutation and react to the settled state.
    function handleToggle(productId) {
        // Derive what the product's CURRENT state is before the flip
        const product = products.find((p) => p.id === productId);
        const willBeActive = product ? !product.active : false;

        toggleMutation.mutate(productId, {
            onSuccess: (data) => {
                // data.is_enabled mirrors the legacy API response shape
                const isEnabled = data?.is_enabled ?? willBeActive;
                toast.success(
                    isEnabled ? 'Product activated' : 'Product deactivated',
                    { duration: 3000 }
                );
            },
            onError: () => {
                toast.error('Something went wrong. Please try again.', {
                    duration: 3000,
                });
            },
        });
    }

    // ── Loading / Error guards ────────────────────────────────────────────────
    if (isLoading) return <Layout><LoadingState message="Loading products…" /></Layout>;
    if (isError)   return <Layout><ErrorState message={error?.message ?? 'Failed to load products.'} /></Layout>;

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
                    <ProductTable
                        empty={
                            <div className="py-16 text-center text-sm text-[var(--muted-foreground)] uppercase font-black tracking-widest opacity-40">
                                No products match your filters.
                            </div>
                        }
                    >
                        {sorted.map((product) => (
                            <div
                                key={product.id}
                                className={`transition-opacity duration-500 ${
                                    product.active ? 'opacity-100' : 'opacity-40'
                                }`}
                            >
                                <ProductRow
                                    product={product}
                                    onToggle={handleToggle}
                                    // Pass loading state so Toggle can show a spinner
                                    // while this specific product's mutation is in-flight
                                    loading={
                                        toggleMutation.isPending &&
                                        toggleMutation.variables === product.id
                                    }
                                    fading={false}
                                />
                            </div>
                        ))}
                    </ProductTable>
                </Card>

            </div>
        </Layout>
    );
}