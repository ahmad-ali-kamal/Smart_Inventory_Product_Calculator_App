import React from 'react';
import Layout from '../../Components/Layout';
import { useInventory } from '../../Context/InventoryContext';
import { AlertCircle, ShieldCheck, Clock, ListFilter } from 'lucide-react';
import ProductRow from '../../Components/Inventory/ProductRow';

export default function InventoryDashboard() {
    const { products, stats } = useInventory();

    return (
        <Layout>
            <div className="space-y-10" dir="ltr">

                {/* Header Section */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black text-[var(--foreground)] tracking-tight">Stock Intelligence</h1>
                        <p className="text-[13px] text-[var(--muted-foreground)] mt-2">
                            Real-time analysis of product shelf life and active batch monitoring.
                        </p>
                    </div>
                </div>

                {/* 3 Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <StatCard
                        label="Expired"
                        value={stats.expiredCount || 0}
                        icon={<AlertCircle className="w-5 h-5" />}
                        status="critical"
                        sub="Requires immediate action"
                    />
                    <StatCard
                        label="Approaching"
                        value={stats.expiringSoon}
                        icon={<Clock className="w-5 h-5" />}
                        status="warning"
                        sub="Under close monitoring"
                    />
                    <StatCard
                        label="Safe"
                        value={stats.validCount || 0}
                        icon={<ShieldCheck className="w-5 h-5" />}
                        status="success"
                        sub="Stable inventory"
                    />
                </div>

                {/* Table */}
                <div className="bg-[var(--card)] rounded-[20px] border border-[var(--border)] shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--background)]/30">
                        <div className="flex items-center gap-2">
                            <ListFilter className="w-4 h-4 text-[var(--primary)]" />
                            <h2 className="text-sm font-bold text-[var(--foreground)]">Monitored Products</h2>
                        </div>
                    </div>

                    <table className="w-full border-collapse">
                        <thead className="bg-[var(--muted)]/50 border-b border-[var(--border)] text-left">
                            <tr className="text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] font-bold">
                                {/* Product - 25% */}
                                <th className="p-4 w-[25%]">Product</th>

                                {/* Status - 20% */}
                                <th className="p-4 text-center w-[20%]">Status</th>

                                {/* Expiry Info - 30% */}
                                <th className="p-4 text-center w-[30%]">Expiry Info</th>

                                {/* Actions - 25% */}
                                <th className="p-4 text-center w-[25%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {products.map(product => (
                                <ProductRow key={product.id} product={product} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
}

function StatCard({ label, value, icon, status, sub }) {
    const styles = {
        critical: "bg-red-50 text-red-600 border-red-100 shadow-red-100/50",
        warning: "bg-amber-50 text-amber-600 border-amber-100 shadow-amber-100/50",
        success: "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100/50"
    };

    return (
        <div className="p-6 rounded-[22px] bg-[var(--card)] border border-[var(--border)] flex flex-col gap-4 transition-all hover:shadow-md">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm border ${styles[status]}`}>
                {icon}
            </div>
            <div>
                <p className="text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wide">{label}</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-[var(--foreground)]">{value}</span>
                    <span className="text-[10px] text-[var(--muted-foreground)] font-medium">({sub})</span>
                </div>
            </div>
        </div>
    );
}