import React, { useMemo, useState } from 'react';
import Layout from '../../Components/Layout';
import useHareesGuard from '../../hooks/useHareesGuard';
import { AlertCircle, ShieldCheck, Clock, ListFilter, Tag, Percent, BadgeCheck } from 'lucide-react';
import ProductRow from '../../Components/Harees/ProductRow';
import DiscountModal from '../../Components/Harees/DiscountModal';
import ProductAvatar from '../../Components/UI/ProductAvatar';
import StatusBadge, { normalizeStatus } from '../../Components/UI/StatusBadge';
import ErrorBoundary from '../../Components/Common/ErrorBoundary';
import LoadingState from '../../Components/Common/LoadingState';
import ErrorState from '../../Components/Common/ErrorState';
import { StatsSkeleton } from '../../Components/Common/StatsSkeleton';
import { useInventoryDashboard, useInventorySettings } from '../../hooks/useInventory';
import { useApplyDiscount } from '../../hooks/useApplyDiscount';
import DropdownFilter from '../../Components/Common/DropdownFilter';
import toast from 'react-hot-toast';

const toastStyle = {
    borderRadius: '12px',
    background:   'var(--card)',
    color:        'var(--foreground)',
    border:       '1px solid var(--border)',
    fontSize:     '12px',
    fontWeight:   'bold',
};

const STATUS_FILTERS = [
    { value: 'all',         label: 'All'         },
    { value: 'expired',     label: 'Expired'     },
    { value: 'approaching', label: 'Approaching' },
    { value: 'safe',        label: 'Safe'        },
];

export default function Dashboard() {
    useHareesGuard();

    const [statusFilter, setStatusFilter] = useState('all');

    const {
        data: dashboardData,
        isLoading: dashboardLoading,
        isError: dashboardError,
        error: dashboardErrorMessage,
        refetch: refetchDashboard,
    } = useInventoryDashboard();

    const {
        data: settingsData,
        isLoading: settingsLoading,
        isError: settingsError,
        error: settingsErrorMessage,
    } = useInventorySettings();

    const products = useMemo(() => {
        return (dashboardData?.products || []).reverse();
    }, [dashboardData]);

    const stats = useMemo(() => {
        const raw = dashboardData?.stats || {};
        return {
            expiredCount: raw.red_batches   ?? raw.expiredCount ?? 0,
            expiringSoon: raw.yellow_batches ?? raw.expiringSoon ?? 0,
            validCount:   raw.green_batches  ?? raw.validCount   ?? 0,
        };
    }, [dashboardData]);

    const autoDiscount = useMemo(() => {
        const settings = settingsData?.settings || settingsData || {};
        return Boolean(settings.auto_discounts);
    }, [settingsData]);

    if (dashboardLoading || settingsLoading) {
        return (
            <Layout>
                <div className="space-y-10 p-6">
                    <StatsSkeleton cards={3} />
                    <LoadingState />
                </div>
            </Layout>
        );
    }

    if (dashboardError || settingsError) {
        return (
            <Layout>
                <ErrorState
                    message={
                        dashboardErrorMessage?.message ||
                        settingsErrorMessage?.message ||
                        'Failed to load dashboard'
                    }
                    onRetry={refetchDashboard}
                />
            </Layout>
        );
    }

    const allBatches = products.flatMap(product =>
        (product.batches || []).map(batch => ({
            ...batch,
            parentProduct: product,
        }))
    );

    const filteredItems = statusFilter === 'all'
        ? products
        : allBatches.filter(b => normalizeStatus(b.status).toLowerCase() === statusFilter);

    return (
        <Layout>
            <div className="space-y-10" dir="ltr">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <StatCard label="Expired"     value={stats.expiredCount} icon={<AlertCircle className="w-5 h-5" />} status="critical" sub="Requires immediate action" />
                    <StatCard label="Approaching" value={stats.expiringSoon} icon={<Clock className="w-5 h-5" />}       status="warning"  sub="Under close monitoring"   />
                    <StatCard label="Safe"        value={stats.validCount}   icon={<ShieldCheck className="w-5 h-5" />} status="success"  sub="Stable inventory"         />
                </div>

                <div className="bg-[var(--card)] rounded-[20px] border border-[var(--border)] shadow-sm">
                    <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--background)]/30">
                        <div className="flex items-center gap-2">
                            <ListFilter className="w-4 h-4 text-[var(--primary)]" />
                            <h2 className="text-sm font-bold text-[var(--foreground)]">Monitored Products</h2>
                        </div>
                        <DropdownFilter
                            options={STATUS_FILTERS}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            width="w-[130px]"
                        />
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
                                            <BatchRowStandalone
                                                key={batch.id}
                                                batch={batch}
                                                product={batch.parentProduct}
                                                autoDiscount={autoDiscount}
                                            />
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


