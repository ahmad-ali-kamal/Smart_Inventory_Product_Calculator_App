import React, { useState } from 'react';
import { Eye } from 'lucide-react';
import BatchRow from './BatchRow';

export default function ProductRow({ product }) {
    const [showBatches, setShowBatches] = useState(false);

    return (
        <>
            <tr className="group hover:bg-[var(--accent)]/5 transition-all border-b border-[var(--border)]">
                {/* Product - 25% */}
                <td className="p-4 w-[25%]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--muted)] border border-[var(--border)] shrink-0">
                            <img src={product.image || '/placeholder.png'} className="w-full h-full object-cover" alt={product.name} />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-[var(--foreground)] text-[13px]">{product.name}</span>
                            <span className="text-[10px] text-[var(--muted-foreground)] font-mono">{product.sku}</span>
                        </div>
                    </div>
                </td>

                {/* Status - 20% */}
                <td className="p-4 text-center w-[20%]">
                    <span className="px-3 py-1.5 rounded-full text-[10px] font-black bg-[var(--secondary)] text-[var(--primary)] uppercase border border-[var(--primary)]/10">
                        Operational
                    </span>
                </td>

                {/* Expiry Info - 30% */}
                <td className="p-4 text-center w-[30%]">
                </td>

                {/* Actions - 25% */}
                <td className="p-4 w-[25%]">
                    <div className="flex justify-center">
                        <button
                            onClick={() => setShowBatches(!showBatches)}
                            className={`w-[130px] h-[36px] flex items-center justify-center gap-2 rounded-xl text-[11px] font-bold transition-all duration-300 ${
                                showBatches
                                    ? 'bg-[var(--primary)] text-white shadow-lg'
                                    : 'bg-[var(--card)] text-[var(--primary)] border border-[var(--border)]'
                            }`}
                        >
                            {showBatches ? 'Hide Batches' : 'View Batches'}
                            <Eye size={13} className={`transition-transform duration-300 ${showBatches ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </td>
            </tr>

            {/* Batches expand row */}
            <tr>
                <td colSpan="4" className="p-0 border-none">
                    <div className={`grid transition-all duration-500 ease-in-out ${
                        showBatches ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}>
                        <div className="overflow-hidden">
                            <div className="bg-[var(--background)]/30">
                                <BatchRow productId={product.id} product={product} />
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        </>
    );
}