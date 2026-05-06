/**
 * UI Components — Harees Design System
 * =====================================================
 * Export الكل من ملف واحد للسهولة:
 *
 * import { Button, Input, Card, Modal, Alert } from '@/Components/ui'
 * =====================================================
 */

import { useState, useEffect, useRef } from 'react';

/* ============================================================
   BUTTON
   ============================================================
   Props:
     variant  : 'primary' | 'secondary' | 'ghost' | 'danger'
     size     : 'sm' | 'md' | 'lg'
     loading  : boolean
     icon     : ReactNode (optional left/start icon)
     fullWidth: boolean
     disabled : boolean
     onClick  : function
     children : label
*/
export function Button({
    variant   = 'primary',
    size      = 'md',
    loading   = false,
    icon      = null,
    fullWidth = false,
    disabled  = false,
    onClick,
    children,
    type = 'button',
    style: extraStyle = {},
    ...rest
}) {
    const [pressed, setPressed] = useState(false);

    const base = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        border: 'none',
        borderRadius: '10px',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-body)',
        fontWeight: '500',
        letterSpacing: '0.02em',
        transition: 'all 0.25s ease',
        outline: 'none',
        position: 'relative',
        overflow: 'hidden',
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled ? 0.5 : 1,
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        userSelect: 'none',
    };

    const sizes = {
        sm: { padding: '6px 14px', fontSize: '0.82rem' },
        md: { padding: '10px 20px', fontSize: '0.9rem' },
        lg: { padding: '13px 28px', fontSize: '1rem' },
    };

    const variants = {
        primary: {
            background: 'linear-gradient(135deg, #E8BCCD 0%, #D4A0B8 100%)',
            color: '#2A1535',
            border: 'none',
            boxShadow: '0 4px 20px rgba(232,188,205,0.2)',
        },
        secondary: {
            background: 'rgba(232,188,205,0.1)',
            color: 'var(--color-orchid)',
            border: '1px solid rgba(232,188,205,0.25)',
            boxShadow: 'none',
        },
        ghost: {
            background: 'transparent',
            color: 'var(--color-text-muted)',
            border: '1px solid var(--color-border)',
            boxShadow: 'none',
        },
        danger: {
            background: 'rgba(255,80,80,0.1)',
            color: '#ff8080',
            border: '1px solid rgba(255,80,80,0.2)',
            boxShadow: 'none',
        },
    };

    const [hovered, setHovered] = useState(false);

    const hoverStyles = {
        primary:   { filter: 'brightness(1.08)', boxShadow: '0 6px 28px rgba(232,188,205,0.3)' },
        secondary: { background: 'rgba(232,188,205,0.16)', borderColor: 'rgba(232,188,205,0.4)' },
        ghost:     { background: 'rgba(232,188,205,0.06)', color: 'var(--color-orchid)' },
        danger:    { background: 'rgba(255,80,80,0.15)', borderColor: 'rgba(255,80,80,0.3)' },
    };

    const computed = {
        ...base,
        ...sizes[size],
        ...variants[variant],
        ...(hovered && !disabled ? hoverStyles[variant] : {}),
        ...extraStyle,
    };

    return (
        <button
            type={type}
            style={computed}
            disabled={disabled || loading}
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => { setHovered(false); setPressed(false); }}
            onMouseDown={() => setPressed(true)}
            onMouseUp={() => setPressed(false)}
            {...rest}
        >
            {loading ? (
                <span style={{
                    width: '14px', height: '14px',
                    border: '2px solid currentColor',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin-slow 0.7s linear infinite',
                    display: 'inline-block',
                }} />
            ) : icon ? (
                <span style={{ fontSize: '0.9em', display: 'flex', alignItems: 'center' }}>{icon}</span>
            ) : null}
            {children}
        </button>
    );
}

