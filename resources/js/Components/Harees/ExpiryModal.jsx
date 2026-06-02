/**
 * @file ExpiryModal.jsx
 * @module Components/Harees
 *
 * @description
 * Full-screen portal modal for adding or editing expiry batch information
 * for a single Harees-monitored product.
 *
 * Two render paths:
 *  1. Zero-quantity screen — rendered when `product.quantity === 0`.
 *     Shows an empty-state with a link to Salla to add stock first.
 *  2. Main modal — the full batch management form.
 *
 * Variant detection flow (runs on mount):
 *  a. Call `/check-options` to detect Salla product variants.
 *  b. Variants exist  → load them silently and unlock the form immediately.
 *  c. No variants     → show a question card asking the merchant whether the
 *     product has options (e.g. size / colour). The form is locked behind
 *     this gate (`optionsAnswered`) to prevent incorrect data entry.
 *  d. API / network error → fail gracefully, show form without variants.
 *
 * Key state groups:
 *  - Core form        : `batches`, `isSaving`, `error`, `fieldErrors`
 *  - Deletion         : `isDeleting`
 *  - Variant / option : `variants`, `variantsLoading`, `variantsLoaded`,
 *                       `optionsChecked`, `hasVariants`, `optionsAnswered`
 *  - Per-batch vars   : `batchVariants` — map keyed by local batch ID
 *
 * Both `handleDeleteAll` and `handleSave` use native `fetch` (not Axios)
 * because they must send the Laravel CSRF token read from the `<meta>` tag.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
    X, CalendarPlus, Trash2, PlusCircle, AlertCircle,
    Package, Layers, ExternalLink, ShoppingBag, ChevronDown, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

/**
 * Scoped CSS that forces the browser's native date-picker icon to respect the
 * active colour scheme (light / dark) without polluting the global stylesheet.
 * Injected via a `<style>` tag inside the portal — removed automatically when
 * the modal unmounts.
 *
 * @type {string}
 */
const dateInputStyle = `
  input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(0.3); opacity: 1; cursor: pointer;
  }
  :root[class~="dark"] input[type="date"]::-webkit-calendar-picker-indicator,
  .dark input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(1); opacity: 1;
  }
`;

/**
 * ExpiryModal
 *
 * Portal modal for adding or editing expiry batch data for a single product.
 * Mounted and unmounted by the parent (Products page) so form state resets
 * automatically between uses.
 *
 * @component
 *
 * @param {Object}   props
 * @param {Object}   props.product              - The product being edited.
 * @param {number}   props.product.id           - Used in all API endpoint paths.
 * @param {string}   props.product.name         - Shown in the modal header subtitle.
 * @param {number}   [props.product.quantity]   - Preferred total-stock field.
 * @param {number}   [props.product.dbQty]      - Fallback total-stock field.
 * @param {Array}    [props.product.batches]    - Existing batches → activates edit mode.
 * @param {Function} props.onClose              - Called to unmount the modal.
 * @param {Function} props.onSave               - Called after a successful save or delete.
 *                                               Save:   `(productId, data)`
 *                                               Delete: `(productId, { reset: true })`
 * @returns {JSX.Element} A React portal rendering into `document.body`.
 */
