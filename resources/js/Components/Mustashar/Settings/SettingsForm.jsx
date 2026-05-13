// Components/Settings/SettingsForm.jsx
import { Loader2, SlidersHorizontal } from 'lucide-react';
import SettingsField from './SettingsField';
import { WASTE_MIN, WASTE_MAX, UNIT_TYPES } from '../../../constants/calculatorSettings';

export default function SettingsForm({
    waste,
    unitType,
    minInputArea,
    maxInputArea,
    errors,
    isSaving,
    onWasteChange,
    onUnitTypeChange,
    onMinAreaChange,
    onMaxAreaChange,
    onSave,
}) {
    return (
        <div className="bg-[var(--card)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm space-y-6 text-[var(--foreground)]">

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

            <div className="space-y-2">
                <label className="block text-sm font-black text-[var(--foreground)] uppercase tracking-widest">
                    Unit Type
                </label>
                <div className="flex gap-3">
                    {UNIT_TYPES.map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => onUnitTypeChange({ target: { value: type } })}
                            className={`
                                px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest
                                border-2 transition-all
                                ${unitType === type
                                    ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]'
                                    : 'border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/50'
                                }
                            `}
                        >
                            {type}
                        </button>
                    ))}
                </div>
                <p className="text-[10px] text-[var(--muted-foreground)]">
                    Select the unit of measurement for area calculation
                </p>
                {errors.unit_type && (
                    <p className="text-xs text-red-500">{errors.unit_type}</p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <SettingsField
                    label="Min Input Area"
                    hint="Minimum area customer can enter"
                    value={minInputArea}
                    onChange={onMinAreaChange}
                    min="0"
                    step="0.01"
                    placeholder="e.g., 0.01"
                    error={errors.min_input_area}
                />

                <SettingsField
                    label="Max Input Area"
                    hint="Maximum area customer can enter"
                    value={maxInputArea}
                    onChange={onMaxAreaChange}
                    min="0"
                    step="0.01"
                    placeholder="e.g., 100"
                    error={errors.max_input_area}
                />
            </div>

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