import React, { useState } from 'react';
import { Eye } from 'lucide-react';

// ── التنسيق الأساسي لـ "الحبة" (Pill) - ثابت لجميع الحالات ──
const PILL = 'inline-flex items-center justify-center w-[110px] h-[26px] rounded-full text-[9px] font-black uppercase border transition-all duration-200';

// ── إعدادات الألوان والحالات بناءً على متغيرات الداشبورد ──
const getStatusConfig = (status) => {
    const config = {
        Expired: {
            style: {
                color: 'var(--status-expired-text)',
                backgroundColor: 'var(--status-expired-bg)',
                borderColor: 'var(--status-expired-border)',
            },
            label: 'Expired',
        },
        Approaching: {
            style: {
                color: 'var(--status-approaching-text)',
                backgroundColor: 'var(--status-approaching-bg)',
                borderColor: 'var(--status-approaching-border)',
            },
            label: 'Approaching',
        },
        Valid: {
            style: {
                color: 'var(--status-safe-text)',
                backgroundColor: 'var(--status-safe-bg)',
                borderColor: 'var(--status-safe-border)',
            },
            label: 'Save', // أو يمكنك تغييرها إلى Safe لتطابق الداشبورد تماماً
        }
    };
    return config[status] || config.Valid;
};

export default function InventoryProductRow({ product, onExpiry }) {
    const [showBatches, setShowBatches] = useState(false);

    const batches = product.batches?.length
        ? product.batches
        : [
            { id: 1, code: 'B-001', status: 'Expired',     qty: 5,  expiryDate: '2025-12-01' },
            { id: 2, code: 'B-002', status: 'Approaching', qty: 12, expiryDate: '2026-06-15' },
          ];

    return (
        <>
            <tr className="border-b border-[var(--border)] hover:bg-[var(--accent)]/5 transition-colors group">
                {/* معلومات المنتج الرئيسي */}
                <td className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--muted)] shrink-0 flex items-center justify-center">
                            {product.image
                                ? <img
                                    src={product.image}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                                  />
                                : null}
                            <span
                                className="w-full h-full flex items-center justify-center text-[10px] font-black text-[var(--muted-foreground)] uppercase"
                                style={{ display: product.image ? 'none' : 'flex' }}
                            >
                                {product.name?.charAt(0) ?? '?'}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-[var(--foreground)]">{product.name}</span>
                            <span className="text-[10px] font-medium text-[var(--muted-foreground)] uppercase">{product.sku}</span>
                        </div>
                    </div>
                </td>

                <td className="p-4 text-center">
                    <span className="text-[11px] text-[var(--muted-foreground)] font-medium">{product.category}</span>
                </td>

                {/* هنا يظهر اللون المتغير المتوافق مع الداشبورد */}
                <td className="p-4 text-center">
                    {(() => {
                        const config = getStatusConfig(batches[0]?.status);
                        return (
                            <span className={PILL} style={config.style}>
                                {config.label}
                            </span>
                        );
                    })()}
                </td>

                <td className="p-4 text-center">
                    <span className="inline-flex items-center justify-center px-4 h-[30px] rounded-full bg-[var(--accent)] text-[var(--primary)] text-[11px] font-bold border border-[var(--primary)]/20 shadow-sm">
                        {product.dbQty}
                    </span>
                </td>

                <td className="p-4 text-center">
                    <span className="text-[11px] font-bold text-[var(--muted-foreground)]">Multiple Batches</span>
                </td>

                <td className="p-4 text-center">
                    <button 
                        onClick={() => setShowBatches(!showBatches)}
                        className="p-2 rounded-lg hover:bg-[var(--primary)]/10 text-[var(--primary)] transition-colors"
                    >
                        <Eye size={16} />
                    </button>
                </td>
            </tr>

            {/* صفوف الـ Batches عند الضغط على العين */}
            {showBatches && batches.map((batch) => {
                const config = getStatusConfig(batch.status);
                return (
                    <tr key={batch.id} className="bg-[var(--muted)]/10 border-b border-[var(--border)]/50">
                        <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2 pl-8 opacity-70">
                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]/30" />
                                <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">Batch: {batch.code}</span>
                            </div>
                        </td>
                        
                        <td className="py-2.5 px-4 text-center">
                            <span className="text-[11px] text-[var(--muted-foreground)]">{product.category}</span>
                        </td>

                        <td className="py-2.5 px-4 text-center">
                            <span className={PILL} style={config.style}>
                                {config.label}
                            </span>
                        </td>

                        <td className="py-2.5 px-4 text-center">
                            <span className="inline-flex items-center justify-center px-4 h-[30px] rounded-full bg-[var(--accent)] text-[var(--primary)] text-[11px] font-bold border border-[var(--primary)]/20">
                                {batch.qty}
                            </span>
                        </td>

                        <td className="py-2.5 px-4 text-center">
                            <span className="text-[11px] text-[var(--muted-foreground)] font-medium">{batch.expiryDate}</span>
                        </td>

                        <td className="py-2.5 px-4" />
                    </tr>
                );
            })}
        </>
    );
}