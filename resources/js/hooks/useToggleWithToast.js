/**
 * @file useToggleWithToast.js
 * @module Hooks
 *
 * @description
 * Composable hook that wraps the low-level `useToggleProduct` React Query
 * mutation with user-facing toast feedback.
 *
 * Responsibilities:
 *  - Optimistically predict the post-toggle `active` state before the server
 *    responds, so the toast message is accurate even if the response omits
 *    the `is_enabled` field.
 *  - Display a success toast when the mutation resolves, using the server's
 *    authoritative `is_enabled` value (falls back to the optimistic prediction).
 *  - Display a generic error toast when the mutation fails.
 *
 * Usage:
 * ```js
 * const { handleToggle, isPending, variables } = useToggleWithToast(products);
 * ```
 *
 * All user-facing strings are defined in the `t` object for easy i18n extraction.
 */

// resources/js/hooks/useToggleWithToast.js
import toast from "react-hot-toast";
import { useToggleProduct } from "./useProducts";

// ---------------------------------------------------------------------------
// i18n placeholder — move these strings to your translation JSON when ready
// ---------------------------------------------------------------------------

/** @type {Object.<string, string>} Toast messages, ready for i18n extraction. */
const t = {
    product_activated: "Product activated",
    product_deactivated: "Product deactivated",
    toggle_error: "Something went wrong. Please try again.",
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useToggleWithToast
 *
 * Augments the `useToggleProduct` mutation with automatic toast notifications.
 *
 * @param {Array<{ id: number|string, active: boolean }>} [products=[]]
 *   The current product list from the parent component or query cache.
 *   Used to derive the optimistic `willBeActive` state before the server responds.
 *
 * @returns {{
 *   handleToggle: (productId: number|string) => void,
 *   isPending:    boolean,
 *   variables:    number|string|undefined
 * }}
 *   - `handleToggle` — Triggers the toggle mutation for the given product ID.
 *   - `isPending`    — `true` while the mutation is in-flight (forwarded from React Query).
 *   - `variables`    — The `productId` of the most recent mutation attempt (forwarded from React Query).
 */
export function useToggleWithToast(products = []) {
    const toggleMutation = useToggleProduct();

    /**
     * Triggers the product toggle mutation and shows the appropriate toast
     * on success or failure.
     *
     * @param {number|string} productId — The ID of the product to toggle.
     */
    const handleToggle = (productId) => {
        // Derive the expected post-toggle state from the local product list
        // so the toast message is ready before the server responds.
        const product = products.find((p) => p.id === productId);
        const willBeActive = product ? !product.active : false;

        toggleMutation.mutate(productId, {
            onSuccess: (data) => {
                // Prefer the server's authoritative value; fall back to optimistic prediction
                const isEnabled = data?.is_enabled ?? willBeActive;
                toast.success(
                    isEnabled ? t.product_activated : t.product_deactivated,
                );
            },
            onError: () => {
                toast.error(t.toggle_error);
            },
        });
    };

    return {
        handleToggle,
        isPending: toggleMutation.isPending,
        variables: toggleMutation.variables,
    };
}
