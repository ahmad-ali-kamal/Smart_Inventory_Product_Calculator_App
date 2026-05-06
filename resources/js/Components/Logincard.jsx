import { useState, useEffect } from 'react';

/* Accept accent as a prop so both Harees and Mustashar can share this card */
export default function LoginCard({ t, isAr, ff, bodyFont, visible, status, accent = '#7C3AED' }) {
    const [activeStep, setActiveStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveStep(prev => (prev + 1) % t.steps.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [t.steps.length]);

    /* Derive step gradient colours from the accent */
    const stepColors = [
        { from: lighten(accent, 0.55), to: lighten(accent, 0.25) },
        { from: lighten(accent, 0.25), to: accent },
        { from: accent,                to: darken(accent, 0.25) },
    ];

    return (
        <div
            className={`card-anim${visible ? ' show' : ''}`}
            style={{
                width: '100%',
                maxWidth: '420px',
                background: '#fff',
                borderRadius: '20px',
                /* FIX: extra top padding so content clears the navbar (~64px) */
                padding: 'clamp(1.75rem, 4vw, 2.5rem)',
                paddingTop: 'clamp(5rem, 8vw, 6.5rem)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)',
                direction: isAr ? 'rtl' : 'ltr',
                textAlign: isAr ? 'right' : 'left',
            }}
        >
            {/* FIX: Top icon removed entirely */}

            {/* Steps */}
            <div style={{ marginBottom: '1.5rem' }}>
                {t.steps.map((step, i) => {
                    const c = stepColors[i] || stepColors[0];
                    return (
                        <div
                            key={i}
                            className={`step-row${activeStep === i ? ' active-step' : ''}`}
                            style={{ flexDirection: isAr ? 'row-reverse' : 'row' }}
                        >
                            {/* Step icon — inherits accent gradient */}
                            <div style={{
                                width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0,
                                background: `linear-gradient(135deg, ${c.from} 0%, ${c.to} 100%)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: activeStep === i ? `0 4px 16px ${accent}66` : 'none',
                                transition: 'box-shadow 0.3s ease',
                            }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M5 12l4 4 10-10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontFamily: ff,
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    color: activeStep === i ? '#111827' : '#374151',
                                    marginBottom: '2px',
                                    transition: 'color 0.3s ease',
                                    textAlign: isAr ? 'right' : 'left',
                                }}>{step.title}</div>
                                <div style={{
                                    fontFamily: bodyFont,
                                    fontSize: '0.74rem',
                                    color: activeStep === i ? '#6B7280' : '#9CA3AF',
                                    transition: 'color 0.3s ease',
                                    textAlign: isAr ? 'right' : 'left',
                                }}>{step.sub}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: '#F3F4F6', marginBottom: '1.5rem' }} />

            <h2 style={{
                fontFamily: ff,
                fontSize: 'clamp(1.3rem, 3vw, 1.55rem)',
                fontWeight: 800,
                color: '#111827',
                marginBottom: '0.3rem',
            }}>{t.loginNow}</h2>
            <p style={{
                fontFamily: bodyFont,
                fontSize: '0.85rem',
                color: '#6B7280',
                marginBottom: '1.5rem',
                lineHeight: 1.6,
            }}>{t.loginSub}</p>

            {status && (
                <div style={{
                    color: accent,
                    marginBottom: '1rem',
                    fontSize: '0.87rem',
                    fontFamily: bodyFont,
                }}>
                    {status}
                </div>
            )}

            <a href="/auth/salla?app=management" className="salla-btn" style={{ fontFamily: ff }}>
                <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="8" fill="rgba(255,255,255,0.18)"/>
                    <text x="8" y="23" fontSize="17" fontWeight="800" fill="white" fontFamily="Georgia, serif">S</text>
                </svg>
                {t.sallaBtn}
            </a>

            <div style={{
                marginTop: '1.25rem',
                padding: '0.8rem 1rem',
                background: '#F9FAFB',
                border: '1px solid #F3F4F6',
                borderRadius: '12px',
            }}>
                <div style={{
                    fontFamily: bodyFont,
                    fontSize: '0.74rem',
                    color: '#9CA3AF',
                    lineHeight: 1.7,
                }}>{t.note}</div>
            </div>
        </div>
    );
}

/* ── Colour helpers ─────────────────────────────────────────────────────── */

/** Lighten a hex colour by mixing toward white by `amount` (0–1). */
function lighten(hex, amount) {
    const [r, g, b] = hexToRgb(hex);
    const mix = v => Math.round(v + (255 - v) * amount);
    return rgbToHex(mix(r), mix(g), mix(b));
}

/** Darken a hex colour by mixing toward black by `amount` (0–1). */
function darken(hex, amount) {
    const [r, g, b] = hexToRgb(hex);
    const mix = v => Math.round(v * (1 - amount));
    return rgbToHex(mix(r), mix(g), mix(b));
}

function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const int   = parseInt(clean, 16);
    return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}