import { Loader2, SlidersHorizontal, AlertCircle, Sparkles } from 'lucide-react';
import { WASTE_MIN, WASTE_MAX, COVERAGE_MIN, COVERAGE_MAX } from '../../../constants/calculatorSettings';

const t = {
    card_title:    "Smart Calculator Settings",
    card_subtitle: "Set the default calculation rules for your store's products",

    banner_body: "The values set below will automatically apply as global defaults to all products to save your time. You can easily customize any specific product independently from the Products page.",

    coverage_label:       "Default Coverage per Unit (m²)",
    coverage_hint:        `How many m² does one unit/box cover? (${COVERAGE_MIN}–${COVERAGE_MAX} m²)`,
    coverage_placeholder: "e.g. 4.00",

    waste_label:       "Default Waste Percentage (%)",
    waste_hint:        `Extra material buffer for cutting/offcuts (${WASTE_MIN}–${WASTE_MAX}%). Recommended: 10–20%.`,
    waste_placeholder: "e.g. 20",

    btn_saving: "Saving...",
    btn_save:   "Save Global Settings",
};

function Field({ label, hint, value, onChange, min, max, step, placeholder, error }) {
    return (
        <div className="space-y-2 text-left" dir="ltr">
            <label className="block text-[14px] font-bold text-[var(--foreground)] opacity-90">
                {label}
            </label>
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

export default function SettingsForm({
    coverage, waste, errors, isSaving,
    onCoverageChange, onWasteChange, onSave,
}) {
    return (
        <div className="space-y-6 max-w-2xl mx-auto" dir="ltr">

            {/* Header */}
            <div className="bg-[var(--card)] px-8 py-6 rounded-[1.5rem] border border-[var(--border)] shadow-sm">
                <div className="flex items-center justify-between gap-4">
                    <div className="text-left">
                        <h1 className="text-xl font-bold text-[var(--foreground)]">{t.card_title}</h1>
                        <p className="text-xs text-[var(--muted-foreground)] mt-1">{t.card_subtitle}</p>
                    </div>
                    <div className="p-3 bg-[var(--primary)]/10 rounded-2xl text-[var(--primary)] shrink-0">
                        <SlidersHorizontal size={22} />
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="bg-[var(--card)] px-8 py-7 rounded-[1.5rem] border border-[var(--border)] shadow-sm space-y-6">

                {/* Explanation banner */}
                <div className="bg-[var(--primary)]/[0.04] border border-[var(--primary)]/10 rounded-2xl p-4 flex gap-3 items-start">
                    <Sparkles size={15} className="text-[var(--primary)] mt-0.5 shrink-0" />
                    <p className="text-[12px] text-[var(--muted-foreground)] leading-relaxed text-left">
                        {t.banner_body}
                    </p>
                </div>

                {/* Coverage */}
                <Field
                    label={t.coverage_label}
                    hint={t.coverage_hint}
                    value={coverage ?? ""}
                    onChange={onCoverageChange}
                    min={COVERAGE_MIN}
                    max={COVERAGE_MAX}
                    step="0.01"
                    placeholder={t.coverage_placeholder}
                    error={errors.coverage}
                />

                <div className="border-t border-[var(--border)] opacity-60" />

                {/* Waste */}
                <Field
                    label={t.waste_label}
                    hint={t.waste_hint}
                    value={waste ?? ""}
                    onChange={onWasteChange}
                    min={WASTE_MIN}
                    max={WASTE_MAX}
                    step="0.1"
                    placeholder={t.waste_placeholder}
                    error={errors.waste}
                />

                {/* Save */}
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
                            ? <><Loader2 size={18} className="animate-spin" /> {t.btn_saving}</>
                            : t.btn_save
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}