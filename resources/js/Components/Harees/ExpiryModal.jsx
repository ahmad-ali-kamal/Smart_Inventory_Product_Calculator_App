import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CalendarPlus, Trash2, PlusCircle, CheckCircle, AlertCircle, Package, Layers, ExternalLink, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

// ── Toast style ──
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
    filter: invert(0.3);
    opacity: 1;
    cursor: pointer;
  }
  :root[class~="dark"] input[type="date"]::-webkit-calendar-picker-indicator,
  .dark input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(1);
    opacity: 1;
  }
`;

export default function ExpiryModal({ product, onClose, onSave }) {
    const [selection, setSelection] = useState(null); // 'yes' or 'no'
    const [singleDate, setSingleDate] = useState('');
    const [batches, setBatches] = useState([{ id: Date.now(), qty: '', date: '' }]);
    const [isSaving, setIsSaving]       = useState(false);
    const [error, setError]             = useState(null);
    const [isDeleting, setIsDeleting]   = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    // ── Variants State ──
    const [variants, setVariants] = useState([]);
    const [variantsLoading, setVariantsLoading] = useState(false);
    const [variantsLoaded, setVariantsLoaded] = useState(false);
    const [linkedVariants, setLinkedVariants] = useState([]);
    const [showOptionsQuestion, setShowOptionsQuestion] = useState(false);
    const [optionsChecked, setOptionsChecked] = useState(false);
    const [hasVariants, setHasVariants] = useState(null);
    
    // ── Check if quantity and date are entered (to show variants) ──
    const canShowVariants = () => {
        if (!selection) return false;
        if (selection === 'yes') {
            // Show after date is selected (quantity is totalQty from product)
            return !!singleDate;
        } else {
            // Show after at least one batch has quantity AND date
            const hasQty = batches.some(b => b.qty && parseInt(b.qty) > 0);
            const hasDate = batches.some(b => b.date);
            return hasQty && hasDate;
        }
    };
    const showVariantsSection = canShowVariants();

    const totalQty   = product.quantity ?? product.dbQty ?? 0;
    const hasBatches = product.batches && product.batches.length > 0;

    const today = new Date().toISOString().split('T')[0];

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

    // ── Check for variants and ask about options (after quantity/date entered) ──
    useEffect(() => {
        if (!showVariantsSection || optionsChecked || variantsLoaded) return;
        
        const checkOptions = async () => {
            setVariantsLoading(true);
            try {
                const token = getCsrfToken();
                const res = await fetch(`/harees/api/products/${product.id}/check-options`, {
                    headers: {
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': token,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'include',
                });
                const data = await res.json();
                setOptionsChecked(true);
                
                if (data.success) {
                    setHasVariants(data.has_variants);
                    
                    if (!data.has_variants) {
                        // No variants - ask the merchant
                        setShowOptionsQuestion(true);
                    } else {
                        // Has variants - load them
                        loadVariants();
                    }
                }
            } catch (err) {
                console.error('Error checking options:', err);
                setOptionsChecked(true);
            } finally {
                setVariantsLoading(false);
            }
        };
        
        checkOptions();
    }, [showVariantsSection, product.id]);

    // Load variants (combined form like "أحمر - XL")
    const loadVariants = async () => {
        try {
            const token = getCsrfToken();
            const res = await fetch(`/harees/api/products/${product.id}/variants`, {
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });
            const data = await res.json();
            
            if (data.success && data.variants) {
                setVariants(data.variants);
            }
            setVariantsLoaded(true);
        } catch (err) {
            console.error('Error loading variants:', err);
            setVariantsLoaded(true);
        }
    };
    
    // Initialize linked variants for single batch
    useEffect(() => {
        if (variantsLoaded && hasVariants && variants.length > 0 && selection === 'yes' && linkedVariants.length === 0) {
            setLinkedVariants(variants.map(v => ({
                salla_variant_id: v.id,
                variant_quantity: '',
                name: v.name,
                stock_quantity: v.unlimited_quantity ? 999999 : v.stock_quantity,
                unlimited_quantity: v.unlimited_quantity,
            })));
        }
    }, [variantsLoaded, hasVariants, selection]);

    // Initialize linked variants for each batch
    const initializeLinkedVariants = (batchId) => {
        if (!variants.length) return [];
        return variants.map(v => ({
            batch_id: batchId,
            salla_variant_id: v.id,
            variant_quantity: '',
            name: v.name,
            stock_quantity: v.unlimited_quantity ? 999999 : v.stock_quantity,
            unlimited_quantity: v.unlimited_quantity,
        }));
    };
    
    // Add linked variants state per batch (for multiple batches)
    const [batchVariants, setBatchVariants] = useState({});

    // حساب إجمالي الكميات الموزعة على الفاريينت
    const totalVariantQty = linkedVariants.reduce((sum, v) => sum + (parseInt(v.variant_quantity) || 0), 0);
    
    // الحصول على كمية الباتش
    const getBatchQty = () => {
        if (selection === 'yes') {
            return totalQty;
        } else {
            return batches.reduce((sum, b) => sum + (parseInt(b.qty) || 0), 0);
        }
    };
    const batchQty = getBatchQty();
    const remainingForVariants = batchQty - totalVariantQty;

    const usedQty = batches.reduce((sum, b) => sum + (Number(b.qty) || 0), 0);
    const remainingQty    = totalQty - usedQty;
    const allDistributed  = remainingQty === 0 && usedQty > 0;
    const isOverLimit     = usedQty > totalQty;
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
            toast.success('All batches deleted successfully', { duration: 3000, style: toastStyle });

        } catch {
            setError('Connection failed');
            setIsDeleting(false);
        }
    };

    const validate = () => {
        if (!selection) return 'Please select an option first';

        // ── التحقق من الفاريينت ──
        if (hasVariants && variants.length > 0) {
            if (selection === 'yes') {
                // Single batch mode
                const variantErrors = {};
                let hasVariantWithQty = false;
                
                for (let i = 0; i < linkedVariants.length; i++) {
                    const v = linkedVariants[i];
                    const qty = parseInt(v.variant_quantity) || 0;
                    
                    if (qty > 0) {
                        hasVariantWithQty = true;
                        if (!v.unlimited_quantity && qty > v.stock_quantity) {
                            variantErrors[`variant_${i}`] = `الكمية تتجاوز المخزون (${v.stock_quantity})`;
                        }
                    }
                }
                
                if (Object.keys(variantErrors).length > 0) {
                    setFieldErrors(prev => ({ ...prev, ...variantErrors }));
                    return 'تجاوزت كميات بعض الخيارات المخزون المتاح';
                }
                
                if (hasVariantWithQty && totalVariantQty !== batchQty) {
                    return totalVariantQty > batchQty 
                        ? `إجمالي quantities (${totalVariantQty}) يتجاوز كمية الدفعة (${batchQty})`
                        : `لم يتم توزيع كل الكمية - باقي ${batchQty - totalVariantQty}`;
                }
            } else {
                // Multiple batches mode - check each batch
                const variantErrors = {};
                
                for (let b = 0; b < batches.length; b++) {
                    const batch = batches[b];
                    const batchQty = parseInt(batch.qty) || 0;
                    const batchLinked = batchVariants[batch.id] || [];
                    const batchTotal = batchLinked.reduce((sum, v) => sum + (parseInt(v.variant_quantity) || 0), 0);
                    
                    // Check each variant stock
                    batchLinked.forEach((v, i) => {
                        const qty = parseInt(v.variant_quantity) || 0;
                        if (qty > 0 && !v.unlimited_quantity && qty > v.stock_quantity) {
                            variantErrors[`batch_${batch.id}_variant_${v.salla_variant_id}`] = `تجاوز المخزون`;
                        }
                    });
                    
                    // Check total distribution
                    const hasVariantWithQty = batchTotal > 0;
                    if (hasVariantWithQty && batchTotal !== batchQty) {
                        return `الدفعة ${b + 1}: يجب توزيع كامل الكمية (${batchTotal}/${batchQty})`;
                    }
                }
                
                if (Object.keys(variantErrors).length > 0) {
                    setFieldErrors(prev => ({ ...prev, ...variantErrors }));
                    return 'تجاوزت كميات بعض الخيارات المخزون المتاح';
                }
            }
        }

        if (selection === 'yes') {
            if (!singleDate) return 'Please enter the expiry date';

            if (singleDate < today) return 'Expiry date cannot be in the past';

        } else {
            if (batches.length === 0) return 'Add at least one batch';
            const errors = {};
            for (let i = 0; i < batches.length; i++) {
                const qty = parseInt(batches[i].qty);
                if (!batches[i].qty || isNaN(qty) || qty <= 0) {
                    errors[batches[i].id] = 'Quantity must be greater than 0';
                }
                if (!batches[i].date) {
                    errors[batches[i].id + '_date'] = 'required';

                } else if (batches[i].date < today) {
                    errors[batches[i].id + '_date'] = 'past';
                }
            }
            if (Object.keys(errors).length > 0) {
                setFieldErrors(errors);
                return 'Please fix the highlighted fields';
            }
            if (isOverLimit)
                return `Exceeds available stock (${totalQty}).`;
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

        // Add variants if they exist and have quantities
        if (hasVariants && variants.length > 0) {
            if (selection === 'yes') {
                // Single batch mode
                const variantsWithQty = linkedVariants.filter(v => v.variant_quantity && parseInt(v.variant_quantity) > 0);
                if (variantsWithQty.length > 0) {
                    payload.variants = variantsWithQty.map(v => ({
                        salla_variant_id: v.salla_variant_id,
                        variant_quantity: parseInt(v.variant_quantity),
                    }));
                }
            } else {
                // Multiple batches mode - each batch has its own variants
                const allBatchVariants = [];
                batches.forEach(batch => {
                    const batchLinked = batchVariants[batch.id] || [];
                    const batchVariantsWithQty = batchLinked.filter(v => v.variant_quantity && parseInt(v.variant_quantity) > 0);
                    
                    if (batchVariantsWithQty.length > 0) {
                        allBatchVariants.push({
                            batch_id: batch.id,
                            variants: batchVariantsWithQty.map(v => ({
                                salla_variant_id: v.salla_variant_id,
                                variant_quantity: parseInt(v.variant_quantity),
                            }))
                        });
                    }
                });
                
                if (allBatchVariants.length > 0) {
                    payload.batch_variants = allBatchVariants;
                }
            }
        }

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

            if (selection === 'yes' && !data.expiry_date) {
                data.expiry_date = singleDate;
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

    // ── updateBatch: أرقام فقط للـ qty + مسح field error ──
   const updateBatch = (id, field, value) => {
    setError(null);
   let clean = field === 'qty' ? value.replace(/[^0-9]/g, '') : value;

    if (field === 'qty' && clean.length > 6) {
        return; 
    }

    setFieldErrors(prev => ({
        ...prev,
        [id]: undefined,
        [id + '_date']: undefined,
    }));
    setBatches(prev => prev.map(b => b.id === id ? { ...b, [field]: clean } : b));
};

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

                    {/* ── Question: Does product have options? (show after quantity/date) ── */}
                    {showVariantsSection && showOptionsQuestion && !variantsLoaded && (
                        <div className="p-4 rounded-2xl bg-[var(--accent)]/10 border border-[var(--primary)]/15 space-y-3">
                            <div className="flex items-start gap-3">
                                <Layers size={20} className="text-[var(--primary)] flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-[var(--foreground)]">
                                        هل المنتج له خيارات (مثل: حجم، لون)?
                                    </p>
                                    <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
                                        سيتم تطبيق الخصم على كل خيار بشكل منفصل
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => {
                                        setShowOptionsQuestion(false);
                                        window.open('https://salla.sa/dashboard/products', '_blank');
                                    }}
                                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[var(--secondary)] text-[var(--primary)] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                                >
                                    <ExternalLink size={14} />
                                    نعم - أضيف في سلة
                                </button>
                                <button
                                    onClick={() => {
                                        setShowOptionsQuestion(false);
                                        setHasVariants(false);
                                    }}
                                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[var(--muted)] text-[var(--muted-foreground)] hover:opacity-80 transition-opacity"
                                >
                                    لا - منتج واحد
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Loading variants ── */}
                    {showVariantsSection && variantsLoading && (
                        <div className="flex items-center justify-center py-4">
                            <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-bold text-[var(--muted-foreground)] mr-2">جاري تحميل الخيارات...</span>
                        </div>
                    )}

                    {/* ── Message: Enter quantity/date first (if selection made but no qty/date) ── */}
                    {selection && !showVariantsSection && !showOptionsQuestion && (
                        <div className="p-3 rounded-xl bg-[var(--accent)]/10 border border-[var(--primary)]/15 text-center">
                            <p className="text-[11px] font-bold text-[var(--primary)]">
                                ⏳ أدخل الكمية والتاريخ أولاًpara ver las opciones
                            </p>
                        </div>
                    )}

                    {/* ── Variant Selection (for each batch in multiple mode) ── */}
                    {showVariantsSection && variantsLoaded && hasVariants && variants.length > 0 && selection === 'no' && (
                        <div className="p-4 rounded-2xl bg-[var(--accent)]/5 border border-[var(--border)] space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-wide">الخيارات لكل دفعة</span>
                                <span className="text-[10px] text-[var(--muted-foreground)]">{variants.length} فارينت</span>
                            </div>
                            
                            {batches.map((batch, batchIdx) => {
                                const batchQty = parseInt(batch.qty) || 0;
                                const batchLinked = batchVariants[batch.id] || initializeLinkedVariants(batch.id);
                                const batchVariantTotal = batchLinked.reduce((sum, v) => sum + (parseInt(v.variant_quantity) || 0), 0);
                                
                                return (
                                    <div key={batch.id} className="border border-[var(--border)] rounded-xl overflow-hidden">
                                        <div className="bg-[var(--secondary)]/30 px-3 py-2 border-b border-[var(--border)] flex justify-between items-center">
                                            <span className="text-xs font-bold text-[var(--primary)]">الدفعة {batchIdx + 1}</span>
                                            <span className="text-[10px] text-[var(--muted-foreground)]">الكمية: {batchQty}</span>
                                        </div>
                                        
                                        <div className="p-2 space-y-2 max-h-[200px] overflow-y-auto">
                                            {variants.map((variant) => {
                                                const linkedIdx = batchLinked.findIndex(v => v.salla_variant_id === variant.id);
                                                const linked = linkedIdx >= 0 ? batchLinked[linkedIdx] : null;
                                                const hasError = linkedIdx >= 0 && fieldErrors[`batch_${batch.id}_variant_${variant.id}`];
                                                const qty = linked ? parseInt(linked.variant_quantity) || 0 : 0;
                                                
                                                return (
                                                    <div key={variant.id} className={`flex items-center gap-2 p-2 rounded-lg bg-[var(--background)] ${hasError ? 'border border-[var(--status-expired-text)]' : 'border border-[var(--border)]'}`}>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-bold text-[var(--foreground)]">{variant.name}</p>
                                                            <p className={`text-[9px] ${variant.unlimited_quantity ? 'text-[var(--status-safe-text)]' : 'text-[var(--muted-foreground)]'}`}>
                                                                المخزون: {variant.unlimited_quantity ? 'غير محدود' : variant.stock_quantity}
                                                            </p>
                                                            {hasError && <p className="text-[9px] text-[var(--status-expired-text)]">{hasError}</p>}
                                                        </div>
                                                        <input
                                                            type="number"
                                                            placeholder="0"
                                                            min="0"
                                                            max={variant.unlimited_quantity ? 99999 : variant.stock_quantity}
                                                            value={linked?.variant_quantity || ''}
                                                            onChange={(e) => {
                                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                                setBatchVariants(prev => ({
                                                                    ...prev,
                                                                    [batch.id]: (prev[batch.id] || initializeLinkedVariants(batch.id)).map((v, i) => 
                                                                        v.salla_variant_id === variant.id ? { ...v, variant_quantity: val } : v
                                                                    )
                                                                }));
                                                                // Clear error
                                                                if (fieldErrors[`batch_${batch.id}_variant_${variant.id}`]) {
                                                                    setFieldErrors(prev => {
                                                                        const next = { ...prev };
                                                                        delete next[`batch_${batch.id}_variant_${variant.id}`];
                                                                        return next;
                                                                    });
                                                                }
                                                            }}
                                                            className={`w-20 p-1.5 rounded-lg text-xs font-bold text-center border bg-[var(--card)] text-[var(--foreground)] outline-none focus:border-[var(--primary)] ${hasError ? 'border-[var(--status-expired-text)]' : 'border-[var(--border)]'}`}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        
                                        {/* Batch variant total */}
                                        <div className="flex justify-between items-center text-[10px] px-3 py-2 border-t border-[var(--border)] bg-[var(--accent)]/10">
                                            <span className="text-[var(--muted-foreground)]">الموزّع:</span>
                                            <span className={`font-bold ${batchVariantTotal > batchQty ? 'text-[var(--status-expired-text)]' : batchVariantTotal === batchQty ? 'text-[var(--status-safe-text)]' : 'text-[var(--foreground)]'}`}>
                                                {batchVariantTotal} / {batchQty}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ── Variant Selection (for single batch mode) ── */}
                    {showVariantsSection && variantsLoaded && hasVariants && variants.length > 0 && selection === 'yes' && (
                        <div className="p-4 rounded-2xl bg-[var(--accent)]/5 border border-[var(--border)] space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-wide">الخيارات والكميات</span>
                                <span className="text-[10px] text-[var(--muted-foreground)]">{variants.length} فارينت</span>
                            </div>
                            
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                {variants.map((variant, idx) => {
                                    const linkedIdx = linkedVariants.findIndex(v => v.salla_variant_id === variant.id);
                                    const linked = linkedIdx >= 0 ? linkedVariants[linkedIdx] : null;
                                    const hasError = linkedIdx >= 0 && fieldErrors[`variant_${linkedIdx}`];
                                    
                                    return (
                                        <div key={variant.id} className={`flex items-center gap-3 p-3 rounded-xl bg-[var(--background)] border ${hasError ? 'border-[var(--status-expired-text)]' : 'border-[var(--border)]'}`}>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-[var(--foreground)] truncate">{variant.name}</p>
                                                <p className={`text-[9px] ${variant.unlimited_quantity ? 'text-[var(--status-safe-text)]' : 'text-[var(--muted-foreground)]'}`}>
                                                    المخزون: {variant.unlimited_quantity ? 'غير محدود' : variant.stock_quantity}
                                                </p>
                                                {hasError && <p className="text-[9px] text-[var(--status-expired-text)]">{hasError}</p>}
                                            </div>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                min="0"
                                                max={variant.unlimited_quantity ? 99999 : variant.stock_quantity}
                                                value={linked?.variant_quantity || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                                    setLinkedVariants(prev => prev.map((v, i) => 
                                                        i === linkedIdx ? { ...v, variant_quantity: val } : v
                                                    ));
                                                    if (fieldErrors[`variant_${linkedIdx}`]) {
                                                        setFieldErrors(prev => {
                                                            const next = { ...prev };
                                                            delete next[`variant_${linkedIdx}`];
                                                            return next;
                                                        });
                                                    }
                                                }}
                                                className={`w-24 p-2 rounded-lg text-xs font-bold text-center border bg-[var(--card)] text-[var(--foreground)] outline-none focus:border-[var(--primary)] ${hasError ? 'border-[var(--status-expired-text)]' : 'border-[var(--border)]'}`}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                            
                            <div className="flex justify-between items-center text-[10px] pt-2 border-t border-[var(--border)]">
                                <span className="text-[var(--muted-foreground)]">الإجمالي:</span>
                                <span className={`font-bold ${totalVariantQty > batchQty ? 'text-[var(--status-expired-text)]' : totalVariantQty === batchQty ? 'text-[var(--status-safe-text)]' : 'text-[var(--foreground)]'}`}>
                                    {totalVariantQty} / {batchQty}
                                </span>
                            </div>
                        </div>
                    )}

                    <p className="text-sm font-bold text-[var(--foreground)] text-center">
                        Do all quantities have the same expiry date?
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={() => { setSelection('yes'); setError(null); setFieldErrors({}); }}
                            className={`flex-1 py-3 rounded-2xl border text-xs font-bold transition-all ${
                                selection === 'yes'
                                    ? 'border-[var(--primary)] bg-[var(--accent)] text-[var(--primary)]'
                                    : 'border-[var(--border)] text-[var(--muted-foreground)] bg-transparent'
                            }`}
                        >
                            Yes — Single Batch
                        </button>
                        <button
                            onClick={() => { setSelection('no'); setError(null); setFieldErrors({}); }}
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

                    {/* Progress bar */}
                    {selection === 'no' && (
                        <div className="space-y-3">
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
                                   
                                    min={today}
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
                                        onClick={() => setBatches(prev => [...prev, { id: Date.now(), qty: '', date: '' }])}
                                        className="text-[10px] font-bold text-[var(--primary)] bg-[var(--secondary)] px-2 py-1 rounded-lg flex items-center gap-1 hover:opacity-80 transition-opacity"
                                    >
                                        <PlusCircle size={10} /> Add Batch
                                    </button>
                                </div>
                            </div>

                            {batches.map((batch, idx) => (
                                <div
                                    key={batch.id}
                                    className={`p-4 rounded-xl border bg-[var(--card)] space-y-3 transition-colors ${
                                        (fieldErrors[batch.id] || fieldErrors[batch.id + '_date'])
                                            ? 'border-[var(--status-expired-text)] ring-1 ring-[var(--status-expired-text)]/20'
                                            : 'border-[var(--border)]'
                                    }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] font-bold text-[var(--foreground)]">Batch {idx + 1}</span>
                                        <button
                                            onClick={() => {
                                                setBatches(prev => prev.filter(b => b.id !== batch.id));
                                                setFieldErrors(prev => {
                                                    const next = { ...prev };
                                                    delete next[batch.id];
                                                    delete next[batch.id + '_date'];
                                                    return next;
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
                                                maxLength={6} 
                                                value={batch.qty}
                                                onChange={e => updateBatch(batch.id, 'qty', e.target.value)}
                                                onKeyDown={e => {
                                                    if (['-', '+', 'e', 'E', '.'].includes(e.key)) e.preventDefault();
                                                }}
                                                className={`w-full p-2.5 rounded-xl text-xs font-bold outline-none transition-colors border
                                                    bg-[var(--background)] text-[var(--foreground)]
                                                    ${fieldErrors[batch.id]
                                                        ? 'border-[var(--status-expired-text)] bg-[var(--status-expired-bg)] ring-1 ring-[var(--status-expired-text)]/30'
                                                        : 'border-[var(--border)] focus:border-[var(--primary)]'
                                                    }`}
                                            />
                                            {fieldErrors[batch.id] && (
                                                <p className="text-[9px] font-bold text-[var(--status-expired-text)] mt-0.5">
                                                    {fieldErrors[batch.id]}
                                                </p>
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
                                                className={`w-full p-2.5 rounded-xl text-xs outline-none transition-colors border
                                                    bg-[var(--background)] text-[var(--foreground)]
                                                    ${fieldErrors[batch.id + '_date']
                                                        ? 'border-[var(--status-expired-text)] bg-[var(--status-expired-bg)] ring-1 ring-[var(--status-expired-text)]/30'
                                                        : 'border-[var(--border)] focus:border-[var(--primary)]'
                                                    }`}
                                            />
                                            {fieldErrors[batch.id + '_date'] && (
                                                <p className="text-[9px] font-bold text-[var(--status-expired-text)] mt-0.5">
                                                    
                                                    {fieldErrors[batch.id + '_date'] === 'past'
                                                        ? 'Date is in the past'
                                                        : 'Required'}
                                                </p>
                                            )}
                                        </div>

                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Error Alert Box */}
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
                      
                        disabled={isSaving || !selection}
                        className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                            isSaving
                                ? 'bg-[var(--primary)]/60 text-white cursor-wait'
                                : !selection
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