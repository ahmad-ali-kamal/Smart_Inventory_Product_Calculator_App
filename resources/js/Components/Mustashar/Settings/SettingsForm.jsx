// Components/Settings/SettingsForm.jsx
//
// Single Responsibility: render the input card (two fields + save button).
// Receives all data and handlers from the parent — no logic of its own.
//
import { Loader2 } from 'lucide-react';
import SettingsField from './SettingsField';
import {
    COVERAGE_MIN, COVERAGE_MAX,
    WASTE_MIN,    WASTE_MAX,
} from '../../../constants/calculatorSettings';

export default function SettingsForm({
    coverage,
    waste,
    errors,
    isSaving,
    onCoverageChange,
    onWasteChange,
    onSave,
}) {
    return (
        <div className="bg-[var(--card)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm space-y-6 text-[var(--foreground)]">

            <SettingsField
                label="Unit Coverage (m²)"
                hint={`Area covered by one unit — between ${COVERAGE_MIN} and ${COVERAGE_MAX} m²`}
                value={coverage}
                onChange={onCoverageChange}
                min={COVERAGE_MIN}
                max={COVERAGE_MAX}
                step="0.01"
                placeholder="e.g., 2.56"
                error={errors.coverage}
            />

            <SettingsField
                label="Waste Percentage (%)"
                hint={`Extra safety margin — from ${WASTE_MIN}% up to ${WASTE_MAX}%`}
                value={waste}
                onChange={onWasteChange}
                min={WASTE_MIN}
                max={WASTE_MAX}
                step="0.1"
                placeholder="e.g., 10"
                error={errors.waste}
            />

            <button
                onClick={onSave}
                disabled={isSaving}
                className={`
                    w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest
                    transition-all shadow-lg flex items-center justify-center gap-2
                    bg-[var(--primary)] text-white
                    ${isSaving
                        ? 'opacity-70 cursor-not-allowed'
                        : 'hover:opacity-90 active:scale-95 shadow-indigo-500/20'
                    }
                `}
            >
                {isSaving ? (
                    <>
                        <Loader2 size={15} className="animate-spin" />
                        Saving...
                    </>
                ) : (
                    'Save All Settings'
                )}
            </button>
        </div>
    );
}