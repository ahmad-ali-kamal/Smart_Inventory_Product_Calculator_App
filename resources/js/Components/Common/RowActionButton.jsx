// resources/js/Components/Common/RowActionButton.jsx
import React from 'react';

/**
 * Shared action button used inside product table rows.
 *
 * Props:
 *  - onClick       : function   — click handler (omit when `href` is set)
 *  - href          : string     — renders an <a> tag instead of <button>
 *  - icon          : ReactNode  — lucide icon or any element
 *  - children      : ReactNode  — button label text
 *  - variant       : 'default' | 'active' | 'disabled'
 *                    default  → accent bg, primary text (most buttons)
 *                    active   → primary bg, white text (toggled-on state)
 *                    disabled → accent bg, dimmed, not clickable
 *  - size          : 'sm' | 'md'   (default: 'sm')
 *  - className     : string     — extra classes for overrides
 */
export default function RowActionButton({
    onClick,
    href,
    icon,
    children,
    variant = 'default',
    size = 'sm',
    className = '',
    ...rest
}) {
    const base =
        'inline-flex items-center justify-center gap-1.5 font-black uppercase tracking-wide transition-opacity rounded-xl border';

    const sizes = {
        sm: 'px-3 py-1.5 text-[10px]',
        md: 'px-4 py-2   text-[11px]',
    };

    const variants = {
        default:  'bg-[var(--accent)] text-[var(--primary)] border-[var(--primary)]/20 hover:opacity-80',
        active:   'bg-[var(--primary)] text-white border-transparent shadow-sm hover:opacity-80',
        disabled: 'bg-[var(--accent)] text-[var(--muted-foreground)] border-[var(--border)] opacity-30 cursor-not-allowed',
    };

    const classes = `${base} ${sizes[size]} ${variants[variant]} ${className}`;

    if (href) {
        return (
            <a href={href} className={classes} {...rest}>
                {icon && <span className="flex-shrink-0">{icon}</span>}
                {children}
            </a>
        );
    }

    return (
        <button onClick={onClick} className={classes} disabled={variant === 'disabled'} {...rest}>
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
        </button>
    );
}