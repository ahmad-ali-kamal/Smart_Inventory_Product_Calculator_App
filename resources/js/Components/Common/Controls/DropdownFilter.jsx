/**
 * @file DropdownFilter.jsx
 * @module Components/Common/Controls
 *
 * @description
 * Compact filter dropdown used in table toolbars.
 * Renders a styled trigger button that opens a floating options list.
 * Highlights in the primary brand color when an non-default option is active,
 * providing a clear "filter is active" affordance.
 *
 * Closes automatically when the user clicks outside (via `useClickOutside`).
 *
 * @example
 * const STATUS_OPTIONS = [
 *   { value: 'all',      label: 'All'      },
 *   { value: 'active',   label: 'Active'   },
 *   { value: 'inactive', label: 'Inactive' },
 * ];
 *
 * <DropdownFilter
 *   options={STATUS_OPTIONS}
 *   value={statusFilter}
 *   onChange={setStatusFilter}
 * />
 */

import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useClickOutside } from '../../../hooks/useClickOutside';
import { useTranslation } from 'react-i18next';

/**
 * DropdownFilter
 *
 * @param {Object}   props
 * @param {Array<{ value: string, label: string }>} props.options
 *   - Full list of filter options. The first item is treated as the
 *     "default / no filter" option for the active-state highlight logic.
 * @param {string}   props.value     - Currently selected option value (controlled).
 * @param {Function} props.onChange  - Called with the newly selected value string
 *                                     when the user picks an option.
 * @param {string}   [props.width]   - Tailwind width class for the trigger button.
 *                                     Defaults to `'w-28'`.
 * @returns {JSX.Element}
 */
export default function DropdownFilter({ options, value, onChange, width = 'w-28' }) {
    const { t } = useTranslation('shared');
    /** Controls visibility of the options list */
    const [open, setOpen] = useState(false);

    /** Ref used by useClickOutside to detect clicks outside the dropdown */
    const ref = useClickOutside(() => setOpen(false));

    /** Derive the display label for the trigger button from the current value */
    const activeLabel = options.find(o => o.value === value)?.label ?? options[0]?.label;

    /**
     * True when the selected value differs from the first (default) option.
     * Drives the "active filter" highlight on the trigger button.
     */
    const isFiltering = value !== options[0]?.value;

    return (
        <div className="relative" ref={ref}>
            {/* ── Trigger button ── */}
            <button
                onClick={() => setOpen(o => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={t('dropdown_filter.filter_button_label')}
                className={`flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-bold transition-all justify-between border ${width} ${
                    // Highlight with primary color when open OR when a non-default filter is active
                    open || isFiltering
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                        : 'bg-[var(--accent)] text-[var(--primary)] border-[var(--primary)]/5'
                }`}
            >
                <div className="flex items-center gap-1.5 overflow-hidden">
                    <SlidersHorizontal size={13} className="flex-shrink-0" />
                    {/* Truncate long labels gracefully */}
                    <span className="truncate">{activeLabel}</span>
                </div>

                {/* Chevron rotates 180° when the dropdown is open */}
                <ChevronDown
                    size={12}
                    className={`flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {/* ── Options list — only rendered when open ── */}
            {open && (
                <div
                    role="listbox"
                    className="absolute end-0 mt-2 w-full bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg z-50 overflow-hidden"
                >
                    {options.map(opt => (
                        <button
                            key={opt.value}
                            role="option"
                            aria-selected={value === opt.value}
                            onClick={() => { onChange(opt.value); setOpen(false); }}
                            className={`w-full text-start px-4 py-2.5 text-xs font-bold transition-colors ${
                                // Highlight the currently active option
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