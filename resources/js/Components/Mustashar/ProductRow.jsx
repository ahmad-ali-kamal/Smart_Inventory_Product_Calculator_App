/**
 * @file ProductRow.jsx
 * @module Components/Mustashar
 *
 * Renders a single product as a responsive grid row inside `ProductTable`.
 * Handles four independent concerns internally:
 *
 *   1. **Row highlight flash** — brief green/gray tint for 1.2 s after a toggle.
 *   2. **Inline coverage editing** — number input with validation and optimistic save.
 *   3. **Inline waste editing**   — identical pattern to coverage.
 *   4. **Deactivation overlay**   — when `exiting=true` (Dashboard only), the row
 *      is dimmed and all interactions are blocked.
 *
 * Both the Coverage and Waste cells display:
 *   - The resolved value (product-level → global → fallback).
 *   - A `GLOBAL` badge when the value is inherited from the global settings.
 *   - `"—"` only when `coverage_source === 'none'` or
 *     `waste_source === 'default'` (hard backend fallback, not explicitly set).
 *
 * Grid layout must stay in sync with the constants in `ProductTable.jsx`.
 *
 * Used by: Dashboard, Products
 */

import { useState, useRef, useEffect } from "react";
import { usePage } from "@inertiajs/react";
import { ExternalLink, Pencil, Check } from "lucide-react";
import RowActionButton from "../Common/RowActionButton";
import Toggle from "../Common/Toggle";
import ProductAvatar from "../Common/UI/ProductAvatar";
import { useUpdateProductCoverage, useUpdateProductWaste, useUpdateProductDimension } from "../../Hooks/useProducts";
import { validateCoverage, validateWaste } from "../../constants/calculatorSettings";
import { useTranslation } from "react-i18next";

// ── Grid column definitions ───────────────────────────────────────────────────
// Must stay in sync with the matching constants in ProductTable.jsx.
// First column uses responsive min-width: 140px on mobile, 220px on desktop.
const COLS_WITH_PREVIEW    = "grid-cols-[1.5fr_1.25fr_1fr_1fr_0.8fr_0.7fr_0.7fr_1fr]";
const COLS_WITHOUT_PREVIEW = "grid-cols-[1.5fr_1.25fr_1fr_1fr_0.8fr_0.7fr_0.7fr]";

// ── Shared inline-edit cell style helpers ─────────────────────────────────────
// Pure functions — no hooks or side-effects — so they can be called freely
// during render. Both Coverage and Waste cells use identical visual treatment.

/**
 * Returns the inline style object for the small number input used in both
 * the Coverage and Waste edit cells.
 *
 * @param {boolean} hasError  - Applies red border when true.
 * @param {boolean} isSaving  - Dims the input while a network request is in-flight.
 * @returns {React.CSSProperties}
 */
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

/**
 * Returns the inline style object for the small confirm (✓) button adjacent
 * to the inline edit input.
 *
 * @param {boolean} hasError  - Applies red tones when true.
 * @param {boolean} isSaving  - Shows a "not-allowed" cursor while saving.
 * @returns {React.CSSProperties}
 */
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

/**
 * Returns the inline style object for the small validation error label
 * rendered beneath the edit input.
 *
 * @returns {React.CSSProperties}
 */
function errorLabelStyle() {
    return {
        fontSize:   "9px",
        color:      "#dc2626",
        maxWidth:   "100px",
        textAlign:  "center",
        lineHeight: 1.3,
    };
}

// ── Internal sub-components ───────────────────────────────────────────────────

/**
 * GlobalBadge
 *
 * A tiny pill shown next to a coverage or waste value that was inherited
 * from the global calculator settings rather than set per-product.
 * Clicking the adjacent pencil icon overrides it.
 *
 * @param {object} props
 * @param {string} props.title - Tooltip text explaining the inheritance.
 * @returns {JSX.Element}
 */
