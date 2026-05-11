// Components/Settings/SettingsForm.jsx
import { Loader2, SlidersHorizontal } from 'lucide-react';
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

            {/* Header inside the card */}
            <div className="flex items-center gap-4 pb-2 border-b border-[var(--border)]">
                <div className="p-3 bg-[var(--primary)]/10 rounded-2xl text-[var(--primary)]">
                    <SlidersHorizontal size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-black text-[var(--foreground)]">Calculator Settings</h1>
                    <p className="text-sm text-[var(--muted-foreground)] uppercase tracking-widest font-medium">
                        Configure calculation parameters for products
                    </p>
                </div>
            </div>

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