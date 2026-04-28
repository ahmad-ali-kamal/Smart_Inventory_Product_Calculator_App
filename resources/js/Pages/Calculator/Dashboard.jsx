// resources/js/Pages/Calculator/Dashboard.jsx
import { router } from '@inertiajs/react';
import Layout from '../../Components/Layout';
import { useProducts } from '../../Context/ProductsContext';
import Card from '../../Components/UI/Card';
import StatCard from '../../Components/UI/StatCard';
import ProductRow from '../../Components/UI/ProductRow';
import { Package, Zap, SlidersHorizontal } from 'lucide-react';

export default function Dashboard() {
    const { products, activeProducts, calcRules } = useProducts();

    return (
        <Layout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-semibold text-[var(--foreground)]">Dashboard</h1>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        Overview of your Smart Product Calculator configuration.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard
                        icon={<Package className="w-5 h-5" />}
                        label="Total Products"
                        value={products.length}
                        sub="in catalogue"
                    />
                    <StatCard
                        icon={<Zap className="w-5 h-5" />}
                        label="Activated"
                        value={activeProducts.length}
                        sub={`${products.length - activeProducts.length} inactive`}
                        subHighlight={`↑ ${Math.round((activeProducts.length / products.length) * 100)}% enabled`}
                    />
                    <StatCard
                        icon={<SlidersHorizontal className="w-5 h-5" />}
                        label="Calculation Rules"
                        value={
                            <span className="text-xl font-semibold">
                                {calcRules.coverage.toFixed(2)}{' '}
                                <span className="text-sm font-normal text-[var(--muted-foreground)]">sqm / unit</span>
                            </span>
                        }
                        sub={
                            <span>
                                <span className="text-[var(--foreground)] font-medium">{calcRules.waste.toFixed(2)}%</span>{' '}
                                waste margin
                            </span>
                        }
                        action="Edit"
                        onAction={() => router.visit('/settings')}
                    />
                </div>

                <Card>
                    <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-[var(--foreground)]">Activated Products</h2>
                            <p className="text-sm text-[var(--muted-foreground)]">
                                Products currently enabled in the smart calculator
                            </p>
                        </div>
                        <button
                            onClick={() => router.visit('/products')}
                            className="flex items-center gap-1.5 bg-[var(--primary)] text-white text-sm font-medium px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
                        >
                            Manage All
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    <div className="px-6 hidden md:grid grid-cols-[1fr_8rem_6rem_5rem] gap-4 py-2.5 border-b border-[var(--border)]">
                        {['Product', 'Category', 'Status', ''].map((col) => (
                            <span key={col} className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">{col}</span>
                        ))}
                    </div>

                    <div className="px-4">
                        {activeProducts.length === 0 ? (
                            <div className="py-12 text-center text-[var(--muted-foreground)] text-sm">
                                No active products.{' '}
                                <button onClick={() => router.visit('/products')} className="text-[var(--primary)] underline">
                                    Go to Products
                                </button>
                            </div>
                        ) : (
                            activeProducts.map((product) => (
                                <ProductRow
                                    key={product.id}
                                    product={product}
                                    showToggle={false}
                                    onManage={() => router.visit('/products')}
                                />
                            ))
                        )}
                    </div>

                    <div className="px-6 py-3 border-t border-[var(--border)] flex items-center justify-between">
                        <span className="text-sm text-[var(--muted-foreground)]">
                            {activeProducts.length} of {products.length} products enabled
                        </span>
                        <button
                            onClick={() => router.visit('/products')}
                            className="text-sm text-[var(--primary)] hover:underline flex items-center gap-1"
                        >
                            View all
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </Card>
            </div>
        </Layout>
    );
}