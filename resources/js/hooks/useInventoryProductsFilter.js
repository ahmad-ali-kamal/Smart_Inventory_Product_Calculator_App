/**
 * @file useInventoryProductsFilter.js
 * @module Hooks
 *
 * @description
 * Custom hook that layers client-side search and filter logic on top of the
 * `useInventoryProducts` React Query result.
 *
 * Responsibilities:
 *  - Expose `search` and `filter` state with their setters so the page's
 *    TableToolbar can be a fully controlled component.
 *  - Derive the `filtered` product array via `useMemo` so the filter
 *    computation only re-runs when `products`, `search`, or `filter` changes.
 *  - Re-export the raw query flags (`isLoading`, `isError`, `error`, `refetch`)
 *    so the page doesn't need to import `useInventoryProducts` separately.
 *  - Export `FILTER_OPTIONS` alongside the hook so the dropdown in TableToolbar
 *    and the filter logic always stay in sync from a single source of truth.
 */

import { useState, useMemo } from "react";
import { useInventoryProducts } from "./useInventory";

/**
 * Dropdown filter options for the TableToolbar.
 * The `value` field is matched against `product.bucket_type` during filtering.
 * Export alongside the hook so both the UI and the logic share the same list.
 *
 * @type {Array<{ value: string, label: string }>}
 */
export const FILTER_OPTIONS = [
    { value: 'all',    label: 'All'    },
    { value: 'short',  label: 'Short'  },
    { value: 'medium', label: 'Medium' },
    { value: 'long',   label: 'Long'   },
];

/**
 * useInventoryProductsFilter
 *
 * Wraps `useInventoryProducts` with client-side search and bucket-type
 * filtering, returning a pre-filtered product list ready for the table.
 *
 * Search matches against:
 *  - `product.name`              (case-insensitive substring)
 *  - `product.salla_product_id`  (coerced to lowercase string)
 *
 * Filter matches against:
 *  - `product.bucket_type`  — one of: 'short' | 'medium' | 'long'
 *  - 'all'                  — no filter applied (all products pass through)
 *
 * @returns {Object}
 * @returns {Array}    return.filtered   - Products that pass both the search and filter.
 * @returns {string}   return.search     - Current search string (controlled).
 * @returns {Function} return.setSearch  - Updates the search string.
 * @returns {string}   return.filter     - Current filter value (controlled).
 * @returns {Function} return.setFilter  - Updates the active filter.
 * @returns {boolean}  return.isLoading  - True while the products query is fetching.
 * @returns {boolean}  return.isError    - True if the products query has failed.
 * @returns {Error|null} return.error    - The Error object from the query, or null.
 * @returns {Function} return.refetch    - Manually re-triggers the products query.
 */
export function useInventoryProductsFilter() {
    // ── Controlled filter state ───────────────────────────────────────────────
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    // ── Raw query ─────────────────────────────────────────────────────────────
    const { data, isLoading, isError, error, refetch } = useInventoryProducts();

    // ── Normalise API response shape ──────────────────────────────────────────
    // The API may return products under either `data.products` (v2) or
    // `data.data` (v1 envelope), so both shapes are handled here.
    const products = useMemo(() => data?.products || data?.data || [], [data]);

    // ── Client-side filtering ─────────────────────────────────────────────────
    const filtered = useMemo(() =>
        products.filter(p => {
            // Search: matches name OR Salla product ID (both case-insensitive)
            const matchesSearch =
                p.name?.toLowerCase().includes(search.toLowerCase()) ||
                p.salla_product_id?.toString().toLowerCase().includes(search.toLowerCase());

            // Bucket filter: 'all' passes everything; otherwise exact match on bucket_type
            const matchesFilter = filter === "all" || p.bucket_type === filter;

            return matchesSearch && matchesFilter;
        }),
        [products, search, filter]
    );

    return {
        filtered,
        search, setSearch,
        filter, setFilter,
        isLoading, isError, error, refetch,
    };
}