import React, { useEffect, useState, useRef } from 'react';
import Layout from '../../Components/Layout';
import useHareesGuard from '../../hooks/useHareesGuard';
import { AlertCircle, ShieldCheck, Clock, ListFilter, SlidersHorizontal, ChevronDown, Tag, Percent, BadgeCheck } from 'lucide-react';
import ProductRow from '../../Components/Harees/ProductRow';
import DiscountModal from '../../Components/Harees/DiscountModal';
import ErrorBoundary from '../../Components/Common/ErrorBoundary';
import LoadingState from '../../Components/Common/LoadingState';
import ErrorState from '../../Components/Common/ErrorState';
import { StatsSkeleton } from '../../Components/Common/StatsSkeleton';

// Normalization: Mapping backend status codes to unified frontend display names.
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
    const [autoDiscount, setAutoDiscount] = useState(false);
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

        Promise.all([
            fetch('/harees/api/dashboard', {
                headers: { Accept: 'application/json' },
                credentials: 'include',
            }),
            fetch('/harees/api/settings', {
                headers: { Accept: 'application/json' },
                credentials: 'include',
            }),
        ])
            .then(([dashRes, settingsRes]) => {
                if (!dashRes.ok) throw new Error('Failed to fetch data');
                if (!settingsRes.ok) throw new Error('Failed to fetch settings');
                return Promise.all([dashRes.json(), settingsRes.json()]);
            })
            .then(([dashData, settingsData]) => {
                const reversedProducts = (dashData.products || []).reverse();
                setProducts(reversedProducts);
                const raw = dashData.stats || {};
                setStats({
                    expiredCount: raw.red_batches    ?? raw.expiredCount  ?? 0,
                    expiringSoon: raw.yellow_batches ?? raw.expiringSoon  ?? 0,
                    validCount:   raw.green_batches  ?? raw.validCount    ?? 0,
                });

                const settings = settingsData.settings || settingsData;
                setAutoDiscount(Boolean(settings.auto_discounts));
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

    //Advanced Filtering Logic: Splitting products into batches for filtered results.
    const allBatches = products.flatMap(product => 
        (product.batches || []).map(batch => ({
            ...batch,
            parentProduct: product 
        }))
    );

    const filteredItems = statusFilter === 'all' 
        ? products 
        : allBatches.filter(b => normalizeStatus(b.status) === statusFilter);

    const activeLabel = STATUS_FILTERS.find(o => o.value === statusFilter)?.label ?? 'All';

    return (
        <Layout>
            <div className="space-y-10" dir="ltr">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <StatCard label="Expired"    value={stats.expiredCount} icon={<AlertCircle className="w-5 h-5" />} status="critical" sub="Requires immediate action" />
                    <StatCard label="Approaching" value={stats.expiringSoon} icon={<Clock className="w-5 h-5" />}      status="warning"  sub="Under close monitoring"   />
                    <StatCard label="Safe"        value={stats.validCount}   icon={<ShieldCheck className="w-5 h-5" />} status="success"  sub="Stable inventory"         />
                </div>

                <div className="bg-[var(--card)] rounded-[20px] border border-[var(--border)] shadow-sm">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--background)]/30">
                        <div className="flex items-center gap-2">
                            <ListFilter className="w-4 h-4 text-[var(--primary)]" />
                            <h2 className="text-sm font-bold text-[var(--foreground)]">Monitored Products</h2>
                        </div>

                        {/* Dropdown Filter */}
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

                    <div className="overflow-hidden rounded-b-[20px]">
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
                                {statusFilter === 'all' ? (
                                    filteredItems.map(product => (
                                        <ProductRow key={product.id} product={product} autoDiscount={autoDiscount} />
                                    ))
                                ) : (
                                    filteredItems.map(batch => (
                                        <BatchRowStandalone key={batch.id} batch={batch} product={batch.parentProduct} autoDiscount={autoDiscount} />
                                    ))
                                )}
                                
                                {filteredItems.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="p-10 text-center text-sm text-[var(--muted-foreground)]">
                                            No monitored items found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </ErrorBoundary>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

// Component: Render batch as an independent row during filtering.
function BatchRowStandalone({ batch, product, autoDiscount }) {
    const [selectedBatch, setSelectedBatch] = useState(null);

    const normalized = normalizeStatus(batch.status);
    const batchCode  = batch.batch_code  || batch.batchNo     || '—';
    const expiryDate = batch.expiry_date  || batch.expiryDate  || '—';

  
    const getStatusStyle = (status) => {
        switch (status) {
            case 'expired':     return { color: 'var(--status-expired-text)', bg: 'var(--status-expired-bg)', border: 'var(--status-expired-border)' };
            case 'approaching': return { color: 'var(--status-approaching-text)', bg: 'var(--status-approaching-bg)', border: 'var(--status-approaching-border)' };
            default:            return { color: 'var(--status-safe-text)', bg: 'var(--status-safe-bg)', border: 'var(--status-safe-border)' };
        }
    };
    const style = getStatusStyle(normalized);

    return (
        <>
            <tr className="hover:bg-[var(--accent)]/5 transition-all border-b border-[var(--border)]">
                <td className="py-3 px-4 w-[25%]">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-[var(--muted)] border border-[var(--border)] shrink-0 flex items-center justify-center">
                            {(product.image_url || product.image) ? (
                                <img
                                    src={product.image_url || product.image}
                                    className="w-full h-full object-cover"
                                    alt={product.name}
                                    onError={e => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextSibling.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <span
                                className="w-full h-full flex items-center justify-center text-[9px] font-black text-[var(--muted-foreground)] uppercase"
                                style={{ display: (product.image_url || product.image) ? 'none' : 'flex' }}
                            >
                                {product.name?.charAt(0) ?? '?'}
                            </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-bold text-[var(--foreground)] truncate max-w-[150px]">{product.name}</span>
                            <span className="text-[9px] font-bold flex items-center gap-1 text-[var(--muted-foreground)]">
                                <Tag size={8} className="text-[var(--primary)] opacity-50" />
                                {batchCode}
                            </span>
                        </div>
                    </div>
                </td>
                <td className="py-3 px-4 text-center w-[20%]">
                    <span 
                        style={{ color: style.color, background: style.bg, borderColor: style.border }}
                        className="inline-flex items-center justify-center w-[100px] h-[22px] rounded-full text-[9px] font-black uppercase border"
                    >
                        {normalized}
                    </span>
                </td>
                <td className="py-3 px-4 text-center w-[30%]">
                    <span className="text-[11px] font-bold text-[var(--foreground)]">{expiryDate}</span>
                </td>
                <td className="py-3 px-4 text-center w-[25%]">
                    {normalized === 'approaching' ? (
                        autoDiscount ? (
                            <div
                                className="inline-flex items-center justify-center gap-1.5 px-3 h-[28px] rounded-full border text-[9px] font-black uppercase tracking-wide mx-auto"
                                style={{
                                    color: 'var(--status-approaching-text)',
                                    background: 'var(--status-approaching-bg)',
                                    borderColor: 'var(--status-approaching-border)',
                                }}
                            >
                                <BadgeCheck size={10} />
                                Auto-Discount Enabled
                            </div>
                        ) : (
                            <button
                                onClick={() => setSelectedBatch(batch)}
                                className="w-[120px] h-[32px] flex items-center justify-center gap-1.5 rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/5 text-[var(--primary)] text-[10px] font-black uppercase hover:bg-[var(--primary)] hover:text-white transition-all mx-auto"
                            >
                                <Percent size={11} />
                                Discount
                            </button>
                        )
                    ) : (
                        <span className="text-[10px] text-[var(--muted-foreground)]">-</span>
                    )}
                </td>
            </tr>

            {selectedBatch && (
                <DiscountModal
                    batch={selectedBatch}
                    product={product}
                    onClose={() => setSelectedBatch(null)}
                    onApply={() => setSelectedBatch(null)}
                />
            )}
        </>
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