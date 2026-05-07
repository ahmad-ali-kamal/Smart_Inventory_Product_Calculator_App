import React, { useState } from 'react';
import { X, Percent, CheckCircle, Info, AlertCircle } from 'lucide-react';

export default function DiscountModal({ batch, product, onClose, onApply }) {
    const [discountPct, setDiscountPct] = useState('20');
    const [endDate, setEndDate]         = useState('');
    const [isApplied, setIsApplied]     = useState(false);
    const [pctError, setPctError]       = useState('');

    const handlePctChange = (e) => {
        // Strip everything that's not a digit
        const clean = e.target.value.replace(/[^\d]/g, '');

        // Prevent leading zeros (e.g. "07" → "7")
        const normalized = clean === '' ? '' : String(parseInt(clean, 10));

        setDiscountPct(normalized);

        // Live validation
        if (normalized === '') {
            setPctError('Required');
        } else {
            const num = parseInt(normalized, 10);
            if (num < 1 || num > 99) {
                setPctError('Must be between 1 and 99');
            } else {
                setPctError('');
            }
        }
    };

    const handleApply = () => {
        if (!endDate) return;

        // Validate before submit
        const num = parseInt(discountPct, 10);
        if (!discountPct || isNaN(num) || num < 1 || num > 99) {
            setPctError('Must be a number greater than 0');
            return;
        }

        setIsApplied(true);

onApply && onApply({
    batchId: batch?.id,
    discountPct: num,
    endDate
});
    };

    const hasError = Boolean(pctError);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-[500px] bg-[var(--card)] border border-[var(--border)] rounded-[24px] shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">

                {/* Header */}
                <div className="flex items-center gap-3 p-5 border-b border-[var(--border)]">
                    <div className="w-10 h-10 rounded-xl bg-[var(--muted)] flex items-center justify-center text-[var(--primary)]">
                        <Percent size={20} />
                    </div>
                    <div className="flex-1 text-left">
                        <h3 className="text-sm font-bold text-[var(--foreground)]">Apply Discount</h3>
                        <p className="text-[11px] text-[var(--muted-foreground)]">{product?.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors">
                        <X size={16} className="text-[var(--foreground)]" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Note */}
                    <div className="flex items-start gap-2 p-4 rounded-2xl bg-[var(--accent)] border border-[var(--primary)]/10">
                        <Info size={14} className="text-[var(--primary)] mt-0.5 shrink-0" />
                        <p className="text-[11px] text-[var(--primary)] leading-relaxed">
                            <span className="font-black">Note:</span> Discounts apply only to Yellow-status batches. Green inventory is always protected.
                        </p>
                    </div>

                    {/* Form */}
                    <div className="p-5 rounded-2xl bg-[var(--muted)]/40 border border-[var(--primary)]/20 space-y-4">
                        <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-wider">
                            Manual Configuration
                        </span>

                        <div className="grid grid-cols-2 gap-3">
                            {/* Discount % */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[9px] font-black text-[var(--muted-foreground)] uppercase tracking-tighter">
                                    Discount Percentage
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={discountPct}
                                        onChange={handlePctChange}
                                        className={`
                                            w-full p-3 pr-7 rounded-xl border
                                            text-[var(--foreground)]
                                            text-sm font-bold outline-none
                                            transition-all
                                            placeholder:text-[var(--muted-foreground)]
                                            focus:ring-2
                                            ${hasError
                                                ? 'bg-red-50 dark:bg-red-950/20 border-red-500 focus:border-red-500 focus:ring-red-500/15'
                                                : 'bg-[var(--muted)] border-[var(--primary)]/20 focus:border-[var(--primary)]/60 focus:ring-[var(--primary)]/15'
                                            }
                                        `}
                                    />
                                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold ${hasError ? 'text-red-400' : 'text-[var(--muted-foreground)]'}`}>
                                        %
                                    </span>
                                </div>
                                {hasError && (
                                    <p className="text-[10px] text-red-500 font-medium flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                                        <AlertCircle size={10} />
                                        {pctError}
                                    </p>
                                )}
                            </div>

                            {/* End Date */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[9px] font-black text-[var(--muted-foreground)] uppercase tracking-tighter">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    className="
                                        w-full p-3 rounded-xl border
                                        bg-[var(--muted)]
                                        border-[var(--primary)]/20
                                        text-[var(--foreground)]
                                        text-sm outline-none
                                        focus:border-[var(--primary)]/60
                                        focus:ring-2 focus:ring-[var(--primary)]/15
                                        transition-all
                                        [color-scheme:light]
                                        dark:[color-scheme:dark]
                                    "
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-[var(--border)]">
                    <button
                        onClick={handleApply}
                        disabled={isApplied}
                        className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                            isApplied
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100/20'
                                : 'bg-[var(--primary)] text-white hover:opacity-90'
                        }`}
                    >
                        {isApplied
                            ? <><CheckCircle size={16} /> Applied Successfully</>
                            : <><Percent size={14} /> Apply Discount</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}