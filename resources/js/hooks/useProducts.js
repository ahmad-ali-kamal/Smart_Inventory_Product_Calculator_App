// resources/js/hooks/useProducts.js
//
// ─── WHY HOOKS INSTEAD OF CONTEXT ────────────────────────────────────────────
// React Query manages server state (loading, caching, refetching, errors).
// Context is for UI / client state (filters, modals, theme).
// Mixing them causes stale-data bugs and unnecessary re-renders.
//
// Pattern used here: one file = one domain.
// Import only what a page needs — Dashboard gets `useActiveProducts`,
// Products page gets `useAllProducts`. Same underlying query, zero duplication.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// ── Axios instance ────────────────────────────────────────────────────────────
// Mirrors the legacy products.js headers:
//   X-CSRF-TOKEN, Accept: application/json, X-Requested-With: XMLHttpRequest
// Axios automatically reads the CSRF token from the meta tag when configured
// via axios.defaults (done in bootstrap.js / app.js). The headers below are
// the per-request equivalents that match what the legacy fetch() sent manually.
const api = axios.create({
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        // Axios picks up X-CSRF-TOKEN automatically from the cookie / meta tag
        // via the global axios.defaults.headers.common set in bootstrap.js.
        // If you are NOT using bootstrap.js, uncomment the line below:
        // "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.content ?? "",
    },
});

// ── API functions ─────────────────────────────────────────────────────────────

/**
 * fetchProducts — GET /api/products
 * Expected response shape:
 * {
 *   data: Product[],
 *   meta: { calcRules: { coverage: number, waste: number } }
 * }
 */
async function fetchProducts() {
    const { data } = await axios.get("/mustashar/api-proxy/products");
    return data.data || data;
}

/**
 * toggleProductApi — POST /api/products/{id}/toggle
 * Matches the legacy URL pattern: `this.dataset.toggleUrl`
 *
 * Expected response shape (mirrors legacy `data` object):
 * {
 *   success:    boolean,
 *   is_enabled: boolean,   // <-- same field as legacy `data.is_enabled`
 *   message?:   string,
 * }
 */
async function toggleProductApi(productId) {
    const { data } = await api.post(`/api/products/${productId}/toggle`);

    if (!data.success) {
        // Surface the server's own error message when available,
        // matching the legacy `throw new Error(data.message ?? 'Failed')` pattern.
        throw new Error(data.message ?? "Failed to toggle product.");
    }

    return data; // { success, is_enabled, message? }
}

/**
 * updateCalcRulesApi — PATCH /api/calc-rules
 */
async function updateCalcRulesApi(rules) {
    const { data } = await api.patch("/api/calc-rules", rules);
    return data;
}

// ── Query Keys ────────────────────────────────────────────────────────────────
export const QUERY_KEYS = {
    products: ["products"],
    calcRules: ["calcRules"],
};

// ─────────────────────────────────────────────────────────────────────────────
// useProductsData  (private base query)
// Both page-level hooks below consume this same cached entry — zero duplication.
// ─────────────────────────────────────────────────────────────────────────────
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
        products: data?.data ?? [],
        calcRules: data?.meta?.calcRules ?? { coverage: 0, waste: 0 },
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

    const allProducts = data?.data ?? [];
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

// ─────────────────────────────────────────────────────────────────────────────
// useToggleProduct  →  used by both Products.jsx and Dashboard.jsx
//
// Optimistic update pattern (mirrors legacy products.js flow):
//   Legacy step                     React Query equivalent
//   ─────────────────────────────── ──────────────────────────────────────────
//   updateRow(row, optimistic)   →  onMutate: flip `active` in cache
//   fetch(url, { method: POST }) →  mutationFn: toggleProductApi
//   catch → updateRow(row, !opt) →  onError: restore snapshot from context
//   finally → remove loading     →  onSettled: invalidate + consumers re-render
//
// The `loading` prop on ProductRow/Toggle is driven by:
//   toggleMutation.isPending && toggleMutation.variables === product.id
// (wired up in Products.jsx)
// ─────────────────────────────────────────────────────────────────────────────
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
                return {
                    ...old,
                    data: old.data.map((p) =>
                        p.id === productId ? { ...p, active: !p.active } : p,
                    ),
                };
            });

            // 4. Return snapshot so onError can restore it
            return { previous };
        },

        // Network / server error → roll back to snapshot
        onError: (_err, _productId, context) => {
            if (context?.previous) {
                queryClient.setQueryData(QUERY_KEYS.products, context.previous);
            }
        },

        // onSuccess is intentionally NOT used to sync the toggle —
        // that happens in onSettled via invalidation so the UI always reflects
        // the real server state after the request settles (success or error).

        // Always sync with real server state after settle (success OR error)
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
