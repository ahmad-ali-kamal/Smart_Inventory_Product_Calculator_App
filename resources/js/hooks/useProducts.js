/**
 * @file useProducts.js
 * @module Hooks
 *
 * Central data layer for the Mustashar product catalog and calculator settings.
 *
 * Exported hooks:
 *   - useAllProducts                → Products page (full list, unfiltered)
 *   - useActiveProducts             → Dashboard (active subset + all for counters)
 *   - useToggleProduct              → Optimistic active/inactive toggle mutation
 *   - useCalculatorSettings         → Calculator config read
 *   - useSettingsStatus             → Derived "is configured?" boolean
 *   - useUpdateCalculatorSettings   → Calculator config write mutation
 *   - useUpdateProductCoverage      → Per-product coverage write mutation
 *   - useUpdateProductWaste         → Per-product waste write mutation  ✅ NEW
 */

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// ── Shared axios instance ─────────────────────────────────────────────────────
const api = axios.create({
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
    },
});

// ── Query key registry ────────────────────────────────────────────────────────
export const QUERY_KEYS = {
    products: ["products"],
    calculatorSettings: ["calculator-settings"],
};

// ── API functions ─────────────────────────────────────────────────────────────

async function fetchProducts() {
    const { data } = await api.get("/mustashar/api/products");
    return data.data ?? data;
}

async function toggleProductApi(productId) {
    const { data } = await api.post(
        `/mustashar/api/products/${productId}/toggle`,
    );
    if (!data.success)
        throw new Error(data.message ?? "Failed to toggle product.");
    return data;
}

// ── Shared base query ─────────────────────────────────────────────────────────
function useProductsData() {
    return useQuery({
        queryKey: QUERY_KEYS.products,
        queryFn: fetchProducts,
        staleTime: 30_000,
        placeholderData: (prev) => prev,
    });
}

// ── useAllProducts ────────────────────────────────────────────────────────────
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

// ── useActiveProducts ─────────────────────────────────────────────────────────
export function useActiveProducts() {
    const { data, isLoading, isError, error } = useProductsData();

    const allProducts = data ?? [];

    const activeProducts = useMemo(
        () => allProducts.filter((p) => p.active),
        [allProducts],
    );

    return {
        allProducts,
        activeProducts,
        isLoading,
        isError,
        error,
    };
}

// ── useToggleProduct ──────────────────────────────────────────────────────────
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

// ── useCalculatorSettings ─────────────────────────────────────────────────────
/**
 * Fetches the global calculator settings.
 *
 * Server response shape:
 *   { configured: boolean, coverage: number|null, waste: number|null }
 */
export function useCalculatorSettings() {
    return useQuery({
        queryKey: QUERY_KEYS.calculatorSettings,
        queryFn: async () => {
            const { data } = await api.get(
                "/mustashar/api/calculator-settings",
            );
            return data;
        },
    });
}

/**
 * Derived hook — returns a single boolean indicating whether the calculator
 * has been configured at least once.
 */
export function useSettingsStatus() {
    const { data, isLoading } = useCalculatorSettings();
    return {
        isLoading,
        isConfigured: !isLoading && !!data?.configured,
    };
}

// ── useUpdateCalculatorSettings ───────────────────────────────────────────────
/**
 * Mutation hook for saving the global calculator settings.
 *
 * After success, invalidates the products cache so every product row
 * re-fetches its resolved coverage_source / waste_source.
 */
export function useUpdateCalculatorSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ waste_percentage, coverage_per_unit }) => {
            const { data } = await api.post(
                "/mustashar/api/calculator-settings",
                { coverage_per_unit, waste_percentage },
            );
            return data;
        },

        onSuccess: (data) => {
            queryClient.setQueryData(QUERY_KEYS.calculatorSettings, {
                coverage: data.coverage,
                waste: data.waste,
                configured: data.configured,
            });

            // Invalidate products — changing global settings affects every
            // product whose coverage_source or waste_source is 'global'.
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
        },
    });
}

// ── useUpdateProductCoverage ──────────────────────────────────────────────────
/**
 * Mutation hook for updating a single product's coverage_per_unit.
 * Patches only the affected product in the cache — no full list refetch.
 */
export function useUpdateProductCoverage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ productId, coverage_per_unit }) => {
            const { data } = await api.post(
                `/mustashar/api/products/${productId}/coverage`,
                { coverage_per_unit },
            );
            return data;
        },

        onSuccess: (serverData, { productId, coverage_per_unit }) => {
            queryClient.setQueryData(QUERY_KEYS.products, (old) => {
                if (!old) return old;
                return old.map((p) => {
                    if (p.id !== productId) return p;
                    return {
                        ...p,
                        coverage_per_unit,
                        coverage_source:
                            serverData?.coverage_source ?? "product",
                    };
                });
            });
        },
    });
}

// ── useUpdateProductWaste ─────────────────────────────────────────────────────
/**
 * Mutation hook for updating a single product's waste_percentage.
 *
 * Mirrors useUpdateProductCoverage exactly.
 * Pass waste_percentage: null to clear the per-product override and fall
 * back to the global setting.
 */
export function useUpdateProductWaste() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ productId, waste_percentage }) => {
            const { data } = await api.post(
                `/mustashar/api/products/${productId}/waste`,
                { waste_percentage },
            );
            return data;
        },

        onSuccess: (serverData, { productId, waste_percentage }) => {
            queryClient.setQueryData(QUERY_KEYS.products, (old) => {
                if (!old) return old;
                return old.map((p) => {
                    if (p.id !== productId) return p;
                    return {
                        ...p,
                        // إذا null تعني مسح القيمة الخاصة — نرجع للقيمة المحلولة من السيرفر
                        waste_percentage:
                            waste_percentage !== null
                                ? waste_percentage
                                : (serverData?.waste_percentage ??
                                  p.waste_percentage),
                        waste_source: serverData?.waste_source ?? "product",
                    };
                });
            });
        },
    });
}
