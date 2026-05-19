/**
 * @file ProductRow.jsx
 * @module Components/Mustashar
 *
 * Renders a single product as a responsive grid row inside ProductTable.
 * Handles three independent concerns internally:
 *
 *   1. Row highlight flash — a brief green/gray background tint after a toggle.
 *   2. Inline coverage editing — a number input with validation and optimistic save.
 *   3. Deactivation overlay — when `exiting=true` (Dashboard only), the row renders
 *      in a faded, grayscale, non-interactive state before AnimatePresence collapses it.
 *
 * The `exiting` prop is the only behavioral difference between the Dashboard and
 * Products consumers. Products never passes it, so its rows are completely unaffected
 * by the Dashboard's deferred-exit animation logic.
 *
 * Used by: Dashboard, Products
 */

import { useState, useRef, useEffect } from "react";
import { usePage } from "@inertiajs/react";
import { ExternalLink, Pencil, Check } from "lucide-react";
import RowActionButton from "../Common/RowActionButton";
import Toggle from "../Common/Toggle";
import ProductAvatar from "../Common/ProductAvatar";
import { useUpdateProductCoverage } from "../../Hooks/useProducts";
import { validateCoverage } from "../../constants/calculatorSettings";

// ── i18n strings ──────────────────────────────────────────────────────────────
// Move to your translation JSON and replace with useTranslation() when ready.
const t = {
    // Coverage field
    coverage_save_title:   "Save coverage",
    coverage_error_save:   "Failed to save. Please try again.",
    coverage_edit_title:   "Edit coverage",
    coverage_unit:         "m²",
    coverage_empty:        "—",

    // Status badge
    status_active:         "Active",
    status_inactive:       "Inactive",

    // Preview link
    preview_label:         "Preview",

    // Salla URL slug fallback
    product_slug_fallback: "product",
};

// Column grid definitions — kept at module scope to avoid recreation on re-render.
const COLS_WITH_PREVIEW    = "grid-cols-[280px_1fr_1fr_1fr_1fr_1fr]";
const COLS_WITHOUT_PREVIEW = "grid-cols-[280px_1fr_1fr_1fr_1fr]";

/**
 * ProductRow
 *
 * @param {object}   props
 * @param {object}   props.product              - Product record from the React Query cache.
 * @param {number}   props.product.id           - Unique product ID (used as React key and mutation target).
 * @param {string}   props.product.name         - Display name.
 * @param {string}   props.product.image        - Avatar image URL.
 * @param {string}   props.product.category     - Category label shown in the Category column.
 * @param {boolean}  props.product.active       - Current activation state from the cache.
 * @param {number|null} props.product.coverage_per_unit - Coverage in m² per unit; null means unconfigured.
 * @param {string|number} props.product.salla_product_id - Salla platform product ID (shown as secondary text).
 * @param {function} props.onToggle             - Called with `(productId)` when the toggle is clicked.
 * @param {boolean}  [props.loading=false]      - True while this row's mutation is in-flight; dims the row.
 * @param {boolean}  [props.showPreview=false]  - Renders the Salla storefront preview link column.
 * @param {boolean}  [props.exiting=false]      - Dashboard passes true during the deferred-exit window
 *                                                so the row appears deactivated (faded/grayscale) before
 *                                                AnimatePresence collapses it. Never passed by Products.
 *
 * @returns {JSX.Element}
 */
