/**
 * @file useProductsFilter.js
 * @module Hooks
 *
 * Derives a filtered product list from the React Query cache
 * for use on the Products page.
 *
 * Responsibilities:
 *   - Search filtering (by product name or Salla product ID)
 *   - Category filtering via a dropdown
 *   - Category dropdown option derivation from live cache data
 *
 * Order: exactly as the server returns. No sorting, ever.
 *
 * Used by: Products page.
 */

import { useState, useMemo } from "react";
import { useAllProducts } from "./useProducts";
import { useTranslation } from "react-i18next";

/**
 * useProductsFilter
 *
 * Composes search and category filtering on top of the shared React Query
 * products cache. Returns a filtered subset in the exact order the server
 * delivered — no client-side sorting is applied at any point.
 *
 * @returns {{
 *   sorted:            object[],                        - Filtered product array in server order.
 *   search:            string,                          - Current search query string.
 *   setSearch:         (value: string) => void,         - Updates the search query.
 *   categoryFilter:    string,                          - Active category filter value.
 *   setCategoryFilter: (value: string) => void,         - Updates the category filter.
 *   categoryOptions:   { value: string, label: string }[], - Options derived from the live product list.
 *   isLoading:         boolean,                         - True while the initial fetch is in flight.
 *   isError:           boolean,                         - True if the fetch failed.
 *   error:             Error|null,                      - The error object, if any.
 *   refetch:           () => Promise<void>,             - Triggers a manual cache refetch.
 * }}
 */
export function useProductsFilter() {
    const { t } = useTranslation("mustashar");
    const { products, isLoading, isError, error, refetch } = useAllProducts();

    const [search,         setSearch]         = useState("");
    const [categoryFilter, setCategoryFilter] = useState(t("products_filter.category_all"));

    // ── Category dropdown options ─────────────────────────────────────────────
    // Built from the live product list so new categories appear automatically
    // after a catalog sync, without requiring a page reload.
    const categoryOptions = useMemo(
        () =>
            [
                t("products_filter.category_all"),
                ...new Set(products.map((p) => p.category || t("products_filter.category_uncategorized"))),
            ]
                .map((c) => ({ value: c, label: c })),
        [products, t],
    );

    // ── Filtered list — server order preserved ────────────────────────────────
    // Applies both filters in a single pass. The result preserves the original
    // array order from the server — no sort comparator is used.
    const sorted = useMemo(() => {
        return products.filter((p) => {
            // Category match: pass everything when "All" is selected.
            const matchCat    = categoryFilter === t("products_filter.category_all") || p.category === categoryFilter;

            // Search match: pass everything when the query is empty; otherwise
            // check both the display name and the numeric Salla product ID.
            const matchSearch =
                !search ||
                p.name?.toLowerCase().includes(search.toLowerCase()) ||
                p.salla_product_id?.toString().includes(search);

            return matchCat && matchSearch;
        });
    }, [products, categoryFilter, search]);

    return {
        sorted,
        search,
        setSearch,
        categoryFilter,
        setCategoryFilter,
        categoryOptions,
        isLoading,
        isError,
        error,
        refetch,
    };
}