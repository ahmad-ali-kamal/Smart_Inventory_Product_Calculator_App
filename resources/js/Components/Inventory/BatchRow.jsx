import React, { useState } from 'react';
import { useInventory } from '../../Context/InventoryContext';
import { Tag, Calendar, Percent } from 'lucide-react';
import DiscountModal from '../../Components/Inventory/DiscountModal';

export default function BatchRow({ productId, product }) {
    const { batches } = useInventory();
    const productBatches = batches.filter(b => b.productId === productId);
    const [selectedBatch, setSelectedBatch] = useState(null);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Expired':
                return {
                    style: {
                        color: 'var(--status-expired-text)',
                        background: 'var(--status-expired-bg)',
                        borderColor: 'var(--status-expired-border)',
                    },
                    label: 'Expired',
                };
            case 'Approaching':
                return {
                    style: {
                        color: 'var(--status-approaching-text)',
                        background: 'var(--status-approaching-bg)',
                        borderColor: 'var(--status-approaching-border)',
                    },
                    label: 'Approaching',
                };
            default:
                return {
                    style: {
                        color: 'var(--status-safe-text)',
                        background: 'var(--status-safe-bg)',
                        borderColor: 'var(--status-safe-border)',
                    },
                    label: 'Safe',
                };
        }
    };

    return (
        <>
            {productBatches.map(batch => {
                const { style, label } = getStatusStyle(batch.status);
                return (
                    <div key={batch.id} className="flex items-center border-b border-[var(--border)] last:border-0 hover:bg-[var(--accent)]/5 transition-all">
                        {/* Product column - 25% - batch ID */}
                        <div className="w-[25%] py-3 px-4">
                            <span className="text-[11px] font-bold flex items-center gap-1 text-[var(--foreground)]">
                                <Tag size={10} className="text-[var(--primary)] opacity-50" /> {batch.batchNo}
                            </span>
                        </div>

                        {/* Status column - 20% - batch status badge */}
                        <div className="w-[20%] py-3 px-4 flex justify-center">
                            <div
                                style={style}
                                className="w-[100px] py-1 rounded-full border text-[9px] font-black uppercase text-center tracking-wide"
                            >
                                {label}
                            </div>
                        </div>

                        {/* Expiry Info column - 30% - expiry date */}
                        <div className="w-[30%] py-3 px-4 flex justify-center">
                            <span className="text-[11px] font-bold flex items-center gap-1 text-[var(--foreground)]">
                                <Calendar size={10} className="opacity-50" /> {batch.expiryDate}
                            </span>
                        </div>

                        {/* Actions column - 25% - discount button */}
                        <div className="w-[25%] py-3 px-4 flex justify-center">
                            <button
                                onClick={() => setSelectedBatch(batch)}
                                className="w-[120px] h-[32px] flex items-center justify-center gap-1.5 rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/5 text-[var(--primary)] text-[10px] font-black uppercase hover:bg-[var(--primary)] hover:text-white transition-all"
                            >
                                <Percent size={11} />
                                Discount
                            </button>
                        </div>
                    </div>
                );
            })}

            {selectedBatch && (
                <DiscountModal
                    batch={selectedBatch}
                    product={product}
                    onClose={() => setSelectedBatch(null)}
                    onApply={() => setSelectedBatch(null)}
                />
            )}
        </>
    );
}