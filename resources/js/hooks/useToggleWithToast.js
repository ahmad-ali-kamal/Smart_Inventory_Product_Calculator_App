/**
 * @file useToggleWithToast.js
 * @module Hooks
 *
 * Composes `useToggleProduct` with two additional layers:
 *
 *   1. **Validation guard** — reads the resolved `coverage_per_unit` and
 *      `waste_percentage` directly from the React Query cache before
 *      allowing a product to be activated. This approach is intentionally
 *      synchronous (no fetch) and always reflects the latest server-
 *      confirmed data — even when the Products page is filtered and some
 *      rows are hidden from the current view.
 *
 *   2. **Toast notifications** — success, validation failure, and server
 *      error states each surface a distinct `react-hot-toast` message.
 *
 * This hook is the single entry point for all toggle interactions across
 * the Dashboard and the Products page. Neither consumer needs to pass a
 * product list — the hook reads it from the cache autonomously.
 *
 * Background — guard accuracy fix:
 *   Previously the guard would reject activation even when a global setting
 *   existed, because the cache stored the raw product-level value only.
 *   After the Backend `index()` fix and the corresponding cache update in
 *   `useProducts`, the cache now holds the fully resolved value:
 *     - A positive number  → product-level or global setting is in place.
 *     - `null`             → no value anywhere → activation is blocked.
 *
 * Used by: Dashboard, Products
 */

import { useRef } from "react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useToggleProduct, QUERY_KEYS } from "./useProducts";

// ── i18n strings ──────────────────────────────────────────────────────────────
// Move to your translation JSON and replace with useTranslation() when ready.
const t = {
    /** Generic fallback — shown when neither coverage nor waste is set. */
    toast_coverage_required:
        "Set a unit coverage for this product, or configure a global default in Settings.",
    toast_activated:   "Product activated",
    toast_deactivated: "Product deactivated",
    toast_error:       "Something went wrong. Please try again.",
};

/**
 * useToggleWithToast
 *
 * @returns {{
 *   handleToggle: (productId: number) => void,
 *   isPending:    boolean,
 *   variables:    number|undefined
 * }}
 *
 * - `handleToggle` — Call with a product ID to validate then toggle.
 * - `isPending`    — True while the mutation network request is in-flight.
 * - `variables`    — The product ID passed to the most recent mutation call;
 *                    useful for per-row loading indicators.
 */
export function useToggleWithToast() {
    const queryClient    = useQueryClient();
    const toggleMutation = useToggleProduct();

    /**
     * Validates that both coverage and waste are configured before allowing
     * activation, then fires the toggle mutation.
     *
     * All reads are synchronous cache lookups — no network call is made here.
     * The inferred `willBeActive` flag lets us apply the guard only on the
     * activation path (not on deactivation).
     *
     * @param {number} productId - ID of the product whose toggle was clicked.
     */
    const handleToggle = (productId) => {
        // Synchronous cache read — no fetch, no stale closure risk.
        const allProducts = queryClient.getQueryData(QUERY_KEYS.products) ?? [];
        const product     = allProducts.find((p) => p.id === productId);

        // Determine the intended state from the current cached flag.
        const willBeActive = product ? !product.active : false;

        // ── Validation guard (activation only) ───────────────────────────────
        if (willBeActive) {
            const coverage = product?.coverage_per_unit;
            const waste    = product?.waste_percentage;

            // Treat 0, null, and undefined as "not configured".
            const coverageInvalid =
                coverage === null ||
                coverage === undefined ||
                Number(coverage) <= 0;
            const wasteInvalid = waste === null || waste === undefined;

            if (coverageInvalid || wasteInvalid) {
                // Tailor the message to the specific missing field(s).
                const msg =
                    coverageInvalid && wasteInvalid
                        ? "Set coverage and waste percentage before activating — or configure global defaults in Settings."
                        : coverageInvalid
                          ? "Set a unit coverage for this product, or configure a global default in Settings."
                          : "Set a waste percentage for this product, or configure a global default in Settings.";
                toast.error(msg, { duration: 4000 });
                return; // Block the mutation.
            }
        }

        // ── Fire the mutation ─────────────────────────────────────────────────
        toggleMutation.mutate(productId, {
            onSuccess: (data) => {
                // Prefer the server-confirmed state; fall back to inferred state.
                const isEnabled = data?.is_enabled ?? willBeActive;
                toast.success(
                    isEnabled ? t.toast_activated : t.toast_deactivated,
                );
            },
            onError: () => {
                toast.error(t.toast_error);
            },
        });
    };

    return {
        handleToggle,
        isPending: toggleMutation.isPending,
        variables: toggleMutation.variables,
    };
}