// resources/js/Components/UI/StatCard.jsx
import { Settings } from 'lucide-react';

/**
 * StatCard — يدعم طريقتين للاستخدام:
 *
 * 1) الكارد العادي:
 *    <StatCard label="Total Products" value={20} icon={<Package />} sub="In your store" />
 *    أو بـ icon كـ component:
 *    <StatCard label="Total Products" value={20} icon={Package} sub="In your store" />
 *
 * 2) كارد الإعدادات:
 *    <StatCard type="settings_preview" rules={calcRules}>
 *        <EditButton />
 *    </StatCard>
 */
export default function StatCard({ label, title, value, icon: IconProp, type, rules, children, sub, variant }) {

    // يقبل label أو title
    const displayLabel = label || title;

    // يقبل icon كـ JSX أو كـ component
    const IconEl = IconProp && typeof IconProp !== 'object'
        ? <IconProp style={{ width: '15px', height: '15px' }} strokeWidth={1.8} />
        : IconProp
            ? <span style={{ width: '15px', height: '15px', display: 'flex', alignItems: 'center' }}>{IconProp}</span>
            : null;

    const card = {
        padding: '20px 22px 22px',
        borderRadius: '18px',
        border: '1px solid var(--border)',
        background: 'var(--card)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        cursor: 'default',
    };

    const iconWrap = {
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
        color: 'var(--primary)',
        flexShrink: 0,
    };

    const labelStyle = {
        fontSize: '10.5px',
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--muted-foreground)',
        margin: 0,
    };

    const hoverOn  = e => { e.currentTarget.style.boxShadow = '0 4px 20px color-mix(in srgb, var(--primary) 11%, transparent)'; e.currentTarget.style.transform = 'translateY(-1px)'; };
    const hoverOff = e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; };

    /* ─── Settings card ─── */
    if (type === 'settings_preview') {
        return (
            <div style={card} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
                <div style={iconWrap}>
                    <Settings style={{ width: '15px', height: '15px' }} strokeWidth={2} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <p style={labelStyle}>Calculator Logic</p>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <PurpleBadge>{rules?.coverage || '8.00'} m²</PurpleBadge>
                            <PurpleBadge>{rules?.waste || '10'}% waste</PurpleBadge>
                        </div>
                    </div>
                    {children && <div>{children}</div>}
                </div>
            </div>
        );
    }

    /* ─── Default stat card ─── */
    return (
        <div style={card} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
            {IconEl && <div style={iconWrap}>{IconEl}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <p style={labelStyle}>{displayLabel}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '7px' }}>
                    <span style={{ fontSize: '28px', fontWeight: 800, lineHeight: 1, color: 'var(--foreground)' }}>
                        {value}
                    </span>
                    {sub && (
                        <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
                            {sub}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── Badge موف داخلي — يتكيّف مع light/dark تلقائياً ─── */
function PurpleBadge({ children }) {
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '3px 10px',
            borderRadius: '20px',
            fontSize: '10.5px',
            fontWeight: 600,
            fontFamily: 'monospace',
            letterSpacing: '0.04em',
            background: 'color-mix(in srgb, var(--primary) 14%, transparent)',
            color: 'var(--primary)',
            border: '1px solid color-mix(in srgb, var(--primary) 22%, transparent)',
        }}>
            {children}
        </span>
    );
}