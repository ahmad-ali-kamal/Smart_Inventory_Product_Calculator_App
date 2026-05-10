import { useState, useMemo } from "react";
import { useInventoryProducts } from "./useInventory";

export const FILTER_OPTIONS = [
    { value: 'all',    label: 'All'    },
    { value: 'short',  label: 'Short'  },
    { value: 'medium', label: 'Medium' },
    { value: 'long',   label: 'Long'   },
];

export function useInventoryProductsFilter() {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    const { data, isLoading, isError, error, refetch } = useInventoryProducts();

    const products = useMemo(() => data?.products || data?.data || [], [data]);

    const filtered = useMemo(() =>
        products.filter(p => {
            const matchesSearch =
                p.name?.toLowerCase().includes(search.toLowerCase()) ||
                p.salla_product_id?.toString().toLowerCase().includes(search.toLowerCase());
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