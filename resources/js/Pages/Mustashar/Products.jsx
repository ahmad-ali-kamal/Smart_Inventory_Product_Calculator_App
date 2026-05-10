import useMustasharGuard from '../../Hooks/useMustasharGuard';
import PageShell from '../../Components/Common/PageShell';
import TableToolbar from '../../Components/Common/TableToolbar';
import Card from '../../Components/Common/Card';
import ProductRow from '../../Components/Mustashar/ProductRow';
import ProductTable from '../../Components/Mustashar/ProductTable';
import { useProductsFilter } from '../../Hooks/useProductsFilter';
import { useToggleWithToast } from '../../Hooks/useToggleWithToast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Products() {
    useMustasharGuard();

    const {
        sorted,
        search, setSearch,
        categoryFilter, setCategoryFilter,
        categoryOptions,
        isLoading, isError, error, refetch,
    } = useProductsFilter();

    const { handleToggle, isPending, variables } = useToggleWithToast(sorted);

    return (
        <PageShell isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
            <div className="space-y-6">
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

                <Card>
                    <ProductTable empty="All products are inactive. Activate products to include them in calculations.">
                        <AnimatePresence mode="popLayout">
                            {sorted.map(product => (
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