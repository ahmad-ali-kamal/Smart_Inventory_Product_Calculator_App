import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    X, CalendarPlus, Trash2, PlusCircle, AlertCircle,
    Package, Layers, ExternalLink, ShoppingBag, ChevronDown, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

const toastStyle = {
    borderRadius: '12px',
    background: 'var(--card)',
    color: 'var(--foreground)',
    border: '1px solid var(--border)',
    fontSize: '12px',
    fontWeight: 'bold',
};

const dateInputStyle = `
  input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(0.3); opacity: 1; cursor: pointer;
  }
  :root[class~="dark"] input[type="date"]::-webkit-calendar-picker-indicator,
  .dark input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(1); opacity: 1;
  }
`;

export default function ExpiryModal({ product, onClose, onSave }) {

    // ── Core state ──
    const [batches, setBatches]         = useState([{ id: Date.now(), qty: '', date: '' }]);
    const [isSaving, setIsSaving]       = useState(false);
    const [error, setError]             = useState(null);
    const [isDeleting, setIsDeleting]   = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    // ── Variants / options state ──
    const [variants, setVariants]               = useState([]);
    const [variantsLoading, setVariantsLoading] = useState(false);
    const [variantsLoaded, setVariantsLoaded]   = useState(false);
    const [optionsChecked, setOptionsChecked]   = useState(false);
    // null = unknown | true = has salla variants | false = no salla variants
    const [hasVariants, setHasVariants]         = useState(null);
    // false = waiting for merchant answer (only when hasVariants===false)
    // true  = answered or product already had variants
    const [optionsAnswered, setOptionsAnswered] = useState(false);

    // Per-batch variant qty map  { [batchId]: [{ salla_variant_id, variant_quantity, ... }] }
    const [batchVariants, setBatchVariants] = useState({});

    // ✅ استخدام variants_data المحلية أولاً (من الـ cache)
    const localVariants = product.variants_data || [];

    // ── Derived ──
    const totalQty        = product.quantity ?? product.dbQty ?? 0;
    const hasBatches      = product.batches && product.batches.length > 0;
    const today           = new Date().toISOString().split('T')[0];
    const usedQty         = batches.reduce((sum, b) => sum + (Number(b.qty) || 0), 0);
    const remainingQty    = totalQty - usedQty;
    const allDistributed  = remainingQty === 0 && usedQty > 0;
    const isOverLimit     = usedQty > totalQty;
    const progressPercent = totalQty > 0 ? Math.min((usedQty / totalQty) * 100, 100) : 0;

    // A batch shows its variants panel once both qty AND date are filled
    const isBatchReady = (b) => b.qty && parseInt(b.qty) > 0 && !!b.date;

    const getCsrfToken = () => document.querySelector('meta[name="csrf-token"]')?.content;

    // ── Load existing batches when editing ──
    useEffect(() => {
        if (!hasBatches) return;
        setBatches(product.batches.map(b => ({
            id: b.id,
            qty: b.quantity ?? b.qty ?? '',
            date: b.expiry_date || b.expiryDate || '',
            batchId: b.id,
        })));
    }, [hasBatches, product.batches]);

    // ── On mount: immediately call check-options ──
    // • Product has salla variants  → load them silently, mark optionsAnswered=true
    // • No salla variants           → show question card BEFORE the batches form
    useEffect(() => {
        if (optionsChecked || totalQty === 0) return;

        const checkOptions = async () => {
            setVariantsLoading(true);
            
            // ✅ أولاً: تحقق من local variants_data (الـ cache)
            if (localVariants && localVariants.length > 0) {
                setVariants(localVariants);
                setHasVariants(true);
                setOptionsAnswered(true);
                setVariantsLoaded(true);
                setVariantsLoading(false);
                setOptionsChecked(true);
                return;
            }

            // ✅ ثانياً: اتصل بالـ API للتحقق من وجود variants في سلة
            try {
                const res = await fetch(`/harees/api/products/${product.id}/check-options`, {
                    headers: {
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': getCsrfToken(),
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'include',
                });
                const data = await res.json();
                setOptionsChecked(true);

                if (data.success) {
                    if (data.has_variants) {
                        setHasVariants(true);
                        setOptionsAnswered(true);   // skip question, go straight to form
                        loadVariants();
                    } else {
                        setHasVariants(false);
                        // optionsAnswered stays false → question card blocks the form
                    }
                } else {
                    // API error → skip variants entirely, show form
                    setOptionsAnswered(true);
                    setVariantsLoaded(true);
                }
            } catch {
                setOptionsChecked(true);
                setOptionsAnswered(true);
                setVariantsLoaded(true);
            } finally {
                setVariantsLoading(false);
            }
        };

        checkOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product.id]);

    const loadVariants = async () => {
        try {
            const res = await fetch(`/harees/api/products/${product.id}/variants`, {
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });
            const data = await res.json();
            if (data.success && data.variants) setVariants(data.variants);
            setVariantsLoaded(true);
        } catch {
            setVariantsLoaded(true);
        }
    };

    // ✅ استخدام useMemo للحفاظ على template ثابت
    const variantTemplate = useMemo(() => {
        if (!variants || variants.length === 0) return [];
        return variants.map(v => ({
            salla_variant_id: v.id,
            variant_quantity: '',
            name: v.name,
            stock_quantity: v.unlimited_quantity ? 999999 : v.stock_quantity,
            unlimited_quantity: v.unlimited_quantity,
        }));
    }, [variants]);

    const initializeBatchVariants = useCallback((batchId) => {
        return variantTemplate.map(v => ({
            batch_id: batchId,
            ...v,
        }));
    }, [variantTemplate]);

    // ✅ دالة refresh للـ variants من سلة
    const refreshVariants = async () => {
        setVariantsLoading(true);
        setVariantsLoaded(false);
        try {
            const res = await fetch(`/harees/api/products/${product.id}/variants`, {
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });
            const data = await res.json();
            if (data.success && data.variants) {
                setVariants(data.variants);
            }
            setVariantsLoaded(true);
        } catch {
            setVariantsLoaded(true);
            toast.error('فشل تحديث الـ variants', { duration: 3000, style: toastStyle });
        } finally {
            setVariantsLoading(false);
        }
    };

    // ── Delete all ──
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
            toast.success('All batches deleted successfully', { duration: 3000, style: toastStyle });
        } catch {
            setError('Connection failed');
            setIsDeleting(false);
        }
    };

    // ── Validate ──
    const validate = () => {
        if (batches.length === 0) return 'Add at least one batch';

        const errors = {};
        for (const b of batches) {
            const qty = parseInt(b.qty);
            if (!b.qty || isNaN(qty) || qty <= 0) errors[b.id] = 'Quantity must be greater than 0';
            if (!b.date)             errors[b.id + '_date'] = 'required';
            else if (b.date < today) errors[b.id + '_date'] = 'past';
        }
        if (Object.keys(errors).length) {
            setFieldErrors(errors);
            return 'Please fix the highlighted fields';
        }
        if (isOverLimit)       return `Exceeds available stock (${totalQty}).`;
        if (usedQty < totalQty) return `${totalQty - usedQty} unit(s) unassigned — all stock must be distributed`;

        // Variant validation
        if (hasVariants && variants.length > 0) {
            const variantErrors = {};
            for (let i = 0; i < batches.length; i++) {
                const batch       = batches[i];
                const batchQtyNum = parseInt(batch.qty) || 0;
                const batchLinked = batchVariants[batch.id] || [];
                const batchTotal  = batchLinked.reduce((s, v) => s + (parseInt(v.variant_quantity) || 0), 0);

                batchLinked.forEach(v => {
                    const q = parseInt(v.variant_quantity) || 0;
                    if (q > 0 && !v.unlimited_quantity && q > v.stock_quantity)
                        variantErrors[`batch_${batch.id}_variant_${v.salla_variant_id}`] = 'Exceeds available stock';
                });

                if (batchTotal > 0 && batchTotal !== batchQtyNum)
                    return `Batch ${i + 1}: distributed qty (${batchTotal}) must equal batch qty (${batchQtyNum})`;
            }
            if (Object.keys(variantErrors).length) {
                setFieldErrors(p => ({ ...p, ...variantErrors }));
                return 'Some option quantities exceed available stock';
            }
        }

        return null;
    };

    // ── Save ──
    const handleSave = async () => {
        setError(null);
        const err = validate();
        if (err) { setError(err); return; }

        setIsSaving(true);
        const payload = {
            product_id: product.id,
            same_expiry: false,
            batches: batches.map(b => ({
                id: b.batchId || null,
                quantity: parseInt(b.qty),
                expiry_date: b.date,
                batch_code: b.batchId ? undefined : null,
            })),
        };

        if (hasVariants && variants.length > 0) {
            const allBatchVariants = [];
            batches.forEach(batch => {
                const linked = (batchVariants[batch.id] || []).filter(v => v.variant_quantity && parseInt(v.variant_quantity) > 0);
                if (linked.length > 0)
                    allBatchVariants.push({
                        batch_id: batch.id,
                        variants: linked.map(v => ({
                            salla_variant_id: v.salla_variant_id,
                            variant_quantity: parseInt(v.variant_quantity),
                        })),
                    });
            });
            if (allBatchVariants.length) payload.batch_variants = allBatchVariants;
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
            onSave(product.id, data);
            onClose();
            toast.success(
                hasBatches ? 'Expiry date updated successfully' : 'Expiry date added successfully',
                { duration: 3000, style: toastStyle }
            );
        } catch {
            setError('Connection failed');
            setIsSaving(false);
        }
    };

    const updateBatch = (id, field, value) => {
        setError(null);
        let clean = field === 'qty' ? value.replace(/[^0-9]/g, '') : value;
        if (field === 'qty' && clean.length > 6) return;
        setFieldErrors(p => ({ ...p, [id]: undefined, [id + '_date']: undefined }));
        setBatches(p => p.map(b => b.id === id ? { ...b, [field]: clean } : b));
    };

    // ─────────────────────────────────────────────
    // ZERO QUANTITY — empty state screen
    // ─────────────────────────────────────────────
    if (totalQty === 0) {
        return createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                <div className="relative w-full max-w-[420px] bg-[var(--card)] border border-[var(--border)] rounded-[24px] shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
                    <div className="flex items-center gap-3 p-5 border-b border-[var(--border)]">
                        <div className="w-10 h-10 rounded-xl bg-[var(--secondary)] flex items-center justify-center text-[var(--primary)]">
                            <CalendarPlus size={20} />
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="text-sm font-bold text-[var(--foreground)]">Add Expiry Date</h3>
                            <p className="text-[11px] text-[var(--muted-foreground)]">{product.name}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors text-[var(--foreground)]">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="p-8 flex flex-col items-center text-center space-y-5">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--secondary)] flex items-center justify-center">
                            <Package size={28} className="text-[var(--primary)]" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-black text-[var(--foreground)]">No stock available</p>
                            <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                                To create expiry batches, your product needs stock in the inventory.
                                Add quantity in Salla first, then come back to set expiry dates.
                            </p>
                        </div>
                        <a
                            href="https://salla.sa/dashboard/products"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-[var(--primary)] text-white flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
                        >
                            <ShoppingBag size={15} />
                            Go to Salla to add stock
                            <ExternalLink size={13} className="opacity-70" />
                        </a>
                        <button
                            onClick={onClose}
                            className="text-[11px] font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        );
    }

    // ─────────────────────────────────────────────
    // MAIN MODAL
    // ─────────────────────────────────────────────
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <style>{dateInputStyle}</style>
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

                    {/* A ── Checking options spinner (on open, before anything shows) */}
                    {!optionsChecked && variantsLoading && (
                        <div className="flex items-center justify-center py-8 gap-2">
                            <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-bold text-[var(--muted-foreground)]">Checking product options...</span>
                        </div>
                    )}

                    {/* B ── Question card — shown FIRST when no salla variants found */}
                    {optionsChecked && hasVariants === false && !optionsAnswered && (
                        <div className="p-4 rounded-2xl bg-[var(--accent)]/10 border border-[var(--primary)]/15 space-y-3">
                            <div className="flex items-start gap-3">
                                <Layers size={20} className="text-[var(--primary)] flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-[var(--foreground)]">
                                        Does this product have options?
                                    </p>
                                    <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
                                        e.g. size, color or any other variant — quantity will be split per option.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => window.open('https://salla.sa/dashboard/products', '_blank')}
                                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[var(--secondary)] text-[var(--primary)] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                                >
                                    <ExternalLink size={14} />
                                    Yes — add options in Salla first
                                </button>
                                <button
                                    onClick={() => {
                                        setOptionsAnswered(true);
                                        setVariantsLoaded(true);
                                    }}
                                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[var(--muted)] text-[var(--muted-foreground)] hover:opacity-80 transition-opacity"
                                >
                                    No — single product
                                </button>
                            </div>
                        </div>
                    )}

                    {/* C ── Loading variants spinner (after auto-detect confirmed variants) */}
                    {optionsChecked && hasVariants === true && variantsLoading && (
                        <div className="flex items-center justify-center py-4 gap-2">
                            <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-bold text-[var(--muted-foreground)]">Loading product options...</span>
                        </div>
                    )}

                    {/* D ── Main form — unlocked after optionsAnswered */}
                    {optionsAnswered && (
                        <>
                            {/* Available Stock Badge */}
                            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--accent)]/10 border border-[var(--primary)]/15">
                                <Package size={16} className="text-[var(--primary)] flex-shrink-0" />
                                <div>
                                    <p className="text-[10px] font-black text-[var(--primary)] uppercase tracking-wide">Available Stock</p>
                                    <p className="text-sm font-bold text-[var(--foreground)]">{totalQty} units</p>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="p-4 rounded-2xl bg-[var(--accent)]/5 border border-[var(--border)] space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wide">
                                    <span className={
                                        isOverLimit      ? 'text-[var(--status-expired-text)]'
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
                                            isOverLimit      ? 'bg-[var(--status-expired-text)]'
                                            : allDistributed ? 'bg-[var(--status-safe-text)]'
                                            : 'bg-[var(--primary)]'
                                        }`}
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>

                            {/* ✅ زر refresh للـ variants */}
                            {hasVariants && variantsLoaded && (
                                <button
                                    onClick={refreshVariants}
                                    disabled={variantsLoading}
                                    className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--primary)] bg-[var(--secondary)] px-2 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
                                >
                                    <RefreshCw size={12} className={variantsLoading ? 'animate-spin' : ''} />
                                    تحديث من سلة
                                </button>
                            )}

                            {/* ── Batches ── */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-[var(--primary)]">MULTIPLE BATCHES</span>
                                    <div className="flex gap-2">
                                        {batches.length > 0 && (
                                            <button
                                                onClick={async () => {
                                                    setBatches([]);
                                                    setBatchVariants({});
                                                    setError(null);
                                                    setFieldErrors({});
                                                    if (hasBatches) await handleDeleteAll(false);
                                                }}
                                                disabled={isDeleting}
                                                className="text-[10px] font-bold text-[var(--status-expired-text)] bg-[var(--status-expired-bg)] px-2 py-1 rounded-lg hover:brightness-95 transition-all"
                                            >
                                                {isDeleting ? 'Clearing...' : 'Clear All'}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setBatches(p => [...p, { id: Date.now(), qty: '', date: '' }])}
                                            className="text-[10px] font-bold text-[var(--primary)] bg-[var(--secondary)] px-2 py-1 rounded-lg flex items-center gap-1 hover:opacity-80 transition-opacity"
                                        >
                                            <PlusCircle size={10} /> Add Batch
                                        </button>
                                    </div>
                                </div>

                                {batches.map((batch, idx) => {
                                    const batchReady    = isBatchReady(batch);
                                    const showVariants  = batchReady && variantsLoaded && hasVariants && variants.length > 0;
                                    const batchLinked   = batchVariants[batch.id] || (showVariants ? initializeBatchVariants(batch.id) : []);
                                    const batchVarTotal = batchLinked.reduce((s, v) => s + (parseInt(v.variant_quantity) || 0), 0);
                                    const batchQtyNum   = parseInt(batch.qty) || 0;

                                    return (
                                        <div key={batch.id} className="space-y-0">

                                            {/* Batch card */}
                                            <div className={`p-4 ${showVariants ? 'rounded-t-xl' : 'rounded-xl'} border bg-[var(--card)] space-y-3 transition-colors ${
                                                (fieldErrors[batch.id] || fieldErrors[batch.id + '_date'])
                                                    ? 'border-[var(--status-expired-text)] ring-1 ring-[var(--status-expired-text)]/20'
                                                    : 'border-[var(--border)]'
                                            }`}>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[11px] font-bold text-[var(--foreground)]">Batch {idx + 1}</span>
                                                    <button
                                                        onClick={() => {
                                                            setBatches(p => p.filter(b => b.id !== batch.id));
                                                            setBatchVariants(p => { const n = { ...p }; delete n[batch.id]; return n; });
                                                            setFieldErrors(p => {
                                                                const n = { ...p };
                                                                delete n[batch.id];
                                                                delete n[batch.id + '_date'];
                                                                return n;
                                                            });
                                                            setError(null);
                                                        }}
                                                        className="p-1 rounded-lg hover:bg-[var(--status-expired-bg)] transition-colors group"
                                                    >
                                                        <Trash2 size={13} className="text-[var(--status-expired-text)] opacity-70 group-hover:opacity-100" />
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    {/* Quantity */}
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-black text-[var(--muted-foreground)] uppercase tracking-wide">Quantity</label>
                                                        <input
                                                            type="number"
                                                            placeholder="0"
                                                            min="1"
                                                            value={batch.qty}
                                                            onChange={e => updateBatch(batch.id, 'qty', e.target.value)}
                                                            onKeyDown={e => ['-', '+', 'e', 'E', '.'].includes(e.key) && e.preventDefault()}
                                                            className={`w-full p-2.5 rounded-xl text-xs font-bold outline-none transition-colors border bg-[var(--background)] text-[var(--foreground)] ${
                                                                fieldErrors[batch.id]
                                                                    ? 'border-[var(--status-expired-text)] bg-[var(--status-expired-bg)] ring-1 ring-[var(--status-expired-text)]/30'
                                                                    : 'border-[var(--border)] focus:border-[var(--primary)]'
                                                            }`}
                                                        />
                                                        {fieldErrors[batch.id] && (
                                                            <p className="text-[9px] font-bold text-[var(--status-expired-text)] mt-0.5">{fieldErrors[batch.id]}</p>
                                                        )}
                                                    </div>

                                                    {/* Expiry Date */}
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-black text-[var(--muted-foreground)] uppercase tracking-wide">Expiry Date</label>
                                                        <input
                                                            type="date"
                                                            value={batch.date}
                                                            min={today}
                                                            onChange={e => updateBatch(batch.id, 'date', e.target.value)}
                                                            className={`w-full p-2.5 rounded-xl text-xs outline-none transition-colors border bg-[var(--background)] text-[var(--foreground)] ${
                                                                fieldErrors[batch.id + '_date']
                                                                    ? 'border-[var(--status-expired-text)] bg-[var(--status-expired-bg)] ring-1 ring-[var(--status-expired-text)]/30'
                                                                    : 'border-[var(--border)] focus:border-[var(--primary)]'
                                                            }`}
                                                        />
                                                        {fieldErrors[batch.id + '_date'] && (
                                                            <p className="text-[9px] font-bold text-[var(--status-expired-text)] mt-0.5">
                                                                {fieldErrors[batch.id + '_date'] === 'past' ? 'Date is in the past' : 'Required'}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Variants panel — flush below its batch card */}
                                            {showVariants && (
                                                <div className="border border-t-0 border-[var(--border)] rounded-b-xl overflow-hidden bg-[var(--accent)]/5">
                                                    <div className="px-3 py-2 bg-[var(--secondary)]/30 border-b border-[var(--border)] flex justify-between items-center">
                                                        <div className="flex items-center gap-1.5">
                                                            <ChevronDown size={12} className="text-[var(--primary)]" />
                                                            <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-wide">
                                                                Distribute options — Batch {idx + 1}
                                                            </span>
                                                        </div>
                                                        <span className={`text-[10px] font-bold ${
                                                            batchVarTotal > batchQtyNum
                                                                ? 'text-[var(--status-expired-text)]'
                                                                : batchVarTotal === batchQtyNum && batchQtyNum > 0
                                                                    ? 'text-[var(--status-safe-text)]'
                                                                    : 'text-[var(--muted-foreground)]'
                                                        }`}>
                                                            {batchVarTotal} / {batchQtyNum}
                                                        </span>
                                                    </div>

                                                    <div className="p-2 space-y-1.5">
                                                        {variants.map(variant => {
                                                            const linked   = batchLinked.find(v => v.salla_variant_id === variant.id);
                                                            const hasError = fieldErrors[`batch_${batch.id}_variant_${variant.id}`];

                                                            return (
                                                                <div
                                                                    key={variant.id}
                                                                    className={`flex items-center gap-2 p-2.5 rounded-lg bg-[var(--background)] border ${hasError ? 'border-[var(--status-expired-text)]' : 'border-[var(--border)]'}`}
                                                                >
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-xs font-bold text-[var(--foreground)] truncate">{variant.name}</p>
                                                                        <p className={`text-[9px] ${variant.unlimited_quantity ? 'text-[var(--status-safe-text)]' : 'text-[var(--muted-foreground)]'}`}>
                                                                            Stock: {variant.unlimited_quantity ? 'Unlimited' : variant.stock_quantity}
                                                                        </p>
                                                                        {hasError && (
                                                                            <p className="text-[9px] text-[var(--status-expired-text)]">{hasError}</p>
                                                                        )}
                                                                    </div>
                                                                    <input
                                                                        type="number"
                                                                        placeholder="0"
                                                                        min="0"
                                                                        max={variant.unlimited_quantity ? 99999 : variant.stock_quantity}
                                                                        value={linked?.variant_quantity || ''}
                                                                        onChange={e => {
                                                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                                                            setBatchVariants(p => {
                                                                                const current = p[batch.id] || initializeBatchVariants(batch.id);
                                                                                return {
                                                                                    ...p,
                                                                                    [batch.id]: current.map(v =>
                                                                                        v.salla_variant_id === variant.id ? { ...v, variant_quantity: val } : v
                                                                                    ),
                                                                                };
                                                                            });
                                                                            if (fieldErrors[`batch_${batch.id}_variant_${variant.id}`])
                                                                                setFieldErrors(p => { const n = { ...p }; delete n[`batch_${batch.id}_variant_${variant.id}`]; return n; });
                                                                        }}
                                                                        className={`w-20 p-1.5 rounded-lg text-xs font-bold text-center border bg-[var(--card)] text-[var(--foreground)] outline-none focus:border-[var(--primary)] ${hasError ? 'border-[var(--status-expired-text)]' : 'border-[var(--border)]'}`}
                                                                    />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Error alert */}
                            {error && (
                                <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--status-expired-bg)] border border-[var(--status-expired-border)] text-[var(--status-expired-text)] text-[11px] font-bold">
                                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                                    {error}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="p-5 border-t border-[var(--border)] bg-[var(--card)]">
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !optionsAnswered || batches.length === 0}
                        className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                            isSaving
                                ? 'bg-[var(--primary)]/60 text-white cursor-wait'
                                : !optionsAnswered || batches.length === 0
                                    ? 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed'
                                    : 'bg-[var(--primary)] text-white hover:opacity-90 active:scale-[0.98]'
                        }`}
                    >
                        {isSaving ? (
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