export default function ProductRow({
    product,
    onToggle,
    loading     = false,
    showPreview = false,
    exiting     = false,
}) {
    const { auth }       = usePage().props;
    const updateCoverage = useUpdateProductCoverage();

    // ── Row highlight (activate / deactivate flash) ───────────────────────────
    // A brief background tint plays after each toggle to confirm the state change
    // to the user. Skipped during the exit window — the overlay already signals state.
    const [highlight,  setHighlight] = useState(null);
    const prevActive   = useRef(product.active);
    const highlightRef = useRef(null);

    useEffect(() => {
        // Suppress flash while the row is on its way out of the Dashboard list.
        if (exiting) return;
        // Only react when the active flag actually changed.
        if (prevActive.current === product.active) return;
        prevActive.current = product.active;

        clearTimeout(highlightRef.current);
        setHighlight(product.active ? "active" : "inactive");
        // Clear the tint after 1.2 s — long enough to be noticed, short enough to be subtle.
        highlightRef.current = setTimeout(() => setHighlight(null), 1200);

        return () => clearTimeout(highlightRef.current);
    }, [product.active, exiting]);

    // ── Coverage inline edit ──────────────────────────────────────────────────
    const [isEditing,     setIsEditing]     = useState(false);
    const [coverageValue, setCoverage]      = useState(product.coverage_per_unit ?? "");
    const [coverageError, setCoverageError] = useState(null);
    const [isSaving,      setIsSaving]      = useState(false);
    const inputRef = useRef(null);

    // Auto-focus and select-all when the input appears.
    useEffect(() => {
        if (isEditing) inputRef.current?.focus();
        if (isEditing) inputRef.current?.select();
    }, [isEditing]);

    /** Enter edit mode, resetting to the last saved server value. */
    const handleEditStart = () => {
        setCoverage(String(product.coverage_per_unit ?? ""));
        setCoverageError(null);
        setIsEditing(true);
    };

    /** Validate the input, then fire the mutation. Stays in edit mode on validation error. */
    const handleSave = async () => {
        const err = validateCoverage(coverageValue);
        if (err) { setCoverageError(err); return; }

        setIsSaving(true);
        try {
            await updateCoverage.mutateAsync({
                productId:         product.id,
                coverage_per_unit: parseFloat(coverageValue),
            });
            setCoverageError(null);
            setIsEditing(false);
        } catch {
            setCoverageError(t.coverage_error_save);
        } finally {
            setIsSaving(false);
        }
    };

    /** Abandon edits and restore the last saved value. */
    const handleCancel = () => {
        setIsEditing(false);
        setCoverageError(null);
        setCoverage(String(product.coverage_per_unit ?? ""));
    };

    /**
     * Keyboard shortcuts inside the coverage input:
     *   Enter  → save
     *   Escape → cancel
     */
    const handleKeyDown = (e) => {
        if (e.key === "Enter")  { e.preventDefault(); handleSave(); }
        if (e.key === "Escape") handleCancel();
    };

    /**
     * Prevents the save button's mousedown from stealing focus away from the
     * input before the onClick handler has a chance to run.
     */
    const preventBlur = (e) => e.preventDefault();

    // ── Salla storefront preview URL ──────────────────────────────────────────
    // Constructed from the merchant ID and the product slug derived from the name.
    const sallaMerchantId = auth?.user?.salla_merchant_id;
    const sallaProductId  = product.salla_product_id;

    // Slugify: lowercase, spaces → hyphens, strip non-Arabic/non-word chars, collapse double hyphens.
    const productSlug = product.name
        ? product.name.toString().toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\u0621-\u064A\w-]+/g, "")
            .replace(/--+/g, "-")
        : t.product_slug_fallback;

    // Only build a URL when both IDs are available; otherwise the button renders as disabled.
    const previewUrl =
        sallaMerchantId && sallaProductId
            ? `https://salla.sa/intend/${sallaMerchantId}/${productSlug}/p${sallaProductId}`
            : null;

    // Formatted coverage display string, e.g. "4.5 m²" or "—" when unset.
    const coverageDisplay = product.coverage_per_unit
        ? `${product.coverage_per_unit} ${t.coverage_unit}`
        : t.coverage_empty;

    // ── Row container style ───────────────────────────────────────────────────
    // `exiting` takes visual precedence: fade + grayscale communicates deactivation
    // before the row is physically removed from the DOM by AnimatePresence.
    const rowStyle = exiting
        ? {
            opacity:       0.38,
            filter:        "grayscale(0.6)",
            transition:    "opacity 0.2s ease, filter 0.2s ease",
            pointerEvents: "none",
        }
        : {
            backgroundColor:
                highlight === "active"   ? "rgba(16, 185, 129, 0.06)"  :
                highlight === "inactive" ? "rgba(156, 163, 175, 0.07)" :
                "transparent",
            boxShadow:
                highlight === "active"   ? "0 0 0 1px rgba(16, 185, 129, 0.18) inset"  :
                highlight === "inactive" ? "0 0 0 1px rgba(156, 163, 175, 0.15) inset" :
                "none",
            opacity:       loading ? 0.5 : 1,
            pointerEvents: loading ? "none" : "auto",
            transition:    "background-color 0.5s ease, box-shadow 0.5s ease, opacity 0.3s ease",
        };

    return (
        <div
            className={`grid gap-4 px-8 py-4 items-center ${
                showPreview ? COLS_WITH_PREVIEW : COLS_WITHOUT_PREVIEW
            }`}
            style={rowStyle}
        >
            {/* ── Product info ── */}
            <div className="flex items-center gap-4 min-w-0">
                <ProductAvatar src={product.image} name={product.name} size={40} radius="rounded-xl" />
                <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[var(--foreground)] truncate uppercase tracking-tight">
                        {product.name}
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)] font-mono uppercase">
                        {product.salla_product_id}
                    </p>
                </div>
            </div>

            {/* ── Category ── */}
            <div className="flex justify-center">
                <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest">
                    {product.category}
                </span>
            </div>

            {/* ── Unit Coverage ── */}
            <div className="flex justify-center items-center">
                <div className="flex flex-col items-center gap-1">
                    {isEditing ? (
                        <>
                            <div className="flex items-center gap-1.5">
                                {/* Inline number input — spins hidden via CSS appearance reset */}
                                <input
                                    ref={inputRef}
                                    type="number"
                                    value={coverageValue}
                                    onChange={(e) => { setCoverage(e.target.value); setCoverageError(null); }}
                                    onKeyDown={handleKeyDown}
                                    onBlur={handleSave}
                                    step="0.01" min="0.01" max="200"
                                    disabled={isSaving}
                                    style={{
                                        width:            "64px",
                                        textAlign:        "center",
                                        fontSize:         "11px",
                                        fontWeight:        700,
                                        color:            "var(--primary)",
                                        background:       "color-mix(in srgb, var(--primary) 8%, transparent)",
                                        border:           `1px solid ${coverageError ? "#fca5a5" : "color-mix(in srgb, var(--primary) 30%, transparent)"}`,
                                        borderRadius:     "8px",
                                        padding:          "4px 6px",
                                        outline:          "none",
                                        MozAppearance:    "textfield",
                                        WebkitAppearance: "none",
                                        appearance:       "textfield",
                                        opacity:           isSaving ? 0.6 : 1,
                                    }}
                                />
                                {/* Confirm button — onMouseDown prevents blur from firing before onClick */}
                                <button
                                    type="button"
                                    onMouseDown={preventBlur}
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    title={t.coverage_save_title}
                                    style={{
                                        width:          "22px",
                                        height:         "22px",
                                        borderRadius:   "6px",
                                        border:         "none",
                                        background:      coverageError ? "#fca5a5" : "color-mix(in srgb, var(--primary) 15%, transparent)",
                                        color:           coverageError ? "#dc2626" : "var(--primary)",
                                        display:        "flex",
                                        alignItems:     "center",
                                        justifyContent: "center",
                                        cursor:          isSaving ? "not-allowed" : "pointer",
                                        flexShrink:      0,
                                        transition:     "opacity 0.15s",
                                        opacity:         isSaving ? 0.5 : 1,
                                    }}
                                >
                                    <Check size={12} strokeWidth={3} />
                                </button>
                            </div>
                            {/* Inline validation error — shown below the input row */}
                            {coverageError && (
                                <span style={{
                                    fontSize:   "9px",
                                    color:      "#dc2626",
                                    maxWidth:   "110px",
                                    textAlign:  "center",
                                    lineHeight: 1.3,
                                }}>
                                    {coverageError}
                                </span>
                            )}
                        </>
                    ) : (
                        /* Read mode — value + edit icon pencil button */
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold font-mono text-[var(--primary)]">
                                {coverageDisplay}
                            </span>
                            <button
                                onClick={handleEditStart}
                                className="p-1 text-[var(--muted-foreground)] opacity-40 hover:opacity-100 hover:text-[var(--primary)] transition-all"
                                title={t.coverage_edit_title}
                            >
                                <Pencil size={12} strokeWidth={2.5} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Status badge ── */}
            <div className="flex justify-center items-center gap-2">
                {/* Dot indicator: emerald with glow when active, gray when inactive or exiting */}
                <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${
                    product.active && !exiting
                        ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                        : "bg-gray-300"
                }`} />
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${
                    product.active && !exiting ? "text-emerald-600" : "text-[var(--muted-foreground)]"
                }`}>
                    {product.active && !exiting ? t.status_active : t.status_inactive}
                </span>
            </div>

            {/* ── Toggle switch ── */}
            <div className="flex justify-center">
                {/*
                  Pass `checked={product.active && !exiting}` so the thumb slides to OFF
                  as soon as the Dashboard marks this row as exiting — giving the merchant
                  an immediate visual confirmation before the row collapses.
                */}
                <Toggle
                    checked={product.active && !exiting}
                    onChange={() => onToggle(product.id)}
                    disabled={loading || exiting}
                />
            </div>

            {/* ── Salla preview link (Dashboard only) ── */}
            {showPreview && (
                <div className="flex justify-center">
                    {previewUrl && !exiting ? (
                        <RowActionButton href={previewUrl} target="_blank" variant="active" icon={<ExternalLink size={11} />}>
                            {t.preview_label}
                        </RowActionButton>
                    ) : (
                        /* Disabled state when URL is unavailable or row is exiting */
                        <RowActionButton variant="disabled" icon={<ExternalLink size={11} />}>
                            {t.preview_label}
                        </RowActionButton>
                    )}
                </div>
            )}
        </div>
    );
}
