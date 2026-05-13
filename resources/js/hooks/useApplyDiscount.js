/**
 * @file useApplyDiscount.js
 * @module Hooks
 *
 * @description
 * React Query mutation hook that applies a manual discount to a specific
 * product batch via the Harees API.
 *
 * Responsibilities:
 *  - Encapsulates the Axios POST request and server-response validation.
 *  - Automatically invalidates the relevant React Query caches on success so
 *    the Dashboard and Products pages reflect the change immediately.
 *  - Throws a descriptive `Error` on failure so the calling component
 *    (BatchRow / DiscountModal) can surface the message to the user.
 *
 * Usage:
 * ```js
 * const { mutateAsync, isPending } = useApplyDiscount(product.id);
 * await mutateAsync({ batchId, discountPct, endDate });
 * ```
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

/**
 * applyDiscountApi
 *
 * Standalone async function that performs the actual HTTP request.
 * Decoupled from the hook so it can be unit-tested in isolation.
 *
 * Axios automatically throws for 4xx / 5xx responses, so the `if (!data.success)`
 * guard below handles application-level errors where the HTTP status is 200
 * but the payload signals failure.
 *
 * @async
 * @param {Object} params
 * @param {number} params.productId    - Scopes the endpoint to the correct product.
 * @param {number} params.batchId      - ID of the batch receiving the discount.
 * @param {number} params.discountPct  - Integer percentage (1–99).
 * @param {string} params.endDate      - ISO date string (YYYY-MM-DD) for discount expiry.
 * @returns {Promise<Object>} The `data` object from a successful API response.
 * @throws {Error} When the HTTP request fails OR when `data.success` is falsy.
 */
async function applyDiscountApi({ productId, batchId, discountPct, endDate }) {
    const { data } = await axios.post(
        `/harees/api/products/${productId}/discounts/apply`,
        {
            batch_id:            batchId,
            discount_percentage: discountPct,
            ends_at:             endDate,
            // Flag distinguishes manual discounts from AI-suggested ones in analytics.
            is_ai_suggested:     false,
        }
    );

    // Guard: the server responded with HTTP 200 but signalled a logical failure.
    if (!data.success) {
        throw new Error(data.message || 'Failed to apply discount');
    }

    return data;
}

/**
 * useApplyDiscount
 *
 * React Query mutation hook for applying a batch discount.
 * Wraps `applyDiscountApi` and handles cache invalidation on success.
 *
 * @param {number} productId - The product whose batch will receive the discount.
 *                            Passed to `applyDiscountApi` via `mutationFn` closure.
 * @returns {import('@tanstack/react-query').UseMutationResult}
 *   The full mutation result object from React Query.
 *   Key fields used by consumers:
 *     - `mutateAsync` — call with `{ batchId, discountPct, endDate }`
 *     - `isPending`   — true while the request is in-flight
 */
export function useApplyDiscount(productId) {
    const queryClient = useQueryClient();

    return useMutation({
        /**
         * `productId` is captured from the outer scope (hook argument) and merged
         * with the per-call `variables` so the API function receives a complete params object.
         */
        mutationFn: (variables) => applyDiscountApi({ productId, ...variables }),

        onSuccess: () => {
            // Invalidate both query keys so the Dashboard stat cards and the
            // MonitoredProductsTable both re-fetch with fresh data simultaneously.
            queryClient.invalidateQueries({ queryKey: ['inventory', 'dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['inventory', 'products'] });
        },
    });
}