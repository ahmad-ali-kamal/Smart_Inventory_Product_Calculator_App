/**
 * @file useProducts.js
 * @module Hooks
 *
 * Central data layer for the Mustashar product catalog and calculator settings.
 * All server communication goes through a single axios instance; all reads go
 * through React Query so that every component in the tree shares one cache entry
 * per resource.
 *
 * Exported hooks:
 *   - useAllProducts            → Products page (full list, unfiltered)
 *   - useActiveProducts         → Dashboard (active subset + all for counters)
 *   - useToggleProduct          → Optimistic active/inactive toggle mutation
 *   - useCalculatorSettings     → Calculator config read
 *   - useSettingsStatus         → Derived "is configured?" boolean
 *   - useUpdateCalculatorSettings → Calculator config write mutation
 *   - useUpdateProductCoverage  → Per-product coverage write mutation
 *
 * Query key registry:
 *   QUERY_KEYS is exported so that other hooks (useToggleWithToast) can read
 *   or invalidate the same cache entries without hardcoding key strings.
 */

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// ── Shared axios instance ─────────────────────────────────────────────────────
// Created once at module scope — never inside a hook or component — so the same
// instance (and its interceptors, if any) is reused across all API calls.
const api = axios.create({
    headers: {
        Accept:           "application/json",
        "Content-Type":   "application/json",
        "X-Requested-With": "XMLHttpRequest",
    },
});

// ── Query key registry ────────────────────────────────────────────────────────
/**
 * Canonical React Query cache keys.
 * Import this object anywhere you need to read, set, or invalidate these entries.
 *
 * @type {{ products: string[], calculatorSettings: string[] }}
 */
export const QUERY_KEYS = {
    products:           ["products"],
    calculatorSettings: ["calculator-settings"],
};

// ── API functions ─────────────────────────────────────────────────────────────
// Plain async functions — not hooks. Kept outside the query options so they can
// be unit-tested independently of React Query.

/**
 * Fetches the full product list from the server.
 * Unwraps Laravel's standard `{ data: [...] }` envelope if present.
 *
 * @returns {Promise<object[]>} Flat array of product records.
 */
async function fetchProducts() {
    const { data } = await api.get("/mustashar/api/products");
    return data.data ?? data;
}

/**
 * Sends a toggle request for a single product and asserts success.
 *
 * @param {number} productId - The product to toggle.
 * @returns {Promise<object>} Server response payload (includes `is_enabled`).
 * @throws {Error} If the server responds with `success: false`.
 */
async function toggleProductApi(productId) {
    const { data } = await api.post(`/mustashar/api/products/${productId}/toggle`);
    if (!data.success) throw new Error(data.message ?? "Failed to toggle product.");
    return data;
}

// ── Shared base query ─────────────────────────────────────────────────────────
/**
 * Internal hook — not exported.
 * All consumer hooks below call this single useQuery instance so React Query
 * deduplicates the network request: regardless of how many components mount
 * simultaneously, only one fetch fires.
 *
 * `placeholderData` keeps the previous data visible during background refetches,
 * preventing the UI from flashing an empty state between invalidation cycles.
 *
 * @returns {import("@tanstack/react-query").UseQueryResult<object[]>}
 */
function useProductsData() {
    return useQuery({
        queryKey:        QUERY_KEYS.products,
        queryFn:         fetchProducts,
        staleTime:       30_000, // treat data as fresh for 30 s to reduce redundant fetches
        placeholderData: (prev) => prev,
    });
}

// ── useAllProducts ────────────────────────────────────────────────────────────
/**
 * Returns the full, unfiltered product array.
 * Filtering and sort-order stabilization are handled downstream in useProductsFilter.
 *
 * Consumer: Products page.
 *
 * @returns {{
 *   products:  object[],
 *   isLoading: boolean,
 *   isError:   boolean,
 *   error:     Error|null,
 *   refetch:   function
 * }}
 */
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
/**
 * Returns both the full product array and a memoized active-only subset.
 * The `activeProducts` array is recomputed only when the cache data reference
 * changes (i.e. after a genuine cache write), not on every parent re-render.
 *
 * Consumer: Dashboard page.
 *
 * @returns {{
 *   allProducts:    object[],
 *   activeProducts: object[],
 *   isLoading:      boolean,
 *   isError:        boolean,
 *   error:          Error|null
 * }}
 */
