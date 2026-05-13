// resources/js/Components/UI/StatCard.jsx
import { Settings } from 'lucide-react';

/**
 * StatCard — يدعم ثلاث طرق للاستخدام:
 *
 * 1) الكارد العادي (Mustashar):
 *    <StatCard label="Total Products" value={20} icon={<Package />} sub="In your store" />
 *    أو بـ icon كـ component:
 *    <StatCard label="Total Products" value={20} icon={Package} sub="In your store" />
 *
 * 2) كارد الإعدادات:
 *    <StatCard type="settings_preview" rules={calcRules}>
 *        <EditButton />
 *    </StatCard>
 *
 * 3) كارد ملوّن بحسب الحالة (Harees):
 *    <StatCard label="Expired" value={5} icon={<AlertCircle />} variant="critical" sub="..." />
 *    variant: "critical" | "warning" | "success"
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

    // ── Variant config (للحالات الملونة مثل حريص) ──
    const VARIANT_CONFIG = {
        critical: {
            textVar:       'var(--status-expired-text)',
            iconBgVar:     'var(--status-expired-icon-bg)',
            iconBorderVar: 'var(--status-expired-icon-border)',
        },
        warning: {
            textVar:       'var(--status-approaching-text)',
            iconBgVar:     'var(--status-approaching-icon-bg)',
            iconBorderVar: 'var(--status-approaching-icon-border)',
        },
        success: {
            textVar:       'var(--status-safe-text)',
            iconBgVar:     'var(--status-safe-icon-bg)',
            iconBorderVar: 'var(--status-safe-icon-border)',
        },
    };

    const variantStyle = variant ? VARIANT_CONFIG[variant] : null;

    const resolvedIconWrap = variantStyle ? {
        ...iconWrap,
        background:  variantStyle.iconBgVar,
        borderColor: variantStyle.iconBorderVar,
        color:       variantStyle.textVar,
        border:      '1px solid',
    } : iconWrap;

    const resolvedLabelStyle = variantStyle ? {
        ...labelStyle,
        color: variantStyle.textVar,
    } : labelStyle;
/* --- Settings card section inside StatCard.jsx --- */

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
                        {/* Filter rules to remove null, undefined, or NaN values before mapping */}
                        {rules && rules.length > 0 ? (
                            rules
                                .filter(rule => rule.value && !rule.value.includes('NaN'))
                                .map((rule) => (
                                    <PurpleBadge key={rule.label}>
                                        {rule.value}
                                    </PurpleBadge>
                                ))
                        ) : (
                            /* Fallback if no valid rules exist */
                            <PurpleBadge>Default Settings</PurpleBadge>
                        )}
                    </div>
                </div>
                {children && <div>{children}</div>}
            </div>
        </div>
    );
}

    /* ─── Default stat card (مع دعم variant) ─── */
    return (
        <div style={card} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
            {IconEl && <div style={resolvedIconWrap}>{IconEl}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <p style={resolvedLabelStyle}>{displayLabel}</p>
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