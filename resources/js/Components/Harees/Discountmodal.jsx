/**
 * @file DiscountModal.jsx
 * @module Components/Harees
 *
 * @description
 * Controlled modal dialog for manually applying or editing a timed discount
 * on a specific batch.  The modal handles its own field-level validation and
 * loading / success / error states independently from the parent.
 *
 * Responsibilities:
 *  - Distinguish between "Add Discount" (first time) and "Edit Discount"
 *    (updating an existing discount) via the `isEdit` prop.
 *  - Pre-populate the discount percentage field with `existingPct` when in
 *    edit mode so the merchant can see and adjust the current value.
 *  - Validate discount percentage (1–99) and end-date (must be future).
 *  - Delegate the actual API call to the `onApply` prop (supplied by BatchRow).
 *  - Pass `isEdit` back to `onApply` so BatchRow can surface the correct toast.
 *  - Display server-side errors inline without closing the modal.
 *  - Close automatically 1.2 s after a confirmed success.
 *
 * The parent (`BatchRow`) is responsible for closing the modal on its own
 * side; the `onClose` callback is called from both the ✕ button and after
 * the success animation timeout.
 */

import React, { useState } from 'react';
import { X, Percent, CheckCircle, Info, AlertCircle, Loader2, Edit } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * DiscountModal
 *
 * A full-screen overlay modal that lets the merchant configure and submit a
 * manual discount (or update an existing one) for a single batch.
 *
 * Design decisions:
 *  - `isEdit` switches title, submit button label, and icon between add / edit modes.
 *  - `existingPct` pre-populates the discount percentage field in edit mode.
 *  - A brief `isSuccess` state drives the button's green confirmation animation
 *    before the `onClose` timeout fires.
 *  - The modal does NOT close on server error; the error is displayed inline
 *    so the user can correct their input without re-opening the form.
 *
 * @component
 *
 * @param {Object}   props
 * @param {Object}   props.batch              - The batch receiving the discount.
 * @param {number}   props.batch.id           - Batch ID sent to the API.
 * @param {string}   [props.batch.batch_code] - Display label for the batch.
 * @param {string}   [props.batch.expiry_date]- Expiry date shown in the UI.
 * @param {Object}   props.product            - Parent product (used for the subtitle).
 * @param {string}   props.product.name       - Product display name.
 * @param {boolean}  [props.isEdit=false]     - True when updating an existing discount.
 * @param {number}   [props.existingPct=20]   - Current discount percentage (pre-populates
 *                                             the input in edit mode).
 * @param {Function} props.onClose            - Called to hide / unmount the modal.
 * @param {Function} props.onApply            - Async callback:
 *                                             `({ batchId, discountPct, endDate, isEdit }) → Promise<void>`.
 *                                             Must throw an `Error` with a `.message` on failure.
 * @returns {JSX.Element}
 */
