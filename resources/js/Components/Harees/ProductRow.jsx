import React, { useState } from 'react';
import { Eye, Calendar } from 'lucide-react';
import BatchRow from './BatchRow';

// نورماليزيشن محلية للعرض فقط
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

export default function ProductRow({ product }) {
    const [showBatches, setShowBatches] = useState(false);

    const normalizedStatus = normalizeStatus(product.status);
    const statusStyle = getStatusStyle(normalizedStatus);
    // الباك يرسل image_url
    const image = product.image_url || product.image;

    return (
        <>
            <tr className="group hover:bg-[var(--accent)]/5 transition-all border-b border-[var(--border)]">
                {/* Product - 25% */}
                <td className="p-4 w-[25%]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--muted)] border border-[var(--border)] shrink-0 flex items-center justify-center">
                            {image
                                ? <img
                                    src={image}
                                    className="w-full h-full object-cover"
                                    alt={product.name}
                                    onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                                  />
                                : null}
                            <span
                                className="w-full h-full flex items-center justify-center text-[10px] font-black text-[var(--muted-foreground)] uppercase"
                                style={{ display: image ? 'none' : 'flex' }}
                            >
                                {product.name?.charAt(0) ?? '?'}
                            </span>
                        </div>
                        <div className="flex flex-col">
    <span className="font-bold text-[var(--foreground)] text-[13px]">{product.name}</span>
    <span className="text-[10px] text-[var(--muted-foreground)] font-mono">{product.sku}</span>
    <span className="text-[10px] text-[var(--muted-foreground)]/70">#{product.id}</span>
</div>
                    </div>
                </td>

                {/* Status - 20% */}
                <td className="p-4 text-center w-[20%]">
                    <span
                        style={statusStyle}
                        className="inline-flex items-center justify-center w-[110px] h-[26px] rounded-full text-[9px] font-black uppercase border"
                    >
                        {normalizedStatus}
                    </span>
                </td>

                {/* Expiry Info - 30% */}
                <td className="p-4 text-center w-[30%]">
                    {product.expiry_date ? (
                        <span className="text-[11px] font-bold flex items-center justify-center gap-1 text-[var(--foreground)]">
                            <Calendar size={10} className="opacity-50" />
                            {product.expiry_date}
                        </span>
                    ) : (
                        <span className="text-[11px] text-[var(--muted-foreground)]">—</span>
                    )}
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
                                <BatchRow product={product} />
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        </>
    );
}