function GlobalBadge({ title }) {
    const { t } = useTranslation('mustashar');

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
            {t("product_row.badge_global")}
        </span>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

/**
 * ProductRow
 *
 * @param {object}       props
 * @param {object}       props.product
 * @param {number}       props.product.id                  - Unique product identifier.
 * @param {string}       props.product.name                - Display name.
 * @param {string}       props.product.image               - Avatar image URL.
 * @param {string}       props.product.category            - Category label.
 * @param {boolean}      props.product.active              - Current active state.
 * @param {number|null}  props.product.coverage_per_unit   - Resolved coverage value
 *                                                           (product-level → global → null).
 * @param {string}       props.product.coverage_source     - `'product'|'global'|'none'`
 * @param {number}       props.product.waste_percentage    - Resolved waste value
 *                                                           (always a number after backend resolution).
 * @param {string}       props.product.waste_source        - `'product'|'global'|'default'`
 * @param {string|number} props.product.salla_product_id  - Salla platform product ID.
 * @param {function}     props.onToggle                    - Called with `productId` when the toggle is clicked.
 * @param {boolean}      [props.loading=false]             - Dims the row and disables the toggle while true
 *                                                           (used when a mutation is in-flight for this product).
 * @param {boolean}      [props.showPreview=false]         - When true, renders the Salla preview link column.
 * @param {boolean}      [props.exiting=false]             - When true (Dashboard deactivation), overlays a
 *                                                           grayscale + opacity treatment and blocks all input.
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
    const { t } = useTranslation("mustashar");
    const { auth }       = usePage().props;
    const updateCoverage  = useUpdateProductCoverage();
    const updateWaste     = useUpdateProductWaste();
    const updateDimension = useUpdateProductDimension();

    // ── Row highlight flash ───────────────────────────────────────────────────
    // Tracks whether `active` changed since the last render and applies a
    // brief tinted background to give the toggle action visual confirmation.
    const [highlight,  setHighlight] = useState(null);  // null | 'active' | 'inactive'
    const prevActive   = useRef(product.active);
    const highlightRef = useRef(null);                  // holds the setTimeout id for cleanup

    useEffect(() => {
        // Skip flash during an exiting animation to avoid conflicting styles.
        if (exiting) return;
        // No change — nothing to flash.
        if (prevActive.current === product.active) return;
        prevActive.current = product.active;

        clearTimeout(highlightRef.current);
        setHighlight(product.active ? "active" : "inactive");
        // Clear the highlight class after 1.2 s so the row returns to normal.
        highlightRef.current = setTimeout(() => setHighlight(null), 1200);

        return () => clearTimeout(highlightRef.current);
    }, [product.active, exiting]);

    // ── Coverage inline edit ──────────────────────────────────────────────────
    // Local state drives the controlled input; the mutation updates the cache
    // on success without requiring a full list refetch.
    const [coverageEditing, setCoverageEditing] = useState(false);
    const [coverageValue,   setCoverageValue]   = useState(product.coverage_per_unit ?? "");
    const [coverageError,   setCoverageError]   = useState(null);
    const [coverageSaving,  setCoverageSaving]  = useState(false);
    const coverageInputRef = useRef(null);

    // Auto-focus and select the input text when edit mode opens.
    useEffect(() => {
        if (coverageEditing) { coverageInputRef.current?.focus(); coverageInputRef.current?.select(); }
    }, [coverageEditing]);

    /**
     * Opens the coverage edit input, seeding it with the current resolved value.
     */
    const handleCoverageEditStart = () => {
        setCoverageValue(String(product.coverage_per_unit ?? ""));
        setCoverageError(null);
        setCoverageEditing(true);
    };

    /**
     * Validates the coverage input and persists the new value via the mutation.
     * Keeps the input open (with an error message) on validation or network failure.
     */
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
            setCoverageError(t("product_row.coverage_error_save"));
        } finally {
            setCoverageSaving(false);
        }
    };

    /**
     * Closes the coverage input and resets it to the last saved value.
     */
    const handleCoverageCancel = () => {
        setCoverageEditing(false);
        setCoverageError(null);
        setCoverageValue(String(product.coverage_per_unit ?? ""));
    };

    /**
     * Keyboard shortcuts for the coverage input: Enter saves, Escape cancels.
     *
     * @param {React.KeyboardEvent} e
     */
    const handleCoverageKeyDown = (e) => {
        if (e.key === "Enter")  { e.preventDefault(); handleCoverageSave(); }
        if (e.key === "Escape") handleCoverageCancel();
    };

    // ── Waste inline edit ─────────────────────────────────────────────────────
    // Identical pattern to the coverage edit block above.
    const [wasteEditing, setWasteEditing] = useState(false);
    const [wasteValue,   setWasteValue]   = useState(
        product.waste_percentage != null ? String(product.waste_percentage) : ""
    );
    const [wasteError,   setWasteError]   = useState(null);
    const [wasteSaving,  setWasteSaving]  = useState(false);
    const wasteInputRef = useRef(null);

    // Auto-focus and select the input text when edit mode opens.
    useEffect(() => {
        if (wasteEditing) { wasteInputRef.current?.focus(); wasteInputRef.current?.select(); }
    }, [wasteEditing]);

    /**
     * Opens the waste edit input, seeding it with the current resolved value.
     */
    const handleWasteEditStart = () => {
        // Start from the currently resolved value as an edit baseline.
        setWasteValue(product.waste_percentage != null ? String(product.waste_percentage) : "");
        setWasteError(null);
        setWasteEditing(true);
    };

    /**
     * Validates the waste input and persists the new value via the mutation.
     * `validateWaste` returns `{ waste?: string }` — the message is extracted
     * before being stored in the local error state.
     */
    const handleWasteSave = async () => {
        const errs   = validateWaste(wasteValue);
        const errMsg = errs?.waste ?? null;
        if (errMsg) { setWasteError(errMsg); return; }

        setWasteSaving(true);
        try {
            await updateWaste.mutateAsync({
                productId:        product.id,
                // Pass null to clear a per-product override and fall back to global.
                waste_percentage: wasteValue !== "" ? parseFloat(wasteValue) : null,
            });
            setWasteError(null);
            setWasteEditing(false);
        } catch {
            setWasteError(t("product_row.waste_error_save"));
        } finally {
            setWasteSaving(false);
        }
    };

    /**
     * Closes the waste input and resets it to the last saved value.
     */
    const handleWasteCancel = () => {
        setWasteEditing(false);
        setWasteError(null);
        setWasteValue(product.waste_percentage != null ? String(product.waste_percentage) : "");
    };

    /**
     * Keyboard shortcuts for the waste input: Enter saves, Escape cancels.
     *
     * @param {React.KeyboardEvent} e
     */
    const handleWasteKeyDown = (e) => {
        if (e.key === "Enter")  { e.preventDefault(); handleWasteSave(); }
        if (e.key === "Escape") handleWasteCancel();
    };

    // ── Dimension toggle ──────────────────────────────────────────────────────
    const [dimensionSaving, setDimensionSaving] = useState(false);

    const handleDimensionToggle = async () => {
        if (dimensionSaving) return;
        const current = product.dimension_count ?? 2;
        const next    = current === 2 ? 3 : 2;
        setDimensionSaving(true);
        try {
            await updateDimension.mutateAsync({
                productId: product.id,
                dimension_count: next,
            });
        } catch {
            // silently fail; server data stays in cache
        } finally {
            setDimensionSaving(false);
        }
    };

    // ── Salla preview URL ─────────────────────────────────────────────────────
    // Constructs the public Salla product URL from the merchant ID and a
    // URL-safe slug derived from the product name. Used in the Preview column.
    const sallaMerchantId = auth?.user?.salla_merchant_id;
    const sallaProductId  = product.salla_product_id;

    // Slugify the product name: lowercase, spaces→hyphens, strip non-Arabic/ASCII chars.
    const productSlug = product.name
        ? product.name.toString().toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\u0621-\u064A\w-]+/g, "")
            .replace(/--+/g, "-")
        : t("product_row.product_slug_fallback");

    // Only build the URL when both IDs are available; null suppresses the link.
    const previewUrl =
        sallaMerchantId && sallaProductId
            ? `https://salla.sa/intend/${sallaMerchantId}/${productSlug}/p${sallaProductId}`
            : null;

    // ── Display value derivation ──────────────────────────────────────────────
    // Translate raw product fields into the strings rendered in each cell.

    /** Formatted coverage string, or "—" when no value is set. */
    const coverageDisplay  = product.coverage_per_unit
        ? `${product.coverage_per_unit} ${t("product_row.coverage_unit")}`
        : t("product_row.coverage_empty");

    /** True when the coverage value was inherited from the global setting. */
    const coverageIsGlobal = product.coverage_source === "global";

    /**
     * Show a value only when the source is explicitly 'product' or 'global'.
     * 'default' means the backend applied a hard-coded fallback (10 %) that
     * the user never configured — treat that the same as "not set" (show "—").
     */
    const wasteDisplay  = (product.waste_source === "product" || product.waste_source === "global") && product.waste_percentage != null
        ? `${product.waste_percentage}${t("product_row.waste_unit")}`
        : "—";

    /** True when the waste value was inherited from the global setting. */
    const wasteIsGlobal = product.waste_source === "global";

    /**
     * Prevents the input from losing focus when the confirm button is clicked
     * (mousedown fires before blur; calling preventDefault() cancels the blur).
     *
     * @param {React.MouseEvent} e
     */
    const preventBlur = (e) => e.preventDefault();

    // ── Row style ─────────────────────────────────────────────────────────────
    // Two mutually exclusive styles: the exiting overlay (dimmed, no pointer
    // events) or the highlight flash (green / gray tint, fades via transition).
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
            className={`grid gap-2 lg:gap-4 px-4 lg:px-8 py-4 items-center ${
                showPreview ? COLS_WITH_PREVIEW : COLS_WITHOUT_PREVIEW
            }`}
            style={rowStyle}
        >
            {/* ── Product info (avatar + name + Salla ID) ── */}
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

            {/* ── Unit Coverage — static display or inline edit ── */}
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
                                    step="0.01" min="0.01"
                                    disabled={coverageSaving}
                                    style={inputStyle(!!coverageError, coverageSaving)}
                                />
                                <button
                                    type="button"
                                    onMouseDown={preventBlur}
                                    onClick={handleCoverageSave}
                                    disabled={coverageSaving}
                                    title={t("product_row.coverage_save_title")}
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
                                <GlobalBadge title={t("product_row.global_badge_tooltip_coverage")} />
                            )}
                            <button
                                onClick={handleCoverageEditStart}
                                className="p-1 text-[var(--muted-foreground)] opacity-40 hover:opacity-100 hover:text-[var(--primary)] transition-all"
                                title={t("product_row.coverage_edit_title")}
                            >
                                <Pencil size={12} strokeWidth={2.5} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Waste % — static display or inline edit ── */}
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
                                    title={t("product_row.waste_save_title")}
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
                                <GlobalBadge title={t("product_row.global_badge_tooltip_waste")} />
                            )}
                            <button
                                onClick={handleWasteEditStart}
                                className="p-1 text-[var(--muted-foreground)] opacity-40 hover:opacity-100 hover:text-[var(--primary)] transition-all"
                                title={t("product_row.waste_edit_title")}
                            >
                                <Pencil size={12} strokeWidth={2.5} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Dimensions (2D / 3D toggle) ── */}
            <div className="flex justify-center items-center">
                <button
                    onClick={handleDimensionToggle}
                    disabled={dimensionSaving || exiting}
                    title={t("product_row.dimension_tooltip")}
                    className={`
                        text-[10px] font-black tracking-wider px-2.5 py-1 rounded-md border
                        transition-all duration-150 select-none
                        ${dimensionSaving ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-80"}
                        ${
                            (product.dimension_count ?? 2) === 3
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }
                    `}
                >
                    {(product.dimension_count ?? 2) === 3
                        ? t("product_row.dimension_3d")
                        : t("product_row.dimension_2d")
                    }
                </button>
            </div>

            {/* ── Status badge (dot + label) ── */}
            <div className="flex justify-center items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${
                    product.active && !exiting
                        ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                        : "bg-gray-300"
                }`} />
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${
                    product.active && !exiting ? "text-emerald-600" : "text-[var(--muted-foreground)]"
                }`}>
                    {product.active && !exiting ? t("product_row.status_active") : t("product_row.status_inactive")}
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

            {/* ── Salla preview link (Dashboard only, requires showPreview) ── */}
            {showPreview && (
                <div className="flex justify-center">
                    {previewUrl && !exiting ? (
                        <RowActionButton href={previewUrl} target="_blank" variant="active" icon={<ExternalLink size={11} />}>
                            {t("product_row.preview_label")}
                        </RowActionButton>
                    ) : (
                        <RowActionButton variant="disabled" icon={<ExternalLink size={11} />}>
                            {t("product_row.preview_label")}
                        </RowActionButton>
                    )}
                </div>
            )}
        </div>
    );
}