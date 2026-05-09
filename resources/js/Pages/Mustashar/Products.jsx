// Pages/Calculator/Products.jsx
import { useState, useMemo } from 'react';
import useMustasharGuard from '../../Hooks/useMustasharGuard';
import PageShell from '../../Components/Common/PageShell';
import TableToolbar from '../../Components/Common/TableToolbar';
import Card from '../../Components/Common/Card';
import ProductRow from '../../Components/Mustashar/ProductRow';
import ProductTable from '../../Components/Mustashar/ProductTable';
import { useAllProducts } from '../../Hooks/useProducts';
import { useToggleWithToast } from '../../Hooks/useToggleWithToast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Products() {
    useMustasharGuard();

    const { products = [], isLoading, isError, error, refetch } = useAllProducts();
    const { handleToggle, isPending, variables } = useToggleWithToast(products);

    const [search, setSearch]               = useState('');
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

                {/* ── Toolbar + Banner ── */}
                <TableToolbar
                    banner="Active products sort to the top so you can spot them fast; inactive ones appear faded to easily highlight catalog gaps."
                    search={search}
                    onSearch={setSearch}
                    filterOptions={categoryOptions}
                    filterValue={categoryFilter}
                    onFilter={setCategoryFilter}
                    syncEndpoint="/mustashar/api/products/sync"
                    onSyncSuccess={() => refetch()}
                    placeholder="Search products..."
                    filterWidth="w-[130px]"
                />

                {/* ── Products Table ── */}
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