import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CalendarPlus, Trash2, PlusCircle, CheckCircle, AlertCircle, Package } from 'lucide-react';

export default function ExpiryModal({ product, onClose, onSave }) {
    const [selection, setSelection] = useState(null); // 'yes' or 'no'
    const [singleDate, setSingleDate] = useState('');
    const [batches, setBatches] = useState([{ id: Date.now(), qty: '', date: '' }]);
    const [isSaving, setIsSaving]   = useState(false);
    const [isSaved, setIsSaved]     = useState(false);
    const [error, setError]         = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const totalQty   = product.quantity ?? product.dbQty ?? 0;
    const hasBatches = product.batches && product.batches.length > 0;

    useEffect(() => {
        if (!hasBatches) return;
        if (product.batches.length === 1) {
            setSelection('yes');
            setSingleDate(product.batches[0].expiry_date || product.batches[0].expiryDate || '');
        } else {
            setSelection('no');
            setBatches(product.batches.map(b => ({
                id: b.id,
                qty: b.quantity ?? b.qty ?? '',
                date: b.expiry_date || b.expiryDate || '',
                batchId: b.id,
            })));
        }
    }, [hasBatches, product.batches]);

    const usedQty        = batches.reduce((sum, b) => sum + (parseInt(b.qty) || 0), 0);
    const remainingQty   = totalQty - usedQty;
    const allDistributed = remainingQty === 0 && usedQty > 0;
    const isOverLimit    = usedQty > totalQty;
    const progressPercent = totalQty > 0 ? Math.min((usedQty / totalQty) * 100, 100) : 0;

    const getCsrfToken = () => document.querySelector('meta[name="csrf-token"]')?.content;

    const handleDeleteAll = async (closeAfter = true) => {
        setError(null);
        setIsDeleting(true);
        try {
            const res = await fetch(`/harees/api/expiry/${product.id}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                setError(data.message || 'Failed to delete batches');
                setIsDeleting(false);
                return;
            }
            onSave(product.id, { reset: true });
            if (closeAfter) onClose();
        } catch {
            setError('Connection failed');
            setIsDeleting(false);
        }
    };

    const validate = () => {
        if (!selection) return 'Please select an option first';
        if (selection === 'yes') {
            if (!singleDate) return 'Please enter the expiry date';
        } else {
            if (batches.length === 0) return 'Add at least one batch';
            for (let i = 0; i < batches.length; i++) {
                if (!batches[i].qty || parseInt(batches[i].qty) < 1)
                    return `Enter a valid quantity for Batch ${i + 1}`;
                if (!batches[i].date)
                    return `Enter the expiry date for Batch ${i + 1}`;
            }
            if (isOverLimit)
                return `Total (${usedQty}) exceeds available stock (${totalQty})`;
            if (usedQty < totalQty)
                return `${totalQty - usedQty} unit(s) unassigned — all stock must be distributed`;
        }
        return null;
    };

    const handleSave = async () => {
        setError(null);
        const err = validate();
        if (err) { setError(err); return; }

        setIsSaving(true);
        const payload = { product_id: product.id, same_expiry: selection === 'yes' };

        if (selection === 'yes') {
            payload.single_batch = {
                expiry_date: singleDate,
                batch_code: product.batches?.[0]?.batch_code || product.batches?.[0]?.code || null,
            };
        } else {
            payload.batches = batches.map(b => ({
                id: b.batchId || null,
                quantity: parseInt(b.qty),
                expiry_date: b.date,
                batch_code: b.batchId ? undefined : null,
            }));
        }

        try {
            const res = await fetch('/harees/api/expiry', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                setError(data.message || 'An error occurred while saving');
                setIsSaving(false);
                return;
            }

            setIsSaved(true);
            if (selection === 'yes' && !data.expiry_date) {
                data.expiry_date = singleDate;
            }
            setTimeout(() => { onSave(product.id, data); onClose(); }, 1400);
        } catch {
            setError('Connection failed');
            setIsSaving(false);
        }
    };

    const updateBatch = (id, field, value) => {
        setError(null);
        setBatches(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
    };

    return createPortal(
        // الـ Portal يرسم الـ modal مباشرة على document.body — يتجاوز أي overflow أو transform في الـ parents
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="relative w-full max-w-[500px] bg-[var(--card)] border border-[var(--border)] rounded-[24px] shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">

                {/* ── Header ── */}
                <div className="flex items-center gap-3 p-5 border-b border-[var(--border)]">
                    <div className="w-10 h-10 rounded-xl bg-[var(--secondary)] flex items-center justify-center text-[var(--primary)]">
                        <CalendarPlus size={20} />
                    </div>
                    <div className="flex-1 text-left">
                        <h3 className="text-sm font-bold text-[var(--foreground)]">
                            {hasBatches ? 'Edit Expiry Date' : 'Add Expiry Date'}
                        </h3>
                        <p className="text-[11px] text-[var(--muted-foreground)]">{product.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors text-[var(--foreground)]">
                        <X size={16} />
                    </button>
                </div>

                {/* ── Body ── */}
                <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">

                    <p className="text-sm font-bold text-[var(--foreground)] text-center">
                        Do all quantities have the same expiry date?
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={() => { setSelection('yes'); setError(null); }}
                            className={`flex-1 py-3 rounded-2xl border text-xs font-bold transition-all ${
                                selection === 'yes'
                                    ? 'border-[var(--primary)] bg-[var(--accent)] text-[var(--primary)]'
                                    : 'border-[var(--border)] text-[var(--muted-foreground)] bg-transparent'
                            }`}
                        >
                            Yes — Single Batch
                        </button>
                        <button
                            onClick={() => { setSelection('no'); setError(null); }}
                            className={`flex-1 py-3 rounded-2xl border text-xs font-bold transition-all ${
                                selection === 'no'
                                    ? 'border-[var(--primary)] bg-[var(--accent)] text-[var(--primary)]'
                                    : 'border-[var(--border)] text-[var(--muted-foreground)] bg-transparent'
                            }`}
                        >
                            No — Multiple Batches
                        </button>
                    </div>

                    {selection && (
                        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--accent)]/10 border border-[var(--primary)]/15">
                            <Package size={16} className="text-[var(--primary)] flex-shrink-0" />
                            <div>
                                <p className="text-[10px] font-black text-[var(--primary)] uppercase tracking-wide">Available Stock</p>
                                <p className="text-sm font-bold text-[var(--foreground)]">{totalQty} units</p>
                            </div>
                        </div>
                    )}

                    {/* Progress bar - استخدام متغيرات الـ Status */}
                    {selection === 'no' && (
                        <div className="space-y-3">
                            <div className="p-4 rounded-2xl bg-[var(--accent)]/5 border border-[var(--border)] space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wide">
                                    <span className={
                                        isOverLimit     ? 'text-[var(--status-expired-text)]'
                                        : allDistributed ? 'text-[var(--status-safe-text)]'
                                        : 'text-[var(--primary)]'
                                    }>
                                        {isOverLimit
                                            ? `⚠ Exceeded by ${usedQty - totalQty}`
                                            : allDistributed
                                                ? '✓ All distributed'
                                                : `${remainingQty} units remaining`}
                                    </span>
                                    <span className="text-[var(--muted-foreground)]">{usedQty} / {totalQty}</span>
                                </div>
                                <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-300 ${
                                            isOverLimit ? 'bg-[var(--status-expired-text)]' : allDistributed ? 'bg-[var(--status-safe-text)]' : 'bg-[var(--primary)]'
                                        }`}
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* YES: Single Batch */}
                    {selection === 'yes' && (
                        <div className="p-5 rounded-2xl bg-[var(--accent)]/5 border border-[var(--border)] space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-[var(--primary)]">SINGLE BATCH</span>
                                {hasBatches && (
                                    <button
                                        onClick={() => handleDeleteAll(true)}
                                        disabled={isDeleting}
                                        className="p-1.5 rounded-lg hover:bg-[var(--status-expired-bg)] transition-colors group"
                                    >
                                        {isDeleting
                                            ? <span className="w-3.5 h-3.5 border-2 border-[var(--status-expired-text)] border-t-transparent rounded-full animate-spin inline-block" />
                                            : <Trash2 size={14} className="text-[var(--status-expired-text)] opacity-70 group-hover:opacity-100" />
                                        }
                                    </button>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wide">Expiry Date</label>
                                <input
                                    type="date"
                                    value={singleDate}
                                    onChange={e => { setSingleDate(e.target.value); setError(null); }}
                                    className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm outline-none focus:border-[var(--primary)] transition-colors"
                                />
                            </div>
                        </div>
                    )}

                    {/* NO: Multiple Batches */}
                    {selection === 'no' && (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-[var(--primary)]">MULTIPLE BATCHES</span>
                                <div className="flex gap-2">
                                    {batches.length > 0 && (
                                        <button
                                            onClick={async () => {
                                                setBatches([]);
                                                setError(null);
                                                if (hasBatches) await handleDeleteAll(false);
                                            }}
                                            disabled={isDeleting}
                                            // تعديل زر Clear All
                                            className="text-[10px] font-bold text-[var(--status-expired-text)] bg-[var(--status-expired-bg)] px-2 py-1 rounded-lg hover:brightness-95 transition-all"
                                        >
                                            {isDeleting ? 'Clearing...' : 'Clear All'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setBatches(prev => [...prev, { id: Date.now(), qty: '', date: '' }])}
                                        className="text-[10px] font-bold text-[var(--primary)] bg-[var(--secondary)] px-2 py-1 rounded-lg flex items-center gap-1 hover:opacity-80 transition-opacity"
                                    >
                                        <PlusCircle size={10} /> Add Batch
                                    </button>
                                </div>
                            </div>

                            {batches.map((batch, idx) => (
                                <div key={batch.id} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] font-bold text-[var(--foreground)]">Batch {idx + 1}</span>
                                        <button
                                            onClick={() => { setBatches(prev => prev.filter(b => b.id !== batch.id)); setError(null); }}
                                            className="p-1 rounded-lg hover:bg-[var(--status-expired-bg)] transition-colors group"
                                        >
                                            <Trash2 size={13} className="text-[var(--status-expired-text)] opacity-70 group-hover:opacity-100" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-[var(--muted-foreground)] uppercase tracking-wide">Quantity</label>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                min="1"
                                                value={batch.qty}
                                                onChange={e => updateBatch(batch.id, 'qty', e.target.value)}
                                                className="w-full p-2.5 border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl text-xs font-bold outline-none focus:border-[var(--primary)] transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-[var(--muted-foreground)] uppercase tracking-wide">Expiry Date</label>
                                            <input
                                                type="date"
                                                value={batch.date}
                                                onChange={e => updateBatch(batch.id, 'date', e.target.value)}
                                                className="w-full p-2.5 border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] rounded-xl text-xs outline-none focus:border-[var(--primary)] transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Error Alert Box - باستخدام متغيرات الـ Status */}
                    {error && (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--status-expired-bg)] border border-[var(--status-expired-border)] text-[var(--status-expired-text)] text-[11px] font-bold">
                            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                            {error}
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="p-5 border-t border-[var(--border)] bg-[var(--card)]">
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isSaved || !selection}
                        className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                            isSaved
                                ? 'bg-[var(--status-safe-text)] text-white'
                                : isSaving
                                    ? 'bg-[var(--primary)]/60 text-white cursor-wait'
                                    : !selection
                                        ? 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed'
                                        : 'bg-[var(--primary)] text-white hover:opacity-90 active:scale-[0.98]'
                        }`}
                    >
                        {isSaved ? (
                            <><CheckCircle size={16} /> Saved Successfully</>
                        ) : isSaving ? (
                            <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving...</>
                        ) : (
                            hasBatches ? 'Update Expiry Date' : 'Save Expiry Information'
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}