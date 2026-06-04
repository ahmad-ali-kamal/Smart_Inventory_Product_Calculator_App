/**
 * @file SettingsForm.jsx
 * @module Components/Mustashar/Settings
 *
 * Presentational form component for the Mustashar Calculator Settings screen.
 * Renders two numeric fields (coverage per unit and waste percentage) with
 * validation error display, a descriptive banner, and a save button.
 *
 * This component is intentionally **stateless** — it owns no fetching or
 * mutation logic. All state and handlers are injected via props from the
 * `useSettingsForm` hook, keeping this file a pure UI shell that is easy
 * to test and visually iterate on in isolation.
 *
 * Used by: Settings (page component)
 */
import { useTranslation } from 'react-i18next';
import { Loader2, SlidersHorizontal, AlertCircle, Sparkles } from 'lucide-react';
import { WASTE_MIN, WASTE_MAX, COVERAGE_MIN, COVERAGE_MAX } from '../../../constants/calculatorSettings';

// ── Internal sub-components ───────────────────────────────────────────────────

/**
 * Field
 *
 * Reusable labelled number input with an optional hint and inline error message.
 * Both the Coverage and Waste rows use this component so styling is consistent.
 *
 * @param {object}         props
 * @param {string}         props.label       - Visible field label text.
 * @param {string}         [props.hint]      - Secondary descriptive text below the label.
 * @param {string|number}  props.value       - Controlled input value.
 * @param {function}       props.onChange    - Change handler forwarded to the input element.
 * @param {number}         props.min         - HTML min constraint for the number input.
 * @param {number}         props.max         - HTML max constraint for the number input.
 * @param {string}         [props.step]      - HTML step attribute (defaults to "0.01").
 * @param {string}         props.placeholder - Placeholder text shown when the input is empty.
 * @param {string}         [props.error]     - Validation error message; renders a red hint when set.
 *
 * @returns {JSX.Element}
 */
function Field({ label, hint, value, onChange, min, max, step, placeholder, error }) {
    return (
        <div className="space-y-2 text-start">
            <label className="block text-[14px] font-bold text-[var(--foreground)] opacity-90">
               {label}
            </label>
            {/* Render the hint paragraph only when content is provided */}
            {hint && (
                <p className="text-[12px] text-[var(--muted-foreground)] leading-relaxed opacity-85">{hint}</p>
            )}
            <div className="pt-1">
                <input
                    type="number"
                    value={value}
                    min={min}
                    max={max}
                    step={step ?? '0.01'}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`
                        w-full bg-[var(--muted)] border rounded-xl px-4 py-3
                        text-sm font-medium focus:ring-2 outline-none transition-all
                        text-[var(--foreground)] placeholder-[var(--muted-foreground)]/40
                        ${error
                            ? 'border-red-400 focus:ring-red-400/20'
                            : 'border-[var(--border)] focus:ring-[var(--primary)]/20'
                        }
                    `}
                />
                {/* Inline error — shown directly below the input for immediate feedback */}
                {error && (
                    <p className="text-red-500 text-[11px] mt-1.5 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

/**
 * SettingsForm
 *
 * @param {object}   props
 * @param {string}   props.coverage          - Controlled value for the coverage input.
 * @param {string}   props.waste             - Controlled value for the waste input.
 * @param {{ coverage?: string, waste?: string }} props.errors
 *                                           - Field-level validation errors; empty object when valid.
 * @param {boolean}  props.isSaving          - When true, disables the save button and shows a spinner.
 * @param {function} props.onCoverageChange  - onChange handler for the coverage field.
 * @param {function} props.onWasteChange     - onChange handler for the waste field.
 * @param {function} props.onSave            - Called when the save button is clicked.
 *
 * @returns {JSX.Element}
 */
export default function SettingsForm({
    coverage, waste, errors, isSaving,
    onCoverageChange, onWasteChange, onSave,
}) {
       const { t } = useTranslation('mustashar');
    return (
        <div className="w-full max-w-7xl mx-auto space-y-6">

            {/* ── Header card ────────────────────────────────────────────────── */}
            <div className="bg-[var(--card)] px-8 py-6 rounded-[1.5rem] border border-[var(--border)] shadow-sm">
                <div className="flex items-center gap-4">
                    {/* Decorative icon badge */}
                    <div className="p-3 bg-[var(--primary)]/10 rounded-2xl text-[var(--primary)] shrink-0">
                        <SlidersHorizontal size={22} />
                    </div>
                    <div className="text-start">
                        <h1 className="text-xl font-bold text-[var(--foreground)]">{t('settings.card_title')}</h1>
                        <p className="text-xs text-[var(--muted-foreground)] mt-1">{t('settings.card_subtitle')}</p>
                    </div>
                </div>
            </div>

            {/* ── Form card ──────────────────────────────────────────────────── */}
            <div className="bg-[var(--card)] px-8 py-7 rounded-[1.5rem] border border-[var(--border)] shadow-sm space-y-6">

                {/* Explanation banner — sets user expectations before they touch any field */}
                <div className="bg-[var(--primary)]/[0.04] border border-[var(--primary)]/10 rounded-2xl p-4 flex gap-3 items-start">
                    <Sparkles size={15} className="text-[var(--primary)] mt-0.5 shrink-0" />
                    <p className="text-[12px] text-[var(--muted-foreground)] leading-relaxed text-start">
                        {t('settings.banner_body')}
                    </p>
                </div>

                {/* Coverage field */}
                <Field
                    label={t('settings.coverage_label')}
                    hint={t('settings.coverage_hint')}
                    value={coverage ?? ""}
                    onChange={onCoverageChange}
                    min={COVERAGE_MIN}
                    max={COVERAGE_MAX}
                    step="0.01"
                    placeholder={t('settings.coverage_placeholder')}
                    error={errors.coverage}
                />

                {/* Visual separator between the two fields */}
                <div className="border-t border-[var(--border)] opacity-60" />

                {/* Waste field */}
                <Field
                    label={t('settings.waste_label')}
                    hint={t('settings.waste_hint')}
                    value={waste ?? ""}
                    onChange={onWasteChange}
                    min={WASTE_MIN}
                    max={WASTE_MAX}
                    step="0.1"
                    placeholder={t('settings.waste_placeholder')}
                    error={errors.waste}
                />

                {/* Save button — spinner replaces text while the mutation is in-flight */}
                <div className="pt-2">
                    <button
                        onClick={onSave}
                        disabled={isSaving}
                        className={`
                            w-full py-3.5 rounded-xl font-bold text-sm tracking-wide
                            transition-all flex items-center justify-center gap-2
                            bg-[var(--primary)] text-white shadow-sm
                            ${isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-95 active:scale-[0.99]'}
                        `}
                    >
                        {isSaving
                            ? <><Loader2 size={18} className="animate-spin" /> {t('settings.btn_saving')}</>
                            : t('settings.btn_save')
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}