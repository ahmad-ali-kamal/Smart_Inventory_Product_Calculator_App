// resources/js/Components/UI/StatusFilter.jsx
// كومبونينت مشترك — dropdown style
import { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, ChevronUp, ChevronDown } from 'lucide-react';

const DEFAULT_FILTERS = [
    { key: 'all',         label: 'All' },
    { key: 'Expired',     label: 'Expired' },
    { key: 'Approaching', label: 'Approaching' },
    { key: 'Safe',        label: 'Safe' },
];

export default function StatusFilter({
    value   = 'all',
    onChange,
    filters = DEFAULT_FILTERS,
}) {
    const [open, setOpen] = useState(false);
    const ref             = useRef(null);

    /* Close on outside click */
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selected = filters.find(f => f.key === value) ?? filters[0];

    return (
        <div ref={ref} className="relative select-none">

            {/* Trigger */}
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 px-4 py-2 rounded-full
                           bg-[var(--primary)]/20 hover:bg-[var(--primary)]/30
                           border border-[var(--primary)]/20
                           text-[var(--primary)] font-bold text-sm
                           transition-all duration-200"
            >
                <SlidersHorizontal size={15} />
                <span>{selected.label}</span>
                {open
                    ? <ChevronUp   size={14} className="opacity-70" />
                    : <ChevronDown size={14} className="opacity-70" />
                }
            </button>

            {/* Dropdown menu */}
            {open && (
                <div
                    className="absolute right-0 top-[calc(100%+8px)] z-50
                               min-w-[160px] py-1
                               bg-[var(--card)] rounded-2xl
                               border border-[var(--border)]
                               shadow-xl shadow-black/10
                               overflow-hidden"
                >
                    {filters.map((f, i) => {
                        const isActive = f.key === value;
                        return (
                            <button
                                key={f.key}
                                onClick={() => { onChange(f.key); setOpen(false); }}
                                className={`w-full text-left px-5 py-3 text-sm transition-colors duration-150
                                    ${i < filters.length - 1 ? 'border-b border-[var(--border)]' : ''}
                                    ${isActive
                                        ? 'text-[var(--primary)] font-bold bg-[var(--primary)]/5'
                                        : 'text-[var(--muted-foreground)] font-semibold hover:text-[var(--foreground)] hover:bg-[var(--muted)]/40'
                                    }`}
                            >
                                {f.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}