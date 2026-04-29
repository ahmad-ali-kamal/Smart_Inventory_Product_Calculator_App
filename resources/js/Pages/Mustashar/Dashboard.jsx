// resources/js/Pages/Calculator/Dashboard.jsx
import { useState, useCallback } from 'react';
import { Link } from '@inertiajs/react';
import Layout from '../../Components/Layout';
import useMustasharGuard from '../../hooks/useMustasharGuard';
import StatCard from '../../Components/UI/StatCard';
import ProductRow from '../../Components/Mustashar/ProductRow';
import ProductTable from '../../Components/Mustashar/ProductTable';
import { useAllProducts, useToggleProduct, useCalculatorSettings } from '../../hooks/useProducts';

import { StatsSkeleton } from '../../Components/Common/StatsSkeleton';
import { ListSkeleton } from '../../Components/Common/ListSkeleton';

import { Package, CheckCircle2, Pencil } from 'lucide-react';

export default function Dashboard() {
    useMustasharGuard();

    const { products = [], isLoading } = useAllProducts();
    const { data: settings } = useCalculatorSettings();
    const toggleMutation = useToggleProduct();

    const activeProducts = products.filter((p) => p.active);
    const calcRules = settings
    ? [
        { label: 'Coverage', value: `${Number(settings.coverage).toFixed(2)} m²` },
        { label: 'Waste', value: `${Number(settings.waste).toFixed(0)}% waste` },
    ]
    : [];

    const [fadingIds, setFadingIds] = useState(new Set());

    const handleToggle = useCallback((id) => {
        setFadingIds((prev) => new Set(prev).add(id));

        setTimeout(() => {
            toggleMutation.mutate(id);

            setFadingIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }, 500);
    }, [toggleMutation]);

    if (isLoading) {
        return (
            <Layout>
                <div className="p-8 space-y-10">
                    <StatsSkeleton cards={3} />
                    <div className="space-y-6">
                        <div className="h-6 w-48 bg-[var(--muted)] rounded animate-pulse" />
                        <ListSkeleton items={5} />
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-8 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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

                    <StatCard
                        type="settings_preview"
                        rules={calcRules}
                    >
                        <Link href="/mustashar/settings">
                            <Pencil size={15} className="text-[var(--primary)]" strokeWidth={2} />
                        </Link>
                    </StatCard>
                </div>

                <div className="bg-[var(--card)] rounded-[20px] border border-[var(--border)] overflow-hidden">
                    <ProductTable
                        empty={
                            <div className="py-20 text-center text-xs font-bold uppercase tracking-widest opacity-30">
                                No active products
                            </div>
                        }
                    >
                        {activeProducts.map((product) => (
                            <ProductRow
                                key={product.id}
                                product={product}
                                onToggle={handleToggle}
                                fading={fadingIds.has(product.id)}
                            />
                        ))}
                    </ProductTable>
                </div>
            </div>
        </Layout>
    );
}