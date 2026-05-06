import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const api = axios.create({
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
    },
});

// ── API functions ─────────────────────────────────────────────────────────────

async function fetchProducts() {
    const { data } = await axios.get("/mustashar/api/products");
    return data.data || data;
}

async function toggleProductApi(productId) {
    const { data } = await axios.post(
        `/mustashar/api/products/${productId}/toggle`,
    );

    if (!data.success) {
        throw new Error(data.message ?? "Failed to toggle product.");
    }

    return data;
}

async function updateCalcRulesApi(rules) {
    const { data } = await api.patch("/api/calc-rules", rules);
    return data;
}

// ── Query Keys ────────────────────────────────────────────────────────────────
export const QUERY_KEYS = {
    products: ["products"],
    calcRules: ["calcRules"],
};

function useProductsData() {
    return useQuery({
        queryKey: QUERY_KEYS.products,
        queryFn: fetchProducts,
        staleTime: 30_000,
        placeholderData: (prev) => prev,
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// useAllProducts  →  used by Products.jsx
// ─────────────────────────────────────────────────────────────────────────────
export function useAllProducts() {
    const { data, isLoading, isError, error } = useProductsData();

    return {
        products: data ?? [],
        isLoading,
        isError,
        error,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// useActiveProducts  →  used by Dashboard.jsx
// ─────────────────────────────────────────────────────────────────────────────
export function useActiveProducts() {
    const { data, isLoading, isError, error } = useProductsData();

    const allProducts = data ?? [];
    const activeProducts = allProducts.filter((p) => p.active);

    return {
        allProducts,
        activeProducts,
        calcRules: data?.meta?.calcRules ?? { coverage: 0, waste: 0 },
        isLoading,
        isError,
        error,
    };
}

export function useToggleProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: toggleProductApi,

        // Called BEFORE the network request fires
        onMutate: async (productId) => {
            // 1. Cancel any in-flight refetches so they don't stomp our optimistic update
            await queryClient.cancelQueries({ queryKey: QUERY_KEYS.products });

            // 2. Snapshot current cache so we can roll back on error
            const previous = queryClient.getQueryData(QUERY_KEYS.products);

            // 3. Optimistically flip the product's active flag in the cache
            queryClient.setQueryData(QUERY_KEYS.products, (old) => {
                if (!old) return old;

                return old.map((p) =>
                    p.id === productId ? { ...p, active: !p.active } : p,
                );
            });

            return { previous };
        },

        onError: (_err, _productId, context) => {
            if (context?.previous) {
                queryClient.setQueryData(QUERY_KEYS.products, context.previous);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
        },
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// useUpdateCalcRules  →  used by Settings page (future)
// ─────────────────────────────────────────────────────────────────────────────
export function useUpdateCalcRules() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateCalcRulesApi,
        onSuccess: (updatedRules) => {
            queryClient.setQueryData(QUERY_KEYS.products, (old) => {
                if (!old) return old;
                return {
                    ...old,
                    meta: { ...old.meta, calcRules: updatedRules },
                };
            });
        },
    });
}
export function useCalculatorSettings() {
    return useQuery({
        queryKey: ["calculator-settings"],
        queryFn: async () => {
            const { data } = await axios.get(
                "/mustashar/api/calculator-settings",
            );
            return data;
        },
    });
}
export function useUpdateCalculatorSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ coverage, waste }) => {
            const { data } = await axios.post(
                "/mustashar/api/calculator-settings",
                {
                    coverage_per_unit: coverage,
                    waste_percentage: waste,
                },
            );

            return data;
        },

        onSuccess: (data) => {
            queryClient.setQueryData(["calculator-settings"], {
                coverage: data.coverage,
                waste: data.waste,
            });

            queryClient.invalidateQueries({
                queryKey: ["calculator-settings"],
            });
        },
    });
}