/* ============================================================
   INPUT
   ============================================================
   Props:
     label       : string
     error       : string
     hint        : string
     icon        : ReactNode (right side icon)
     type        : 'text' | 'email' | 'password' | 'number' | 'search'
     value       : string
     onChange    : function
     placeholder : string
     disabled    : boolean
     required    : boolean
*/
export function Input({
    label,
    error,
    hint,
    icon,
    type      = 'text',
    value,
    onChange,
    placeholder,
    disabled  = false,
    required  = false,
    name,
    id,
    autoComplete,
    style: extraStyle = {},
}) {
    const [focused, setFocused] = useState(false);
    const inputId = id ?? name ?? `input-${Math.random().toString(36).substr(2,6)}`;

    const wrapperStyle = {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        width: '100%',
    };

    const labelStyle = {
        fontFamily: 'var(--font-body)',
        fontSize: '0.82rem',
        fontWeight: '500',
        color: error ? '#ff8080' : focused ? 'var(--color-orchid)' : 'var(--color-text-muted)',
        transition: 'color 0.2s',
    };

    const inputWrapStyle = {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
    };

    const inputStyle = {
        width: '100%',
        padding: icon ? '11px 40px 11px 14px' : '11px 14px',
        background: focused
            ? 'rgba(82,56,89,0.2)'
            : 'rgba(82,56,89,0.1)',
        border: `1px solid ${error ? 'rgba(255,80,80,0.4)' : focused ? 'rgba(232,188,205,0.4)' : 'var(--color-border)'}`,
        borderRadius: '10px',
        fontFamily: 'var(--font-body)',
        fontSize: '0.9rem',
        color: 'var(--color-text)',
        outline: 'none',
        transition: 'all 0.2s ease',
        boxShadow: focused ? `0 0 0 3px rgba(232,188,205,0.06)` : 'none',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'text',
        direction: 'rtl',
        ...extraStyle,
    };

    return (
        <div style={wrapperStyle}>
            {label && (
                <label htmlFor={inputId} style={labelStyle}>
                    {label}
                    {required && <span style={{ color: 'var(--color-orchid)', marginRight: '4px' }}>*</span>}
                </label>
            )}

            <div style={inputWrapStyle}>
                <input
                    id={inputId}
                    name={name}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    autoComplete={autoComplete}
                    style={inputStyle}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                />
                {icon && (
                    <span style={{
                        position: 'absolute',
                        right: '12px',
                        color: focused ? 'var(--color-orchid)' : 'var(--color-text-faint)',
                        pointerEvents: 'none',
                        fontSize: '14px',
                        transition: 'color 0.2s',
                    }}>
                        {icon}
                    </span>
                )}
            </div>

            {error && (
                <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.78rem',
                    color: '#ff8080',
                    display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                    <span>⚠</span> {error}
                </span>
            )}

            {hint && !error && (
                <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.78rem',
                    color: 'var(--color-text-faint)',
                }}>
                    {hint}
                </span>
            )}
        </div>
    );
}

/* ============================================================
   CARD
   ============================================================
   Props:
     title    : string
     subtitle : string
     icon     : string/emoji
     hoverable: boolean
     padding  : 'sm' | 'md' | 'lg'
     children : content
*/
export function Card({
    title,
    subtitle,
    icon,
    hoverable = false,
    padding   = 'md',
    children,
    style: extraStyle = {},
}) {
    const [hovered, setHovered] = useState(false);

    const paddings = {
        sm: '1rem',
        md: '1.5rem',
        lg: '2rem',
    };

    const cardStyle = {
        background: hovered && hoverable
            ? 'rgba(82,56,89,0.18)'
            : 'rgba(82,56,89,0.1)',
        border: `1px solid ${hovered && hoverable ? 'rgba(232,188,205,0.25)' : 'var(--color-border)'}`,
        borderRadius: '16px',
        padding: paddings[padding],
        backdropFilter: 'blur(16px)',
        transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hovered && hoverable ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered && hoverable ? '0 12px 40px rgba(0,0,0,0.3)' : 'none',
        ...extraStyle,
    };

    return (
        <div
            style={cardStyle}
            onMouseEnter={() => hoverable && setHovered(true)}
            onMouseLeave={() => hoverable && setHovered(false)}
        >
            {(icon || title || subtitle) && (
                <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                    marginBottom: children ? '1.25rem' : 0,
                }}>
                    {icon && (
                        <div style={{
                            width: '44px', height: '44px', flexShrink: 0,
                            background: 'rgba(232,188,205,0.1)',
                            border: '1px solid rgba(232,188,205,0.15)',
                            borderRadius: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '18px',
                        }}>
                            {icon}
                        </div>
                    )}
                    <div>
                        {title && (
                            <h4 style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                color: 'var(--color-orchid-light)',
                                margin: 0,
                            }}>
                                {title}
                            </h4>
                        )}
                        {subtitle && (
                            <p style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '0.82rem',
                                color: 'var(--color-text-faint)',
                                margin: '3px 0 0',
                            }}>
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
            )}
            {children}
        </div>
    );
}

