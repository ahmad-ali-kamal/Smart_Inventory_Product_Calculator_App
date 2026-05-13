// resources/js/Hooks/useProducts.js
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
    const { data, isLoading, isError, error, refetch } = useProductsData();

    return {
        products: data ?? [],
        isLoading,
        isError,
        error,
        refetch,
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

        onMutate: async (productId) => {
            await queryClient.cancelQueries({ queryKey: QUERY_KEYS.products });
            const previous = queryClient.getQueryData(QUERY_KEYS.products);

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
function useCalcRules() {
    const { data: settings } = useCalculatorSettings();

    // Return empty array if no settings to avoid rendering anything
    if (!settings || settings.waste === undefined || settings.waste === null) {
        return [];
    }

    /* Return ONLY waste percentage to remove the NaN/Coverage badge */
    return [
        {
            label: "Waste",
            value: `${Number(settings.waste).toFixed(0)}% waste`,
        },
    ];
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

export function useSettingsStatus() {
    const { data, isLoading } = useCalculatorSettings();
    const isConfigured = !isLoading && !!data?.configured;
    return { isLoading, isConfigured };
}

export function useUpdateCalculatorSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            waste_percentage,
            unit_type,
            min_input_area,
            max_input_area,
        }) => {
            const { data } = await axios.post(
                "/mustashar/api/calculator-settings",
                {
                    waste_percentage,
                    unit_type,
                    min_input_area,
                    max_input_area,
                },
            );
            return data;
        },

        onSuccess: (data) => {
            queryClient.setQueryData(["calculator-settings"], {
                waste: data.waste,
                unit_type: data.unit_type,
                min_input_area: data.min_input_area,
                max_input_area: data.max_input_area,
                configured: data.configured,
            });
        },
    });
}

export function useUpdateProductCoverage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ productId, coverage_per_unit }) => {
            const { data } = await axios.post(
                `/mustashar/api/products/${productId}/coverage`,
                { coverage_per_unit },
            );
            return data;
        },

        onSuccess: (_, variables) => {
            queryClient.setQueryData(QUERY_KEYS.products, (old) => {
                if (!old) return old;
                return old.map((p) =>
                    p.id === variables.productId
                        ? {
                              ...p,
                              coverage_per_unit: variables.coverage_per_unit,
                          }
                        : p,
                );
            });
        },
    });
}
