/**
 * @file useProducts.js
 * @module Hooks
 *
 * Central data layer for the Mustashar product catalog and settings.
 * All server communication in the Mustashar feature flows
 * through the hooks exported here — no component fetches data directly.
 *
 * Architecture overview:
 *   - A single shared React Query base hook (`useProductsData`) issues one
 *     cached GET request for the product list; all consumer hooks derive
 *     from it so the network call is de-duplicated automatically.
 *   - Mutation hooks follow the optimistic-update pattern: the cache is
 *     patched immediately on `onMutate`, rolled back on `onError`, and
 *     confirmed/invalidated on `onSettled` / `onSuccess`.
 *
 * Exported hooks:
 *   - useAllProducts                → Products page (full list, unfiltered)
 *   - useActiveProducts             → Dashboard (active subset + all for counters)
 *   - useToggleProduct              → Optimistic active/inactive toggle mutation
 *   - useMustasharSettings          → Mustashar config read
 *   - useSettingsStatus             → Derived "is configured?" boolean
 *   - useUpdateMustasharSettings    → Mustashar config write mutation
 *   - useUpdateProductCoverage      → Per-product coverage write mutation
 *   - useUpdateProductWaste         → Per-product waste write mutation
 */

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// ── Shared axios instance ─────────────────────────────────────────────────────
// Sets JSON headers and the Laravel AJAX flag on every request so controllers
// return JSON error responses instead of HTML redirects.
const api = axios.create({
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
    },
});

// ── Query key registry ────────────────────────────────────────────────────────
// Centralising keys prevents string typos and makes cache invalidation
// explicit and easy to grep across the codebase.
export const QUERY_KEYS = {
    products: ["products"],
    calculatorSettings: ["mustashar-settings"],
};

// ── API functions ─────────────────────────────────────────────────────────────

/**
 * Fetches the full product list from the server.
 * Normalises the response by unwrapping the `data` envelope when present.
 *
 * @returns {Promise<object[]>} Array of product objects.
 */
async function fetchProducts() {
    const { data } = await api.get("/mustashar/api/products");
    return data.data ?? data;
}

/**
 * Sends a toggle request for a single product.
 * Throws on server-reported failure so React Query can trigger `onError`.
 *
 * @param {number} productId - ID of the product to toggle.
 * @returns {Promise<object>} Server response payload.
 */
async function toggleProductApi(productId) {
    const { data } = await api.post(
        `/mustashar/api/products/${productId}/toggle`,
    );
    if (!data.success)
        throw new Error(data.message ?? "Failed to toggle product.");
    return data;
}

// ── Shared base query ─────────────────────────────────────────────────────────

/**
 * Internal hook that owns the single product-list query.
 * All exported product hooks call this so they share the same cache entry.
 *
 * @returns {import("@tanstack/react-query").UseQueryResult<object[]>}
 */
function useProductsData() {
    return useQuery({
        queryKey: QUERY_KEYS.products,
        queryFn: fetchProducts,
        // Keep data fresh for 30 s before triggering a background refetch.
        staleTime: 30_000,
        // Show the previous data while a refetch is in-flight (no loading flash).
        placeholderData: (prev) => prev,
    });
}

// ── useAllProducts ────────────────────────────────────────────────────────────