export function useActiveProducts() {
    const { data, isLoading, isError, error } = useProductsData();

    const allProducts = data ?? [];

    // useMemo avoids re-filtering on unrelated parent re-renders.
    // The identity of `allProducts` only changes when React Query writes to the cache.
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
/**
 * Mutation hook for toggling a product's active flag.
 *
 * Optimistic update strategy:
 *   1. `onMutate`  — cancel in-flight refetches, snapshot the current cache,
 *                    then immediately flip `active` in the cache so the UI
 *                    reacts without waiting for the server.
 *   2. `onError`   — restore the pre-mutation snapshot on server failure.
 *   3. `onSettled` — always invalidate to re-sync with server truth, whether
 *                    the mutation succeeded or was rolled back.
 *
 * Consumer: useToggleWithToast (which adds validation and toast feedback).
 *
 * @returns {import("@tanstack/react-query").UseMutationResult<object, Error, number>}
 */
export function useToggleProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: toggleProductApi,

        onMutate: async (productId) => {
            // Cancel any in-flight refetch so it doesn't overwrite our optimistic write.
            await queryClient.cancelQueries({ queryKey: QUERY_KEYS.products });

            // Save a snapshot for rollback.
            const previous = queryClient.getQueryData(QUERY_KEYS.products);

            // Optimistically flip the target product's `active` flag.
            queryClient.setQueryData(QUERY_KEYS.products, (old) => {
                if (!old) return old;
                return old.map((p) =>
                    p.id === productId ? { ...p, active: !p.active } : p,
                );
            });

            // Return context so `onError` can access the snapshot.
            return { previous };
        },

        onError: (_err, _productId, context) => {
            // Restore the cache to its pre-mutation state on server failure.
            if (context?.previous) {
                queryClient.setQueryData(QUERY_KEYS.products, context.previous);
            }
        },

        onSettled: () => {
            // Re-sync with server truth regardless of success or failure.
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
        },
    });
}

// ── useCalculatorSettings ─────────────────────────────────────────────────────
/**
 * Fetches the calculator settings (waste percentage, coverage, configured flag).
 *
 * @returns {import("@tanstack/react-query").UseQueryResult<object>}
 */
export function useCalculatorSettings() {
    return useQuery({
        queryKey: QUERY_KEYS.calculatorSettings,
        queryFn:  async () => {
            const { data } = await api.get("/mustashar/api/calculator-settings");
            return data;
        },
    });
}

/**
 * Derived hook — returns a single boolean indicating whether the calculator
 * has been fully configured by the merchant.
 *
 * @returns {{ isLoading: boolean, isConfigured: boolean }}
 */
export function useSettingsStatus() {
    const { data, isLoading } = useCalculatorSettings();
    return {
        isLoading,
        // `configured` is false-y until the merchant has saved settings at least once.
        isConfigured: !isLoading && !!data?.configured,
    };
}

// ── useUpdateCalculatorSettings ───────────────────────────────────────────────
/**
 * Mutation hook for saving the calculator's waste percentage.
 * On success, writes the server-confirmed values back into the cache directly
 * (no invalidation round-trip needed — the server returns the full updated object).
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useUpdateCalculatorSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ waste_percentage }) => {
            const { data } = await api.post("/mustashar/api/calculator-settings", {
                waste_percentage,
            });
            return data;
        },

        onSuccess: (data) => {
            // Write the server-confirmed values directly into the cache.
            queryClient.setQueryData(QUERY_KEYS.calculatorSettings, {
                waste:      data.waste,
                configured: data.configured,
            });
        },
    });
}

// ── useUpdateProductCoverage ──────────────────────────────────────────────────
/**
 * Mutation hook for updating a single product's coverage_per_unit value.
 * On success, patches that one product in the cache without refetching
 * the entire list — keeping all other products' optimistic state intact.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
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

        onSuccess: (_, { productId, coverage_per_unit }) => {
            // Surgically update only the affected product in the cache.
            queryClient.setQueryData(QUERY_KEYS.products, (old) => {
                if (!old) return old;
                return old.map((p) =>
                    p.id === productId ? { ...p, coverage_per_unit } : p,
                );
            });
        },
    });
}
