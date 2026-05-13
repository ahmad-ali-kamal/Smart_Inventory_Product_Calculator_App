/**
 * @file useHareesStats.js
 * @module Hooks
 *
 * @description
 * Facade hook that composes the two core inventory queries
 * (`useInventoryDashboard` and `useInventorySettings`) into a single,
 * pre-processed object consumed exclusively by the Harees Dashboard page.
 *
 * Responsibilities:
 *  - Derive `needsSetup` from the dashboard payload so the page can gate
 *    its UI without knowing the raw API shape.
 *  - Reverse the products array so the most recently added product appears
 *    first in the table.
 *  - Normalise the stats object, handling both legacy colour-keyed fields
 *    (`red_batches`, `yellow_batches`, `green_batches`) and semantic aliases
 *    (`expiredCount`, `expiringSoon`, `validCount`).
 *  - Resolve the `autoDiscount` flag from whichever settings shape the API
 *    returns (nested under `settings.settings` or flat).
 *  - Merge the loading / error states of both queries so the page only needs
 *    to check one `isLoading` and one `isError`.
 */

import { useMemo } from "react";
import { useInventoryDashboard, useInventorySettings } from "./useInventory";

/**
 * useHareesStats
 *
 * Aggregates dashboard and settings query results into the exact shape
 * required by the Harees Dashboard page and its child components.
 *
 * Memoisation strategy:
 *   Every derived value is wrapped in `useMemo` keyed on the relevant
 *   query's `data` reference.  This prevents downstream re-renders when
 *   React Query re-runs a query but the response payload hasn't changed.
 *
 * @returns {Object} Processed data ready for the Dashboard page.
 *
 * @returns {Array<Object>}  return.products
 *   Monitored products with nested batches, reversed so the newest entry
 *   appears at the top of the table.
 *
 * @returns {Object}  return.stats
 *   Aggregated batch counts keyed by canonical names.
 * @returns {number}  return.stats.expiredCount   - Batches with "red" / expired status.
 * @returns {number}  return.stats.expiringSoon   - Batches with "yellow" / approaching status.
 * @returns {number}  return.stats.validCount     - Batches with "green" / safe status.
 *
 * @returns {boolean} return.autoDiscount
 *   Whether the merchant has enabled automatic discounting for approaching batches.
 *
 * @returns {boolean} return.needsSetup
 *   True when the merchant has not yet configured their expiry thresholds.
 *
 * @returns {boolean} return.isLoading
 *   True while either the dashboard or settings query is still fetching.
 *
 * @returns {boolean} return.isError
 *   True if either query has entered an error state.
 *
 * @returns {Error|null} return.error
 *   The first available error object (dashboard error takes priority).
 *
 * @returns {Function} return.refetch
 *   Manually re-triggers the dashboard query (e.g. wired to a "Retry" button).
 *   Settings are not re-fetched here because they change far less frequently.
 */
export function useHareesStats() {
    // ── Raw query results ─────────────────────────────────────────────────────
    const dashboard = useInventoryDashboard();
    const settings  = useInventorySettings();

    // ── needsSetup ────────────────────────────────────────────────────────────
    /**
     * True when the API signals that the merchant's setup is incomplete.
     * The `Boolean()` cast handles both an explicit `false` and an absent field.
     */
    const needsSetup = useMemo(() => {
        return Boolean(dashboard.data?.needs_setup);
    }, [dashboard.data]);

    // ── products ──────────────────────────────────────────────────────────────
    /**
     * Spread into a new array before reversing so the original cache reference
     * is not mutated (`.reverse()` mutates in-place).
     * Result: newest product at index 0, oldest at the end.
     */
    const products = useMemo(
        () => [...(dashboard.data?.products || [])].reverse(),
        [dashboard.data],
    );

    // ── stats ─────────────────────────────────────────────────────────────────
    /**
     * The API may return either the colour-keyed form (`red_batches`, …) used
     * by the v1 endpoint or the semantic form (`expiredCount`, …) used by v2.
     * The nullish-coalescing chain handles both shapes and falls back to 0 if
     * neither key is present, keeping the stat cards from showing `undefined`.
     */
    const stats = useMemo(() => {
        const raw = dashboard.data?.stats || {};
        return {
            expiredCount: raw.red_batches    ?? raw.expiredCount ?? 0,
            expiringSoon: raw.yellow_batches ?? raw.expiringSoon ?? 0,
            validCount:   raw.green_batches  ?? raw.validCount   ?? 0,
        };
    }, [dashboard.data]);

    // ── autoDiscount ──────────────────────────────────────────────────────────
    /**
     * The settings payload may be nested (`settings.data.settings.auto_discounts`)
     * or flat (`settings.data.auto_discounts`) depending on the API version.
     * The `|| settings.data` fallback handles the flat shape transparently.
     */
    const autoDiscount = useMemo(() => {
        const s = settings.data?.settings || settings.data || {};
        return Boolean(s.auto_discounts);
    }, [settings.data]);

    // ── Composed return value ─────────────────────────────────────────────────
    return {
        products,
        stats,
        autoDiscount,
        needsSetup,

        // Loading: the page should show a skeleton if either query is pending.
        isLoading: dashboard.isLoading || settings.isLoading,

        // Error: true if either query failed; the page renders its error state.
        isError: dashboard.isError || settings.isError,

        // Error object: dashboard error takes priority for display purposes.
        error: dashboard.error || settings.error,

        // Refetch: only the dashboard is wired to the "Retry" button because
        // it carries all the data the page primarily depends on.
        refetch: dashboard.refetch,
    };
}