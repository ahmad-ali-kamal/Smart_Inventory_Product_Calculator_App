import { useState, useMemo } from "react";
import { useAllProducts } from "./useProducts";

export function useProductsFilter() {
    const { products, isLoading, isError, error, refetch } = useAllProducts();

    const [search, setSearch]                 = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");

    const categoryOptions = useMemo(
        () =>
            ["All", ...new Set(products.map(p => p.category || "Uncategorized"))]
                .map(c => ({ value: c, label: c })),
        [products]
    );

    const sorted = useMemo(() =>
        [...products]
            .filter(p => {
                const matchCat    = categoryFilter === "All" || p.category === categoryFilter;
                const matchSearch = !search ||
                    p.name?.toLowerCase().includes(search.toLowerCase()) ||
                    p.salla_product_id?.toString().includes(search);
                return matchCat && matchSearch;
            })
            .sort((a, b) => (a.active === b.active ? 0 : a.active ? -1 : 1)),
        [products, categoryFilter, search]
    );

    return {
        sorted,
        search, setSearch,
        categoryFilter, setCategoryFilter,
        categoryOptions,
        isLoading, isError, error, refetch,
    };
}