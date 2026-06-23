import { useTranslation } from 'react-i18next';
import useMustasharGuard from "../../Hooks/useMustasharGuard";
import PageShell from "../../Components/Common/PageShell";
import SetupBanner from "../../Components/Common/Feedback/SetupBanner";
import TableToolbar from "../../Components/Common/Controls/TableToolbar";
import Pagination from "../../Components/Common/Controls/Pagination";
import Card from "../../Components/Common/UI/Card";
import ProductRow from "../../Components/Mustashar/ProductRow";
import ProductTable from "../../Components/Mustashar/ProductTable";
import { useProductsFilter } from "../../Hooks/useProductsFilter";
import { useSettingsStatus } from "../../Hooks/useProducts";
import { useToggleWithToast } from "../../Hooks/useToggleWithToast";

export default function Products() {
    const { t } = useTranslation('mustashar');
    useMustasharGuard();

    const {
        paginated,
        page, setPage,
        totalPages,
        sorted,
        search, setSearch,
        categoryFilter, setCategoryFilter,
        categoryOptions,
        isLoading, isError, error, refetch,
    } = useProductsFilter();

    const { isLoading: settingsLoading, isConfigured } = useSettingsStatus();
    const needsSetup = !settingsLoading && !isConfigured;

    const { handleToggle, isPending, variables } = useToggleWithToast();

    return (
        <PageShell isLoading={isLoading} isError={isError} error={error} context="products" onRetry={refetch}>
            <div className="space-y-6">

                {needsSetup && (
                    <SetupBanner
                        href="/qiasat/settings"
                        description={t('products.setup_banner_description')}
                    />
                )}

                <TableToolbar
                    banner={t('products.toolbar_banner')}
                    search={search}
                    onSearch={setSearch}
                    filterOptions={categoryOptions}
                    filterValue={categoryFilter}
                    onFilter={setCategoryFilter}
                    syncEndpoint="/mustashar/api/products/sync"
                    onSyncSuccess={() => refetch()}
                    placeholder={t('products.search_placeholder')}
                    filterWidth="w-32"
                />

                <Card>
                    <ProductTable>
                        {sorted.length > 0 ? (
                            paginated.map((product) => (
                                <ProductRow
                                    key={product.id}
                                    product={product}
                                    onToggle={handleToggle}
                                    loading={isPending && variables === product.id}
                                />
                            ))
                        ) : (
                            <div className="py-20 text-center text-sm text-[var(--muted-foreground)] uppercase font-black tracking-widest opacity-40">
                                {t('products.empty_state')}
                            </div>
                        )}
                    </ProductTable>
                </Card>

                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

            </div>
        </PageShell>
    );
}