export default function DiscountModal({
    batch,
    product,
    isEdit = false,
    existingPct = 20,
    onClose,
    onApply,
}) {
    const { t } = useTranslation('harees');
    // ── Form field state ──────────────────────────────────────────────────────
    // Pre-populate with the existing percentage in edit mode; default to "20".
    const [discountPct, setDiscountPct] = useState(isEdit ? String(existingPct) : '20');
    const [endDate, setEndDate]         = useState('');

    // ── Validation error state ────────────────────────────────────────────────
    const [pctError, setPctError]       = useState('');
    const [dateError, setDateError]     = useState('');

    // ── Async / feedback state ────────────────────────────────────────────────
    const [serverError, setServerError] = useState('');
    const [isLoading, setIsLoading]     = useState(false);
    const [isSuccess, setIsSuccess]     = useState(false);

    /**
     * Minimum valid date string (today's date in YYYY-MM-DD format).
     * Used as the `min` attribute on the date input and for validation.
     *
     * @type {string}
     */
    const todayStr = new Date().toISOString().split('T')[0];

    // ── Validation helpers ────────────────────────────────────────────────────

    /**
     * Validates the discount percentage field.
     *
     * @param {string} val - Current field value.
     * @returns {string} Error message, or empty string when valid.
     */
    const validatePct = (val) => {
        if (!val) return t('discount_modal.err_required');
        const num = parseInt(val, 10);
        if (isNaN(num) || num < 1 || num > 99) return t('discount_modal.err_pct_range');
        return '';
    };

    /**
     * Validates the end-date field; the date must be strictly in the future.
     *
     * @param {string} val - Current field value (YYYY-MM-DD).
     * @returns {string} Error message, or empty string when valid.
     */
    const validateDate = (val) => {
        if (!val) return t('discount_modal.err_required');
        if (val <= todayStr) return t('discount_modal.err_date_future');
        return '';
    };

    // ── Event handlers ────────────────────────────────────────────────────────

    /**
     * Strips non-numeric characters, re-normalises the integer string, and
     * updates validation in real time as the user types.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} e
     */
    const handlePctChange = (e) => {
        const clean      = e.target.value.replace(/[^\d]/g, '');
        const normalized = clean === '' ? '' : String(parseInt(clean, 10));
        setDiscountPct(normalized);
        setPctError(validatePct(normalized));
        setServerError(''); // Clear any previous server error on new input
    };

    /**
     * Updates end-date state and runs live validation.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} e
     */
    const handleDateChange = (e) => {
        setEndDate(e.target.value);
        setDateError(validateDate(e.target.value));
        setServerError(''); // Clear any previous server error on new input
    };

    /**
     * handleApply
     *
     * Runs full validation, then calls the `onApply` callback with `isEdit`
     * so the parent can show the correct success toast.
     * On success: briefly shows the green confirmation state, then closes.
     * On failure: displays the server error inline; modal remains open.
     *
     * @async
     */
    const handleApply = async () => {
        // Run both validations and surface errors before sending anything.
        const pErr  = validatePct(discountPct);
        const dErr  = validateDate(endDate);
        setPctError(pErr);
        setDateError(dErr);
        if (pErr || dErr) return;

        setIsLoading(true);
        setServerError('');

        try {
            await onApply({
                batchId:    batch.id,
                discountPct: parseInt(discountPct, 10),
                endDate,
                isEdit,    // ← forwarded so BatchRow can pick the right toast
            });

            // Briefly show the success state before the parent closes the modal.
            setIsSuccess(true);
            setTimeout(onClose, 1200);
        } catch (err) {
            // Keep the modal open and surface the server message inline.
            setServerError(err.message || t('discount_modal.err_generic'));
        } finally {
            setIsLoading(false);
        }
    };

    // ── Derived display values ────────────────────────────────────────────────
    const modalTitle  = isEdit ? t('discount_modal.modal_title_edit') : t('discount_modal.modal_title_add');
    const submitLabel = isEdit ? t('discount_modal.btn_edit_apply')   : t('discount_modal.btn_add_apply');
    const successMsg  = isEdit ? t('discount_modal.btn_updated')      : t('discount_modal.btn_applied');

    return (
        /* Full-screen overlay: clicking outside the card does NOT close the modal
           (intentional — prevents accidental loss of unsaved discount values). */
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg bg-[var(--card)] border border-[var(--border)] rounded-[24px] shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">

                {/* ── Header ────────────────────────────────────────────────── */}
                <div className="flex items-center gap-3 p-4 sm:p-5 border-b border-[var(--border)]">
                    <div className="w-10 h-10 rounded-xl bg-[var(--muted)] flex items-center justify-center text-[var(--primary)]">
                        {/* Edit icon in edit mode, Percent icon for new discounts */}
                        {isEdit ? <Edit size={20} /> : <Percent size={20} />}
                    </div>
                    <div className="flex-1 text-start">
                        <h3 className="text-sm font-bold text-[var(--foreground)]">
                            {modalTitle}
                        </h3>
                        {/* Product name doubles as the modal subtitle */}
                        <p className="text-[11px] text-[var(--muted-foreground)]">
                            {product?.name}
                        </p>
                    </div>
                    {/* Close button is disabled while a request is in-flight */}
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors disabled:opacity-40"
                    >
                        <X size={16} className="text-[var(--foreground)]" />
                    </button>
                </div>

                <div className="p-4 sm:p-6 space-y-5">

                    {/* ── Informational note ─────────────────────────────────── */}
                    <div className="flex items-start gap-2 p-4 rounded-2xl bg-[var(--accent)] border border-[var(--primary)]/10">
                        <Info size={14} className="text-[var(--primary)] mt-0.5 shrink-0" />
                        <p className="text-[11px] text-[var(--primary)] leading-relaxed">
                            <span className="font-black">{t('discount_modal.note_title')}</span> {t('discount_modal.note_body')}
                        </p>
                    </div>

                    {/* ── Server-side error banner ───────────────────────────── */}
                    {serverError && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={14} className="text-red-500 shrink-0" />
                            <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                                {serverError}
                            </p>
                        </div>
                    )}

                    {/* ── Form fields ────────────────────────────────────────── */}
                    <div className="p-5 rounded-2xl bg-[var(--muted)]/40 border border-[var(--primary)]/20 space-y-4">
                        <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-wider">
                            {t('discount_modal.section_title')}
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                            {/* Discount percentage input */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[9px] font-black text-[var(--muted-foreground)] uppercase tracking-tighter">
                                    {t('discount_modal.label_discount_pct')}
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={discountPct}
                                        onChange={handlePctChange}
                                        disabled={isLoading || isSuccess}
                                        className={`
                                            w-full p-3 pe-7 rounded-xl border
                                            text-[var(--foreground)] text-sm font-bold outline-none transition-all
                                            placeholder:text-[var(--muted-foreground)] focus:ring-2
                                            disabled:opacity-60 disabled:cursor-not-allowed
                                            ${pctError
                                                ? 'bg-red-50 dark:bg-red-950/20 border-red-500 focus:border-red-500 focus:ring-red-500/15'
                                                : 'bg-[var(--muted)] border-[var(--primary)]/20 focus:border-[var(--primary)]/60 focus:ring-[var(--primary)]/15'
                                            }
                                        `}
                                    />
                                    {/* Inline "%" symbol positioned to the right of the value */}
                                    <span className={`absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold ${pctError ? 'text-red-400' : 'text-[var(--muted-foreground)]'}`}>
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

                            {/* End date input */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[9px] font-black text-[var(--muted-foreground)] uppercase tracking-tighter">
                                    {t('discount_modal.label_end_date')}
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    min={todayStr}  // Prevents selecting past dates via the date picker
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

                {/* ── Footer / submit button ─────────────────────────────────── */}
                <div className="p-4 sm:p-5 border-t border-[var(--border)]">
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
                        {/* Three visual states: success confirmation → loading spinner → idle */}
                        {isSuccess ? (
                            <><CheckCircle size={16} /> {successMsg}</>
                        ) : isLoading ? (
                            <><Loader2 size={14} className="animate-spin" /> {t('discount_modal.btn_applying')}</>
                        ) : (
                            /* Show Edit icon in edit mode, Percent icon for new discounts */
                            isEdit
                                ? <><Edit size={14} /> {submitLabel}</>
                                : <><Percent size={14} /> {submitLabel}</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}