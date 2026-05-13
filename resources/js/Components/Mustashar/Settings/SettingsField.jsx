/**
 * @file SettingsField.jsx
 * @module Components/Mustashar/Settings
 *
 * @description
 * Purely presentational component that renders a single labelled number input
 * with its associated hint text and inline validation error state.
 *
 * Single Responsibility: this component owns zero business logic.
 * It receives all data and behaviour through props and delegates upward.
 *
 * Used by: SettingsForm.jsx (renders two instances — one for coverage, one for waste).
 */

import { AlertCircle } from 'lucide-react';

// ---------------------------------------------------------------------------
// i18n strings — move these values to your JSON translation file when ready.
// ---------------------------------------------------------------------------
const t = {
    error_icon_aria: "Validation error",
};

/**
 * A labelled number input with optional hint text and inline error display.
 *
 * @param {object}   props
 * @param {string}   props.label       — Uppercase label text rendered above the input.
 * @param {string}   [props.hint]      — Small secondary hint shown below the label.
 * @param {string}   props.value       — Controlled input value (string form of a number).
 * @param {function} props.onChange    — Change handler forwarded to the <input> element.
 * @param {number}   props.min         — HTML `min` attribute for the number input.
 * @param {number}   props.max         — HTML `max` attribute for the number input.
 * @param {number}   props.step        — HTML `step` attribute (decimal precision).
 * @param {string}   [props.placeholder] — Placeholder text shown when the field is empty.
 * @param {string}   [props.error]     — Validation error message. When truthy, the input
 *                                       turns red and the message is shown below it.
 * @returns {JSX.Element}
 */
export default function SettingsField({
    label,
    hint,
    value,
    onChange,
    min,
    max,
    step,
    placeholder,
    error,
}) {
    // Build the input class string once; swap border/ring colours based on error state.
    const inputClass = `
        w-full bg-[var(--muted)] border rounded-2xl p-4
        text-lg font-bold focus:ring-2 outline-none transition-all
        text-[var(--foreground)] placeholder-[var(--muted-foreground)]
        ${error
            ? 'border-red-400 focus:ring-red-400/30'
            : 'border-[var(--border)] focus:ring-[var(--primary)]'
        }
    `;

    return (
        <div className="space-y-4">
            {/* Field label — intentionally uppercase via CSS class for visual hierarchy */}
            <label className="block text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)]">
                {label}
            </label>

            {/* Optional hint — rendered only when the prop is provided */}
            {hint && (
                <p className="text-[11px] text-[var(--muted-foreground)] -mt-2">
                    {hint}
                </p>
            )}

            <div>
                <input
                    type="number"
                    value={value}
                    min={min}
                    max={max}
                    step={step}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={inputClass}
                />

                {/* Inline error message — only rendered when `error` prop is truthy */}
                {error && (
                    <p className="text-red-500 text-[10px] mt-2 flex items-center gap-1">
                        <AlertCircle size={12} aria-label={t.error_icon_aria} />
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
}