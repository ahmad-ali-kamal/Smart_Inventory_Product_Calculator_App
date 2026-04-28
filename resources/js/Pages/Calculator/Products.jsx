// resources/js/Pages/Calculator/Products.jsx
import { useState, useMemo } from 'react';
import Layout from '../../Components/Layout';
import Card from '../../Components/UI/Card';
import { useProducts } from '../../Context/ProductsContext';
import { Search, ChevronDown } from 'lucide-react';

export default function Products() {
    const { products, activeProducts, toggleProduct } = useProducts();
    const [filter, setFilter]           = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [search, setSearch]           = useState('');

    const categories = useMemo(() => ['All', ...new Set(products.map((p) => p.category))], [products]);

    const sorted = useMemo(() => {
        return [...products]
            .filter((p) => {
                const matchFilter = filter === 'all' || (filter === 'active' ? p.active : !p.active);
                const matchCat    = categoryFilter === 'All' || p.category === categoryFilter;
                const matchSearch = search === '' || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
                return matchFilter && matchCat && matchSearch;
            })
            .sort((a, b) => (a.active === b.active ? 0 : a.active ? -1 : 1));
    }, [products, filter, categoryFilter, search]);

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-[var(--foreground)]">Products</h1>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">Manage product activation for the smart calculator.</p>
                </div>

                <div className="flex items-start gap-3 bg-[var(--secondary)] border border-[var(--border)] rounded-xl px-4 py-3">
                    <svg className="w-4 h-4 text-[var(--primary)] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm">
                        <span className="font-semibold text-[var(--foreground)]">Activation Guide: </span>
                        <span className="text-[var(--muted-foreground)]">Active products are highlighted and sorted to the top. Inactive products appear faded so you can spot gaps at a glance.</span>
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex items-center border border-[var(--border)] rounded-full p-1 gap-1 bg-[var(--card)]">
                        {[
                            { key: 'all',      label: 'All',      count: products.length },
                            { key: 'active',   label: 'Active',   count: activeProducts.length },
                            { key: 'inactive', label: 'Inactive', count: products.length - activeProducts.length },
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
                                {tab.label} <span className="text-xs">{tab.count}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex-1" />

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

                    <div className="relative">
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="appearance-none pl-3 pr-8 py-2 text-sm bg-[var(--card)] border border-[var(--border)] rounded-full text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] cursor-pointer"
                        >
                            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)] pointer-events-none" />
                    </div>
                </div>

                <Card>
                    <div className="hidden md:grid grid-cols-[1fr_8rem_7rem_5rem] gap-4 px-6 py-3 border-b border-[var(--border)]">
                        {['Product', 'Category', 'Status', 'Active'].map((col) => (
                            <span key={col} className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">{col}</span>
                        ))}
                    </div>

                    <div className="divide-y divide-[var(--border)]">
                        {sorted.map((product) => (
                            <div
                                key={product.id}
                                className={`flex flex-col sm:grid sm:grid-cols-[1fr_8rem_7rem_5rem] gap-2 sm:gap-4 px-6 py-4 items-start sm:items-center transition-opacity ${product.active ? 'opacity-100' : 'opacity-40'}`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-[var(--muted)] flex-shrink-0">
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-[var(--foreground)] truncate">{product.name}</p>
                                        <p className="text-xs text-[var(--muted-foreground)]">{product.sku}</p>
                                    </div>
                                </div>

                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${product.active ? 'bg-[var(--secondary)] text-[var(--secondary-foreground)]' : 'text-[var(--muted-foreground)]'}`}>
                                    {product.category}
                                </span>

                                <div className="flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${product.active ? 'bg-emerald-500' : 'bg-[var(--muted-foreground)]'}`} />
                                    <span className={`text-xs font-medium ${product.active ? 'text-emerald-600' : 'text-[var(--muted-foreground)]'}`}>
                                        {product.active ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        role="switch"
                                        aria-checked={product.active}
                                        onClick={() => toggleProduct(product.id)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${product.active ? 'bg-[var(--primary)]' : 'bg-[var(--switch-background)]'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${product.active ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </Layout>
    );
}