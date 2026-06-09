/**
 * @file RowActionButton.jsx
 * @module Components/Common/Controls
 *
 * @description
 * Polymorphic action button used inside Mustashar data table rows.
 * Renders either a `<button>` or an `<a>` tag depending on whether `href`
 * is supplied, keeping the calling code consistent regardless of navigation
 * intent.
 *
 * Supports three visual variants (default, active, disabled) and two sizes
 * (sm, md) to cover the full range of row-level actions: view, edit,
 * activate/deactivate, sync, delete, etc.
 *
 * @example
 * // Standard action button
 * <RowActionButton icon={<Eye size={11} />} onClick={() => openModal(row.id)}>
 *   View
 * </RowActionButton>
 *
 * @example
 * // Navigation link rendered as <a>
 * <RowActionButton href={`/products/${row.id}/edit`} icon={<Pencil size={11} />}>
 *   Edit
 * </RowActionButton>
 *
 * @example
 * // Toggled-on / active state
 * <RowActionButton variant="active" icon={<CheckCircle size={11} />}>
 *   Active
 * </RowActionButton>
 */

import React from 'react';

/**
 * RowActionButton
 *
 * @param {Object}        props
 * @param {Function}      [props.onClick]          - Click handler. Used when rendering a `<button>`.
 * @param {string}        [props.href]             - When provided, renders an `<a>` tag for navigation.
 * @param {React.ReactNode} [props.icon]           - Icon element (e.g. a Lucide icon) shown before the label.
 * @param {React.ReactNode} [props.children]       - Button label text.
 * @param {'default'|'active'|'disabled'} [props.variant='default']
 *   - `default`  → accent background, primary text. Used for most actions.
 *   - `active`   → primary background, white text. Used for toggled-on states.
 *   - `disabled` → dimmed, not interactive. Used when the action is unavailable.
 * @param {'sm'|'md'}     [props.size='sm']        - Controls padding and font size.
 * @param {string}        [props.className='']     - Additional Tailwind classes for one-off overrides.
 * @param {Object}        [props.rest]             - Any other native button / anchor attributes.
 * @returns {JSX.Element}
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
    /** Shared base classes applied to both the button and anchor variants */
    const base =
        'inline-flex items-center justify-center gap-1.5 font-black uppercase tracking-wide transition-opacity rounded-xl border';

    /** Size-specific padding and font-size classes — responsive on mobile vs md+ */
    const sizes = {
        sm: 'px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-[11px]',
        md: 'px-3 md:px-4 py-1.5 md:py-2 text-[11px] md:text-[12px]',
    };

    /** Visual variant classes — map each state to its token-based color set */
    const variants = {
        default:  'bg-[var(--accent)] text-[var(--primary)] border-[var(--primary)]/20 hover:opacity-80',
        active:   'bg-[var(--primary)] text-white border-transparent shadow-sm hover:opacity-80',
        disabled: 'bg-[var(--accent)] text-[var(--muted-foreground)] border-[var(--border)] opacity-30 cursor-not-allowed',
    };

    /** Composed class string shared by both element types */
    const classes = `${base} ${sizes[size]} ${variants[variant]} ${className}`;

    /* ── Anchor variant: used for page navigation ── */
    if (href) {
        return (
            <a href={href} className={classes} {...rest}>
                {icon && <span className="flex-shrink-0">{icon}</span>}
                {children}
            </a>
        );
    }

    /* ── Button variant: used for in-page actions ── */
    return (
        <button
            onClick={onClick}
            className={classes}
            // Natively disabled when variant is 'disabled' to block keyboard interaction
            disabled={variant === 'disabled'}
            {...rest}
        >
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
        </button>
    );
}