// Hooks/useHareesStats.js
import { useMemo } from "react";
import { useInventoryDashboard, useInventorySettings } from "./useInventory";

export function useHareesStats() {
    const dashboard = useInventoryDashboard();
    const settings = useInventorySettings();

    // Whether the merchant hasn't configured settings yet
    const needsSetup = useMemo(() => {
        return Boolean(dashboard.data?.needs_setup);
    }, [dashboard.data]);

    const products = useMemo(
        () => [...(dashboard.data?.products || [])].reverse(),
        [dashboard.data],
    );

    const stats = useMemo(() => {
        const raw = dashboard.data?.stats || {};
        return {
            expiredCount: raw.red_batches ?? raw.expiredCount ?? 0,
            expiringSoon: raw.yellow_batches ?? raw.expiringSoon ?? 0,
            validCount: raw.green_batches ?? raw.validCount ?? 0,
        };
    }, [dashboard.data]);

    const autoDiscount = useMemo(() => {
        const s = settings.data?.settings || settings.data || {};
        return Boolean(s.auto_discounts);
    }, [settings.data]);

    return {
        products,
        stats,
        autoDiscount,
        needsSetup,
        isLoading: dashboard.isLoading || settings.isLoading,
        isError: dashboard.isError || settings.isError,
        error: dashboard.error || settings.error,
        refetch: dashboard.refetch,
    };
}
