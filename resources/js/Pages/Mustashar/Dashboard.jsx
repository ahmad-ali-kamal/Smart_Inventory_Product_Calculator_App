// resources/js/Pages/Calculator/Dashboard.jsx
import { Link } from '@inertiajs/react';
import Layout from '../../Components/Layout';
import useMustasharGuard from '../../Hooks/useMustasharGuard';
import StatCard from '../../Components/UI/StatCard';
import ProductRow from '../../Components/Mustashar/ProductRow';
import ProductTable from '../../Components/Mustashar/ProductTable';
import LoadingState from '../../Components/Common/LoadingState';
import ErrorState from '../../Components/Common/ErrorState';
import { useAllProducts, useCalculatorSettings } from '../../Hooks/useProducts';
import { useToggleWithToast } from '../../Hooks/useToggleWithToast';  // ← الهوك الموحد
import { Package, CheckCircle2, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
    useMustasharGuard();

    const { products = [], isLoading, isError, error } = useAllProducts();
    const { data: settings } = useCalculatorSettings();

    // ← هوك موحد — نفس السلوك تماماً مثل Products
    const { handleToggle, isPending, variables } = useToggleWithToast(products);

    // ── Loading / Error guards (مطابقة لـ Products) ──────────────────────
    if (isLoading) return <Layout><LoadingState message="Loading dashboard…" /></Layout>;
    if (isError)   return <Layout><ErrorState message={error?.message ?? 'Failed to load products.'} /></Layout>;

    const activeProducts = products.filter((p) => p.active);

    const calcRules = settings ? [
        { label: 'Coverage', value: `${Number(settings.coverage).toFixed(2)} m²` },
        { label: 'Waste',    value: `${Number(settings.waste).toFixed(0)}% waste` },
    ] : [];

    return (
        <Layout>
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard
                        label="Total Products"
                        value={products.length}
                        icon={<Package className="w-4 h-4" />}
                        sub="In your store"
                    />
                    <StatCard
                        label="Activated"
                        value={activeProducts.length}
                        icon={<CheckCircle2 className="w-4 h-4" />}
                        sub="Live on storefront"
                    />
                    <StatCard type="settings_preview" rules={calcRules}>
                        <Link href="/mustashar/settings">
                            <Pencil size={15} className="text-[var(--primary)]" />
                        </Link>
                    </StatCard>
                </div>

                <div className="bg-[var(--card)] rounded-[20px] border border-[var(--border)] overflow-hidden">
                  <ProductTable empty="No active products available">
    {activeProducts.length > 0 && (
        <AnimatePresence mode="popLayout">
            {activeProducts.map((product) => (
                <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                >
                    <ProductRow
                        product={product}
                        onToggle={handleToggle}
                        loading={isPending && variables === product.id}
                    />
                </motion.div>
            ))}
        </AnimatePresence>
    )}
</ProductTable>
                </div>
            </div>
        </Layout>
    );
}