// resources/js/Pages/Calculator/Dashboard.jsx
import { useState, useCallback } from 'react';
import { router } from '@inertiajs/react';
import Layout from '../../Components/Layout';
import useMustasharGuard from '../../Hooks/useMustasharGuard';
import { useProducts } from '../../Context/ProductsContext'; 
import StatCard from '../../Components/UI/StatCard';
import ProductRow from '../../Components/Mustashar/ProductRow';
import ProductTable from '../../Components/Mustashar/ProductTable';

// استيراد السكيلتونز (تأكدي أن الملفات موجودة فعلاً في هذا المسار)
import { StatsSkeleton } from '../../Components/Common/StatsSkeleton';
import { ListSkeleton } from '../../Components/Common/ListSkeleton';

import { Package, Zap, SlidersHorizontal } from 'lucide-react';

export default function Dashboard() {
    useMustasharGuard();
    // تأكدي أن isLoading يتم تمريره من الـ Context
    const { products, activeProducts, calcRules, toggleProduct, isLoading } = useProducts();
    const [fadingIds, setFadingIds] = useState(new Set());

    // 1. فحص حالة التحميل
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

    // 2. دالة التبديل (Toggle)
    const handleToggle = useCallback((id) => {
        setFadingIds((prev) => new Set(prev).add(id));
        setTimeout(() => {
            toggleProduct(id);
            setFadingIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }, 500);
    }, [toggleProduct]);

    // 3. عرض الصفحة الأساسية
    return (
        <Layout>
            <div className="p-8 space-y-10 animate-in fade-in duration-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard 
                        title="Total Products" 
                        value={products?.length || 0} 
                        icon={Package} 
                    />
                    <StatCard 
                        title="Active Engines" 
                        value={activeProducts?.length || 0} 
                        icon={Zap} 
                        variant="accent"
                    />
                    <StatCard 
                        title="Active Rules" 
                        value={calcRules?.length || 0} 
                        icon={SlidersHorizontal} 
                    />
                </div>

                <div className="bg-[var(--card)] rounded-[2.5rem] border border-[var(--border)] overflow-hidden">
                    <ProductTable
                        empty={<div className="py-20 text-center opacity-40">No active products.</div>}
                    >
                        {activeProducts?.map((product) => (
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