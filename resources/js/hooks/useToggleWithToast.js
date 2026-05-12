// resources/js/hooks/useToggleWithToast.js
import toast from "react-hot-toast";
import { useToggleProduct } from "./useProducts";

export function useToggleWithToast(products = []) {
    const toggleMutation = useToggleProduct();

    const handleToggle = (productId) => {
        const product = products.find((p) => p.id === productId);
        const willBeActive = product ? !product.active : false;

        toggleMutation.mutate(productId, {
            onSuccess: (data) => {
                const isEnabled = data?.is_enabled ?? willBeActive;
                toast.success(
                    isEnabled ? "Product activated" : "Product deactivated",
                );
            },
            onError: () => {
                toast.error("Something went wrong. Please try again.");
            },
        });
    };

    return {
        handleToggle,
        isPending: toggleMutation.isPending,
        variables: toggleMutation.variables,
    };
}
