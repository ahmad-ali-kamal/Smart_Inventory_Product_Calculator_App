// resources/js/Components/Harees/DiscountModal.jsx
import React, { useState } from 'react';
import { X, Percent, CheckCircle, Info, AlertCircle, Loader2 } from 'lucide-react';

/**
 * DiscountModal — نظّفنا:
 *  1. أزلنا isApplied (كان لا معنى له — المودال يُغلق فور onApply)
 *  2. أضفنا loading state مرئي أثناء الـ request
 *  3. أضفنا error state يُعرض داخل المودال بدل alert()
 *  4. أضفنا validation للتاريخ (لا يقبل تاريخاً في الماضي)
 *  5. المودال لا يُغلق تلقائياً — المسؤولية على الـ Parent بعد onApply
 *
 * Props:
 *  - batch:      object  — { id, batch_code, expiry_date }
 *  - product:    object  — { name }
 *  - onClose:    fn
 *  - onApply:    async fn({ batchId, discountPct, endDate }) → يجب أن يرمي Error عند الفشل
 */
export default function DiscountModal({ batch, product, onClose, onApply }) {
    const [discountPct, setDiscountPct] = useState('20');
    const [endDate, setEndDate]         = useState('');
    const [pctError, setPctError]       = useState('');
    const [dateError, setDateError]     = useState('');
    const [serverError, setServerError] = useState('');
    const [isLoading, setIsLoading]     = useState(false);
    const [isSuccess, setIsSuccess]     = useState(false);

    // ── today كـ YYYY-MM-DD لتقييد حقل التاريخ ───────────────────────────
    const todayStr = new Date().toISOString().split('T')[0];

    // ── Validation helpers ────────────────────────────────────────────────
    const validatePct = (val) => {
        if (!val) return 'Required';
        const num = parseInt(val, 10);
        if (isNaN(num) || num < 1 || num > 99) return 'Must be between 1 and 99';
        return '';
    };

    const validateDate = (val) => {
        if (!val) return 'Required';
        if (val <= todayStr) return 'Must be a future date';
        return '';
    };

    // ── Handlers ──────────────────────────────────────────────────────────
    const handlePctChange = (e) => {
        const clean      = e.target.value.replace(/[^\d]/g, '');
        const normalized = clean === '' ? '' : String(parseInt(clean, 10));
        setDiscountPct(normalized);
        setPctError(validatePct(normalized));
        setServerError('');
    };

    const handleDateChange = (e) => {
        setEndDate(e.target.value);
        setDateError(validateDate(e.target.value));
        setServerError('');
    };

    const handleApply = async () => {
        // تحقق من كل الحقول قبل الإرسال
        const pErr = validatePct(discountPct);
        const dErr = validateDate(endDate);
        setPctError(pErr);
        setDateError(dErr);
        if (pErr || dErr) return;

        setIsLoading(true);
        setServerError('');

        try {
            await onApply({
                batchId:     batch?.id,
                discountPct: parseInt(discountPct, 10),
                endDate,
            });
            setIsSuccess(true);
            // أغلق المودال تلقائياً بعد نجاح القصير
            setTimeout(onClose, 1200);
        } catch (err) {
            setServerError(err?.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

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
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors disabled:opacity-40"
                    >
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

                    {/* Server Error */}
                    {serverError && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={14} className="text-red-500 shrink-0" />
                            <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">{serverError}</p>
                        </div>
                    )}

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
                                        disabled={isLoading || isSuccess}
                                        className={`
                                            w-full p-3 pr-7 rounded-xl border
                                            text-[var(--foreground)] text-sm font-bold outline-none transition-all
                                            placeholder:text-[var(--muted-foreground)] focus:ring-2
                                            disabled:opacity-60 disabled:cursor-not-allowed
                                            ${pctError
                                                ? 'bg-red-50 dark:bg-red-950/20 border-red-500 focus:border-red-500 focus:ring-red-500/15'
                                                : 'bg-[var(--muted)] border-[var(--primary)]/20 focus:border-[var(--primary)]/60 focus:ring-[var(--primary)]/15'
                                            }
                                        `}
                                    />
                                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold ${pctError ? 'text-red-400' : 'text-[var(--muted-foreground)]'}`}>
                                        %
                                    </span>
                                </div>
                                {pctError && (
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
                                    min={todayStr}
                                    onChange={handleDateChange}
                                    disabled={isLoading || isSuccess}
                                    className={`
                                        w-full p-3 rounded-xl border
                                        text-[var(--foreground)] text-sm outline-none transition-all
                                        focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed
                                        [color-scheme:light] dark:[color-scheme:dark]
                                        ${dateError
                                            ? 'bg-red-50 dark:bg-red-950/20 border-red-500 focus:border-red-500 focus:ring-red-500/15'
                                            : 'bg-[var(--muted)] border-[var(--primary)]/20 focus:border-[var(--primary)]/60 focus:ring-[var(--primary)]/15'
                                        }
                                    `}
                                />
                                {dateError && (
                                    <p className="text-[10px] text-red-500 font-medium flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                                        <AlertCircle size={10} />
                                        {dateError}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-[var(--border)]">
                    <button
                        onClick={handleApply}
                        disabled={isLoading || isSuccess}
                        className={`
                            w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider
                            transition-all flex items-center justify-center gap-2
                            disabled:cursor-not-allowed
                            ${isSuccess
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100/20'
                                : 'bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-70'
                            }
                        `}
                    >
                        {isSuccess ? (
                            <><CheckCircle size={16} /> Applied Successfully</>
                        ) : isLoading ? (
                            <><Loader2 size={14} className="animate-spin" /> Applying…</>
                        ) : (
                            <><Percent size={14} /> Apply Discount</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}