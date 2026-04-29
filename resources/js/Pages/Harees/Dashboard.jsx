import React, { useState } from 'react';
import Layout from '../../Components/Layout';
import useHareesGuard from '../../hooks/useHareesGuard';
import { useHarees } from '../../Context/HareesContext';
import { AlertCircle, ShieldCheck, Clock, ListFilter } from 'lucide-react';
import ProductRow from '../../Components/Harees/ProductRow';

export default function Dashboard() {
    useHareesGuard();
    const { products, stats } = useHarees();

    return (
        <Layout>
            <div className="space-y-10" dir="ltr">

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
                        <StatusFilter value={filter} onChange={setFilter} />
                    </div>

                    <table className="w-full border-collapse">
                        <thead className="bg-[var(--muted)]/50 border-b border-[var(--border)] text-left">
                            <tr className="text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] font-bold">
                                <th className="p-4 w-[25%]">Product</th>
                                <th className="p-4 text-center w-[20%]">Status</th>
                                <th className="p-4 text-center w-[30%]">Expiry Info</th>
                                <th className="p-4 text-center w-[25%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {filteredProducts.map(product => (
                                <ProductRow key={product.id} product={product} />
                            ))}
                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="p-10 text-center text-sm text-[var(--muted-foreground)]">
                                        No products match this filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
}

/* ── StatCard ── */
function StatCard({ label, value, icon, status, sub }) {
    const config = {
        critical: {
            textVar: 'var(--status-expired-text)',
            iconBgVar: 'var(--status-expired-icon-bg)',
            iconBorderVar: 'var(--status-expired-icon-border)',
        },
        warning: {
            textVar: 'var(--status-approaching-text)',
            iconBgVar: 'var(--status-approaching-icon-bg)',
            iconBorderVar: 'var(--status-approaching-icon-border)',
        },
        success: {
            textVar: 'var(--status-safe-text)',
            iconBgVar: 'var(--status-safe-icon-bg)',
            iconBorderVar: 'var(--status-safe-icon-border)',
        },
    };

    const c = config[status];

    return (
        <div className="p-6 rounded-[22px] bg-[var(--card)] border border-[var(--border)] flex flex-col gap-4 transition-all hover:shadow-md">
            {/* Icon + Label */}
            <div className="flex items-center gap-3">
                <div
                    style={{
                        color: c.textVar,
                        background: c.iconBgVar,
                        borderColor: c.iconBorderVar,
                    }}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border"
                >
                    {icon}
                </div>
                <span
                    style={{ color: c.textVar }}
                    className="text-[13px] font-black uppercase tracking-wide"
                >
                    {label}
                </span>
            </div>

            {/* Value + sub */}
            <div>
                <span className="text-3xl font-black text-[var(--foreground)]">{value}</span>
                <p className="text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wide mt-1">
                    {sub}
                </p>
            </div>
        </div>
    );
}