/* ============================================================
   MODAL
   ============================================================
   Props:
     isOpen   : boolean
     onClose  : function
     title    : string
     size     : 'sm' | 'md' | 'lg' | 'xl'
     children : content
     footer   : ReactNode (optional action buttons)
*/
export function Modal({
    isOpen,
    onClose,
    title,
    size     = 'md',
    children,
    footer,
}) {
    const overlayRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
        if (isOpen) window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const widths = { sm: '380px', md: '520px', lg: '680px', xl: '860px' };

    return (
        <div
            ref={overlayRef}
            onClick={(e) => { if (e.target === overlayRef.current) onClose?.(); }}
            style={{
                position: 'fixed', inset: 0, zIndex: 200,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1rem',
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(8px)',
                animation: 'fadeIn 0.2s ease both',
            }}
        >
            <div style={{
                width: '100%',
                maxWidth: widths[size],
                background: 'rgba(20,12,28,0.97)',
                border: '1px solid rgba(232,188,205,0.15)',
                borderRadius: '20px',
                boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
                overflow: 'hidden',
                animation: 'scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
                direction: 'rtl',
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <h3 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        color: 'var(--color-orchid-light)',
                        margin: 0,
                    }}>
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            width: '32px', height: '32px',
                            background: 'rgba(232,188,205,0.06)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: 'var(--color-text-faint)',
                            fontSize: '14px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255,80,80,0.08)';
                            e.currentTarget.style.color = '#ff8080';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(232,188,205,0.06)';
                            e.currentTarget.style.color = 'var(--color-text-faint)';
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '1.5rem' }}>
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div style={{
                        padding: '1rem 1.5rem',
                        borderTop: '1px solid var(--color-border)',
                        display: 'flex', gap: '10px', justifyContent: 'flex-end',
                    }}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ============================================================
   ALERT
   ============================================================
   Props:
     type     : 'info' | 'success' | 'warning' | 'error'
     title    : string (optional)
     message  : string
     onClose  : function (optional — shows X if provided)
     icon     : custom icon (optional)
*/
export function Alert({
    type    = 'info',
    title,
    message,
    onClose,
    icon,
}) {
    const [visible, setVisible] = useState(true);

    if (!visible) return null;

    const configs = {
        info: {
            bg:     'rgba(100,150,255,0.08)',
            border: 'rgba(100,150,255,0.2)',
            color:  'rgba(150,190,255,0.9)',
            icon:   'ℹ',
        },
        success: {
            bg:     'rgba(80,220,120,0.08)',
            border: 'rgba(80,220,120,0.2)',
            color:  'rgba(120,220,150,0.9)',
            icon:   '✓',
        },
        warning: {
            bg:     'rgba(255,180,50,0.08)',
            border: 'rgba(255,180,50,0.2)',
            color:  'rgba(255,200,100,0.9)',
            icon:   '⚠',
        },
        error: {
            bg:     'rgba(255,80,80,0.08)',
            border: 'rgba(255,80,80,0.2)',
            color:  'rgba(255,120,120,0.9)',
            icon:   '⊗',
        },
    };

    const c = configs[type];

    const handleClose = () => {
        setVisible(false);
        onClose?.();
    };

    return (
        <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '12px',
            padding: '12px 14px',
            background: c.bg,
            border: `1px solid ${c.border}`,
            borderRadius: '12px',
            animation: 'fadeUp 0.35s ease both',
        }}>
            {/* Icon */}
            <span style={{
                fontSize: '16px',
                color: c.color,
                flexShrink: 0,
                marginTop: '1px',
            }}>
                {icon ?? c.icon}
            </span>

            {/* Content */}
            <div style={{ flex: 1 }}>
                {title && (
                    <div style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.88rem',
                        fontWeight: '600',
                        color: c.color,
                        marginBottom: message ? '3px' : 0,
                    }}>
                        {title}
                    </div>
                )}
                {message && (
                    <div style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.85rem',
                        color: c.color,
                        opacity: 0.8,
                        lineHeight: 1.6,
                    }}>
                        {message}
                    </div>
                )}
            </div>

            {/* Close */}
            {onClose && (
                <button
                    onClick={handleClose}
                    style={{
                        width: '24px', height: '24px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: c.color,
                        opacity: 0.5,
                        fontSize: '12px',
                        flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'opacity 0.2s',
                        borderRadius: '6px',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
                >
                    ✕
                </button>
            )}
        </div>
    );
}

/* ============================================================
   Default export كـ collection
*/
export default { Button, Input, Card, Modal, Alert };