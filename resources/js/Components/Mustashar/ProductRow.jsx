/**
 * @file ProductRow.jsx
 * @module Components/Mustashar
 *
 * @description
 * Presentational component that renders a single product as a responsive grid row
 * inside `ProductTable`. The column layout adapts based on the `showPreview` prop:
 * an extra "Preview" column is appended when the row appears on the Dashboard.
 *
 * Responsibilities:
 *  - Reads `salla_merchant_id` from Inertia's shared auth props to construct
 *    a Salla storefront preview URL for the product.
 *  - Derives a URL-safe slug from the product name (supports Arabic characters).
 *  - Renders the product avatar, name, category, active status indicator,
 *    a toggle switch, and an optional external preview link.
 *
 * Column grid:
 *  Without preview: [280px  1fr  1fr  1fr]
 *  With    preview: [280px  1fr  1fr  1fr  1fr]
 */

import { usePage } from '@inertiajs/react';
import { ExternalLink } from 'lucide-react';
import RowActionButton from '../Common/RowActionButton';
import Toggle from "../Common/UI/Toggle";
import ProductAvatar from "../Common/UI/ProductAvatar";

// ---------------------------------------------------------------------------
// i18n strings — move these values to a JSON translation file when ready.
// ---------------------------------------------------------------------------
const t = {
    status_active:         "active",
    status_inactive:       "inactive",
    preview_btn:           "Preview",
    preview_disabled_title: "بيانات الرابط غير مكتملة",  // "Link data is incomplete"
    fallback_slug:         "product",
};

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

/** Grid columns when the preview link column is visible (Dashboard). */
const COLS_WITH_PREVIEW    = 'grid-cols-[280px_1fr_1fr_1fr_1fr]';

/** Grid columns when the preview link column is hidden (Products page). */
const COLS_WITHOUT_PREVIEW = 'grid-cols-[280px_1fr_1fr_1fr]';

/**
 * A single product row for use inside `ProductTable`.
 *
 * @param {object}   props
 * @param {object}   props.product            — Product data object from the server.
 * @param {string|number} props.product.id    — Unique product identifier.
 * @param {string}   props.product.name       — Display name (may contain Arabic).
 * @param {string}   [props.product.image]    — Product thumbnail URL.
 * @param {string}   [props.product.category] — Category label.
 * @param {boolean}  props.product.active     — Whether the product is currently active.
 * @param {string|number} [props.product.salla_product_id] — Salla platform product id.
 * @param {function} props.onToggle           — Called with `product.id` when the toggle changes.
 * @param {boolean}  [props.fading=false]     — When `true`, the row fades out and is non-interactive
 *                                              (used during optimistic removal animations).
 * @param {boolean}  [props.showPreview=false] — When `true`, renders the external Salla preview column.
 * @returns {JSX.Element}
 */
export default function ProductRow({ product, onToggle, fading = false, showPreview = false }) {
    const { auth } = usePage().props;

    const sallaMerchantId = auth?.user?.salla_merchant_id;
    const sallaProductId  = product.salla_product_id;

    // Build a URL-safe slug from the product name.
    // The regex preserves Arabic Unicode block (U+0621–U+064A) alongside
    // standard word characters so Arabic product names produce valid slugs.
    const productSlug = product.name
        ? product.name.toString().toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\u0621-\u064A\w\-]+/g, '')
            .replace(/--+/g, '-')
        : t.fallback_slug;

    // Preview URL is only constructable when both merchant and product ids are present.
    const previewUrl = (sallaMerchantId && sallaProductId)
        ? `https://salla.sa/intend/${sallaMerchantId}/${productSlug}/p${sallaProductId}`
        : null;

    return (
        <div
            className={`
                grid gap-4 px-8 py-4 items-center
                ${showPreview ? COLS_WITH_PREVIEW : COLS_WITHOUT_PREVIEW}
                transition-all duration-300
                ${fading ? 'opacity-0 -translate-y-1 pointer-events-none' : 'opacity-100 translate-y-0'}
            `}
        >
            {/* ── Product info: avatar + name + Salla id ─────────────── */}
            <div className="flex items-center gap-4 min-w-0">
                <ProductAvatar
                    src={product.image}
                    name={product.name}
                    size={40}
                    radius="rounded-xl"
                />
                <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[var(--foreground)] truncate uppercase tracking-tight">
                        {product.name}
                    </p>
                    {/* Salla product id displayed in monospace for easy scanning */}
                    <p className="text-[10px] text-[var(--muted-foreground)] font-mono uppercase">
                        {product.salla_product_id}
                    </p>
                </div>
            </div>

            {/* ── Category label ─────────────────────────────────────── */}
            <div className="flex justify-center">
                <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest">
                    {product.category}
                </span>
            </div>

            {/* ── Active status indicator ────────────────────────────── */}
            {/* Glowing dot + label that transition smoothly on state change */}
            <div className="flex justify-center items-center gap-2">
                <span
                    className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${
                        product.active
                            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                            : 'bg-gray-300'
                    }`}
                />
                <span
                    className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-500 ${
                        product.active ? 'text-emerald-600' : 'text-[var(--muted-foreground)]'
                    }`}
                >
                    {product.active ? t.status_active : t.status_inactive}
                </span>
            </div>

            {/* ── Toggle switch ──────────────────────────────────────── */}
            <div className="flex justify-center">
                <Toggle
                    checked={product.active}
                    onChange={() => onToggle(product.id)}
                />
            </div>

            {/* ── Preview link — rendered only when showPreview=true ─── */}
            {showPreview && (
                <div className="flex justify-center">
                    {previewUrl ? (
                        // Active button: opens the Salla storefront product page.
                        <RowActionButton
                            href={previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="active"
                            icon={<ExternalLink size={11} />}
                        >
                            {t.preview_btn}
                        </RowActionButton>
                    ) : (
                        // Disabled button: shown when merchant or product id is missing.
                        <RowActionButton
                            variant="disabled"
                            icon={<ExternalLink size={11} />}
                            title={t.preview_disabled_title}
                        >
                            {t.preview_btn}
                        </RowActionButton>
                    )}
                </div>
            )}
        </div>
    );
}