export default function ExpiryModal({ product, onClose, onSave }) {
    const { t } = useTranslation('harees');


    // ── Salla deep-link URL ──────────────────────────────────────────────────
    // Uses `salla_product_id` (the Salla platform ID, not the local DB id) to
    // land the merchant directly on the correct product edit page in their
    // Salla dashboard. Falls back to the products list when the ID is absent.
    const sallaProductsUrl = product?.salla_product_id
        ? `https://s.salla.sa/products/${product.salla_product_id}`
        : 'https://s.salla.sa/products';

    // ── React Query client ────────────────────────────────────────────────────
    // Used inside handleDeleteAll to directly invalidate both the products and
    // dashboard caches after a successful deletion, ensuring the Dashboard page
    // reflects the change immediately without depending on the parent's refetch.
    const queryClient = useQueryClient();

    // ── Core form state ───────────────────────────────────────────────────────
    // Batch shape: { id (local key), qty (string), date (string), batchId? (server ID) }
    const [batches, setBatches]         = useState([{ id: Date.now(), qty: '', date: '' }]);
    const [isSaving, setIsSaving]       = useState(false);
    const [error, setError]             = useState(null);
    const [isDeleting, setIsDeleting]         = useState(false);
    // Keys: batchId (qty error) and batchId+'_date' (date error)
    const [fieldErrors, setFieldErrors] = useState({});

    // ── Variant / options state ───────────────────────────────────────────────
    const [variants, setVariants]               = useState([]);
    const [variantsLoading, setVariantsLoading] = useState(false);
    const [variantsLoaded, setVariantsLoaded]   = useState(false);
    const [optionsChecked, setOptionsChecked]   = useState(false);
    // null = unknown | true = has salla variants | false = no salla variants
    const [hasVariants, setHasVariants]         = useState(null);
    // false = waiting for merchant answer (only when hasVariants===false)
    // true  = answered or product already had variants → form is unlocked
    const [optionsAnswered, setOptionsAnswered] = useState(false);

    // Per-batch variant qty map: { [batchId]: [{ salla_variant_id, variant_quantity, ... }] }
    // This state is populated once from existing data (edit mode) or from stock (create mode)
    // and only updated via explicit user input — never overwritten on rerender.
    const [batchVariants, setBatchVariants] = useState({});
    const batchVariantsRef = useRef({});

    // ── Derived values ──
    const localVariants = product.variants_data || [];
    const totalQty        = product.quantity ?? product.dbQty ?? 0;
    const hasBatches      = product.batches && product.batches.length > 0;
    const today           = new Date().toISOString().split('T')[0];
    const usedQty         = batches.reduce((sum, b) => sum + (Number(b.qty) || 0), 0);
    const remainingQty    = totalQty - usedQty;
    const allDistributed  = remainingQty === 0 && usedQty > 0;
    const isOverLimit     = usedQty > totalQty;
    // Clamped to 100 so the bar never visually overflows its container
    const progressPercent = totalQty > 0 ? Math.min((usedQty / totalQty) * 100, 100) : 0;

    /**
     * isBatchReady
     * A batch unlocks its variant sub-panel only once both qty and date are valid.
     *
     * @param {{ qty: string, date: string }} b
     * @returns {boolean}
     */
    const isBatchReady = (b) => b.qty && parseInt(b.qty) > 0 && !!b.date;

    /**
     * getCsrfToken
     * Reads the Laravel CSRF token injected by Blade into the document `<head>`.
     * Required for all state-mutating requests made via native `fetch`.
     *
     * @returns {string|undefined}
     */
    const getCsrfToken = () => document.querySelector('meta[name="csrf-token"]')?.content;

    // ── Effect: populate form with existing batches (edit mode) ───────────────
    // Maps the server batch shape to the lean local shape used by the form.
    // Also loads existing variant distribution from saved batch_items.
    useEffect(() => {
        if (!hasBatches) return;

        const mappedBatches = product.batches.map(b => ({
            id:      b.id,
            qty:     b.quantity ?? b.qty ?? '',
            date:    b.expiry_date || b.expiryDate || '',
            batchId: b.id,   // preserved so the save payload can send UPDATE vs CREATE
        }));
        setBatches(mappedBatches);

        // Load existing variant distribution for each batch (edit mode)
        const existingVariants = {};
        product.batches.forEach(b => {
            if (b.variants && b.variants.length > 0) {
                existingVariants[b.id] = b.variants.map(v => ({
                    batch_id: b.id,
                    salla_variant_id: v.salla_variant_id,
                    variant_quantity: String(v.variant_quantity ?? v.quantity ?? ''),
                    name: v.name ?? '',
                    stock_quantity: v.stock_quantity ?? 0,
                    unlimited_quantity: v.unlimited_quantity ?? false,
                }));
            }
        });
        if (Object.keys(existingVariants).length > 0) {
            setBatchVariants(existingVariants);
            batchVariantsRef.current = existingVariants;
        }
    }, [hasBatches, product.batches]);

    // ── Effect: check-options on mount ────────────────────────────────────────
    // Decision tree:
    //   has_variants = true  → loadVariants() silently, skip question card
    //   has_variants = false → show question card, block form (`optionsAnswered=false`)
    //   API / catch          → skip variants, show form regardless
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
                        Accept:             'application/json',
                        'X-CSRF-TOKEN':     getCsrfToken(),
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
                    // API returned success:false → degrade gracefully
                    setOptionsAnswered(true);
                    setVariantsLoaded(true);
                }
            } catch {
                // Network failure → degrade gracefully
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

    /**
     * loadVariants
     *
     * Fetches the Salla product variants after `check-options` confirms they exist.
     * Called automatically — no user interaction needed.
     *
     * @async
     * @returns {Promise<void>}
     */
    const loadVariants = async () => {
        try {
            const res = await fetch(`/harees/api/products/${product.id}/variants`, {
                headers: {
                    Accept:             'application/json',
                    'X-CSRF-TOKEN':     getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
            });
            const data = await res.json();
            if (data.success && data.variants) setVariants(data.variants);
            setVariantsLoaded(true);
        } catch {
            // Fail silently — the form still works without the variants panel
            setVariantsLoaded(true);
        }
    };

    const variantTemplate = useMemo(() => {
        if (!variants || variants.length === 0) return [];
        return variants.map(v => ({
            salla_variant_id: v.id,
            // ✅ Auto-fill from real Salla stock_quantity as initial value
            // التاجر يستطيع تعديلها بعد ذلك
            variant_quantity: hasBatches ? '' : String(v.stock_quantity ?? 0),
            name: v.name,
            stock_quantity: v.unlimited_quantity ? 999999 : v.stock_quantity,
            unlimited_quantity: v.unlimited_quantity,
        }));
    }, [variants, hasBatches]);

    const initializeBatchVariants = useCallback((batchId) => {
        // ✅ Use existing saved data if available (edit mode), never overwrite
        const existing = batchVariantsRef.current[batchId];
        if (existing && existing.length > 0) {
            return existing.map(v => ({
                ...v,
                variant_quantity: v.variant_quantity ?? '',
            }));
        }
        return variantTemplate.map(v => ({
            batch_id: batchId,
            ...v,
        }));
    }, [variantTemplate]);

    // ✅ Stable effect: once variants are loaded and batches are ready,
    // populate batchVariants state for any batch that doesn't have it yet.
    // This runs once per batch and never overwrites existing user edits.
    useEffect(() => {
        if (!variantsLoaded || !hasVariants || variants.length === 0) return;
        if (batches.length === 0) return;

        setBatchVariants(prev => {
            const next = { ...prev };
            let changed = false;
            batches.forEach(batch => {
                const batchId = batch.id;
                if (!next[batchId]) {
                    // Only initialize if this batch has qty + date filled
                    if (batch.qty && parseInt(batch.qty) > 0 && !!batch.date) {
                        next[batchId] = initializeBatchVariants(batchId);
                        changed = true;
                    }
                }
            });
            if (changed) {
                batchVariantsRef.current = next;
                return next;
            }
            return prev; // Return same reference if nothing changed
        });
    }, [variantsLoaded, hasVariants, variants, batches, initializeBatchVariants]);

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

    // ── Delete all batches ────────────────────────────────────────────────────

    /**
     * handleDeleteAll
     *
     * Sends a DELETE request to wipe all expiry batches for this product.
     *
     * Flow:
     *  1. Show a native browser confirmation dialog — bail out if the merchant
     *     cancels, so no accidental deletions occur.
     *  2. On approval, call the DELETE endpoint (edit mode) or clear local state (create mode).
     *  3. Notify the parent to bust the React Query cache (`onSave`).
     *  4. Close the modal immediately (`onClose`).
     *  5. After a 100 ms delay, fire the success toast so it renders cleanly
     *     over the now-visible inventory table rather than inside the modal layer.
     *
     * @async
     * @returns {Promise<void>}
     */
    const handleDeleteAll = async () => {
        // تأكيد من التاجر قبل أي عملية
        const confirmed = window.confirm(
            'Are you sure you want to delete all batches for this product? This action cannot be undone.'
        );
        if (!confirmed) return;

        setError(null);
        setIsDeleting(true);

        try {
            // وضع الإنشاء: لا يوجد شيء في الداتابيس — امسح local state فقط
            if (!hasBatches) {
                setBatches([]);
                setBatchVariants({});
                batchVariantsRef.current = {};
                setIsDeleting(false);
                onClose();
                setTimeout(() => toast.success(t('expiry_modal.toast_deleted'), { duration: 3000 }), 100);
                return;
            }

            // وضع التعديل: كلّم DELETE API لحذف من الداتابيس
            const res = await fetch(`/harees/api/expiry/${product.id}`, {
                method: 'DELETE',
                headers: {
                    Accept:             'application/json',
                    'X-CSRF-TOKEN':     getCsrfToken(),
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

            // أبلغ الـ parent فوراً — يُحدّث local state للمنتج
            onSave(product.id, { reset: true });

            // invalidate الـ cache في React Query
            // invalidateQueries وحده يعلّم المشترك النشط بأن البيانات قديمة
            // ويُرسل refetch فوري لكل صفحة مفتوحة
            await queryClient.invalidateQueries({ queryKey: ['harees', 'products'],  refetchType: 'all' });
            await queryClient.invalidateQueries({ queryKey: ['harees', 'dashboard'], refetchType: 'all' });

            // أغلق المودال فوراً
            onClose();

            // اعرض التوست بعد إغلاق المودال بـ 100ms
            // حتى يظهر فوق الجدول مش تحت المودال
            setTimeout(() => toast.success(t('expiry_modal.toast_deleted'), { duration: 3000 }), 100);

        } catch {
            setError(t('expiry_modal.err_connection'));
            setIsDeleting(false);
        }
    };

    // ── Validation ────────────────────────────────────────────────────────────

    /**
     * validate
     *
     * Runs field-level and business-rule validation before submission.
     * Populates `fieldErrors` so inputs highlight inline, then returns a single
     * summary string for the footer alert (or `null` when everything is valid).
     *
     * Order:
     *  1. At least one batch must exist.
     *  2. Each batch: qty > 0, date present and in the future.
     *  3. Total assigned qty ≤ totalQty.
     *  4. All stock distributed (usedQty === totalQty).
     *  5. Per-variant quantities within stock limits and summing to batch qty.
     *
     * @returns {string|null}
     */
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
        if (isOverLimit)        return `Exceeds available stock (${totalQty}).`;
        if (usedQty < totalQty) return `${totalQty - usedQty} unit(s) unassigned — all stock must be distributed`;

        // Variant validation — only when the product has Salla variants
        if (hasVariants && variants.length > 0) {
            const variantErrors = {};
            for (let i = 0; i < batches.length; i++) {
                const batch       = batches[i];
                const batchQtyNum = parseInt(batch.qty) || 0;
                const batchLinked = batchVariants[batch.id] || [];
                const batchTotal  = batchLinked.reduce((s, v) => s + (parseInt(v.variant_quantity) || 0), 0);

                // Flag rows whose qty exceeds the variant's available stock
                batchLinked.forEach(v => {
                    const q = parseInt(v.variant_quantity) || 0;
                    if (q > 0 && !v.unlimited_quantity && q > v.stock_quantity)
                        variantErrors[`batch_${batch.id}_variant_${v.salla_variant_id}`] = 'Exceeds available stock';
                });

                // Variant totals must exactly match the batch qty when quantities are entered
                if (batchTotal > 0 && batchTotal !== batchQtyNum)
                    return `Batch ${i + 1}: distributed qty (${batchTotal}) must equal batch qty (${batchQtyNum})`;
            }
            if (Object.keys(variantErrors).length) {
                setFieldErrors(p => ({ ...p, ...variantErrors }));
                return 'Some option quantities exceed available stock';
            }
        }

        return null; // All validations passed
    };

    // ── Save ──────────────────────────────────────────────────────────────────

    /**
     * handleSave
     *
     * Validates the form, constructs the API payload, and submits it.
     * `batch_variants` is appended to the payload only when the product has
     * variants with at least one filled quantity.
     *
     * @async
     * @returns {Promise<void>}
     */
    const handleSave = async () => {
        setError(null);
        const err = validate();
        if (err) { setError(err); return; }

        setIsSaving(true);

        // Core payload — always present
        const payload = {
            product_id:  product.id,
            same_expiry: false,
            batches: batches.map(b => ({
                // ✅ FIX: Use server ID (batchId) if editing, otherwise use the local React ID (b.id = Date.now())
                // هذا يضمن تطابق id الباتش مع batch_id في batch_variants عند إنشاء Batch جديد
                id:          b.batchId || b.id,   // number = update existing, temp ID = new
                quantity:    parseInt(b.qty),
                expiry_date: b.date,
                batch_code:  b.batchId ? undefined : null,
            })),
        };

        // Optional variant distribution block
        if (hasVariants && variants.length > 0) {
            const allBatchVariants = [];
            batches.forEach(batch => {
                // Only include variants with a quantity entered
                const linked = (batchVariants[batch.id] || []).filter(
                    v => v.variant_quantity && parseInt(v.variant_quantity) > 0
                );
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
                    'Content-Type':     'application/json',
                    Accept:             'application/json',
                    'X-CSRF-TOKEN':     getCsrfToken(),
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
            // Notify parent → bust cache, close modal, then show toast
            onSave(product.id, data);
            onClose();
            toast.success(
                hasBatches ? t('expiry_modal.toast_updated') : t('expiry_modal.toast_added'),
                { duration: 3000 }
            );
        } catch {
            setError(t('expiry_modal.err_connection'));
            setIsSaving(false);
        }
    };

    /**
     * updateBatch
     *
     * Updates one field on one batch entry with live cleanup:
     *  - Strips non-numeric chars from `qty` and enforces 6-digit max.
     *  - Clears both field errors for the affected batch on every keystroke
     *    so stale highlights disappear immediately.
     *
     * @param {number} id    - Local batch `id`.
     * @param {string} field - `'qty'` | `'date'`.
     * @param {string} value - Raw input value.
     */
    const updateBatch = (id, field, value) => {
        setError(null);
        let clean = field === 'qty' ? value.replace(/[^0-9]/g, '') : value;
        if (field === 'qty' && clean.length > 6) return;
        setFieldErrors(p => ({ ...p, [id]: undefined, [id + '_date']: undefined }));
        setBatches(p => p.map(b => b.id === id ? { ...b, [field]: clean } : b));
    };

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER PATH 1: Zero-quantity empty-state screen
    // ─────────────────────────────────────────────────────────────────────────
    if (totalQty === 0) {
        return createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                <div className="relative w-full max-w-[420px] bg-[var(--card)] border border-[var(--border)] rounded-[24px] shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
                    <div className="flex items-center gap-3 p-5 border-b border-[var(--border)]">
                        <div className="w-10 h-10 rounded-xl bg-[var(--secondary)] flex items-center justify-center text-[var(--primary)]">
                            <CalendarPlus size={20} />
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="text-sm font-bold text-[var(--foreground)]">{t('expiry_modal.zero_title')}</h3>
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
                            <p className="text-sm font-black text-[var(--foreground)]">{t('expiry_modal.zero_no_stock_title')}</p>
                            <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                                {t('expiry_modal.zero_no_stock_body')}
                            </p>
                        </div>
                        {/* Deep link into the merchant's Salla products dashboard to add stock.
                            Uses the unified shortlink `s.salla.sa/products` which works
                            regardless of whether the store has a custom domain. */}
                        <a
                            href={sallaProductsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-[var(--primary)] text-white flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
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

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER PATH 2: Main batch management modal
    // ─────────────────────────────────────────────────────────────────────────
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            {/* Scoped date-picker colour-scheme fix */}
            <style>{dateInputStyle}</style>
            <div className="relative w-full max-w-[500px] bg-[var(--card)] border border-[var(--border)] rounded-[24px] shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">

                {/* ── Header ────────────────────────────────────────────────── */}
                <div className="flex items-center gap-3 p-5 border-b border-[var(--border)]">
                    <div className="w-10 h-10 rounded-xl bg-[var(--secondary)] flex items-center justify-center text-[var(--primary)]">
                        <CalendarPlus size={20} />
                    </div>
                    <div className="flex-1 text-left">
                        {/* Title switches between Add and Edit based on whether batches already exist */}
                        <h3 className="text-sm font-bold text-[var(--foreground)]">
                            {hasBatches ? t('expiry_modal.modal_title_edit') : t('expiry_modal.modal_title_add')}
                        </h3>
                        <p className="text-[11px] text-[var(--muted-foreground)]">{product.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors text-[var(--foreground)]">
                        <X size={16} />
                    </button>
                </div>

                {/* ── Scrollable body ────────────────────────────────────────── */}
                <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">

                    {/* State A: Initial options-check spinner
                        Shown before `optionsChecked` resolves — user sees
                        something immediately rather than a blank modal. */}
                    {!optionsChecked && variantsLoading && (
                        <div className="flex items-center justify-center py-8 gap-2">
                            <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-bold text-[var(--muted-foreground)]">
                                {t('expiry_modal.spinner_checking')}
                            </span>
                        </div>
                    )}

                    {/* State B: Question card — shown when no Salla variants were detected.
                        Gating the form here forces the merchant to consciously choose
                        before they accidentally mix variant / non-variant data. */}
                    {optionsChecked && hasVariants === false && !optionsAnswered && (
                        <div className="p-4 rounded-2xl bg-[var(--accent)]/10 border border-[var(--primary)]/15 space-y-3">
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
                                {/* "Yes" → merchant goes to their Salla products dashboard to add options, then returns */}
                                <button
                                    onClick={() => window.open(sallaProductsUrl, '_blank')}
                                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[var(--secondary)] text-[var(--primary)] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                                >
                                    <ExternalLink size={14} />
                                    {t('expiry_modal.question_yes')}
                                </button>
                                {/* "No" → skip variants, unlock the main form */}
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

                    {/* State C: Variant-list loading spinner
                        Shown after auto-detect confirms variants exist but before
                        the /variants endpoint has returned. */}
                    {optionsChecked && hasVariants === true && variantsLoading && (
                        <div className="flex items-center justify-center py-4 gap-2">
                            <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-bold text-[var(--muted-foreground)]">
                                {t('expiry_modal.spinner_loading')}
                            </span>
                        </div>
                    )}

                    {/* State D: Main form — unlocked only after `optionsAnswered` is true */}
                    {optionsAnswered && (
                        <>
                            {/* Available stock badge */}
                            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--accent)]/10 border border-[var(--primary)]/15">
                                <Package size={16} className="text-[var(--primary)] flex-shrink-0" />
                                <div>
                                    <p className="text-[10px] font-black text-[var(--primary)] uppercase tracking-wide">
                                        {t('expiry_modal.stock_label')}
                                    </p>
                                    <p className="text-sm font-bold text-[var(--foreground)]">
                                        {totalQty} {t('expiry_modal.stock_unit')}
                                    </p>
                                </div>
                            </div>

                            {/* Distribution progress bar
                                Colour: expired-red (over limit) → safe-green (fully distributed) → primary */}
                            <div className="p-4 rounded-2xl bg-[var(--accent)]/5 border border-[var(--border)] space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wide">
                                    <span className={
                                        isOverLimit      ? 'text-[var(--status-expired-text)]'
                                        : allDistributed ? 'text-[var(--status-safe-text)]'
                                        : 'text-[var(--primary)]'
                                    }>
                                        {isOverLimit
                                            ? `${t('expiry_modal.progress_exceeded')} ${usedQty - totalQty}`
                                            : allDistributed
                                                ? t('expiry_modal.progress_distributed')
                                                : `${remainingQty} ${t('expiry_modal.progress_remaining')}`}
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

                            {/* ── Refresh variants from basket ── */}
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
                                    <span className="text-[10px] font-black text-[var(--primary)]">
                                        {t('expiry_modal.section_title')}
                                    </span>
                                    <div className="flex gap-2">
                                        {/* Clear All: asks for browser confirmation then deletes */}
                                        {batches.length > 0 && (
                                            <button
                                                onClick={handleDeleteAll}
                                                disabled={isDeleting}
                                                className="text-[10px] font-bold text-[var(--status-expired-text)] bg-[var(--status-expired-bg)] px-2 py-1 rounded-lg hover:brightness-95 transition-all"
                                            >
                                                {isDeleting ? t('expiry_modal.btn_clearing') : t('expiry_modal.btn_clear_all')}
                                            </button>
                                        )}
                                        {/* Add Batch: appends a new empty entry */}
                                        <button
                                            onClick={() => setBatches(p => [...p, { id: Date.now(), qty: '', date: '' }])}
                                            className="text-[10px] font-bold text-[var(--primary)] bg-[var(--secondary)] px-2 py-1 rounded-lg flex items-center gap-1 hover:opacity-80 transition-opacity"
                                        >
                                            <PlusCircle size={10} /> {t('expiry_modal.btn_add_batch')}
                                        </button>
                                    </div>
                                </div>

                                {batches.map((batch, idx) => {
                                    // Variant sub-panel: shown only when qty+date filled AND variants loaded
                                    const batchReady   = isBatchReady(batch);
                                    const showVariants = batchReady && variantsLoaded && hasVariants && variants.length > 0;
                                    // Initialise variant list lazily on first render for this batch
                                    // ✅ Stable: always reads from batchVariants state (never calls initializeBatchVariants inline)
                                    const batchLinked   = batchVariants[batch.id] || [];
                                    const batchVarTotal = batchLinked.reduce((s, v) => s + (parseInt(v.variant_quantity) || 0), 0);
                                    const batchQtyNum   = parseInt(batch.qty) || 0;

                                    return (
                                        <div key={batch.id} className="space-y-0">

                                            {/* Batch card — top corners only rounded when variant panel is open below */}
                                            <div className={`p-4 ${showVariants ? 'rounded-t-xl' : 'rounded-xl'} border bg-[var(--card)] space-y-3 transition-colors ${
                                                (fieldErrors[batch.id] || fieldErrors[batch.id + '_date'])
                                                    ? 'border-[var(--status-expired-text)] ring-1 ring-[var(--status-expired-text)]/20'
                                                    : 'border-[var(--border)]'
                                            }`}>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[11px] font-bold text-[var(--foreground)]">
                                                        {t('expiry_modal.batch_label')} {idx + 1}
                                                    </span>
                                                    {/* Remove this batch from local state */}
                                                    <button
                                                        onClick={() => {
                                                            setBatches(p => p.filter(b => b.id !== batch.id));
                                                            setBatchVariants(p => { const n = { ...p }; delete n[batch.id]; delete batchVariantsRef.current[batch.id]; return n; });
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
                                                    {/* Quantity field
                                                        Blocks -/+/e/E/. keys to prevent invalid number strings */}
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-black text-[var(--muted-foreground)] uppercase tracking-wide">
                                                            {t('expiry_modal.field_quantity')}
                                                        </label>
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
                                                            <p className="text-[9px] font-bold text-[var(--status-expired-text)] mt-0.5">
                                                                {fieldErrors[batch.id]}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Expiry date field — `min={today}` blocks past dates in the picker */}
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] font-black text-[var(--muted-foreground)] uppercase tracking-wide">
                                                            {t('expiry_modal.field_expiry_date')}
                                                        </label>
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
                                                                {/* 'past' vs 'required' map to different user-facing messages */}
                                                                {fieldErrors[batch.id + '_date'] === 'past'
                                                                    ? t('expiry_modal.err_date_past')
                                                                    : t('expiry_modal.err_date_required')}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Variant distribution panel — flush below its batch card (no gap / border-top removed) */}
                                            {showVariants && (
                                                <div className="border border-t-0 border-[var(--border)] rounded-b-xl overflow-hidden bg-[var(--accent)]/5">
                                                    <div className="px-3 py-2 bg-[var(--secondary)]/30 border-b border-[var(--border)] flex justify-between items-center">
                                                        <div className="flex items-center gap-1.5">
                                                            <ChevronDown size={12} className="text-[var(--primary)]" />
                                                            <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-wide">
                                                                {t('expiry_modal.variant_panel_prefix')} {idx + 1}
                                                            </span>
                                                        </div>
                                                        {/* Running total vs batch qty — colour signals over / exact / under */}
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
                                                                        <p className="text-xs font-bold text-[var(--foreground)] truncate">
                                                                            {variant.name}
                                                                        </p>
                                                                        <p className={`text-[9px] ${variant.unlimited_quantity ? 'text-[var(--status-safe-text)]' : 'text-[var(--muted-foreground)]'}`}>
                                                                            {t('expiry_modal.variant_stock_label')}{' '}
                                                                            {variant.unlimited_quantity
                                                                                ? t('expiry_modal.variant_stock_unlimited')
                                                                                : variant.stock_quantity}
                                                                        </p>
                                                                        {hasError && (
                                                                            <p className="text-[9px] text-[var(--status-expired-text)]">{hasError}</p>
                                                                        )}
                                                                    </div>
                                                                    {/* Per-variant quantity input — non-negative integers only */}
                                                                    <input
                                                                        type="number"
                                                                        placeholder="0"
                                                                        min="0"
                                                                        max={variant.unlimited_quantity ? 99999 : variant.stock_quantity}
                                                                        value={linked?.variant_quantity || ''}
onChange={e => {
                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                            setBatchVariants(p => {
                                                const current = p[batch.id] || batchVariantsRef.current[batch.id] || [];
                                                const updated = current.map(v =>
                                                    v.salla_variant_id === variant.id
                                                        ? { ...v, variant_quantity: val }
                                                        : v
                                                );
                                                batchVariantsRef.current = { ...batchVariantsRef.current, [batch.id]: updated };
                                                return {
                                                    ...p,
                                                    [batch.id]: updated,
                                                };
                                            });
                                                                            // Clear this specific variant's error on change
                                                                            if (fieldErrors[`batch_${batch.id}_variant_${variant.id}`])
                                                                                setFieldErrors(p => {
                                                                                    const n = { ...p };
                                                                                    delete n[`batch_${batch.id}_variant_${variant.id}`];
                                                                                    return n;
                                                                                });
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

                            {/* Inline error alert — summary / server errors displayed below the batch list */}
                            {error && (
                                <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--status-expired-bg)] border border-[var(--status-expired-border)] text-[var(--status-expired-text)] text-[11px] font-bold">
                                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                                    {error}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* ── Footer / submit button ─────────────────────────────────── */}
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
                            /* Spinner via pure CSS border animation — no external library needed */
                            <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> {t('expiry_modal.btn_saving')}</>
                        ) : (
                            /* Label: Update (edit mode) vs Save (add mode) */
                            hasBatches ? t('expiry_modal.btn_update') : t('expiry_modal.btn_save')
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}