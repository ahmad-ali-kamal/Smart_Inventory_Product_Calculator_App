// Components/Settings/ThresholdCard.jsx
//
// Single Responsibility: render the "Alert Thresholds" card.
// Pure presentational — no state, no logic.
//
import { Settings2, AlertCircle } from 'lucide-react';
import Card from '../../Common/Card';

const THRESHOLD_KEYS = ['short', 'medium', 'long'];

/**
 * @param {object}   thresholds        — { short, medium, long }
 * @param {object}   errors            — flat errors object
 * @param {function} onInputChange     — (field, value, group) => void
 */
export default function ThresholdCard({ thresholds, errors, onInputChange }) {
    return (
        <Card className="p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--secondary)] flex items-center justify-center text-[var(--primary)] flex-shrink-0">
                    <Settings2 size={15} />
                </div>
                <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">Alert Thresholds</p>
                    <p className="text-xs text-[var(--muted-foreground)]">Set days before expiry (1 – 1095 days)</p>
                </div>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-3 gap-3">
                {THRESHOLD_KEYS.map((key) => {
                    const errorKey = `thresholds.${key}`;
                    const hasError = Boolean(errors[errorKey]);
                    return (
                        <div key={key} className="space-y-1">
                            <label className="text-xs text-[var(--muted-foreground)] block capitalize">
                                {key}-term
                            </label>
                            <div className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-[var(--muted)] border transition-all ${
                                hasError
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-[var(--border)] focus-within:border-[var(--primary)]'
                            }`}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={thresholds[key]}
                                    onChange={(e) => onInputChange(key, e.target.value, 'thresholds')}
                                    className="w-full bg-transparent text-sm font-semibold text-[var(--foreground)] outline-none border-none p-0 ring-0 focus:ring-0 shadow-none"
                                />
                                <span className="text-xs text-[var(--muted-foreground)] flex-shrink-0">days</span>
                            </div>
                            {hasError && (
                                <p className="text-[10px] text-red-500 font-medium flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                                    <AlertCircle size={10} />
                                    {errors[errorKey]}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}