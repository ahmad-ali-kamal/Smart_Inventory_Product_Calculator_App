/**
 * @file ProductRow.jsx
 * @module Components/Mustashar
 *
 * Renders a single product as a responsive grid row inside ProductTable.
 * Handles four independent concerns internally:
 *
 *   1. Row highlight flash — brief green/gray tint after a toggle.
 *   2. Inline coverage editing — number input with validation and optimistic save.
 *   3. Inline waste editing   — identical pattern to coverage.  ✅ NEW
 *   4. Deactivation overlay   — when `exiting=true` (Dashboard only).
 *
 * Both Coverage and Waste cells display:
 *   - The resolved value (product → global → fallback)
 *   - A GLOBAL badge when the value is inherited from global settings
 *   - "—" only when source === 'none' (coverage) or source === 'default' (waste with hard fallback shown)
 *
 * Used by: Dashboard, Products
 */

import { useState, useRef, useEffect } from "react";
import { usePage } from "@inertiajs/react";
import { ExternalLink, Pencil, Check } from "lucide-react";
import RowActionButton from "../Common/RowActionButton";
import Toggle from "../Common/Toggle";
import ProductAvatar from "../Common/UI/ProductAvatar";
import { useUpdateProductCoverage, useUpdateProductWaste } from "../../Hooks/useProducts";
import { validateCoverage, validateWaste } from "../../constants/calculatorSettings";

// ── i18n strings ──────────────────────────────────────────────────────────────
const t = {
    coverage_save_title:  "Save coverage",
    coverage_edit_title:  "Edit coverage",
    coverage_error_save:  "Failed to save. Please try again.",
    coverage_unit:        "m²",
    coverage_empty:       "—",

    waste_save_title:     "Save waste",
    waste_edit_title:     "Edit waste %",
    waste_error_save:     "Failed to save. Please try again.",
    waste_unit:           "%",

    badge_global:         "GLOBAL",

    status_active:        "Active",
    status_inactive:      "Inactive",

    preview_label:        "Preview",
    product_slug_fallback: "product",
};

// ✅ UPDATED: grid توسّع ليستوعب عمود Waste الجديد
const COLS_WITH_PREVIEW    = "grid-cols-[220px_1fr_1fr_1fr_1fr_1fr_1fr]";
const COLS_WITHOUT_PREVIEW = "grid-cols-[220px_1fr_1fr_1fr_1fr_1fr]";

// ── Shared inline-edit cell styles ────────────────────────────────────────────
// دالة واحدة تنتج styles الـ input المشتركة بين Coverage و Waste
function inputStyle(hasError, isSaving) {
    return {
        width:            "58px",
        textAlign:        "center",
        fontSize:         "11px",
        fontWeight:       700,
        color:            "var(--primary)",
        background:       "color-mix(in srgb, var(--primary) 8%, transparent)",
        border:           `1px solid ${hasError ? "#fca5a5" : "color-mix(in srgb, var(--primary) 30%, transparent)"}`,
        borderRadius:     "8px",
        padding:          "4px 5px",
        outline:          "none",
        MozAppearance:    "textfield",
        WebkitAppearance: "none",
        appearance:       "textfield",
        opacity:          isSaving ? 0.6 : 1,
    };
}

function confirmBtnStyle(hasError, isSaving) {
    return {
        width:          "22px",
        height:         "22px",
        borderRadius:   "6px",
        border:         "none",
        background:     hasError ? "#fca5a5" : "color-mix(in srgb, var(--primary) 15%, transparent)",
        color:          hasError ? "#dc2626" : "var(--primary)",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        cursor:         isSaving ? "not-allowed" : "pointer",
        flexShrink:     0,
        transition:     "opacity 0.15s",
        opacity:        isSaving ? 0.5 : 1,
    };
}

function errorLabelStyle() {
    return {
        fontSize:   "9px",
        color:      "#dc2626",
        maxWidth:   "100px",
        textAlign:  "center",
        lineHeight: 1.3,
    };
}

// ── GLOBAL badge ──────────────────────────────────────────────────────────────
function GlobalBadge({ title }) {
    return (
        <span
            title={title}
            style={{
                fontSize:      "8px",
                fontWeight:    700,
                letterSpacing: "0.06em",
                color:         "color-mix(in srgb, var(--primary) 70%, transparent)",
                background:    "color-mix(in srgb, var(--primary) 8%, transparent)",
                border:        "1px solid color-mix(in srgb, var(--primary) 20%, transparent)",
                borderRadius:  "4px",
                padding:       "1px 4px",
                lineHeight:    1.4,
                userSelect:    "none",
                whiteSpace:    "nowrap",
            }}
        >
            {t.badge_global}
        </span>
    );
}

