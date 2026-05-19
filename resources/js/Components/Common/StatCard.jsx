/**
 * @file StatCard.jsx
 * @module Components/Common/Display
 *
 * @description
 * Multi-purpose statistics card used across admin pages.
 * Supports three distinct rendering modes controlled by the `type` and
 * `variant` props:
 *
 * ──────────────────────────────────────────────────────────────
 * Mode 1 — Default stat card (most pages):
 *   Displays an icon badge, a label, a large numeric value, and an
 *   optional sub-label. Accepts `icon` as either a JSX element or a
 *   component reference.
 *
 *   <StatCard label="Total Products" value={20} icon={<Package />} sub="In your store" />
 *   <StatCard label="Total Products" value={20} icon={Package} />
 *
 * ──────────────────────────────────────────────────────────────
 * Mode 2 — Settings preview card (type="settings_preview"):
 *   Renders a calculator-logic summary with pill-style rule badges.
 *   Accepts `rules` (array of { label, value }) and optional `children`
 *   (e.g. an Edit button placed in the bottom-right corner).
 *
 *   <StatCard type="settings_preview" rules={calcRules}>
 *       <EditButton />
 *   </StatCard>
 *
 * ──────────────────────────────────────────────────────────────
 * Mode 3 — Status-colored variant card (Harees / expiry tracking):
 *   Same structure as Mode 1, but icon and label colors are driven by
 *   semantic CSS status variables for expired / approaching / safe states.
 *
 *   <StatCard label="Expired" value={5} icon={<AlertCircle />} variant="critical" />
 *   variant: "critical" | "warning" | "success"
 */

// ─── i18n strings ────────────────────────────────────────────────────────────
// Move to your JSON locale file when ready (e.g. en.json → "stat_card": { … })
const t = {
    /** Label for the settings preview card */
    settings_preview_label: 'Calculator Logic',
    /** Placeholder badges shown in settings preview when no rules are supplied */
    settings_preview_placeholder_area: '8.00 m²',
    settings_preview_placeholder_waste: '10% waste',
};
// ─────────────────────────────────────────────────────────────────────────────

import { Settings } from 'lucide-react';

/**
 * StatCard
 *
 * @param {Object}               props
 * @param {string}               [props.label]              - Card label / heading (alias: `title`).
 * @param {string}               [props.title]              - Alias for `label` (either is accepted).
 * @param {number|string}        [props.value]              - Primary numeric value displayed prominently.
 * @param {React.ReactNode|React.ComponentType} [props.icon] - Icon: either a rendered JSX element or
 *                                                             a Lucide component reference.
 * @param {'settings_preview'}   [props.type]               - When set, renders the settings preview layout.
 * @param {Array<{label:string, value:string}>} [props.rules] - Calculator rules for the settings preview mode.
 * @param {React.ReactNode}      [props.children]           - Optional slot for action buttons (settings preview mode).
 * @param {string}               [props.sub]                - Small italic sub-label shown next to the value.
 * @param {'critical'|'warning'|'success'} [props.variant] - Color variant; uses semantic CSS status variables.
 * @returns {JSX.Element}
 */
export default function StatCard({ label, title, value, icon: IconProp, type, rules, children, sub, variant }) {

    /** Accept either `label` or `title` as the display heading */
    const displayLabel = label || title;

    /**
     * Normalize `icon` to a JSX element.
     * Supports both a component reference (e.g. `icon={Package}`) and
     * a pre-rendered element (e.g. `icon={<Package />}`).
     */
    const IconEl = IconProp && typeof IconProp !== 'object'
        ? <IconProp style={{ width: '15px', height: '15px' }} strokeWidth={1.8} />
        : IconProp
            ? <span style={{ width: '15px', height: '15px', display: 'flex', alignItems: 'center' }}>{IconProp}</span>
            : null;

    // ── Shared inline style objects (design tokens via CSS variables) ──

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

    /** Default icon badge style — overridden per variant below */
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

    /** Subtle lift effect on hover — applied via inline style handlers */
    const hoverOn  = e => { e.currentTarget.style.boxShadow = '0 4px 20px color-mix(in srgb, var(--primary) 11%, transparent)'; e.currentTarget.style.transform = 'translateY(-1px)'; };
    const hoverOff = e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; };

    /**
     * Maps each named variant to its corresponding semantic CSS variable set.
     * Variables are defined per-theme in the global stylesheet.
     */
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

    /** Resolved variant config — null when no variant is specified */
    const variantStyle = variant ? VARIANT_CONFIG[variant] : null;

    /** Icon wrapper with variant color overrides applied when a variant is active */
    const resolvedIconWrap = variantStyle ? {
        ...iconWrap,
        background:  variantStyle.iconBgVar,
        borderColor: variantStyle.iconBorderVar,
        color:       variantStyle.textVar,
        border:      '1px solid',
    } : iconWrap;

    /** Label style with variant text color override when a variant is active */
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

    // ─────────────────────────────────────────────────────────────
    // Mode 1 & 3: Default stat card (with optional color variant)
    // ─────────────────────────────────────────────────────────────
    return (
        <div style={card} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
            {/* Icon badge — only rendered when an icon is provided */}
            {IconEl && <div style={resolvedIconWrap}>{IconEl}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {/* Label */}
                <p style={resolvedLabelStyle}>{displayLabel}</p>

                {/* Value row: large number + optional italic sub-label */}
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

// ─────────────────────────────────────────────────────────────────────────────
// PurpleBadge — internal pill badge for the settings preview mode
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PurpleBadge
 *
 * Internal-use only. Renders a monospace pill badge styled with the primary
 * brand color at reduced opacity, adapting automatically to light and dark themes
 * via `color-mix()` against `--primary`.
 *
 * @param {Object}          props
 * @param {React.ReactNode} props.children - Badge content (e.g. "8.00 m²", "10% waste").
 * @returns {JSX.Element}
 */
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