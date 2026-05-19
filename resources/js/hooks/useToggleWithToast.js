/**
 * @file useToggleWithToast.js
 * @module Hooks
 *
 * Composes useToggleProduct with:
 *   1. A coverage validation guard that reads live data directly from the React
 *      Query cache — not from any stale render-time prop — so it is always
 *      accurate even when the Products page is filtered and some products are
 *      hidden from the current view.
 *   2. Toast notifications for success, validation failure, and server error.
 *
 * This hook is the single entry point for toggle interactions on both the
 * Dashboard and the Products page. Neither page needs to pass a product list
 * as an argument.
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
    toast_coverage_required: "Set a valid unit coverage before activating this product.",
    toast_activated:         "Product activated",
    toast_deactivated:       "Product deactivated",
    toast_error:             "Something went wrong. Please try again.",
};

/**
 * useToggleWithToast
 *
 * @returns {{
 *   handleToggle: (productId: number) => void,
 *   isPending:    boolean,  - True while the mutation network request is in-flight.
 *   variables:    number|undefined - The productId currently being mutated (for per-row loading state).
 * }}
 */
export function useToggleWithToast() {
    const queryClient    = useQueryClient();
    const toggleMutation = useToggleProduct();

    /**
     * Validates coverage for activation, then fires the toggle mutation.
     * Reads the product list synchronously from the React Query cache so the
     * check is always against the latest data — even mid-optimistic-update.
     *
     * @param {number} productId - ID of the product to toggle.
     */
    const handleToggle = (productId) => {
        // Synchronous cache read — no fetch, no stale closure.
        const allProducts  = queryClient.getQueryData(QUERY_KEYS.products) ?? [];
        const product      = allProducts.find((p) => p.id === productId);
        // Infer the intended new state from the current cache value.
        const willBeActive = product ? !product.active : false;

        // ── Coverage validation guard ─────────────────────────────────────────
        // Only block activation; deactivation is always allowed without restriction.
        if (willBeActive) {
            const coverage = product?.coverage_per_unit;
            const isInvalid =
                coverage === null      ||
                coverage === undefined ||
                coverage === ""        ||
                Number(coverage) <= 0;

            if (isInvalid) {
                toast.error(t.toast_coverage_required, { duration: 4000 });
                return; // abort — do not fire the mutation
            }
        }

        toggleMutation.mutate(productId, {
            onSuccess: (data) => {
                // Prefer the server-confirmed `is_enabled` flag; fall back to the inferred value.
                const isEnabled = data?.is_enabled ?? willBeActive;
                toast.success(isEnabled ? t.toast_activated : t.toast_deactivated);
            },
            onError: () => {
                toast.error(t.toast_error);
            },
        });
    };

    return {
        handleToggle,
        isPending: toggleMutation.isPending,
        // `variables` holds the productId passed to the last mutate() call.
        // Consumers compare it to their own product.id to show per-row loading state.
        variables: toggleMutation.variables,
    };
}