/**
 * ProductRow
 *
 * @param {object}   props
 * @param {object}   props.product
 * @param {number}   props.product.id
 * @param {string}   props.product.name
 * @param {string}   props.product.image
 * @param {string}   props.product.category
 * @param {boolean}  props.product.active
 * @param {number|null} props.product.coverage_per_unit   — resolved value
 * @param {string}   props.product.coverage_source        — 'product'|'global'|'none'
 * @param {number}   props.product.waste_percentage       — resolved value (always a number)
 * @param {string}   props.product.waste_source           — 'product'|'global'|'default'
 * @param {string|number} props.product.salla_product_id
 * @param {function} props.onToggle
 * @param {boolean}  [props.loading=false]
 * @param {boolean}  [props.showPreview=false]
 * @param {boolean}  [props.exiting=false]
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
    const updateWaste    = useUpdateProductWaste();      // ✅ NEW

    // ── Row highlight ─────────────────────────────────────────────────────────
    const [highlight,  setHighlight] = useState(null);
    const prevActive   = useRef(product.active);
    const highlightRef = useRef(null);

    useEffect(() => {
        if (exiting) return;
        if (prevActive.current === product.active) return;
        prevActive.current = product.active;

        clearTimeout(highlightRef.current);
        setHighlight(product.active ? "active" : "inactive");
        highlightRef.current = setTimeout(() => setHighlight(null), 1200);

        return () => clearTimeout(highlightRef.current);
    }, [product.active, exiting]);

    // ── Coverage inline edit ──────────────────────────────────────────────────
    const [coverageEditing, setCoverageEditing] = useState(false);
    const [coverageValue,   setCoverageValue]   = useState(product.coverage_per_unit ?? "");
    const [coverageError,   setCoverageError]   = useState(null);
    const [coverageSaving,  setCoverageSaving]  = useState(false);
    const coverageInputRef = useRef(null);

    useEffect(() => {
        if (coverageEditing) { coverageInputRef.current?.focus(); coverageInputRef.current?.select(); }
    }, [coverageEditing]);

    const handleCoverageEditStart = () => {
        setCoverageValue(String(product.coverage_per_unit ?? ""));
        setCoverageError(null);
        setCoverageEditing(true);
    };

    const handleCoverageSave = async () => {
        const err = validateCoverage(coverageValue);
        if (err) { setCoverageError(err); return; }

        setCoverageSaving(true);
        try {
            await updateCoverage.mutateAsync({
                productId:         product.id,
                coverage_per_unit: parseFloat(coverageValue),
            });
            setCoverageError(null);
            setCoverageEditing(false);
        } catch {
            setCoverageError(t.coverage_error_save);
        } finally {
            setCoverageSaving(false);
        }
    };

    const handleCoverageCancel = () => {
        setCoverageEditing(false);
        setCoverageError(null);
        setCoverageValue(String(product.coverage_per_unit ?? ""));
    };

    const handleCoverageKeyDown = (e) => {
        if (e.key === "Enter")  { e.preventDefault(); handleCoverageSave(); }
        if (e.key === "Escape") handleCoverageCancel();
    };

    // ── Waste inline edit ─────────────────────────────────────────────────────
    const [wasteEditing, setWasteEditing] = useState(false);
    const [wasteValue,   setWasteValue]   = useState(
        product.waste_percentage != null ? String(product.waste_percentage) : ""
    );
    const [wasteError,   setWasteError]   = useState(null);
    const [wasteSaving,  setWasteSaving]  = useState(false);
    const wasteInputRef = useRef(null);

    useEffect(() => {
        if (wasteEditing) { wasteInputRef.current?.focus(); wasteInputRef.current?.select(); }
    }, [wasteEditing]);

    const handleWasteEditStart = () => {
        // نبدأ بالقيمة المحلولة الحالية كنقطة بداية للتعديل
        setWasteValue(product.waste_percentage != null ? String(product.waste_percentage) : "");
        setWasteError(null);
        setWasteEditing(true);
    };

    const handleWasteSave = async () => {
        // validateWaste تُرجع object { waste?: string } — نستخرج الرسالة
        const errs = validateWaste(wasteValue);
        const errMsg = errs?.waste ?? null;
        if (errMsg) { setWasteError(errMsg); return; }

        setWasteSaving(true);
        try {
            await updateWaste.mutateAsync({
                productId:        product.id,
                waste_percentage: wasteValue !== "" ? parseFloat(wasteValue) : null,
            });
            setWasteError(null);
            setWasteEditing(false);
        } catch {
            setWasteError(t.waste_error_save);
        } finally {
            setWasteSaving(false);
        }
    };

    const handleWasteCancel = () => {
        setWasteEditing(false);
        setWasteError(null);
        setWasteValue(product.waste_percentage != null ? String(product.waste_percentage) : "");
    };

    const handleWasteKeyDown = (e) => {
        if (e.key === "Enter")  { e.preventDefault(); handleWasteSave(); }
        if (e.key === "Escape") handleWasteCancel();
    };

    // ── Salla preview URL ─────────────────────────────────────────────────────
    const sallaMerchantId = auth?.user?.salla_merchant_id;
    const sallaProductId  = product.salla_product_id;

    const productSlug = product.name
        ? product.name.toString().toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\u0621-\u064A\w-]+/g, "")
            .replace(/--+/g, "-")
        : t.product_slug_fallback;

    const previewUrl =
        sallaMerchantId && sallaProductId
            ? `https://salla.sa/intend/${sallaMerchantId}/${productSlug}/p${sallaProductId}`
            : null;

    // ── Display values ────────────────────────────────────────────────────────
    const coverageDisplay    = product.coverage_per_unit
        ? `${product.coverage_per_unit} ${t.coverage_unit}`
        : t.coverage_empty;
    const coverageIsGlobal   = product.coverage_source === "global";

    // 'default' = hard-fallback 10% from backend, treat same as no value set
    const wasteDisplay  = (product.waste_source === "product" || product.waste_source === "global") && product.waste_percentage != null
        ? `${product.waste_percentage}${t.waste_unit}`
        : "—";
    const wasteIsGlobal = product.waste_source === "global";

    const preventBlur = (e) => e.preventDefault();

    // ── Row style ─────────────────────────────────────────────────────────────
    const rowStyle = exiting
        ? { opacity: 0.38, filter: "grayscale(0.6)", transition: "opacity 0.2s ease, filter 0.2s ease", pointerEvents: "none" }
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
                    {coverageEditing ? (
                        <>
                            <div className="flex items-center gap-1.5">
                                <input
                                    ref={coverageInputRef}
                                    type="number"
                                    value={coverageValue}
                                    onChange={(e) => { setCoverageValue(e.target.value); setCoverageError(null); }}
                                    onKeyDown={handleCoverageKeyDown}
                                    onBlur={handleCoverageSave}
                                    step="0.01" min="0.01" max="200"
                                    disabled={coverageSaving}
                                    style={inputStyle(!!coverageError, coverageSaving)}
                                />
                                <button
                                    type="button"
                                    onMouseDown={preventBlur}
                                    onClick={handleCoverageSave}
                                    disabled={coverageSaving}
                                    title={t.coverage_save_title}
                                    style={confirmBtnStyle(!!coverageError, coverageSaving)}
                                >
                                    <Check size={12} strokeWidth={3} />
                                </button>
                            </div>
                            {coverageError && (
                                <span style={errorLabelStyle()}>{coverageError}</span>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold font-mono text-[var(--primary)]">
                                {coverageDisplay}
                            </span>
                            {coverageIsGlobal && (
                                <GlobalBadge title="Inherited from global settings — click the pencil to set a product-specific value" />
                            )}
                            <button
                                onClick={handleCoverageEditStart}
                                className="p-1 text-[var(--muted-foreground)] opacity-40 hover:opacity-100 hover:text-[var(--primary)] transition-all"
                                title={t.coverage_edit_title}
                            >
                                <Pencil size={12} strokeWidth={2.5} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Waste % ── ✅ NEW */}
            <div className="flex justify-center items-center">
                <div className="flex flex-col items-center gap-1">
                    {wasteEditing ? (
                        <>
                            <div className="flex items-center gap-1.5">
                                <input
                                    ref={wasteInputRef}
                                    type="number"
                                    value={wasteValue}
                                    onChange={(e) => { setWasteValue(e.target.value); setWasteError(null); }}
                                    onKeyDown={handleWasteKeyDown}
                                    onBlur={handleWasteSave}
                                    step="0.1" min="0" max="50"
                                    disabled={wasteSaving}
                                    style={inputStyle(!!wasteError, wasteSaving)}
                                />
                                <button
                                    type="button"
                                    onMouseDown={preventBlur}
                                    onClick={handleWasteSave}
                                    disabled={wasteSaving}
                                    title={t.waste_save_title}
                                    style={confirmBtnStyle(!!wasteError, wasteSaving)}
                                >
                                    <Check size={12} strokeWidth={3} />
                                </button>
                            </div>
                            {wasteError && (
                                <span style={errorLabelStyle()}>{wasteError}</span>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold font-mono text-[var(--primary)]">
                                {wasteDisplay}
                            </span>
                            {wasteIsGlobal && (
                                <GlobalBadge title="Inherited from global settings — click the pencil to set a product-specific value" />
                            )}
                            <button
                                onClick={handleWasteEditStart}
                                className="p-1 text-[var(--muted-foreground)] opacity-40 hover:opacity-100 hover:text-[var(--primary)] transition-all"
                                title={t.waste_edit_title}
                            >
                                <Pencil size={12} strokeWidth={2.5} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Status badge ── */}
            <div className="flex justify-center items-center gap-2">
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
                        <RowActionButton variant="disabled" icon={<ExternalLink size={11} />}>
                            {t.preview_label}
                        </RowActionButton>
                    )}
                </div>
            )}
        </div>
    );
}