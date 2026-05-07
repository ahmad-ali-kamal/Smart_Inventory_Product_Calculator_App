import { useState, useEffect } from 'react';

export default function LoginCard({ t, isAr, ff, bodyFont, visible, status, accent = '#7C3AED' }) {
    const [activeStep, setActiveStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveStep(prev => (prev + 1) % t.steps.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [t.steps.length]);

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
                maxWidth: '480px',
                /* Glass morphism — same tint as the icon badge */
                background: 'rgba(196,181,253,0.08)',
                border: '1px solid rgba(196,181,253,0.2)',
                borderRadius: '24px',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 8px 40px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.12)',
                padding: '2rem 2.25rem',
                direction: isAr ? 'rtl' : 'ltr',
                textAlign: isAr ? 'right' : 'left',
            }}
        >
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
                            {/* Step circle */}
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                                background: `linear-gradient(135deg, ${c.from} 0%, ${c.to} 100%)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: activeStep === i ? `0 4px 16px ${accent}66` : 'none',
                                transition: 'box-shadow .3s ease',
                            }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                                    <path d="M5 12l4 4 10-10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontFamily: ff,
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    /* Active = bright white, inactive = soft white */
                                    color: activeStep === i ? '#ffffff' : 'rgba(255,255,255,0.65)',
                                    marginBottom: '2px',
                                    transition: 'color .3s ease',
                                    textAlign: isAr ? 'right' : 'left',
                                }}>{step.title}</div>
                                <div style={{
                                    fontFamily: bodyFont,
                                    fontSize: '0.75rem',
                                    color: activeStep === i ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.38)',
                                    transition: 'color .3s ease',
                                    textAlign: isAr ? 'right' : 'left',
                                }}>{step.sub}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Divider */}
            <div style={{
                height: '1px',
                background: 'rgba(196,181,253,0.2)',
                marginBottom: '1.5rem',
            }}/>

            {/* Login heading */}
            <div style={{
                fontFamily: "'Changa', sans-serif",
                fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)',
                fontWeight: 800,
                color: '#fff',
                marginBottom: '0.3rem',
            }}>{t.loginNow}</div>
            <div style={{
                fontFamily: bodyFont,
                fontSize: '0.82rem',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '1.5rem',
                lineHeight: 1.6,
            }}>{t.loginSub}</div>

            {status && (
                <div style={{ color: '#c4b5fd', marginBottom: '1rem', fontSize: '.87rem', fontFamily: bodyFont }}>
                    {status}
                </div>
            )}

            {/* Salla button */}
            <a href="/auth/salla?app=management" className="salla-btn" style={{ fontFamily: ff }}>
                {t.sallaBtn}
            </a>

            {/* Note */}
            <div style={{
                marginTop: '1rem',
                padding: '.75rem 1rem',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(196,181,253,0.15)',
                borderRadius: '12px',
            }}>
                <div style={{
                    fontFamily: bodyFont,
                    fontSize: '0.72rem',
                    color: 'rgba(255,255,255,0.38)',
                    lineHeight: 1.7,
                }}>{t.note}</div>
            </div>
        </div>
    );
}

function lighten(hex, amount) {
    const [r, g, b] = hexToRgb(hex);
    const mix = v => Math.round(v + (255 - v) * amount);
    return rgbToHex(mix(r), mix(g), mix(b));
}

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