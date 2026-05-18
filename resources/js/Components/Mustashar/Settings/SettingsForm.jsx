// resources/js/Components/Mustashar/Settings/SettingsForm.jsx
import { Loader2, SlidersHorizontal } from 'lucide-react';
import SettingsField from './SettingsField';
import { WASTE_MIN, WASTE_MAX } from '../../../constants/calculatorSettings';

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