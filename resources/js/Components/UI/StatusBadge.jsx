// resources/js/Components/UI/StatusBadge.jsx

const STATUS_MAP = {
    red:         'Expired',
    yellow:      'Approaching',
    green:       'Safe',
    expired:     'Expired',
    approaching: 'Approaching',
    valid:       'Safe',
    safe:        'Safe',
};

export function normalizeStatus(status) {
    return STATUS_MAP[status?.toLowerCase()] ?? 'Safe';
}

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
        default:
            return {
                color:       'var(--status-safe-text)',
                background:  'var(--status-safe-bg)',
                borderColor: 'var(--status-safe-border)',
            };
    }
}

const SIZE = {
    sm: 'w-[90px]  h-[22px] text-[9px]',
    md: 'w-[110px] h-[26px] text-[10px]',
};

/**
 * مشترك بين Harees و Mustashar.
 *
 * Props:
 *  - status:    "red" | "yellow" | "green" | "Expired" | "Approaching" | "Safe" | "valid"
 *  - size:      "sm" | "md"  (default: "md")
 *  - className: إضافي اختياري
 */
export default function StatusBadge({ status, size = 'md', className = '' }) {
    const normalized = normalizeStatus(status);
    const style      = getStatusStyle(normalized);

    return (
        <span
            style={style}
            className={`
                inline-flex items-center justify-center
                rounded-full border font-black uppercase tracking-wide
                ${SIZE[size] ?? SIZE.md}
                ${className}
            `}
        >
            {normalized}
        </span>
    );
}