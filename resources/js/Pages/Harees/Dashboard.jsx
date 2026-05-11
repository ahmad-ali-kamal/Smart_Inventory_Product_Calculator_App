// resources/js/Pages/Harees/Dashboard.jsx
import React, { useState } from 'react';
import { AlertCircle, ShieldCheck, Clock } from 'lucide-react';
import useHareesGuard from '../../Hooks/useHareesGuard';
import PageShell from '../../Components/Common/PageShell';
import StatCard from '../../Components/Common/StatCard';
import SetupBanner from '../../Components/Common/SetupBanner';
import MonitoredProductsTable from '../../Components/Harees/Dashboard/MonitoredProductsTable';
import { useHareesStats } from '../../Hooks/useHareesStats';

export default function Dashboard() {
    useHareesGuard();

    const [statusFilter, setStatusFilter] = useState('all');

    const { products, stats, autoDiscount, needsSetup, isLoading, isError, error, refetch } = useHareesStats();

    return (
        <PageShell isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
            <div className="space-y-10" dir="ltr">

                {needsSetup && (
                    <SetupBanner
                        href="/harees/settings"
                        description="Set up your expiry thresholds first so products and batches can be tracked."
                    />
                )}

                {/* Stat cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <StatCard
                        label="Expired"
                        value={stats.expiredCount}
                        icon={<AlertCircle className="w-5 h-5" />}
                        variant="critical"
                        sub="Requires immediate action"
                    />
                    <StatCard
                        label="Approaching"
                        value={stats.expiringSoon}
                        icon={<Clock className="w-5 h-5" />}
                        variant="warning"
                        sub="Under close monitoring"
                    />
                    <StatCard
                        label="Safe"
                        value={stats.validCount}
                        icon={<ShieldCheck className="w-5 h-5" />}
                        variant="success"
                        sub="Stable inventory"
                    />
                </div>

                <MonitoredProductsTable
                    products={products}
                    autoDiscount={autoDiscount}
                    statusFilter={statusFilter}
                    onFilterChange={setStatusFilter}
                    needsSetup={needsSetup}
                />

            </div>
        </PageShell>
    );
}