import { Loader2, SlidersHorizontal } from 'lucide-react';
import SettingsField from './SettingsField';
import { WASTE_MIN, WASTE_MAX, UNIT_TYPES } from '../../../constants/calculatorSettings';

// إصلاح: تحويل المفاتيح إلى أحرف صغيرة لتطابق القيم البرمجية m2, cm2, mm2
const UNIT_LABELS = {
    m2:  'm²',
    cm2: 'cm²',
    mm2: 'mm²',
};

export default function SettingsForm({
    waste, unitType, minInputArea, maxInputArea,
    errors, isSaving,
    onWasteChange, onUnitTypeChange, onMinAreaChange, onMaxAreaChange, onSave,
}) {
    return (
        <div className="bg-[var(--card)] p-8 rounded-[1.5rem] border border-[var(--border)] shadow-sm space-y-8 text-[var(--foreground)] max-w-2xl mx-auto">

            {/* Header - تحسين المسافات */}
            <div className="flex items-center gap-4 pb-6 border-b border-[var(--border)]">
                <div className="p-3 bg-[var(--primary)]/10 rounded-2xl text-[var(--primary)]">
                    <SlidersHorizontal size={22} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-[var(--foreground)]">Calculator Settings</h1>
                    <p className="text-sm text-[var(--muted-foreground)]">
                        Configure calculation rules for your store
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Waste Percentage */}
                <SettingsField
                    label="Waste Percentage (%)"
                    hint={`Extra safety margin — Recommended ${WASTE_MIN}% to ${WASTE_MAX}%`}
                    value={waste}
                    onChange={onWasteChange}
                    min={WASTE_MIN}
                    max={WASTE_MAX}
                    step="0.1"
                    placeholder="10"
                    error={errors.waste}
                />

                {/* Unit Type - تحسين شكل الأزرار */}
                <div className="space-y-2">
                    <label className="block text-[13px] font-bold text-[var(--foreground)] opacity-80">
                        Unit Type
                    </label>
                    <div className="flex gap-2 p-1 bg-[var(--muted)] rounded-xl w-fit">
                        {UNIT_TYPES.map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => onUnitTypeChange({ target: { value: type } })}
                                className={`
                                    px-6 py-2 rounded-lg font-bold text-sm transition-all
                                    ${unitType === type
                                        ? 'bg-[var(--card)] text-[var(--primary)] shadow-sm'
                                        : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                                    }
                                `}
                            >
                                {UNIT_LABELS[type] || type}
                            </button>
                        ))}
                    </div>
                    {errors.unit_type && (
                        <p className="text-xs text-red-500 mt-1">{errors.unit_type}</p>
                    )}
                </div>

                {/* Min / Max Area - تحسين التوزيع */}
                <div className="grid grid-cols-2 gap-6">
    <SettingsField
        label="Minimum Area"
        hint="Smallest project area you can cover." // نص قصير ومباشر
        value={minInputArea}
        onChange={onMinAreaChange}
        min="0"
        step="0.01"
        placeholder="e.g. 1.0"
        error={errors.min_input_area}
    />
    <SettingsField
        label="Maximum Area"
        hint="Largest area allowed per calculation." // نص قصير ومباشر
        value={maxInputArea}
        onChange={onMaxAreaChange}
        min="0"
        step="0.01"
        placeholder="e.g. 1000.0"
        error={errors.max_input_area}
    />
</div>
            </div>

            {/* Save Button - جعل الحواف أقل حدة */}
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
                        <><Loader2 size={18} className="animate-spin" /> Saving changes...</>
                    ) : (
                        'Save Configuration'
                    )}
                </button>
            </div>
        </div>
    );
}