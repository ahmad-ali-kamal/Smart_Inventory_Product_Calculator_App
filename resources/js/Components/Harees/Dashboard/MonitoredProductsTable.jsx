// resources/js/Components/Harees/Dashboard/MonitoredProductsTable.jsx
import React from 'react';
import { ListFilter } from 'lucide-react';
import DropdownFilter from '../../Common/DropdownFilter';
import ProductRow from './ProductRow';

const STATUS_FILTERS = [
    { value: 'all',         label: 'All'         },
    { value: 'expired',     label: 'Expired'     },
    { value: 'approaching', label: 'Approaching' },
    { value: 'safe',        label: 'Safe'        },
];

function filterProducts(products, statusFilter) {
    if (statusFilter === 'all') return products;

    return products.filter(product =>
        (product.batches || []).some(batch => {
            const s = batch.status?.toLowerCase();
            if (statusFilter === 'expired')     return s === 'red'    || s === 'expired';
            if (statusFilter === 'approaching') return s === 'yellow' || s === 'approaching';
            if (statusFilter === 'safe')        return s === 'green'  || s === 'safe' || s === 'valid';
            return false;
        })
    );
}

// needsSetup is kept as a prop so the table can show an empty state message
// when setup is missing — the banner itself is rendered by the parent page.
export default function MonitoredProductsTable({ products, autoDiscount, statusFilter, onFilterChange, needsSetup }) {
    const filteredProducts = filterProducts(products, statusFilter);

    return (
        <div className="bg-[var(--card)] rounded-[20px] border border-[var(--border)] shadow-sm">

            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--background)]/30">
                <div className="flex items-center gap-2">
                    <ListFilter className="w-4 h-4 text-[var(--primary)]" />
                    <h2 className="text-sm font-bold text-[var(--foreground)]">Monitored Products</h2>
                </div>
                <DropdownFilter
                    options={STATUS_FILTERS}
                    value={statusFilter}
                    onChange={onFilterChange}
                    width="w-[130px]"
                />
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-b-[20px]">
                <table className="w-full border-collapse">
                    <thead className="bg-[var(--muted)]/50 border-b border-[var(--border)] text-left">
                        <tr className="text-[11px] uppercase tracking-widest text-[var(--muted-foreground)] font-bold">
                            <th className="p-4 w-[25%]">Product</th>
                            <th className="p-4 text-center w-[20%]">Status</th>
                            <th className="p-4 text-center w-[30%]">Expiry Info</th>
                            <th className="p-4 text-center w-[25%]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                        {needsSetup ? (
                            <tr>
                                <td colSpan="4" className="p-10 text-center text-sm text-[var(--muted-foreground)]">
                                    Configure your settings to start monitoring products.
                                </td>
                            </tr>
                        ) : filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="p-10 text-center text-sm text-[var(--muted-foreground)]">
                                    No monitored items found.
                                </td>
                            </tr>
                        ) : (
                            filteredProducts.map(product => (
                                <ProductRow
                                    key={product.id}
                                    product={product}
                                    autoDiscount={autoDiscount}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}