function BatchRowStandalone({ batch, product, autoDiscount }) {
    const [selectedBatch, setSelectedBatch] = useState(null);

    const { mutateAsync } = useApplyDiscount(product.id);

    const handleApplyDiscount = async ({ batchId, discountPct, endDate }) => {

        await mutateAsync({ batchId, discountPct, endDate });
        toast.success('Discount applied successfully', { duration: 3000, style: toastStyle });
    };

    const normalized = normalizeStatus(batch.status).toLowerCase();
    const batchCode  = batch.batch_code  || batch.batchNo    || '—';
    const expiryDate = batch.expiry_date  || batch.expiryDate || '—';

    return (
        <>
            <tr className="hover:bg-[var(--accent)]/5 transition-all border-b border-[var(--border)]">
                {/* Product + batch code */}
                <td className="py-3 px-4 w-[25%]">
                    <div className="flex items-center gap-2">
                        <ProductAvatar
                            src={product.image_url || product.image}
                            name={product.name}
                            size={32}
                            radius="rounded-lg"
                        />
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-bold text-[var(--foreground)] truncate max-w-[150px]">
                                {product.name}
                            </span>
                            <span className="text-[9px] font-bold flex items-center gap-1 text-[var(--muted-foreground)]">
                                <Tag size={8} className="text-[var(--primary)] opacity-50" />
                                {batchCode}
                            </span>
                        </div>
                    </div>
                </td>

                {/* Status — Utilizes the common StatusBadge component */}
                <td className="py-3 px-4 text-center w-[20%]">
                    <StatusBadge status={batch.status} size="sm" />
                </td>

                {/* Expiry date */}
                <td className="py-3 px-4 text-center w-[30%]">
                    <span className="text-[11px] font-bold text-[var(--foreground)]">{expiryDate}</span>
                </td>

                {/* Discount action */}
                <td className="py-3 px-4 text-center w-[25%]">
                    {normalized === 'approaching' ? (
                        autoDiscount ? (
                            <div
                                className="inline-flex items-center justify-center gap-1.5 px-3 h-[28px] rounded-full border text-[9px] font-black uppercase tracking-wide mx-auto"
                                style={{
                                    color:       'var(--status-approaching-text)',
                                    background:  'var(--status-approaching-bg)',
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
                        <span className="text-[10px] text-[var(--muted-foreground)]">—</span>
                    )}
                </td>
            </tr>

            {selectedBatch && (
                <DiscountModal
                    batch={selectedBatch}
                    product={product}
                    onClose={() => setSelectedBatch(null)}
                    onApply={handleApplyDiscount}
                />
            )}
        </>
    );
}


function StatCard({ label, value, icon, status, sub }) {
    const config = {
        critical: { textVar: 'var(--status-expired-text)',     iconBgVar: 'var(--status-expired-icon-bg)',     iconBorderVar: 'var(--status-expired-icon-border)'     },
        warning:  { textVar: 'var(--status-approaching-text)', iconBgVar: 'var(--status-approaching-icon-bg)', iconBorderVar: 'var(--status-approaching-icon-border)' },
        success:  { textVar: 'var(--status-safe-text)',         iconBgVar: 'var(--status-safe-icon-bg)',         iconBorderVar: 'var(--status-safe-icon-border)'         },
    };
    const c = config[status];
    return (
        <div className="p-6 rounded-[22px] bg-[var(--card)] border border-[var(--border)] flex flex-col gap-4 transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
                <div
                    style={{ color: c.textVar, background: c.iconBgVar, borderColor: c.iconBorderVar }}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border"
                >
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