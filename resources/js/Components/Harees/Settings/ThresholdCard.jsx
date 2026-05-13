/**
 * @file ThresholdCard.jsx
 * @module Components/Harees/Settings
 *
 * @description
 * Presentational card that renders the "Alert Thresholds" section of the
 * Harees Settings page.
 *
 * Responsibilities:
 *  - Iterates over `THRESHOLD_KEYS` to render three labelled numeric inputs:
 *    short-term, medium-term, and long-term expiry thresholds.
 *  - Applies red border + animated error message beneath any field that has
 *    a validation error in the `errors` prop.
 *
 * Single Responsibility: rendering only. No state, no logic.
 * All values and handlers are received via props from `useInventorySettingsForm`.
 */

import { Settings2, AlertCircle } from 'lucide-react';
import Card from '../../Common/UI/Card';

// ---------------------------------------------------------------------------
// i18n strings — move these values to a JSON translation file when ready.
// ---------------------------------------------------------------------------
const t = {
    card_title:    "Alert Thresholds",
    card_subtitle: "Set days before expiry (1 – 1095 days)",
    field_suffix:  "days",            // unit label appended to each input
    label_suffix:  "-term",          // appended to each key to form the field label
};

// ---------------------------------------------------------------------------
// Threshold field keys — order determines left-to-right column order.
// ---------------------------------------------------------------------------
const THRESHOLD_KEYS = ['short', 'medium', 'long'];

/**
 * Alert Thresholds card with three numeric day inputs.
 *
 * @param {object} props
 * @param {{ short: number|string, medium: number|string, long: number|string }} props.thresholds
 *   — Current threshold values for each term.
 * @param {Record<string, string>} props.errors
 *   — Flat validation errors object keyed as `"thresholds.<key>"`.
 * @param {function} props.onInputChange
 *   — Change handler: `(field, value, group) => void`.
 *   — Called with group `"thresholds"` and the field key.
 * @returns {JSX.Element}
 */
export default function ThresholdCard({ thresholds, errors, onInputChange }) {
    return (
        <Card className="p-5 space-y-4">

            {/* ── Card header ───────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--secondary)] flex items-center justify-center text-[var(--primary)] flex-shrink-0">
                    <Settings2 size={15} />
                </div>
                <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">{t.card_title}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{t.card_subtitle}</p>
                </div>
            </div>

            {/* ── Threshold fields ───────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-3">
                {THRESHOLD_KEYS.map((key) => {
                    const errorKey = `thresholds.${key}`;
                    const hasError = Boolean(errors[errorKey]);

                    return (
                        <div key={key} className="space-y-1">

                            {/* Field label — e.g. "short-term" */}
                            <label className="text-xs text-[var(--muted-foreground)] block capitalize">
                                {key}{t.label_suffix}
                            </label>

                            {/* Input wrapper — border colour driven by error state */}
                            <div className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-[var(--muted)] border transition-all ${
                                hasError
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-[var(--border)] focus-within:border-[var(--primary)]'
                            }`}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={thresholds[key]}
                                    onChange={(e) => onInputChange(key, e.target.value, 'thresholds')}
                                    className="w-full bg-transparent text-sm font-semibold text-[var(--foreground)] outline-none border-none p-0 ring-0 focus:ring-0 shadow-none"
                                />
                                {/* Unit suffix — always visible for clarity */}
                                <span className="text-xs text-[var(--muted-foreground)] flex-shrink-0">
                                    {t.field_suffix}
                                </span>
                            </div>

                            {/* Inline error message — animates in when the field is invalid */}
                            {hasError && (
                                <p className="text-[10px] text-red-500 font-medium flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                                    <AlertCircle size={10} />
                                    {errors[errorKey]}
                                </p>
                            )}

                        </div>
                    );
                })}
            </div>

        </Card>
    );
}