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

import { Zap, EyeOff, BadgePercent, Percent, Calendar, Tag } from 'lucide-react';
import Card from '../../Common/UI/Card';
import HintBox from './HintBox';
import Toggle from '../../Common/Toggle';
import SaveButton from './SaveButton';
import { useTranslation } from 'react-i18next';
import { YELLOW_BATCH_LABELS } from '../../../constants/inventorySettings';

// ---------------------------------------------------------------------------
// Automation row definitions
// Each entry maps to a single toggle row rendered inside the card.
// Defined outside the component so the array reference is stable across renders.
// ---------------------------------------------------------------------------
function getAutomationRows(t) {
    return [
        {
            key: 'autoHide',
            icon: <EyeOff size={18} />,
            title: t('automation_card.auto_hide_title'),
            desc: t('automation_card.auto_hide_desc'),
        },
        {
            key: 'autoDiscount',
            icon: <BadgePercent size={18} />,
            title: t('automation_card.auto_discount_title'),
            desc: t('automation_card.auto_discount_desc'),
        },
    ];
}

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
    yellowLabel,
    errors,
    onToggle,
    onInputChange,
    onYellowLabelChange,
    onSave,
    saving,
    saved,
    saveDisabled,
    saveError,
}) {
    const { t } = useTranslation('harees');
    return (
        <Card className="p-5 space-y-1">

            {/* ── Toggle rows ────────────────────────────────────────────── */}
            {getAutomationRows(t).map(({ key, icon, title, desc }) => (
                <div key={key}>

                    {/* Toggle row — border-b removed on the last row via last:border-0 */}
                    <div className={`py-3 border-b border-[var(--border)] last:border-0`}>
                        <div className="flex items-start justify-between gap-4">
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

                        {/* Hint box — indented to align with title/desc text, matching icon width (w-8) + gap-3 */}
                        {key === 'autoDiscount' && automation.autoDiscount && (
                            <div className="mt-2">
                                <HintBox message={t('automation_card.auto_discount_hint')} />
                            </div>
                        )}
                    </div>

                    {/* Discount config panel — only mounted when autoDiscount is on */}
                    {key === 'autoDiscount' && automation.autoDiscount && (
                        <DiscountPanel
                            discountConfig={discountConfig}
                            errors={errors}
                            onInputChange={onInputChange}
                            t={t}
                        />
                    )}
                </div>
            ))}

            {/* ── Yellow batch label section ─────────────────────────────── */}
            <div className="py-3 border-b border-[var(--border)]">
                <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-[var(--muted-foreground)]">
                        <Tag size={18} />
                    </span>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-[var(--foreground)]">
                            {t('automation_card.yellow_label_title')}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                            {t('automation_card.yellow_label_desc')}
                        </p>
                        <div className="mt-2">
                            <select
                                value={yellowLabel}
                                onChange={(e) => onYellowLabelChange(e.target.value)}
                                className="w-full p-2.5 rounded-xl border border-[var(--primary)]/20 bg-[var(--muted)] text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-[var(--primary)]/30"
                            >
                                {YELLOW_BATCH_LABELS.map((label) => (
                                    <option key={label} value={label}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Save button ────────────────────────────────────────────── */}
            <div className="pt-4 border-t border-[var(--border)]">
                <SaveButton
                    onSave={onSave}
                    saving={saving}
                    saved={saved}
                    disabled={saveDisabled}
                    saveError={saveError}
                />
            </div>
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
function DiscountPanel({ discountConfig, errors, onInputChange, t }) {
    return (
        <div className="mx-1 mb-3 mt-1 p-4 rounded-2xl bg-[var(--muted)]/40 border border-[var(--primary)]/20 space-y-3">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                {/* ── Discount % ─────────────────────────────────────────── */}
                <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-[var(--muted-foreground)] uppercase flex items-center gap-1">
                        <Percent size={9} /> {t('automation_card.discount_percent_label')}
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
                            className="w-full p-3 pe-7 bg-transparent text-[var(--foreground)] text-sm font-bold outline-none ring-0 focus:ring-0 border-none shadow-none"
                        />
                        <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] text-xs">
                            {t('automation_card.suffix_percent')}
                        </span>
                    </div>
                    {errors['discount.percent'] && (
                        <p className="text-[10px] text-red-500 font-medium">{errors['discount.percent']}</p>
                    )}
                </div>

                {/* ── Duration ───────────────────────────────────────────── */}
                <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-[var(--muted-foreground)] uppercase flex items-center gap-1">
                        <Calendar size={9} /> {t('automation_card.discount_duration_label')}
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
                            className="w-full p-3 pe-10 bg-transparent text-[var(--foreground)] text-sm font-bold outline-none ring-0 focus:ring-0 border-none shadow-none"
                        />
                        <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] text-[9px]">
                            {t('automation_card.suffix_days')}
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