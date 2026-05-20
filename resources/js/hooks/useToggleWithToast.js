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
 * FIX: guard يقرأ coverage_per_unit المحلولة (product → global → null).
 * سابقاً كان الـ guard يرفض التفعيل حتى لو في قيمة عامة في الإعدادات،
 * لأن الـ cache كان يحفظ القيمة الخام من product_calculator فقط.
 * الآن بعد إصلاح index() في Backend والـ cache، يعمل الـ guard بشكل صحيح.
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
    // ✅ FIX: رسالة أوضح — تشير للخيارين (خاص أو عام)
    toast_coverage_required:
        "Set a unit coverage for this product, or configure a global default in Settings.",
    toast_activated: "Product activated",
    toast_deactivated: "Product deactivated",
    toast_error: "Something went wrong. Please try again.",
};

/**
 * useToggleWithToast
 *
 * @returns {{
 *   handleToggle: (productId: number) => void,
 *   isPending:    boolean,
 *   variables:    number|undefined
 * }}
 */
export function useToggleWithToast() {
    const queryClient = useQueryClient();
    const toggleMutation = useToggleProduct();

    /**
     * Validates coverage for activation, then fires the toggle mutation.
     *
     * ✅ FIX: يقرأ coverage_per_unit المحلولة من الـ cache.
     * بعد إصلاح Backend + useProducts، القيمة في الـ cache هي القيمة الفعلية:
     *   - رقم صحيح  → سواء جاء من المنتج أو من الإعدادات العامة
     *   - null       → لا قيمة مضبوطة في أي مكان → نمنع التفعيل
     *
     * @param {number} productId
     */
    const handleToggle = (productId) => {
        // Synchronous cache read — no fetch, no stale closure.
        const allProducts = queryClient.getQueryData(QUERY_KEYS.products) ?? [];
        const product = allProducts.find((p) => p.id === productId);

        // Infer the intended new state from the current cache value.
        const willBeActive = product ? !product.active : false;

        // ── Coverage + Waste validation guard ────────────────────────────────
        // Both must be configured (product or global) before activation.
        if (willBeActive) {
            const coverage = product?.coverage_per_unit;
            const waste = product?.waste_percentage;

            const coverageInvalid =
                coverage === null ||
                coverage === undefined ||
                Number(coverage) <= 0;
            const wasteInvalid = waste === null || waste === undefined;

            if (coverageInvalid || wasteInvalid) {
                const msg =
                    coverageInvalid && wasteInvalid
                        ? "Set coverage and waste percentage before activating — or configure global defaults in Settings."
                        : coverageInvalid
                          ? "Set a unit coverage for this product, or configure a global default in Settings."
                          : "Set a waste percentage for this product, or configure a global default in Settings.";
                toast.error(msg, { duration: 4000 });
                return;
            }
        }

        toggleMutation.mutate(productId, {
            onSuccess: (data) => {
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
