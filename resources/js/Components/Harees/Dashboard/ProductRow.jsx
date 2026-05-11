// resources/js/Components/Harees/ProductRow.jsx
import React, { useState } from 'react';
import { Eye } from 'lucide-react';
import RowActionButton from '../../Common/RowActionButton';
import BatchRow from './BatchRow';
import StatusBadge from '../StatusBadge';
import ProductAvatar from '../../Common/ProductAvatar';

export default function ProductRow({ product, autoDiscount }) {
    const [showBatches, setShowBatches] = useState(false);

    return (
        <>
            <tr className="group hover:bg-[var(--accent)]/5 transition-all border-b border-[var(--border)]">

                {/* Product */}
                <td className="py-3.5 px-4 w-[25%]">
                    <div className="flex items-center gap-2.5">
                        <ProductAvatar
                            src={product.image_url || product.image}
                            name={product.name}
                            size={40}
                        />
                        <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-[var(--foreground)] text-[12px] leading-tight">
                                {product.name}
                            </span>
                            <span className="text-[10px] text-[var(--muted-foreground)] font-mono opacity-80">
                                {product.salla_product_id}
                            </span>
                        </div>
                    </div>
                </td>

                {/* Status */}
                <td className="py-3.5 px-4 text-center w-[20%]">
                    <StatusBadge status={product.status} size="md" />
                </td>

                {/* Expiry — empty at product level */}
                <td className="py-3.5 px-4 text-center w-[30%]" />

                {/* Actions */}
                <td className="py-3.5 px-4 w-[25%]">
                    <div className="flex justify-center">
                        <RowActionButton
                            onClick={() => setShowBatches(!showBatches)}
                            variant={showBatches ? 'active' : 'default'}
                            icon={
                                <Eye
                                    size={12}
                                    className={`transition-transform duration-300 ${showBatches ? 'rotate-180' : ''}`}
                                />
                            }
                            className="w-[120px] h-[32px]"
                        >
                            {showBatches ? 'Hide' : 'View'} Batches
                        </RowActionButton>
                    </div>
                </td>
            </tr>

            {/* Expandable batches row */}
            <tr>
                <td colSpan="4" className="p-0 border-none">
                    <div className={`grid transition-all duration-500 ease-in-out ${
                        showBatches ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}>
                        <div className="overflow-hidden">
                            <div className="bg-[var(--background)]/30">
                                <BatchRow product={product} autoDiscount={autoDiscount} />
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        </>
    );
}