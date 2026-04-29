import React, { useState } from 'react';
import { Eye } from 'lucide-react';

// ── Fixed pill — identical size for ALL status badges ──
const PILL = 'inline-flex items-center justify-center w-[110px] h-[26px] rounded-full text-[9px] font-black uppercase border';

const statusStyle = {
    Expired:    'bg-red-50 text-red-500 border-red-100',
    Approaching:'bg-amber-50 text-amber-500 border-amber-100',
    Valid:      'bg-emerald-50 text-emerald-500 border-emerald-100',
};

const statusLabel = {
    Expired:    'Expired',
    Approaching:'Approaching',
    Valid:      'Save',
};

export default function InventoryProductRow({ product, onExpiry }) {
    const [showBatches, setShowBatches] = useState(false);

    const batches = product.batches?.length
        ? product.batches
        : [
            { id: 1, code: 'B-001', status: 'Expired',     qty: 5,  expiryDate: '2025-12-01' },
            { id: 2, code: 'B-002', status: 'Approaching', qty: 12, expiryDate: '2026-06-15' },
          ];

    const displayStatus = batches.some(b => b.status === 'Expired')
        ? 'Expired'
        : batches.some(b => b.status === 'Approaching')
        ? 'Approaching'
        : 'Valid';

    return (
        <>
            {/* ── Main product row ── */}
            <tr className="group border-b border-[var(--border)] hover:bg-[var(--accent)]/5 transition-all">

                {/* Product — 25% */}
                <td className="p-4 w-[25%]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--muted)] border border-[var(--border)] flex-shrink-0">
                            <img
                                src={product.image || '/placeholder.png'}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={e => { e.target.style.display = 'none'; }}
                            />
                        </div>
                        <div>
                            <div className="text-[13px] font-bold text-[var(--foreground)] leading-tight">{product.name}</div>
                            <div className="text-[10px] text-[var(--muted-foreground)] font-mono mt-0.5">ID: {product.id}</div>
                        </div>
                    </div>
                </td>

                {/* Category — 15% */}
                <td className="p-4 w-[15%] text-center">
                    <span className="text-[11px] font-semibold text-[var(--foreground)]">{product.category}</span>
                </td>

                {/* Status — 15% */}
                <td className="p-4 w-[15%] text-center">
                    <span className={`${PILL} ${statusStyle[displayStatus]}`}>
                        {statusLabel[displayStatus]}
                    </span>
                </td>

                {/* Qty — single pill: totalQty / formQty */}
                <td className="p-4 w-[15%] text-center">
                    <span className="inline-flex items-center justify-center px-4 h-[30px] rounded-full bg-[var(--accent)] text-[var(--primary)] text-[11px] font-bold border border-[var(--primary)]/20 gap-1">
                        <span className="font-black">{product.dbQty ?? 0}</span>
                        <span className="opacity-40 font-light">/</span>
                        <span>{product.formQty ?? 0}</span>
                    </span>
                </td>

                {/* Expiry Info — 15% */}
                <td className="p-4 w-[15%] text-center">
                    <button
                        onClick={() => setShowBatches(prev => !prev)}
                        className={`inline-flex items-center justify-center gap-1.5 w-[100px] h-[30px] rounded-full border text-[10px] font-bold transition-all ${
                            showBatches
                                ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                                : 'bg-[var(--card)] text-[var(--muted-foreground)] border-[var(--border)] hover:border-[var(--primary)]/40'
                        }`}
                    >
                        <Eye size={12} />
                        Batch
                    </button>
                </td>

                {/* Action — 15% */}
                <td className="p-4 w-[15%] text-center">
                    <button
                        onClick={() => onExpiry && onExpiry(product)}
                        className="inline-flex items-center justify-center w-[140px] h-[30px] rounded-full bg-[var(--primary)] text-white text-[9px] font-black uppercase tracking-wider hover:opacity-90 transition-opacity"
                    >
                        Add Expiry Date
                    </button>
                </td>
            </tr>

            {/* ── Batch rows — real <tr><td> so columns align with thead ── */}
            {showBatches && batches.map((batch, idx) => (
                <tr
                    key={batch.id}
                    className={`bg-[var(--background)]/40 hover:bg-[var(--accent)]/10 transition-colors ${
                        idx === batches.length - 1 ? 'border-b border-[var(--border)]' : 'border-b border-[var(--border)]/40'
                    }`}
                >
                    {/* Product col — batch code indented */}
                    <td className="py-2.5 px-4 w-[25%]">
                        <span className="pl-14 block font-bold text-[11px] text-[var(--primary)]">
                            {batch.code}
                        </span>
                    </td>

                    {/* Category — exactly under Category col */}
                    <td className="py-2.5 px-4 w-[15%] text-center">
                        <span className="text-[11px] text-[var(--muted-foreground)]">{product.category}</span>
                    </td>

                    {/* Status — exactly under Status col */}
                    <td className="py-2.5 px-4 w-[15%] text-center">
                        <span className={`${PILL} ${statusStyle[batch.status]}`}>
                            {statusLabel[batch.status] ?? batch.status}
                        </span>
                    </td>

                    {/* Qty — purple pill under Qty col */}
                    <td className="py-2.5 px-4 w-[15%] text-center">
                        <span className="inline-flex items-center justify-center px-4 h-[30px] rounded-full bg-[var(--accent)] text-[var(--primary)] text-[11px] font-bold border border-[var(--primary)]/20">
                            {batch.qty}
                        </span>
                    </td>

                    {/* Expiry date — under Expiry Info col */}
                    <td className="py-2.5 px-4 w-[15%] text-center">
                        <span className="text-[11px] text-[var(--muted-foreground)]">{batch.expiryDate}</span>
                    </td>

                    {/* Action — empty */}
                    <td className="py-2.5 px-4 w-[15%]" />
                </tr>
            ))}
        </>
    );
}