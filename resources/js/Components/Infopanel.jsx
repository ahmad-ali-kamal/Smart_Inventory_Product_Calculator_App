import { CheckCircle2 } from 'lucide-react';

function HareesIconColored({ size = 28 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 6.5V12C3 16.5 7 20.5 12 22C17 20.5 21 16.5 21 12V6.5L12 2Z"
                stroke="url(#hg-col)" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
            <path d="M9 12l2 2 4-4" stroke="url(#hg-col)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <defs>
                <linearGradient id="hg-col" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#c4b5fd"/>
                    <stop offset="100%" stopColor="#a5f3fc"/>
                </linearGradient>
            </defs>
        </svg>
    );
}

export default function InfoPanel({ t, isAr, ff, bodyFont, visible }) {
    return (
        <div
            className={`dark-info info-anim${visible ? ' show' : ''}`}
            style={{
                width: '100%',
                padding: '2.5rem 3rem',
                paddingTop: '0',
                direction: isAr ? 'rtl' : 'ltr',
                textAlign: isAr ? 'right' : 'left',
            }}
        >
            {/* Big headline */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{
                    fontFamily: "'Changa', sans-serif",
                    fontSize: 'clamp(1.6rem, 3vw, 2.6rem)',
                    fontWeight: 800,
                    lineHeight: 1.25,
                    color: '#fff',
                    marginBottom: '0.75rem',
                }}>
                    {t.appName}
                    <span style={{
                        display: 'block',
                        background: 'linear-gradient(90deg, #c4b5fd 0%, #a5f3fc 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}>
                        {t.appSub}
                    </span>
                </h1>
                <p style={{
                    fontFamily: bodyFont,
                    fontSize: '0.9rem',
                    color: 'rgba(255,255,255,0.55)',
                    lineHeight: 1.75,
                    maxWidth: '380px',
                    marginInlineStart: 0,
                    marginInlineEnd: 'auto',
                }}>{t.appDesc}</p>
            </div>

            {/* Feature list */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '2.5rem',
            }}>
                {t.features.map((feat, i) => (
                    <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        /* In RTL, icon comes first (inline-start), then text — natural flow */
                        flexDirection: 'row',
                    }}>
                        <CheckCircle2 size={14} color="#a5f3fc" style={{ flexShrink: 0 }} />
                        <span style={{
                            fontFamily: bodyFont,
                            fontSize: '0.83rem',
                            color: 'rgba(255,255,255,0.65)',
                        }}>
                            {feat}
                        </span>
                    </div>
                ))}
            </div>

            {/* Brand badge */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
            }}>
                <div style={{
                    width: '40px', height: '40px', flexShrink: 0,
                    background: 'rgba(196,181,253,0.1)',
                    border: '1px solid rgba(196,181,253,0.2)',
                    borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <HareesIconColored size={22} />
                </div>
                <div>
                    <div style={{
                        fontFamily: "'Changa', sans-serif",
                        fontSize: '1rem',
                        fontWeight: 800,
                        background: 'linear-gradient(90deg, #c4b5fd 0%, #818cf8 50%, #a5f3fc 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}>{t.appName}</div>
                    <div style={{
                        fontFamily: bodyFont,
                        fontSize: '0.72rem',
                        color: 'rgba(255,255,255,0.35)',
                    }}>{t.appSub}</div>
                </div>
            </div>

            {/* Decorative line accent */}
            <div style={{
                marginTop: '1.5rem',
                width: '40px',
                height: '3px',
                borderRadius: '2px',
                background: 'linear-gradient(90deg, #c4b5fd, #a5f3fc)',
            }} />
        </div>
    );
}