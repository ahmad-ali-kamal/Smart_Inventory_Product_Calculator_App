// Components/Settings/SettingsField.jsx
//
// Single Responsibility: render ONE labelled number input with its error state.
// Receives everything via props — zero internal logic, pure presentational.
//
import { AlertCircle } from 'lucide-react';

/**
 * @param {string}   label       — Uppercase label text
 * @param {string}   hint        — Small hint shown below the label
 * @param {string}   value       — Controlled input value
 * @param {function} onChange    — Change handler
 * @param {number}   min         — HTML min attribute
 * @param {number}   max         — HTML max attribute
 * @param {number}   step        — HTML step attribute
 * @param {string}   placeholder — Input placeholder
 * @param {string}   error       — Validation error message (or undefined)
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
            <label className="block text-xs font-black uppercase tracking-widest text-[var(--muted-foreground)]">
                {label}
            </label>

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

                {error && (
                    <p className="text-red-500 text-[10px] mt-2 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
}