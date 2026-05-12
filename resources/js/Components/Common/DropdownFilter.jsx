import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useClickOutside } from '../../Hooks/useClickOutside';

/**
 * Props:
 *   options   { value: string, label: string }[]
 *   value     string   — currently selected value
 *   onChange  (value: string) => void
 *   width     string   (default: 'w-[115px]')
 */
export default function DropdownFilter({ options, value, onChange, width = 'w-[115px]' }) {
    const [open, setOpen] = useState(false);
    const ref = useClickOutside(() => setOpen(false));

    const activeLabel = options.find(o => o.value === value)?.label ?? options[0]?.label;
    const isFiltering = value !== options[0]?.value;

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                className={`flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-bold transition-all justify-between border ${width} ${
                    open || isFiltering
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                        : 'bg-[var(--accent)] text-[var(--primary)] border-[var(--primary)]/5'
                }`}
            >
                <div className="flex items-center gap-1.5 overflow-hidden">
                    <SlidersHorizontal size={13} className="flex-shrink-0" />
                    <span className="truncate">{activeLabel}</span>
                </div>
                <ChevronDown
                    size={12}
                    className={`flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-full bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg z-50 overflow-hidden">
                    {options.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => { onChange(opt.value); setOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
                                value === opt.value
                                    ? 'bg-[var(--accent)] text-[var(--primary)]'
                                    : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)]/50'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}