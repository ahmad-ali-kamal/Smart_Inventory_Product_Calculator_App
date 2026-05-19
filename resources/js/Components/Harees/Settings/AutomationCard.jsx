/**
 * @file AutomationCard.jsx
 * @module Components/Harees/Settings
 *
 * @description
 * Presentational card that renders the Automation section of the Harees
 * Settings page.
 *
 * Responsibilities:
 *  - Iterates over `AUTOMATION_ROWS` to render two labelled toggle rows:
 *    Auto-Hide Expired and Auto Discounts.
 *  - Conditionally renders the `DiscountPanel` sub-component beneath the
 *    autoDiscount row when that toggle is enabled.
 *
 * Sub-components (private, only used here):
 *  - `DiscountPanel` — two-column panel for discount % and duration inputs.
 *
 * Single Responsibility: rendering only. All state lives in `useInventorySettingsForm`.
 */

import { Zap, EyeOff, BadgePercent, Percent, Calendar } from 'lucide-react';
import Card from '../../Common/UI/Card';
import Toggle from '../../Common/Toggle';

// ---------------------------------------------------------------------------
// i18n strings — move these values to a JSON translation file when ready.
// ---------------------------------------------------------------------------
const t = {
    // Card header
    card_title: "Automation",

    // Toggle row labels and descriptions
    auto_hide_title: "Auto-Hide Expired",
    auto_hide_desc:  "Hide products automatically when expired",
    auto_discount_title: "Auto Discounts",
    auto_discount_desc:  "Apply discounts to Yellow-status products",

    // Discount panel field labels and suffixes
    discount_percent_label:  "Discount %",
    discount_duration_label: "Duration",
    suffix_percent:          "%",
    suffix_days:             "days",
};

// ---------------------------------------------------------------------------
// Automation row definitions
// Each entry maps to a single toggle row rendered inside the card.
// Defined outside the component so the array reference is stable across renders.
// ---------------------------------------------------------------------------
const AUTOMATION_ROWS = [
    {
        key:   'autoHide',
        icon:  <EyeOff size={18} />,
        title: t.auto_hide_title,
        desc:  t.auto_hide_desc,
    },
    {
        key:   'autoDiscount',
        icon:  <BadgePercent size={18} />,
        title: t.auto_discount_title,
        desc:  t.auto_discount_desc,
    },
];

/**
 * Automation settings card containing toggle rows and the conditional
 * discount configuration panel.
 *
 * @param {object}   props
 * @param {{ autoHide: boolean, autoDiscount: boolean }} props.automation
 *   — Current state of the automation flags.
 * @param {{ percent: number|string, durationDays: number|string }} props.discountConfig
 *   — Current discount field values.
 * @param {Record<string, string>} props.errors
 *   — Flat validation errors object keyed as `"group.field"`.
 * @param {function} props.onToggle
 *   — Called with the flag key when a toggle changes: `(key: string) => void`.
 * @param {function} props.onInputChange
 *   — Called on discount input changes: `(field, value, group) => void`.
 * @returns {JSX.Element}
 */
export default function AutomationCard({
    automation,
    discountConfig,
    errors,
    onToggle,
    onInputChange,
}) {
    return (
        <Card className="p-5 space-y-1">

            {/* ── Card header ───────────────────────────────────────────── */}
            <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--secondary)] flex items-center justify-center text-[var(--primary)] flex-shrink-0">
                    <Zap size={15} />
                </div>
                <p className="text-sm font-semibold text-[var(--foreground)]">{t.card_title}</p>
            </div>

            {/* ── Toggle rows ────────────────────────────────────────────── */}
            {AUTOMATION_ROWS.map(({ key, icon, title, desc }) => (
                <div key={key}>

                    {/* Toggle row — border-b removed on the last row via last:border-0 */}
                    <div className="flex items-start justify-between gap-4 py-3 border-b border-[var(--border)] last:border-0">
                        <div className="flex items-start gap-3">
                            <span className="mt-0.5 text-[var(--muted-foreground)]">{icon}</span>
                            <div>
                                <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
                                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{desc}</p>
                            </div>
                        </div>
                        <Toggle
                            checked={automation[key]}
                            onChange={() => onToggle(key)}
                        />
                    </div>

                    {/* Discount config panel — only mounted when autoDiscount is on */}
                    {key === 'autoDiscount' && automation.autoDiscount && (
                        <DiscountPanel
                            discountConfig={discountConfig}
                            errors={errors}
                            onInputChange={onInputChange}
                        />
                    )}
                </div>
            ))}
        </Card>
    );
}

// ── Private: discount config sub-panel ─────────────────────────────────────

/**
 * Two-column input panel for the discount percentage and duration fields.
 * Rendered only when the autoDiscount toggle is enabled.
 *
 * @param {object}   props
 * @param {{ percent: number|string, durationDays: number|string }} props.discountConfig
 * @param {Record<string, string>} props.errors
 * @param {function} props.onInputChange — `(field, value, group) => void`
 * @returns {JSX.Element}
 */
function DiscountPanel({ discountConfig, errors, onInputChange }) {
    return (
        <div className="mx-1 mb-3 mt-1 p-4 rounded-2xl bg-[var(--muted)]/40 border border-[var(--primary)]/20 space-y-3">
            <div className="grid grid-cols-2 gap-3">

                {/* ── Discount % ─────────────────────────────────────────── */}
                <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-[var(--muted-foreground)] uppercase flex items-center gap-1">
                        <Percent size={9} /> {t.discount_percent_label}
                    </label>
                    <div className={`relative rounded-xl border bg-[var(--muted)] transition-all ${
                        errors['discount.percent']
                            ? 'border-red-500 bg-red-50'
                            : 'border-[var(--primary)]/20'
                    }`}>
                        <input
                            type="text"
                            value={discountConfig.percent}
                            onChange={(e) => onInputChange('percent', e.target.value, 'discount')}
                            className="w-full p-3 pr-7 bg-transparent text-[var(--foreground)] text-sm font-bold outline-none ring-0 focus:ring-0 border-none shadow-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] text-xs">
                            {t.suffix_percent}
                        </span>
                    </div>
                    {errors['discount.percent'] && (
                        <p className="text-[10px] text-red-500 font-medium">{errors['discount.percent']}</p>
                    )}
                </div>

                {/* ── Duration ───────────────────────────────────────────── */}
                <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-[var(--muted-foreground)] uppercase flex items-center gap-1">
                        <Calendar size={9} /> {t.discount_duration_label}
                    </label>
                    <div className={`relative rounded-xl border bg-[var(--muted)] transition-all ${
                        errors['discount.durationDays']
                            ? 'border-red-500 bg-red-50'
                            : 'border-[var(--primary)]/20'
                    }`}>
                        <input
                            type="text"
                            value={discountConfig.durationDays}
                            onChange={(e) => onInputChange('durationDays', e.target.value, 'discount')}
                            className="w-full p-3 pr-10 bg-transparent text-[var(--foreground)] text-sm font-bold outline-none ring-0 focus:ring-0 border-none shadow-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] text-[9px]">
                            {t.suffix_days}
                        </span>
                    </div>
                    {errors['discount.durationDays'] && (
                        <p className="text-[10px] text-red-500 font-medium">{errors['discount.durationDays']}</p>
                    )}
                </div>

            </div>
        </div>
    );
}