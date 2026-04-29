import { useState } from 'react';
import Navbar from '../Components/Dashboard/Navbar';
import StatCard from '../Components/Dashboard/StatCard';
import ProductTable from '../Components/Calculator/ProductTable';
import EmptyState from '../Components/Dashboard/EmptyState';

const MOCK_SETTINGS = {
    coverage_per_unit: '8.00',
    waste_percentage: '9.00',
};

const MOCK_PRODUCTS = [
    { id: 41, sku: 41, name: 'بلوزة',  subtitle: "Blouse — Women's", category: 'الجاكيتات', enabled: true },
    { id: 42, sku: 42, name: 'بلوزة',  subtitle: "Blouse — Women's", category: 'الجاكيتات', enabled: true },
];

export default function Dashboard() {
    const [products, setProducts] = useState(MOCK_PRODUCTS);

    const stats = {
        total_products: 20,
        enabled_products: products.filter((p) => p.enabled).length,
    };

    const settings = MOCK_SETTINGS;
    const enabledProducts = products.filter((p) => p.enabled);
    const activationPct = stats.total_products
        ? Math.round((stats.enabled_products / stats.total_products) * 100)
        : 0;

    const handleToggle = (id, value) => {
        setProducts((list) =>
            list.map((p) => (p.id === id ? { ...p, enabled: value } : p))
        );
    };

    return (
        <div className="dashboard-root min-h-screen">
      <div dir="ltr" className="min-h-screen bg-[#f8f8fb] text-neutral-900 font-sans" style={{ color: 'inherit', backgroundColor: '#f8f8fb' }}>
            <Navbar active="dashboard" />

            <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">

                {/* Heading */}
                <header className="space-y-2">
                    <p className="text-[0.7rem] font-semibold tracking-[0.22em] text-neutral-500 uppercase">
                        Store Overview
                    </p>
                    <h1 className="text-4xl md:text-5xl font-light text-neutral-900 tracking-tight">
                        Your store,{' '}
                        <span className="font-semibold">at a </span>
                        <span className="font-semibold text-violet-600">glance.</span>
                    </h1>
                </header>

                {/* Stats */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-5">

                    <StatCard
                        variant="purple"
                        label="Total Products"
                        sublabel="In your store"
                        icon={<BoxIcon />}
                    >
                        <span>{stats.total_products}</span>
                        <p className="mt-3 text-xs text-neutral-400 font-normal tracking-wide">
                            across all categories
                        </p>
                    </StatCard>

                    <StatCard
                        variant="dark"
                        label="Activated"
                        sublabel="Calculator enabled"
                        icon={<CheckIcon />}
                    >
                        <span>{stats.enabled_products}</span>

                        <div className="mt-4 space-y-2">
                            <div className="h-px bg-neutral-100 relative overflow-hidden rounded-full">
                                <div
                                    className="absolute inset-y-0 left-0 bg-neutral-900 rounded-full transition-all duration-700"
                                    style={{ width: `${activationPct}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[0.7rem] text-neutral-400 font-normal tracking-wide">
                                <span>0</span>
                                <span>{activationPct}% activated</span>
                                <span>{stats.total_products}</span>
                            </div>
                        </div>
                    </StatCard>

                    <StatCard
                        variant="soft"
                        label="Settings"
                        sublabel="Calculator defaults"
                        icon={<GearIcon />}
                    >
                        <div className="flex flex-wrap items-center gap-2 -mt-2">
                            <span className="px-3 py-1.5 rounded-full bg-violet-50 border border-violet-100 text-violet-700 text-xs font-medium">
                                {settings.coverage_per_unit} sqm
                            </span>
                            <span className="px-3 py-1.5 rounded-full bg-violet-50 border border-violet-100 text-violet-700 text-xs font-medium">
                                {settings.waste_percentage}% waste
                            </span>
                        </div>
                        <button className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-neutral-200 text-neutral-700 text-xs font-medium hover:border-violet-300 hover:text-violet-700 hover:shadow-sm transition-all">
                            <span>Edit defaults</span>
                            <PencilIcon />
                        </button>
                    </StatCard>
                </section>

                {/* Conditional: empty state OR products table */}
                {stats.enabled_products === 0
                    ? <EmptyState />
                    : <ProductTable products={enabledProducts} onToggle={handleToggle} />}
            </main>
        </div>
        </div>
    );
}

/* ─── Icons ─────────────────────────────────────────────────────────────── */

const BoxIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-5 h-5">
        <path d="M3 7l9-4 9 4v10l-9 4-9-4V7Z" strokeLinejoin="round" />
        <path d="M3 7l9 4 9-4M12 11v10" strokeLinejoin="round" />
    </svg>
);

const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const GearIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-5 h-5">
        <circle cx="12" cy="12" r="3.2" />
        <circle cx="12" cy="12" r="9" strokeDasharray="2 4" />
    </svg>
);

const PencilIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-3.5 h-3.5">
        <path d="m4 20 4-1 11-11-3-3L5 16l-1 4Z" strokeLinejoin="round" />
    </svg>
);
