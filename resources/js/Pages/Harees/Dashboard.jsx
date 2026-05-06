import React, { useEffect, useState, useRef } from 'react';
import Layout from '../../Components/Layout';
import useHareesGuard from '../../hooks/useHareesGuard';
import { AlertCircle, ShieldCheck, Clock, ListFilter, SlidersHorizontal, ChevronDown } from 'lucide-react';
import ProductRow from '../../Components/Harees/ProductRow';
import ErrorBoundary from '../../Components/Common/ErrorBoundary';
import LoadingState from '../../Components/Common/LoadingState';
import ErrorState from '../../Components/Common/ErrorState';
import { StatsSkeleton } from '../../Components/Common/StatsSkeleton';

// ── نورماليزيشن: red/yellow/green → expired/approaching/safe (فرونت فقط) ──
const normalizeStatus = (status) => {
    const map = {
        red: 'expired', yellow: 'approaching', green: 'safe',
        expired: 'expired', approaching: 'approaching',
        valid: 'safe', safe: 'safe',
    };
    return map[status?.toLowerCase()] ?? 'safe';
};

const STATUS_FILTERS = [
    { value: 'all',         label: 'All'         },
    { value: 'expired',     label: 'Expired'     },
    { value: 'approaching', label: 'Approaching' },
    { value: 'safe',        label: 'Safe'        },
];

export default function Dashboard() {
    useHareesGuard();

    const [products, setProducts] = useState([]);
    const [stats, setStats] = useState({ expiredCount: 0, expiringSoon: 0, validCount: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [filterOpen, setFilterOpen] = useState(false);
    const filterRef = useRef(null);

    useEffect(() => {
        function handleClick(e) {
            if (filterRef.current && !filterRef.current.contains(e.target)) {
                setFilterOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const fetchDashboardData = () => {
        setLoading(true);
        setError(null);
        fetch('/harees/api/dashboard', {
            headers: { Accept: 'application/json' },
            credentials: 'include',
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch data');
                return res.json();
            })
            .then(data => {
                setProducts(data.products || []);
                // ── ربط أسماء الباك مع الفرونت ──
                const raw = data.stats || {};
                setStats({
                    expiredCount: raw.red_batches    ?? raw.expiredCount  ?? 0,
                    expiringSoon: raw.yellow_batches ?? raw.expiringSoon  ?? 0,
                    validCount:   raw.green_batches  ?? raw.validCount    ?? 0,
                });
            })
            .catch(err => { console.error('Dashboard fetch error:', err); setError(err.message); })
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchDashboardData(); }, []);

    if (loading) {
        return (
            <Layout>
                <div className="space-y-10 p-6">
                    <StatsSkeleton cards={3} />
                    <LoadingState />
                </div>
            </Layout>
        );
    }

    if (error) {
        return <Layout><ErrorState message={error} onRetry={fetchDashboardData} /></Layout>;
    }

    const filteredProducts = products.filter(p =>
        statusFilter === 'all' || normalizeStatus(p.status) === statusFilter
    );

    const activeLabel = STATUS_FILTERS.find(o => o.value === statusFilter)?.label ?? 'All';

    return (
        <Layout>
            <div className="space-y-10" dir="ltr">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <StatCard label="Expired"    value={stats.expiredCount} icon={<AlertCircle className="w-5 h-5" />} status="critical" sub="Requires immediate action" />
                    <StatCard label="Approaching" value={stats.expiringSoon} icon={<Clock className="w-5 h-5" />}      status="warning"  sub="Under close monitoring"   />
                    <StatCard label="Safe"        value={stats.validCount}   icon={<ShieldCheck className="w-5 h-5" />} status="success"  sub="Stable inventory"         />
                </div>

                <div className="bg-[var(--card)] rounded-[20px] border border-[var(--border)] shadow-sm overflow-hidden">
                    {/* ── Header ── */}
                    <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--background)]/30">
                        <div className="flex items-center gap-2">
                            <ListFilter className="w-4 h-4 text-[var(--primary)]" />
                            <h2 className="text-sm font-bold text-[var(--foreground)]">Monitored Products</h2>
                        </div>

                        {/* ── فلتر الحالة ── */}
                        <div className="relative" ref={filterRef}>
                            <button
                                onClick={() => setFilterOpen(o => !o)}
                                className={`flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-bold transition-all justify-between border w-[130px] ${
                                    filterOpen || statusFilter !== 'all'
                                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                                        : 'bg-[var(--accent)] text-[var(--primary)] border-[var(--primary)]/5'
                                }`}
                            >
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                    <SlidersHorizontal size={13} className="flex-shrink-0" />
                                    <span className="truncate">{activeLabel}</span>
                                </div>
                                <ChevronDown
                                    size={12}
                                    className={`flex-shrink-0 transition-transform duration-200 ${filterOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {filterOpen && (
                                <div className="absolute right-0 mt-2 w-full bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg z-50 overflow-hidden">
                                    {STATUS_FILTERS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => { setStatusFilter(opt.value); setFilterOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
                                                statusFilter === opt.value
                                                    ? 'bg-[var(--accent)] text-[var(--primary)]'
                                                    : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)]/50'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <ErrorBoundary>
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
                                            No monitored products yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </ErrorBoundary>
                </div>
            </div>
        </Layout>
    );
}

function StatCard({ label, value, icon, status, sub }) {
    const config = {
        critical: { textVar: 'var(--status-expired-text)',    iconBgVar: 'var(--status-expired-icon-bg)',    iconBorderVar: 'var(--status-expired-icon-border)'    },
        warning:  { textVar: 'var(--status-approaching-text)', iconBgVar: 'var(--status-approaching-icon-bg)', iconBorderVar: 'var(--status-approaching-icon-border)' },
        success:  { textVar: 'var(--status-safe-text)',        iconBgVar: 'var(--status-safe-icon-bg)',        iconBorderVar: 'var(--status-safe-icon-border)'        },
    };
    const c = config[status];
    return (
        <div className="p-6 rounded-[22px] bg-[var(--card)] border border-[var(--border)] flex flex-col gap-4 transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
                <div style={{ color: c.textVar, background: c.iconBgVar, borderColor: c.iconBorderVar }}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border">
                    {icon}
                </div>
                <span style={{ color: c.textVar }} className="text-[13px] font-black uppercase tracking-wide">{label}</span>
            </div>
            <div>
                <span className="text-3xl font-black text-[var(--foreground)]">{value}</span>
                <p className="text-[11px] font-bold text-[var(--muted-foreground)] uppercase tracking-wide mt-1">{sub}</p>
            </div>
        </div>
    );
}