// resources/js/hooks/useToggleWithToast.js
import toast from "react-hot-toast";
import { useToggleProduct } from "./useProducts";

/**
 * Unified toggle hook — used by both Dashboard and Products pages.
 * Derives the next state from the current product list so the toast
 * message always says "activated" or "deactivated" correctly.
 *
 * @param {Array} products  - the full products array from useAllProducts()
 */
export function useToggleWithToast(products = []) {
    const toggleMutation = useToggleProduct();

    const toastStyle = {
        borderRadius: "12px",
        background: "var(--card)",
        color: "var(--foreground)",
        border: "1px solid var(--border)",
        fontSize: "12px",
        fontWeight: "bold",
    };

    const handleToggle = (productId) => {
        // Derive the expected next state BEFORE the mutation fires
        const product = products.find((p) => p.id === productId);
        const willBeActive = product ? !product.active : false;

        toggleMutation.mutate(productId, {
            onSuccess: (data) => {
                // Prefer the server's confirmed value; fall back to our prediction
                const isEnabled = data?.is_enabled ?? willBeActive;
                toast.success(
                    isEnabled ? "Product activated" : "Product deactivated",
                    { duration: 3000, style: toastStyle },
                );
            },
            onError: () => {
                toast.error("Something went wrong. Please try again.", {
                    duration: 3000,
                    style: toastStyle,
                });
            },
        });
    };

    return {
        handleToggle,
        isPending: toggleMutation.isPending,
        variables: toggleMutation.variables,
    };
}
