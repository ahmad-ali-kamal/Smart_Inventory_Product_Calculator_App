// resources/js/Pages/Calculator/Dashboard.jsx
import { useState, useCallback } from 'react';
import Layout from '../../Components/Layout';
import { useProducts } from '../../Context/ProductsContext';
import StatCard from '../../Components/UI/StatCard';
import ProductRow from '../../Components/Calculator/ProductRow';
import ProductTable from '../../Components/Calculator/ProductTable';
import useMustasharGuard from '../../hooks/useMustasharGuard';
import { useProducts } from '../../Context/ProductsContext'; 
import StatCard from '../../Components/UI/StatCard';
import ProductRow from '../../Components/Mustashar/ProductRow';
import ProductTable from '../../Components/Mustashar/ProductTable';

// استيراد السكيلتونز (تأكدي أن الملفات موجودة فعلاً في هذا المسار)
import { StatsSkeleton } from '../../Components/Common/StatsSkeleton';
import { ListSkeleton } from '../../Components/Common/ListSkeleton';
import { Package, CheckCircle2, Pencil } from 'lucide-react';
import { Link } from '@inertiajs/react';

export default function Dashboard() {
    useMustasharGuard();
    // تأكدي أن isLoading يتم تمريره من الـ Context
    const { products, activeProducts, calcRules, toggleProduct, isLoading } = useProducts();
    const [fadingIds, setFadingIds] = useState(new Set());

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

    return (
        <Layout>
            <div className="p-8 space-y-10">

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <StatCard
                        label="Total Products"
                        value={products?.length || 0}
                        icon={<Package className="w-4 h-4" />}
                        sub="In your store"
                    />
                    <StatCard
                        label="Activated"
                        value={activeProducts?.length || 0}
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

                {/* Product Table */}
                <div className="bg-[var(--card)] rounded-[20px] border border-[var(--border)] overflow-hidden">
                    <ProductTable
                        empty={
                            <div className="py-20 text-center text-xs font-bold uppercase tracking-widest opacity-30">
                                No active products
                            </div>
                        }
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