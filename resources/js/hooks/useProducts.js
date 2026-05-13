/**
 * @file useProducts.js
 * @module Hooks
 *
 * @description
 * Central React Query hooks file for all product-related and calculator-settings
 * server state in the Mustashar sub-app.
 *
 * Exports:
 *  - `useAllProducts`              — full product list for Products.jsx
 *  - `useActiveProducts`           — filtered active list + calcRules for Dashboard.jsx
 *  - `useToggleProduct`            — optimistic-update mutation for toggling a product
 *  - `useUpdateCalcRules`          — mutation to patch calc rules (legacy, future use)
 *  - `useCalculatorSettings`       — fetches persisted coverage / waste settings
 *  - `useSettingsStatus`           — convenience hook: isConfigured flag
 *  - `useUpdateCalculatorSettings` — mutation to POST new coverage / waste values
 *
 * Architecture notes:
 *  - A single shared `useProductsData` query avoids duplicate network requests
 *    when both `useAllProducts` and `useActiveProducts` are mounted simultaneously.
 *  - Optimistic updates in `useToggleProduct` roll back automatically on error.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// ---------------------------------------------------------------------------
// Axios instance — adds JSON headers to every request made through this file.
// ---------------------------------------------------------------------------
const api = axios.create({
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
    },
});

// ── API functions ─────────────────────────────────────────────────────────────

/**
 * Fetches the full product list from the Mustashar API.
 * Normalises the response to always return a plain array,
 * handling both `{ data: [...] }` and bare array responses.
 *
 * @returns {Promise<Array>}
 */
async function fetchProducts() {
    const { data } = await axios.get("/mustashar/api/products");
    return data.data || data;
}

/**
 * Toggles the active/inactive state of a single product.
 * Throws if the server returns `success: false`.
 *
 * @param {number|string} productId
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
async function toggleProductApi(productId) {
    const { data } = await axios.post(
        `/mustashar/api/products/${productId}/toggle`,
    );

    if (!data.success) {
        throw new Error(data.message ?? "Failed to toggle product.");
    }

    return data;
}

/**
 * Patches the calculator rules (coverage_per_unit / waste_percentage).
 * Used by the legacy `useUpdateCalcRules` hook.
 *
 * @param {{ coverage_per_unit?: number, waste_percentage?: number }} rules
 * @returns {Promise<object>}
 */
async function updateCalcRulesApi(rules) {
    const { data } = await api.patch("/api/calc-rules", rules);
    return data;
}

// ── Query Keys ────────────────────────────────────────────────────────────────
// Centralising keys prevents cache key typos and simplifies invalidation.
export const QUERY_KEYS = {
    products: ["products"],
    calcRules: ["calcRules"],
};

// ── Shared internal query ─────────────────────────────────────────────────────

/**
 * Internal base query for the product list.
 * Shared between `useAllProducts` and `useActiveProducts` so React Query
 * de-duplicates the network request when both consumers are mounted.
 *
 * @private
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
function useProductsData() {
    return useQuery({
        queryKey: QUERY_KEYS.products,
        queryFn: fetchProducts,
        staleTime: 30_000, // Keep data fresh for 30 s before background refetch.
        placeholderData: (prev) => prev, // Show previous data while refetching (no flicker).
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// useAllProducts  →  used by Products.jsx
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the complete product list plus query metadata.
 * Intended for the Products management page where all products are shown.
 *
 * @returns {{
 *   products:  Array,
 *   isLoading: boolean,
 *   isError:   boolean,
 *   error:     Error|null,
 *   refetch:   function,
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

// ─────────────────────────────────────────────────────────────────────────────
// useActiveProducts  →  used by Dashboard.jsx
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns both the full product list and its active-only subset,
 * plus the embedded `calcRules` meta block used by the dashboard calculator.
 *
 * @returns {{
 *   allProducts:    Array,
 *   activeProducts: Array,
 *   calcRules:      { coverage: number, waste: number },
 *   isLoading:      boolean,
 *   isError:        boolean,
 *   error:          Error|null,
 * }}
 */
export function useActiveProducts() {
    const { data, isLoading, isError, error } = useProductsData();

    const allProducts = data ?? [];
    // Client-side filter; the server returns all products, we slice here.
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

/**
 * Mutation hook to toggle a product's active state with an optimistic update.
 *
 * Optimistic flow:
 *  1. `onMutate`  — cancels in-flight queries, snapshots previous data,
 *                   immediately flips the product's `active` flag in the cache.
 *  2. `onError`   — restores the snapshot if the server request fails.
 *  3. `onSettled` — always invalidates the products query to re-sync with server.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useToggleProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: toggleProductApi,

        onMutate: async (productId) => {
            // Cancel any outgoing refetches so they don't overwrite the optimistic update.
            await queryClient.cancelQueries({ queryKey: QUERY_KEYS.products });
            const previous = queryClient.getQueryData(QUERY_KEYS.products);

            // Optimistically flip the targeted product's active flag.
            queryClient.setQueryData(QUERY_KEYS.products, (old) => {
                if (!old) return old;
                return old.map((p) =>
                    p.id === productId ? { ...p, active: !p.active } : p,
                );
            });

            // Return snapshot so `onError` can roll back.
            return { previous };
        },

        onError: (_err, _productId, context) => {
            // Roll back to the pre-mutation snapshot on failure.
            if (context?.previous) {
                queryClient.setQueryData(QUERY_KEYS.products, context.previous);
            }
        },

        onSettled: () => {
            // Always re-fetch after settle to guarantee server/client consistency.
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
        },
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// useUpdateCalcRules  →  legacy hook for future use
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mutation to PATCH calculator rules via the legacy `/api/calc-rules` endpoint.
 * On success it writes the returned rules into the products query cache under
 * `meta.calcRules`, keeping the dashboard in sync without a refetch.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useUpdateCalcRules() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateCalcRulesApi,
        onSuccess: (updatedRules) => {
            // Merge updated rules into the existing products cache entry.
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

/**
 * Fetches the persisted Mustashar calculator settings from the server.
 * Response shape: `{ coverage: number, waste: number, configured: boolean }`
 *
 * @returns {import('@tanstack/react-query').UseQueryResult<{
 *   coverage:   number,
 *   waste:      number,
 *   configured: boolean,
 * }>}
 */
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

/**
 * Convenience hook that exposes whether the user has ever saved their
 * calculator settings. Used by guard or onboarding flows.
 *
 * @returns {{ isLoading: boolean, isConfigured: boolean }}
 */
export function useSettingsStatus() {
    const { data, isLoading } = useCalculatorSettings();
    // `configured` is only meaningful once the query has resolved.
    const isConfigured = !isLoading && !!data?.configured;
    return { isLoading, isConfigured };
}

/**
 * Mutation hook to save (POST) updated calculator settings.
 *
 * Payload sent  : `{ coverage_per_unit: number, waste_percentage: number }`
 * Response shape: `{ coverage: number, waste: number, configured: boolean }`
 *
 * On success the `calculator-settings` query cache is updated directly,
 * avoiding a redundant GET request.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useUpdateCalculatorSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ coverage, waste }) => {
            const { data } = await axios.post(
                "/mustashar/api/calculator-settings",
                {
                    coverage_per_unit: coverage, // API field name expected by Laravel
                    waste_percentage: waste, // API field name expected by Laravel
                },
            );
            return data;
        },

        onSuccess: (data) => {
            // Write the server-confirmed values back into the cache so the
            // settings form always reflects the true persisted state.
            queryClient.setQueryData(["calculator-settings"], {
                coverage: data.coverage,
                waste: data.waste,
                configured: data.configured,
            });
        },
    });
}
