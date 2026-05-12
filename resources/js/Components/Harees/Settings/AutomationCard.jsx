// Components/Settings/AutomationCard.jsx
//
// Single Responsibility: render the Automation card — two toggles plus
// the conditional discount config panel that appears when autoDiscount is on.
//
import { Zap, EyeOff, BadgePercent, Percent, Calendar } from 'lucide-react';
import Card from '../../Common/Card';
import Toggle from '../../Common/Toggle';

const AUTOMATION_ROWS = [
    {
        key:   'autoHide',
        icon:  <EyeOff size={18} />,
        title: 'Auto-Hide Expired',
        desc:  'Hide products automatically when expired',
    },
    {
        key:   'autoDiscount',
        icon:  <BadgePercent size={18} />,
        title: 'Auto Discounts',
        desc:  'Apply discounts to Yellow-status products',
    },
];

/**
 * @param {object}   automation       — { autoHide, autoDiscount }
 * @param {object}   discountConfig   — { percent, durationDays }
 * @param {object}   errors           — flat errors object
 * @param {function} onToggle         — (key) => void
 * @param {function} onInputChange    — (field, value, group) => void
 */
export default function AutomationCard({
    automation,
    discountConfig,
    errors,
    onToggle,
    onInputChange,
}) {
    return (
        <Card className="p-5 space-y-1">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--secondary)] flex items-center justify-center text-[var(--primary)] flex-shrink-0">
                    <Zap size={15} />
                </div>
                <p className="text-sm font-semibold text-[var(--foreground)]">Automation</p>
            </div>

            {AUTOMATION_ROWS.map(({ key, icon, title, desc }) => (
                <div key={key}>
                    {/* Toggle row */}
                    <div className="flex items-start justify-between gap-4 py-3 border-b border-[var(--border)] last:border-0">
                        <div className="flex items-start gap-3">
                            <span className="mt-0.5 text-[var(--muted-foreground)]">{icon}</span>
                            <div>
                                <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
                                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{desc}</p>
                            </div>
                        </div>
                        <Toggle
                            checked={automation[key]}
                            onChange={() => onToggle(key)}
                        />
                    </div>

                    {/* Conditional discount config panel */}
                    {key === 'autoDiscount' && automation.autoDiscount && (
                        <DiscountPanel
                            discountConfig={discountConfig}
                            errors={errors}
                            onInputChange={onInputChange}
                        />
                    )}
                </div>
            ))}
        </Card>
    );
}

// ── Private: discount config sub-panel ─────────────────────────────────────
function DiscountPanel({ discountConfig, errors, onInputChange }) {
    return (
        <div className="mx-1 mb-3 mt-1 p-4 rounded-2xl bg-[var(--muted)]/40 border border-[var(--primary)]/20 space-y-3">
            <div className="grid grid-cols-2 gap-3">

                {/* Discount % */}
                <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-[var(--muted-foreground)] uppercase flex items-center gap-1">
                        <Percent size={9} /> Discount %
                    </label>
                    <div className={`relative rounded-xl border bg-[var(--muted)] transition-all ${
                        errors['discount.percent']
                            ? 'border-red-500 bg-red-50'
                            : 'border-[var(--primary)]/20'
                    }`}>
                        <input
                            type="text"
                            value={discountConfig.percent}
                            onChange={(e) => onInputChange('percent', e.target.value, 'discount')}
                            className="w-full p-3 pr-7 bg-transparent text-[var(--foreground)] text-sm font-bold outline-none ring-0 focus:ring-0 border-none shadow-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] text-xs">%</span>
                    </div>
                    {errors['discount.percent'] && (
                        <p className="text-[10px] text-red-500 font-medium">{errors['discount.percent']}</p>
                    )}
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-[var(--muted-foreground)] uppercase flex items-center gap-1">
                        <Calendar size={9} /> Duration
                    </label>
                    <div className={`relative rounded-xl border bg-[var(--muted)] transition-all ${
                        errors['discount.durationDays']
                            ? 'border-red-500 bg-red-50'
                            : 'border-[var(--primary)]/20'
                    }`}>
                        <input
                            type="text"
                            value={discountConfig.durationDays}
                            onChange={(e) => onInputChange('durationDays', e.target.value, 'discount')}
                            className="w-full p-3 pr-10 bg-transparent text-[var(--foreground)] text-sm font-bold outline-none ring-0 focus:ring-0 border-none shadow-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] text-[9px]">days</span>
                    </div>
                    {errors['discount.durationDays'] && (
                        <p className="text-[10px] text-red-500 font-medium">{errors['discount.durationDays']}</p>
                    )}
                </div>

            </div>
        </div>
    );
}