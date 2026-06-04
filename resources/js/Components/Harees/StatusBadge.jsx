/**
 * @file StatusBadge.jsx
 * @module Components/UI
 *
 * @description
 * A small pill-shaped badge that visualises the expiry status of a product
 * or batch.  The component normalises the raw status string coming from the
 * API (which may be a colour code like "red" or a semantic string like
 * "expired") into one of three canonical display values before deriving
 * the corresponding theme tokens.
 *
 * Exported helpers (`normalizeStatus`, `getStatusStyle`) are intentionally
 * decoupled from the component so sibling components (e.g. BatchRow) can
 * derive styling without mounting the badge element.
 */

// ─── Status normalisation map ─────────────────────────────────────────────────
/**
 * Maps every raw status string the API may return to one of the three
 * canonical display values: "Expired" | "Approaching" | "Safe".
 *
 * Unmapped strings default to "Safe" inside `normalizeStatus`.
 *
 * @type {Record<string, string>}
 */
import { useTranslation } from 'react-i18next';

const STATUS_MAP = {
    red:         'Expired',
    yellow:      'Approaching',
    green:       'Safe',
    expired:     'Expired',
    approaching: 'Approaching',
    valid:       'Safe',
    safe:        'Safe',
};

/**
 * normalizeStatus
 *
 * Converts a raw API status string to a canonical display label.
 * The lookup is case-insensitive.  Unmapped or falsy values fall back to "Safe".
 *
 * @param {string|undefined} status - Raw status from the API.
 * @returns {'Expired'|'Approaching'|'Safe'} Canonical display label.
 */
export function normalizeStatus(status) {
    return STATUS_MAP[status?.toLowerCase()] ?? 'Safe';
}

/**
 * getStatusStyle
 *
 * Returns an inline-style object that maps the canonical status to the
 * corresponding CSS custom properties defined in the global theme.
 * Using CSS variables (rather than Tailwind classes) here keeps the badge
 * fully themeable without purge-CSS risks for dynamic class names.
 *
 * @param {'Expired'|'Approaching'|'Safe'} normalized - Output of `normalizeStatus`.
 * @returns {{ color: string, background: string, borderColor: string }}
 */
export function getStatusStyle(normalized) {
    switch (normalized) {
        case 'Expired':
            return {
                color:       'var(--status-expired-text)',
                background:  'var(--status-expired-bg)',
                borderColor: 'var(--status-expired-border)',
            };
        case 'Approaching':
            return {
                color:       'var(--status-approaching-text)',
                background:  'var(--status-approaching-bg)',
                borderColor: 'var(--status-approaching-border)',
            };
        default: // 'Safe'
            return {
                color:       'var(--status-safe-text)',
                background:  'var(--status-safe-bg)',
                borderColor: 'var(--status-safe-border)',
            };
    }
}

// ─── Size variants ────────────────────────────────────────────────────────────
/**
 * Tailwind class strings for each supported size variant.
 * Centralised here so adding a new size only requires one change.
 *
 * @type {Record<string, string>}
 */
const SIZE = {
    sm: 'px-2 h-[22px] text-[8px] sm:text-[9px] w-full',
    md: 'px-3 h-[26px] text-[9px] sm:text-[10px] w-full',
};

/**
 * StatusBadge
 *
 * Pill badge that communicates batch / product expiry status at a glance.
 *
 * @component
 *
 * @param {Object}  props
 * @param {string}  props.status    - Raw status string from the API.
 *                                   Accepts colour codes ("red"|"yellow"|"green")
 *                                   or semantic strings ("expired"|"approaching"|"safe"|"valid").
 * @param {'sm'|'md'} [props.size='md'] - Controls the badge's fixed width, height, and font size.
 * @param {string}  [props.className=''] - Additional Tailwind classes for layout overrides.
 * @returns {JSX.Element}
 */
export default function StatusBadge({ status, size = 'md', className = '' }) {
    const { t } = useTranslation('harees');

    // Normalise once; both the display label and the style object derive from it.
    const normalized = normalizeStatus(status);
    const style      = getStatusStyle(normalized);
    const label      = t(`status_badge.${normalized.toLowerCase()}`, normalized);

    return (
        <span
            style={style}
            className={`
                flex items-center justify-center
                rounded-full border font-black uppercase tracking-wide
                ${SIZE[size] ?? SIZE.md}
                ${className}
            `}
        >
            {label}
        </span>
    );
}