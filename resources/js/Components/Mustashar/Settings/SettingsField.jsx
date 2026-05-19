// resources/js/Components/Mustashar/Settings/SettingsField.jsx
import { AlertCircle } from 'lucide-react';

export default function SettingsField({
    label, hint, value, onChange,
    min, max, step, placeholder, error,
}) {
    return (
        <div className="space-y-1.5">
            <label className="block text-[13px] font-bold text-[var(--foreground)] opacity-80">
                {label}
            </label>

            {/* Optional hint — rendered only when the prop is provided */}
            {hint && (
                <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">{hint}</p>
            )}

            <div className="pt-0.5">
                <input
                    type="number"
                    value={value}
                    min={min}
                    max={max}
                    step={step ?? '0.01'}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`
                        w-full bg-[var(--muted)] border rounded-xl px-4 py-2.5
                        text-sm font-medium focus:ring-2 outline-none transition-all
                        text-[var(--foreground)] placeholder-[var(--muted-foreground)]/50
                        ${error
                            ? 'border-red-400 focus:ring-red-400/20'
                            : 'border-[var(--border)] focus:ring-[var(--primary)]/20'
                        }
                    `}
                />

                {/* Inline error message — only rendered when `error` prop is truthy */}
                {error && (
                    <p className="text-red-500 text-[10px] mt-1.5 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
}