/**
 * Provides the full, unfiltered product list for the Products page.
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
 * Provides both the full product list (for counters) and a memoised subset
 * of active products (for the Dashboard tile list).
 *
 * The active subset is recalculated only when the underlying data changes,
 * avoiding redundant iterations on every render.
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
    const { data, isLoading, isError, error, refetch } = useProductsData();

    const allProducts = data ?? [];

    // Memoised so the filtered array reference is stable between renders.
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
        refetch,
    };
}

// ── useToggleProduct ──────────────────────────────────────────────────────────

/**
 * Mutation hook that optimistically toggles a product's `active` flag.
 *
 * Optimistic update flow:
 *   1. `onMutate`  — cancel in-flight queries, snapshot the cache, flip the flag.
 *   2. `onError`   — restore the snapshot if the server call fails.
 *   3. `onSettled` — invalidate the cache to re-sync with the server truth.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useToggleProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: toggleProductApi,

        onMutate: async (productId) => {
            // Cancel any outgoing refetches to prevent them from overwriting
            // the optimistic update.
            await queryClient.cancelQueries({ queryKey: QUERY_KEYS.products });
            const previous = queryClient.getQueryData(QUERY_KEYS.products);

            // Flip the targeted product's active flag in the cache immediately.
            queryClient.setQueryData(QUERY_KEYS.products, (old) => {
                if (!old) return old;
                return old.map((p) =>
                    p.id === productId ? { ...p, active: !p.active } : p,
                );
            });

            // Return the snapshot so onError can roll back.
            return { previous };
        },

        onError: (_err, _productId, context) => {
            // Roll back the optimistic update on failure.
            if (context?.previous) {
                queryClient.setQueryData(QUERY_KEYS.products, context.previous);
            }
        },

        onSettled: () => {
            // Always re-sync with the server after the mutation settles.
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
        },
    });
}

// ── useMustasharSettings ─────────────────────────────────────────────────────

/**
 * Fetches the global mustashar settings from the server.
 *
 * Server response shape:
 *   `{ configured: boolean, coverage: number|null, waste: number|null }`
 *
 * @returns {import("@tanstack/react-query").UseQueryResult<{
 *   configured: boolean,
 *   coverage:   number|null,
 *   waste:      number|null
 * }>}
 */
export function useMustasharSettings() {
    return useQuery({
        queryKey: QUERY_KEYS.calculatorSettings,
        queryFn: async () => {
            const { data } = await api.get("/mustashar/api/mustashar-settings");
            return data;
        },
    });
}

/**
 * Derived hook — returns a single boolean indicating whether mustashar
 * has been configured at least once.
 * Used by the Dashboard guard banner to prompt first-time setup.
 *
 * @returns {{ isLoading: boolean, isConfigured: boolean }}
 */
export function useSettingsStatus() {
    const { data, isLoading } = useMustasharSettings();
    return {
        isLoading,
        isConfigured: !isLoading && !!data?.configured,
    };
}

// ── useUpdateMustasharSettings ───────────────────────────────────────────────

/**
 * Mutation hook for saving the global mustashar settings.
 *
 * On success, the cache entry for `calculatorSettings` is updated in-place
 * (avoiding a redundant GET) and the products cache is invalidated so that
 * every product row re-resolves its `coverage_source` / `waste_source`.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useUpdateMustasharSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ waste_percentage, coverage_per_unit }) => {
            const { data } = await api.post(
                "/mustashar/api/mustashar-settings",
                { coverage_per_unit, waste_percentage },
            );
            return data;
        },

        onSuccess: (data) => {
            // Write the server's confirmed values straight into the cache.
            queryClient.setQueryData(QUERY_KEYS.calculatorSettings, {
                coverage: data.coverage,
                waste: data.waste,
                configured: data.configured,
            });

            // Changing global settings affects every product whose
            // coverage_source or waste_source is 'global' — force a refetch.
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
        },
    });
}

// ── useUpdateProductCoverage ──────────────────────────────────────────────────

/**
 * Mutation hook for updating a single product's `coverage_per_unit`.
 *
 * Patches only the affected product in the cache after a successful save,
 * so the rest of the list is untouched and no full refetch is triggered.
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

        onSuccess: (serverData, { productId, coverage_per_unit }) => {
            // Surgically update only the changed product in the cache.
            queryClient.setQueryData(QUERY_KEYS.products, (old) => {
                if (!old) return old;
                return old.map((p) => {
                    if (p.id !== productId) return p;
                    return {
                        ...p,
                        coverage_per_unit,
                        // Prefer the server-resolved source; fall back to 'product'.
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
 * Mutation hook for updating a single product's `waste_percentage`.
 *
 * Mirrors `useUpdateProductCoverage` exactly in structure.
 * Passing `waste_percentage: null` clears the per-product override so the
 * product falls back to the global setting.
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
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
            // Surgically update only the changed product in the cache.
            queryClient.setQueryData(QUERY_KEYS.products, (old) => {
                if (!old) return old;
                return old.map((p) => {
                    if (p.id !== productId) return p;
                    return {
                        ...p,
                        // If null was passed, fall back to the server-resolved value.
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
