// resources/js/Pages/Calculator/Dashboard.jsx
import { useState, useCallback } from 'react';
import Layout from '../../Components/Layout';
import useMustasharGuard from '../../hooks/useMustasharGuard';
import StatCard from '../../Components/UI/StatCard';
import ProductRow from '../../Components/Mustashar/ProductRow';
import ProductTable from '../../Components/Mustashar/ProductTable';
import { useAllProducts, useToggleProduct } from '../../hooks/useProducts';

import { StatsSkeleton } from '../../Components/Common/StatsSkeleton';
import { ListSkeleton } from '../../Components/Common/ListSkeleton';

import { Package, Zap, SlidersHorizontal } from 'lucide-react';

export default function Dashboard() {
    useMustasharGuard();

    const { products = [], isLoading } = useAllProducts();
    const toggleMutation = useToggleProduct();

    const activeProducts = products.filter((p) => p.active);
    const calcRules = [];

    const [fadingIds, setFadingIds] = useState(new Set());

    // ✅ لازم يكون قبل أي return
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

    // ✅ شرط التحميل بعد تعريف الـ hooks
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
            <div className="p-8 space-y-10 animate-in fade-in duration-700">
                
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard 
                        title="Total Products" 
                        value={products.length} 
                        icon={Package} 
                    />
                    <StatCard 
                        title="Active Engines" 
                        value={activeProducts.length} 
                        icon={Zap} 
                        variant="accent"
                    />
                    <StatCard 
                        title="Active Rules" 
                        value={calcRules.length} 
                        icon={SlidersHorizontal} 
                    />
                </div>

                {/* Table */}
                <div className="bg-[var(--card)] rounded-[2.5rem] border border-[var(--border)] overflow-hidden">
                    <ProductTable
                        empty={
                            <div className="py-20 text-center opacity-40">
                                No active products.
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