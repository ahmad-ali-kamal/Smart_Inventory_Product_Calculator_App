import React, { useState } from 'react';
import { Tag, Calendar, Percent, BadgeCheck } from 'lucide-react';
import DiscountModal from './DiscountModal';

// normalizeStatus: red/yellow/green → Expired/Approaching/Safe
const normalizeStatus = (status) => {
    const map = {
        red: 'Expired', yellow: 'Approaching', green: 'Safe',
        expired: 'Expired', approaching: 'Approaching',
        valid: 'Safe', safe: 'Safe',
    };
    return map[status?.toLowerCase()] ?? 'Safe';
};

const getStatusStyle = (normalized) => {
    switch (normalized) {
        case 'Expired':
            return {
                color: 'var(--status-expired-text)',
                background: 'var(--status-expired-bg)',
                borderColor: 'var(--status-expired-border)',
            };
        case 'Approaching':
            return {
                color: 'var(--status-approaching-text)',
                background: 'var(--status-approaching-bg)',
                borderColor: 'var(--status-approaching-border)',
            };
        default:
            return {
                color: 'var(--status-safe-text)',
                background: 'var(--status-safe-bg)',
                borderColor: 'var(--status-safe-border)',
            };
    }
};

export default function BatchRow({ product, autoDiscount }) {
    const [selectedBatch, setSelectedBatch] = useState(null);

    // الباك يرسل batches كـ array داخل product (من dashboard API)
    // كل batch فيه: id, batch_code, expiry_date, status (red/yellow/green)
    const productBatches = product.batches || [];

    if (productBatches.length === 0) {
        return (
            <div className="py-4 px-6 text-[11px] text-[var(--muted-foreground)] text-center">
                No batches available.
            </div>
        );
    }

    return (
        <>
            {productBatches.map(batch => {
                const normalized = normalizeStatus(batch.status);
                const style = getStatusStyle(normalized);

                
                const batchCode  = batch.batch_code  || batch.batchNo     || '—';
                const expiryDate = batch.expiry_date  || batch.expiryDate  || '—';

                return (
                    <div key={batch.id} className="flex items-center border-b border-[var(--border)] last:border-0 hover:bg-[var(--accent)]/5 transition-all">
                        {/* Batch Code - 25% */}
<div className="w-[25%] py-3.5 px-4">
    <div className="flex items-center gap-2.5">
        {/* product image */}
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--muted)] border border-[var(--border)] shrink-0 flex items-center justify-center">
            {(product.image_url || product.image) ? (
                <img
                    src={product.image_url || product.image}
                    className="w-full h-full object-cover"
                    alt={product.name}
                    onError={e => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextSibling.style.display = 'flex';
                    }}
                />
            ) : null}
            <span
                className="w-full h-full flex items-center justify-center text-[10px] font-black text-[var(--muted-foreground)] uppercase"
                style={{ display: (product.image_url || product.image) ? 'none' : 'flex' }}
            >
                {product.name?.charAt(0) ?? '?'}
            </span>
        </div>

        {/* product name and batch code */}
        <div className="flex flex-col gap-0.5">
            <span className="text-[12px] font-bold text-[var(--foreground)]">{product.name}</span>
            <span className="text-[11px] font-bold flex items-center gap-1 text-[var(--muted-foreground)]">
                <Tag size={10} className="text-[var(--primary)] opacity-50" />
                {batchCode}
            </span>
        </div>
    </div>
</div>

                        {/* Status - 20% */}
                        <div className="w-[20%] py-3.5 px-4 flex justify-center">
                            <div
                                style={style}
                                className="w-[110px] py-1.5 rounded-full border text-[10px] font-black uppercase text-center tracking-wide"
                            >
                                {normalized}
                            </div>
                        </div>

                        {/* Expiry Date - 30% */}
                        <div className="w-[30%] py-3.5 px-4 flex justify-center">
                            <span className="text-[12px] font-bold flex items-center gap-1.5 text-[var(--foreground)]">
                                <Calendar size={11} className="opacity-50" />
                                {expiryDate}
                            </span>
                        </div>

                        {/* Discount - 25% */}
                        <div className="w-[25%] py-3.5 px-4 flex justify-center">
                            {normalized === 'Approaching' && (
                                autoDiscount ? (
                                    <div
                                        className="inline-flex items-center justify-center gap-1.5 px-3 h-[28px] rounded-full border text-[9px] font-black uppercase tracking-wide"
                                        style={{
                                            color: 'var(--status-approaching-text)',
                                            background: 'var(--status-approaching-bg)',
                                            borderColor: 'var(--status-approaching-border)',
                                        }}
                                    >
                                        <BadgeCheck size={10} />
                                        Auto-Discount Enabled
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setSelectedBatch(batch)}
                                        className="w-[120px] h-[32px] flex items-center justify-center gap-1.5 rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/5 text-[var(--primary)] text-[10px] font-black uppercase hover:bg-[var(--primary)] hover:text-white transition-all"
                                    >
                                        <Percent size={11} />
                                        Discount
                                    </button>
                                )
                            )}
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