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

// ProductRow.jsx
export default function ProductRow({ product, autoDiscount }) {
    const [showBatches, setShowBatches] = useState(false);

    const normalizedStatus = normalizeStatus(product.status);
    const statusStyle = getStatusStyle(normalizedStatus);
    const image = product.image_url || product.image;

    return (
        <>
            <tr className="group hover:bg-[var(--accent)]/5 transition-all border-b border-[var(--border)]">
                {/* Product - تم استخدام py-3 px-4 لتطابق صف الباتشات */}
                <td className="py-3.5 px-4 w-[25%]"> 
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--muted)] border border-[var(--border)] shrink-0 flex items-center justify-center">
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
                        <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-[var(--foreground)] text-[12px] leading-tight">{product.name}</span>
                            <span className="text-[10px] text-[var(--muted-foreground)] font-mono opacity-80">{product.salla_product_id}</span>
                        </div>
                    </div>
                </td>

                {/* Status - نفس الـ Padding وارتفاع الكبسولة */}
                <td className="py-3.5 px-4 text-center w-[20%]">
                    <span
                        style={statusStyle}
                        className="inline-flex items-center justify-center w-[110px] h-[26px] rounded-full text-[10px] font-black uppercase border"
                    >
                        {normalizedStatus}
                    </span>
                </td>

                {/* Expiry Info - فارغ بنفس الـ Padding */}
                <td className="py-3.5 px-4 text-center w-[30%]"></td>

                {/* Actions */}
                <td className="py-3.5 px-4 w-[25%]">
                    <div className="flex justify-center">
                        <button
                            onClick={() => setShowBatches(!showBatches)}
                            className={`w-[120px] h-[32px] flex items-center justify-center gap-2 rounded-lg text-[10px] font-bold transition-all duration-300 ${
                                showBatches
                                    ? 'bg-[var(--primary)] text-white shadow-sm'
                                    : 'bg-[var(--card)] text-[var(--primary)] border border-[var(--border)]'
                            }`}
                        >
                            {showBatches ? 'Hide' : 'View'} Batches
                            <Eye size={12} className={`transition-transform duration-300 ${showBatches ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </td>
            </tr>

            {/* صف الباتشات التوسيعي */}
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