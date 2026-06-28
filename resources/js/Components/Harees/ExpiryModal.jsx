import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
    X, CalendarPlus, Trash2, AlertCircle,
    Package, Layers, ExternalLink, ShoppingBag, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation('harees');

    const sallaProductsUrl = product?.salla_product_id
        ? `https://s.salla.sa/products/${product.salla_product_id}`
        : 'https://s.salla.sa/products';

    const queryClient = useQueryClient();

    const existingBatch = product.batches?.[0] || null;
    const isEditMode = !!existingBatch;

    const [expiryDate, setExpiryDate] = useState(existingBatch?.expiry_date || existingBatch?.expiryDate || '');
    const [totalQty, setTotalQty] = useState(existingBatch?.quantity || existingBatch?.qty || '');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    const [variants, setVariants] = useState([]);
    const [variantsLoading, setVariantsLoading] = useState(false);
    const [variantsLoaded, setVariantsLoaded] = useState(false);
    const [optionsChecked, setOptionsChecked] = useState(false);
    const [hasVariants, setHasVariants] = useState(null);
    const [optionsAnswered, setOptionsAnswered] = useState(false);

    const [batchVariants, setBatchVariants] = useState([]);
    const batchVariantsRef = useRef([]);

    const localVariants = product.variants_data || [];
    const productQty = product.quantity ?? product.dbQty ?? 0;
    const today = new Date().toISOString().split('T')[0];

    const getCsrfToken = () => document.querySelector('meta[name="csrf-token"]')?.content;

    const initialVariantCandidates = useMemo(() => {
        if (!isEditMode) return [];
        const source = product.variants_data?.length > 0 ? product.variants_data : (existingBatch?.variants || []);
        const unique = [];
        const seen = new Set();
        source.forEach(v => {
            const id = v.id ?? v.salla_variant_id ?? v.variant_id;
            if (!id || seen.has(id)) return;
            seen.add(id);
            unique.push({
                id,
                name: v.name || v.title || '',
                stock_quantity: v.stock_quantity ?? v.stock ?? 0,
                unlimited_quantity: v.unlimited_quantity ?? false,
            });
        });
        return unique;
    }, [isEditMode, product.variants_data, existingBatch]);

    const hasInitialSavedVariants = initialVariantCandidates.length > 0;

    useEffect(() => {
        if (optionsChecked || productQty === 0) return;

        const checkOptions = async () => {
            setVariantsLoading(true);

            if (hasInitialSavedVariants) {
                setVariants(initialVariantCandidates);
                setHasVariants(true);
                setOptionsAnswered(true);
                setVariantsLoaded(true);
                setVariantsLoading(false);
                setOptionsChecked(true);
                return;
            }

            if (localVariants && localVariants.length > 0) {
                setVariants(localVariants);
                setHasVariants(true);
                setOptionsAnswered(true);
                setVariantsLoaded(true);
                setVariantsLoading(false);
                setOptionsChecked(true);
                return;
            }

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
                        setOptionsAnswered(true);
                        await loadVariants();
                    } else {
                        setHasVariants(false);
                    }
                } else {
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
    }, [product.id, hasInitialSavedVariants, initialVariantCandidates]);

    useEffect(() => {
        if (isEditMode && existingBatch?.variants?.length > 0) {
            const loaded = existingBatch.variants.map(v => ({
                salla_variant_id: v.salla_variant_id || v.variant_id,
                variant_quantity: String(v.variant_quantity ?? v.quantity ?? ''),
                name: v.name || '',
                stock_quantity: v.stock_quantity ?? 0,
                unlimited_quantity: v.unlimited_quantity ?? false,
            }));
            setBatchVariants(loaded);
            batchVariantsRef.current = loaded;
        }
    }, [isEditMode]);

    const loadVariants = async () => {
        if (hasInitialSavedVariants || variants.length > 0) {
            setVariantsLoaded(true);
            setVariantsLoading(false);
            return;
        }

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

    const variantTemplate = useMemo(() => {
        if (!variants || variants.length === 0) return [];
        return variants.map(v => ({
            salla_variant_id: v.id,
            variant_quantity: isEditMode ? '' : String(v.stock_quantity ?? 0),
            name: v.name,
            stock_quantity: v.unlimited_quantity ? 999999 : v.stock_quantity,
            unlimited_quantity: v.unlimited_quantity,
        }));
    }, [variants, isEditMode]);

    useEffect(() => {
        if (!variantsLoaded || !hasVariants || variants.length === 0) return;
        if (!totalQty || parseInt(totalQty) <= 0 || !expiryDate) return;
        if (isEditMode && batchVariants.length > 0) return;

        if (batchVariants.length === 0) {
            const initial = batchVariantsRef.current.length > 0
                ? batchVariantsRef.current
                : variantTemplate;
            setBatchVariants(initial);
            batchVariantsRef.current = initial;
        }
    }, [variantsLoaded, hasVariants, variants, totalQty, expiryDate, isEditMode]);

    const qtyNum = parseInt(totalQty) || 0;
    const isFormInvalid = useMemo(() => {
        if (isSaving || variantsLoading || !optionsAnswered) return true;
        if (!totalQty || qtyNum <= 0 || !expiryDate || expiryDate < today) return true;

        if (hasVariants && variants.length > 0) {
            if (!variantsLoaded) return true;
            const total = batchVariants.reduce((s, v) => s + (parseInt(v.variant_quantity) || 0), 0);
            if (total !== qtyNum) return true;
        }

        return false;
    }, [isSaving, variantsLoading, optionsAnswered, totalQty, qtyNum, expiryDate, today, hasVariants, variants.length, variantsLoaded, batchVariants]);

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
            if (data.success && data.variants) setVariants(data.variants);
            setVariantsLoaded(true);
        } catch {
            setVariantsLoaded(true);
            toast.error('فشل تحديث الـ variants', { duration: 3000 });
        } finally {
            setVariantsLoading(false);
        }
    };

    const handleDeleteAll = async () => {
        const confirmed = window.confirm(
            'Are you sure you want to delete the batch for this product? This action cannot be undone.'
        );
        if (!confirmed) return;

        setError(null);
        setIsDeleting(true);

        try {
            if (!isEditMode) {
                setExpiryDate('');
                setTotalQty('');
                setBatchVariants([]);
                batchVariantsRef.current = [];
                setIsDeleting(false);
                onClose();
                setTimeout(() => toast.success(t('expiry_modal.toast_deleted'), { duration: 3000 }), 100);
                return;
            }

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
                setError(data.message || t('expiry_modal.err_delete_failed'));
                setIsDeleting(false);
                return;
            }

            onSave(product.id, { reset: true });
            queryClient.invalidateQueries({ queryKey: ['harees', 'dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['harees', 'products'] });
            onClose();
            setTimeout(() => toast.success(t('expiry_modal.toast_deleted'), { duration: 3000 }), 100);
        } catch {
            setError(t('expiry_modal.err_connection'));
            setIsDeleting(false);
        }
    };

    const validate = () => {
        const errors = {};
        if (!totalQty || qtyNum <= 0) errors.qty = 'Quantity must be greater than 0';
        if (!expiryDate) errors.date = 'required';
        else if (expiryDate < today) errors.date = 'past';

        if (Object.keys(errors).length) {
            setFieldErrors(errors);
            return 'Please fix the highlighted fields';
        }

        if (hasVariants && variants.length > 0) {
            const total = batchVariants.reduce((s, v) => s + (parseInt(v.variant_quantity) || 0), 0);
            if (total !== qtyNum)
                return `Distributed qty (${total}) must equal total qty (${qtyNum})`;

            for (const v of batchVariants) {
                const q = parseInt(v.variant_quantity) || 0;
                if (q > 0 && !v.unlimited_quantity && q > v.stock_quantity)
                    return `Qty for ${v.name} exceeds available stock (${v.stock_quantity})`;
            }
        }

        return null;
    };

    const handleSave = async () => {
        setError(null);
        const err = validate();
        if (err) { setError(err); return; }

        setIsSaving(true);

        const payload = {
            product_id: product.id,
            expiry_date: expiryDate,
            total_qty: qtyNum,
        };

        if (hasVariants && variants.length > 0) {
            const filledVariants = batchVariants.filter(v => v.variant_quantity && parseInt(v.variant_quantity) > 0);
            if (filledVariants.length > 0) {
                payload.variants = filledVariants.map(v => ({
                    variant_id: v.salla_variant_id,
                    variant_qty: parseInt(v.variant_quantity),
                }));
            }
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
                setError(data.message || t('expiry_modal.err_save_failed'));
                setIsSaving(false);
                return;
            }
            onSave(product.id, data);
            onClose();
            toast.success(
                isEditMode ? t('expiry_modal.toast_updated') : t('expiry_modal.toast_added'),
                { duration: 3000 }
            );
        } catch {
            setError(t('expiry_modal.err_connection'));
            setIsSaving(false);
        }
    };

    if (productQty === 0) {
        return createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                <div className="relative w-full max-w-sm bg-[var(--card)] border border-[var(--border)] rounded-[24px] shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3.5 md:p-5 border-b border-[var(--border)]">
                        <div className="w-10 h-10 rounded-xl bg-[var(--secondary)] flex items-center justify-center text-[var(--primary)]">
                            <CalendarPlus size={20} />
                        </div>
                        <div className="flex-1 text-start">
                            <h3 className="text-sm font-bold text-[var(--foreground)]">{t('expiry_modal.zero_title')}</h3>
                            <p className="text-[11px] text-[var(--muted-foreground)]">{product.name}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors text-[var(--foreground)]">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="p-6 md:p-8 flex flex-col items-center text-center space-y-5">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--secondary)] flex items-center justify-center">
                            <Package size={28} className="text-[var(--primary)]" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-black text-[var(--foreground)]">{t('expiry_modal.zero_no_stock_title')}</p>
                            <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                                {t('expiry_modal.zero_no_stock_body')}
                            </p>
                        </div>
                        <a
                            href={sallaProductsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 md:py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-[var(--primary)] text-white flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
                        >
                            <ShoppingBag size={15} />
                            {t('expiry_modal.zero_go_to_salla')}
                            <ExternalLink size={13} className="opacity-70" />
                        </a>
                        <button
                            onClick={onClose}
                            className="text-[11px] font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                        >
                            {t('expiry_modal.zero_close')}
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        );
    }

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <style>{dateInputStyle}</style>
            <div className="relative w-full max-w-lg bg-[var(--card)] border border-[var(--border)] rounded-[24px] shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">

                <div className="flex items-center gap-3 px-4 py-3.5 md:p-5 border-b border-[var(--border)]">
                    <div className="w-10 h-10 rounded-xl bg-[var(--secondary)] flex items-center justify-center text-[var(--primary)]">
                        <CalendarPlus size={20} />
                    </div>
                    <div className="flex-1 text-start">
                        <h3 className="text-sm font-bold text-[var(--foreground)]">
                            {isEditMode ? t('expiry_modal.modal_title_edit') : t('expiry_modal.modal_title_add')}
                        </h3>
                        <p className="text-[11px] text-[var(--muted-foreground)]">{product.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors text-[var(--foreground)]">
                        <X size={16} />
                    </button>
                </div>

                <div className="px-4 py-4 md:p-6 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">

                    {!optionsChecked && variantsLoading && (
                        <div className="flex items-center justify-center py-8 gap-2">
                            <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-bold text-[var(--muted-foreground)]">
                                {t('expiry_modal.spinner_checking')}
                            </span>
                        </div>
                    )}

                    {optionsChecked && hasVariants === false && !optionsAnswered && (
                        <div className="p-3 md:p-4 rounded-2xl bg-[var(--accent)]/10 border border-[var(--primary)]/15 space-y-3">
                            <div className="flex items-start gap-3">
                                <Layers size={20} className="text-[var(--primary)] flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-[var(--foreground)]">{t('expiry_modal.question_title')}</p>
                                    <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
                                        {t('expiry_modal.question_subtitle')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => window.open(sallaProductsUrl, '_blank')}
                                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[var(--secondary)] text-[var(--primary)] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                                >
                                    <ExternalLink size={14} />
                                    {t('expiry_modal.question_yes')}
                                </button>
                                <button
                                    onClick={() => {
                                        setOptionsAnswered(true);
                                        setVariantsLoaded(true);
                                    }}
                                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[var(--muted)] text-[var(--muted-foreground)] hover:opacity-80 transition-opacity"
                                >
                                    {t('expiry_modal.question_no')}
                                </button>
                            </div>
                        </div>
                    )}

                    {optionsAnswered && (
                        <>
                            <div className="flex items-center gap-3 px-3 py-2.5 md:px-4 md:py-3 rounded-2xl bg-[var(--accent)]/10 border border-[var(--primary)]/15">
                                <Package size={16} className="text-[var(--primary)] flex-shrink-0" />
                                <div>
                                    <p className="text-[10px] font-black text-[var(--primary)] uppercase tracking-wide">
                                        {t('expiry_modal.stock_label')}
                                    </p>
                                    <p className="text-sm font-bold text-[var(--foreground)]">
                                        {productQty} {t('expiry_modal.stock_unit')}
                                    </p>
                                </div>
                            </div>

                            <div className="p-3 md:p-4 rounded-2xl bg-[var(--accent)]/5 border border-[var(--border)] space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-[var(--muted-foreground)] uppercase tracking-wide">
                                        {t('expiry_modal.field_quantity')}
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        min="1"
                                        value={totalQty}
                                        onChange={e => setTotalQty(e.target.value.replace(/[^0-9]/g, ''))}
                                        onKeyDown={e => ['-', '+', 'e', 'E', '.'].includes(e.key) && e.preventDefault()}
                                        className={`w-full p-2 md:p-2.5 rounded-xl text-xs font-bold outline-none transition-colors border bg-[var(--background)] text-[var(--foreground)] ${
                                            fieldErrors.qty
                                                ? 'border-[var(--status-expired-text)] bg-[var(--status-expired-bg)] ring-1 ring-[var(--status-expired-text)]/30'
                                                : 'border-[var(--border)] focus:border-[var(--primary)]'
                                        }`}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-[var(--muted-foreground)] uppercase tracking-wide">
                                        {t('expiry_modal.field_expiry_date')}
                                    </label>
                                    <input
                                        type="date"
                                        value={expiryDate}
                                        min={today}
                                        onChange={e => setExpiryDate(e.target.value)}
                                        className={`w-full p-2 md:p-2.5 rounded-xl text-xs outline-none transition-colors border bg-[var(--background)] text-[var(--foreground)] ${
                                            fieldErrors.date
                                                ? 'border-[var(--status-expired-text)] bg-[var(--status-expired-bg)] ring-1 ring-[var(--status-expired-text)]/30'
                                                : 'border-[var(--border)] focus:border-[var(--primary)]'
                                        }`}
                                    />
                                    {fieldErrors.date === 'past' && (
                                        <p className="text-[9px] font-bold text-[var(--status-expired-text)]">{t('expiry_modal.err_date_past')}</p>
                                    )}
                                </div>
                            </div>

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

                            {hasVariants && variantsLoaded && variants.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-[var(--primary)]">
                                            {t('expiry_modal.variant_panel_prefix') || 'Variant Distribution'}
                                        </span>
                                        <span className={`text-[10px] font-bold ${
                                            batchVariants.reduce((s, v) => s + (parseInt(v.variant_quantity) || 0), 0) !== qtyNum
                                                ? 'text-[var(--status-expired-text)]'
                                                : 'text-[var(--status-safe-text)]'
                                        }`}>
                                            {batchVariants.reduce((s, v) => s + (parseInt(v.variant_quantity) || 0), 0)} / {qtyNum}
                                        </span>
                                    </div>
                                    {variants.filter(v => v.name || v.sku).map(variant => {
                                        const linked = batchVariants.find(v => v.salla_variant_id === variant.id);
                                        return (
                                            <div key={variant.id} className="flex items-center gap-2 p-2 md:p-2.5 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-[var(--foreground)] truncate">
                                                        {variant.name || variant.sku || `(${variant.id})`}
                                                    </p>
                                                    <p className={`text-[9px] ${variant.unlimited_quantity ? 'text-[var(--status-safe-text)]' : 'text-[var(--muted-foreground)]'}`}>
                                                        {t('expiry_modal.variant_stock_label')}{' '}
                                                        {variant.unlimited_quantity ? t('expiry_modal.variant_stock_unlimited') : variant.stock_quantity}
                                                    </p>
                                                </div>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    min="0"
                                                    max={variant.unlimited_quantity ? 99999 : variant.stock_quantity}
                                                    value={linked?.variant_quantity || ''}
                                                    onChange={e => {
                                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                                        setBatchVariants(prev => {
                                                            const updated = prev.map(v =>
                                                                v.salla_variant_id === variant.id
                                                                    ? { ...v, variant_quantity: val }
                                                                    : v
                                                            );
                                                            if (!prev.find(v => v.salla_variant_id === variant.id)) {
                                                                updated.push({
                                                                    salla_variant_id: variant.id,
                                                                    variant_quantity: val,
                                                                    name: variant.name,
                                                                    stock_quantity: variant.stock_quantity,
                                                                    unlimited_quantity: variant.unlimited_quantity,
                                                                });
                                                            }
                                                            batchVariantsRef.current = updated;
                                                            return updated;
                                                        });
                                                    }}
                                                    className="w-16 md:w-20 p-1 md:p-1.5 rounded-lg text-xs font-bold text-center border bg-[var(--card)] text-[var(--foreground)] outline-none focus:border-[var(--primary)] border-[var(--border)]"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {isEditMode && (
                                <button
                                    onClick={handleDeleteAll}
                                    disabled={isDeleting}
                                    className="w-full py-2 rounded-xl text-[10px] font-bold text-[var(--status-expired-text)] bg-[var(--status-expired-bg)] border border-[var(--status-expired-border)] flex items-center justify-center gap-1.5 hover:brightness-95 transition-all"
                                >
                                    <Trash2 size={12} />
                                    {isDeleting ? t('expiry_modal.btn_clearing') : t('expiry_modal.btn_clear_all')}
                                </button>
                            )}

                            {error && (
                                <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--status-expired-bg)] border border-[var(--status-expired-border)] text-[var(--status-expired-text)] text-[11px] font-bold">
                                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                                    {error}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="px-4 py-4 md:p-5 border-t border-[var(--border)] bg-[var(--card)]">
                    <button
                        onClick={handleSave}
                        disabled={isFormInvalid}
                        className={`w-full py-2 md:py-3.5 rounded-xl md:rounded-2xl text-[11px] md:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                            isFormInvalid
                                ? 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed'
                                : 'bg-[var(--primary)] text-white hover:opacity-90 active:scale-[0.98]'
                        }`}
                    >
                        {isSaving ? (
                            <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> {t('expiry_modal.btn_saving')}</>
                        ) : variantsLoading ? (
                            <>{t('expiry_modal.btn_checking_options') || 'Checking options...'}</>
                        ) : (
                            isEditMode ? t('expiry_modal.btn_update') : t('expiry_modal.btn_save')
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
