import React, { useState } from 'react';
import { useHarees } from '../../Context/HareesContext';
import { Tag, Calendar, Percent } from 'lucide-react';
import DiscountModal from './DiscountModal';

export default function BatchRow({ productId, product }) {
    const { batches } = useHarees();
    const productBatches = batches.filter(b => b.productId === productId);
    const [selectedBatch, setSelectedBatch] = useState(null);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Expired': return { text: 'text-red-500', bg: 'bg-red-50/50', border: 'border-red-100' };
            case 'Approaching': return { text: 'text-amber-500', bg: 'bg-amber-50/50', border: 'border-amber-100' };
            default: return { text: 'text-emerald-500', bg: 'bg-emerald-50/50', border: 'border-emerald-100' };
        }
    };

    return (
        <>
            {productBatches.map(batch => {
                const style = getStatusStyle(batch.status);
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
                            <div className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase ${style.text} ${style.bg} ${style.border}`}>
                                {batch.status}
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