/** Colour config for each status variant */
const statusConfig = {
    safe:        { bg: '#DCFCE7', color: '#15803D', dot: '#22C55E' },
    approaching: { bg: '#FEF3C7', color: '#B45309', dot: '#F59E0B' },
    expired:     { bg: '#FEE2E2', color: '#B91C1C', dot: '#EF4444' },
};

/**
 * A small coloured pill that represents an inventory status.
 *
 * @param {'safe'|'approaching'|'expired'} status
 * @param {string} label - Localised display text
 */
export default function StatusPill({ status, label }) {
    const cfg = statusConfig[status];

    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: cfg.bg, color: cfg.color,
            borderRadius: 999, padding: '3px 10px',
            fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
        }}>
            <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: cfg.dot, flexShrink: 0,
            }} />
            {label}
        </span>
    );
}