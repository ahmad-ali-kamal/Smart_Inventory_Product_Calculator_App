/**
 * @file useInventory.js
 * @module Hooks
 *
 * @description
 * Central collection of React Query hooks for the Harees inventory module.
 * Each hook wraps a single service call and exposes it through a consistent
 * React Query interface (query or mutation).
 *
 * Service calls are imported from `inventoryService` which keeps HTTP transport
 * details (fetch / axios, headers, URL construction) out of the hook layer,
 * making both sides independently testable.
 *
 * Query key convention:
 *   ["harees", "<resource>"]  — e.g. ["harees", "dashboard"]
 * This namespacing lets targeted `invalidateQueries` calls selectively bust
 * only the affected resource rather than the entire cache.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
    getDashboard,
    getProducts,
    getSettings,
    updateSettings,
    storeExpiry,
    storeBatch,
    updateBatch,
    deleteBatch,
} from '../services/inventoryService';

// ─────────────────────────────────────────────────────────────────────────────
// Query hooks (read)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useInventoryDashboard
 *
 * Fetches the aggregated dashboard data: stat counts (expired / approaching /
 * safe) and the flat product list used by MonitoredProductsTable.
 *
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export const useInventoryDashboard = () => {
    return useQuery({
        queryKey: ['harees', 'dashboard'],
        queryFn:  getDashboard,
        refetchOnWindowFocus: true,
    });
};

/**
 * useInventoryProducts
 *
 * Fetches the full list of monitored products with their nested batches.
 * Used by pages / components that need more granular product data than
 * the dashboard summary provides.
 *
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export const useInventoryProducts = () => {
    return useQuery({
        queryKey: ['harees', 'products'],
        queryFn:  getProducts,
    });
};

/**
 * useInventorySettings
 *
 * Fetches the merchant's Harees configuration (expiry thresholds, auto-discount
 * toggle, etc.).  Used by the Settings page and any component that needs to
 * know whether setup is complete.
 *
 * @returns {import('@tanstack/react-query').UseQueryResult}
 */
export const useInventorySettings = () => {
    return useQuery({
        queryKey: ['harees', 'settings'],
        queryFn:  getSettings,
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// Mutation hooks (write)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useUpdateInventorySettings
 *
 * Persists changes to the merchant's Harees settings.
 * Invalidates both "settings" and "dashboard" caches on success because
 * threshold changes can alter which products are flagged as approaching / expired.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export const useUpdateInventorySettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateSettings,

        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['harees', 'settings'] });
            queryClient.invalidateQueries({ queryKey: ['harees', 'dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['harees', 'products'] });

            if (variables?.auto_discounts) {
                setTimeout(() => {
                    queryClient.invalidateQueries({ queryKey: ['harees', 'dashboard'] });
                    queryClient.invalidateQueries({ queryKey: ['harees', 'products'] });
                }, 4000);
            }
        },
    });
};

/**
 * useStoreExpiry
 *
 * Creates a new expiry record for a product.
 * `await` is used on both invalidation calls to guarantee the cache is fully
 * refreshed before the calling modal closes.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export const useStoreExpiry = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: storeExpiry,

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['harees', 'dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['harees', 'products'] });
        },
    });
};

// ── deleteExpiryApi ───────────────────────────────────────────────────────────
/**
 * deleteExpiryApi
 *
 * Standalone async function that sends a DELETE request to remove all batches
 * associated with the given expiry record.  Decoupled from the hook so it can
 * be tested independently without React Query infrastructure.
 *
 * Uses the native `fetch` API (rather than Axios) so it can read the CSRF
 * token from the meta tag, which is required by Laravel's CSRF middleware.
 *
 * @async
 * @param {number} productId - ID of the expiry record to delete.
 * @returns {Promise<Object>} Parsed JSON response on success.
 * @throws {Error} When the HTTP response is not OK or `data.success` is falsy.
 */
async function deleteExpiryApi(productId) {
    // Read the Laravel CSRF token injected into the document head.
    const token = document.querySelector('meta[name="csrf-token"]')?.content;

    const res = await fetch(`/harees/api/expiry/${productId}`, {
        method:      'DELETE',
        headers: {
            Accept:            'application/json',
            'X-CSRF-TOKEN':    token,
            'X-Requested-With':'XMLHttpRequest',
        },
        credentials: 'include', // Send session cookie for authentication
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete batches');
    }

    return data;
}

/**
 * useDeleteExpiry
 *
 * Deletes an expiry record (and its associated batches) for a product.
 * Preferred over calling `deleteExpiryApi` directly in components because
 * it handles cache invalidation automatically.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export const useDeleteExpiry = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteExpiryApi,

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['harees', 'dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['harees', 'products'] });
        },
    });
};

/**
 * useStoreBatch
 *
 * Creates a new batch record for a product.
 * Both query keys are invalidated so the products list and dashboard summary
 * counts are updated simultaneously.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export const useStoreBatch = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: storeBatch,

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['harees', 'dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['harees', 'products'] });
        },
    });
};

/**
 * useUpdateBatch
 *
 * Updates an existing batch record (e.g. correcting an expiry date or
 * changing the batch code).
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export const useUpdateBatch = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateBatch,

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['harees', 'dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['harees', 'products'] });
        },
    });
};

/**
 * useDeleteBatch
 *
 * Deletes a single batch with full cleanup (discounts, Salla option values,
 * variants). Invalidates dashboard and products caches on success.
 *
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export const useDeleteBatch = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteBatch,

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['harees', 'dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['harees', 'products'] });
        },
    });
};