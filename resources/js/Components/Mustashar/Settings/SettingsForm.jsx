
import { Loader2, SlidersHorizontal } from 'lucide-react';
import SettingsField from './SettingsField';
import { WASTE_MIN, WASTE_MAX } from '../../../constants/calculatorSettings';

// ---------------------------------------------------------------------------
// i18n strings — move these values to your JSON translation file when ready.
// ---------------------------------------------------------------------------
const t = {
    // Card header
    card_title:           "Calculator Settings",
    card_subtitle:        "Configure calculation parameters for products",

    // Coverage field
    coverage_label:       "Unit Coverage (m²)",
    coverage_hint:        (min, max) => `Area covered by one unit — between ${min} and ${max} m²`,
    coverage_placeholder: "e.g., 2.56",

    // Waste field
    waste_label:       "Waste Percentage (%)",
    waste_hint:        (min, max) => `Extra safety margin — from ${min}% up to ${max}%`,
    waste_placeholder: "e.g., 10",

    // Save button
    btn_saving: "Saving...",
    btn_save:   "Save All Settings",
};

/**
 * Renders the settings card containing two `SettingsField` inputs and a save button.
 *
 * @param {object}   props
 * @param {string}   props.coverage         — Controlled value for the coverage input.
 * @param {string}   props.waste            — Controlled value for the waste input.
 * @param {{ coverage?: string, waste?: string }} props.errors
 *                                          — Validation error messages keyed by field name.
 * @param {boolean}  props.isSaving         — When `true`, the save button shows a spinner
 *                                            and is disabled.
 * @param {function} props.onCoverageChange — Change handler for the coverage input.
 * @param {function} props.onWasteChange    — Change handler for the waste input.
 * @param {function} props.onSave          — Click handler for the save button.
 * @returns {JSX.Element}
 */
export default function SettingsForm({
    waste,
    errors,
    isSaving,
    onWasteChange,
    onSave,
}) {
    return (
        <div className="bg-[var(--card)] p-8 rounded-[1.5rem] border border-[var(--border)] shadow-sm space-y-8 text-[var(--foreground)] max-w-2xl mx-auto">

            {/* Header */}
            <div className="flex items-center gap-4 pb-6 border-b border-[var(--border)]">
                <div className="p-3 bg-[var(--primary)]/10 rounded-2xl text-[var(--primary)]">
                    <SlidersHorizontal size={22} />
                </div>

                {/* Title + subtitle */}
                <div>
                    <h1 className="text-xl font-bold text-[var(--foreground)]">Calculator Settings</h1>
                    <p className="text-sm text-[var(--muted-foreground)]">
                        Calculation rules for your store — all measurements in square meters
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                <SettingsField
                    label="Waste Percentage (%)"
                    hint={`Safety margin added on top of the area — recommended between ${WASTE_MIN}% and ${WASTE_MAX}%`}
                    value={waste}
                    onChange={onWasteChange}
                    min={WASTE_MIN}
                    max={WASTE_MAX}
                    step="0.1"
                    placeholder="10"
                    error={errors.waste}
                />
            </div>

            {/* Save Button */}
            <div className="pt-4">
                <button
                    onClick={onSave}
                    disabled={isSaving}
                    className={`
                        w-full py-4 rounded-xl font-bold text-sm tracking-wide
                        transition-all flex items-center justify-center gap-2
                        bg-[var(--primary)] text-white shadow-md
                        ${isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-95 active:scale-[0.98]'}
                    `}
                >
                    {isSaving ? (
                        <><Loader2 size={18} className="animate-spin" /> Saving...</>
                    ) : (
                        'Save Settings'
                    )}
                </button>
            </div>
        </div>
    );
}