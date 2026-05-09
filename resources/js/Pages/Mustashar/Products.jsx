// Pages/Calculator/Products.jsx
import { useState, useMemo } from 'react';
import useMustasharGuard from '../../Hooks/useMustasharGuard';
import PageShell from '../../Components/Common/PageShell';
import Card from '../../Components/Common/Card';
import ProductRow from '../../Components/Mustashar/ProductRow';
import ProductTable from '../../Components/Mustashar/ProductTable';
import { useAllProducts } from '../../Hooks/useProducts';
import { useToggleWithToast } from '../../Hooks/useToggleWithToast';
import { motion, AnimatePresence } from 'framer-motion';
import DropdownFilter from '../../Components/Common/DropdownFilter';
import SearchInput from '../../Components/Common/SearchInput';
import SyncButton from '../../Components/Common/SyncButton';

export default function Products() {
    useMustasharGuard();

    const { products = [], isLoading, isError, error, refetch } = useAllProducts();
    const { handleToggle, isPending, variables } = useToggleWithToast(products);

    const [search, setSearch]           = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    const categoryOptions = useMemo(
        () => ['All', ...new Set(products.map((p) => p.category || 'Uncategorized'))]
              .map(c => ({ value: c, label: c })),
        [products]
    );

    const sorted = useMemo(() => {
        return [...products]
            .filter((p) => {
                const matchCat    = categoryFilter === 'All' || p.category === categoryFilter;
                const matchSearch = !search ||
                    p.name?.toLowerCase().includes(search.toLowerCase()) ||
                    p.salla_product_id?.toString().includes(search);
                return matchCat && matchSearch;
            })
            .sort((a, b) => (a.active === b.active ? 0 : a.active ? -1 : 1));
    }, [products, categoryFilter, search]);

    return (
        <PageShell isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
            <div className="space-y-6">

                <div>
                    <h1 className="text-2xl font-semibold text-[var(--foreground)]">Products</h1>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        Manage product activation for the smart calculator.
                    </p>
                </div>

                <div className="flex items-start gap-3 bg-[var(--secondary)] border border-[var(--border)] rounded-xl px-4 py-3">
                    <svg className="w-4 h-4 text-[var(--primary)] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm">
                        <span className="font-semibold text-[var(--foreground)]">Activation Guide: </span>
                        <span className="text-[var(--muted-foreground)]">
                            Active products are highlighted and sorted to the top. Inactive products appear faded so you can spot gaps at a glance.
                        </span>
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex-1" />
                    <SearchInput value={search} onChange={setSearch} placeholder="Search products..." sanitize={true} />
                    <DropdownFilter options={categoryOptions} value={categoryFilter} onChange={setCategoryFilter} width="w-[130px]" />
                    <SyncButton endpoint="/mustashar/api/products/sync" onSyncSuccess={() => refetch()} />
                </div>

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
                                    transition={{ type: 'spring', stiffness: 300, damping: 30, opacity: { duration: 0.2 } }}
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
        </PageShell>
    );
}