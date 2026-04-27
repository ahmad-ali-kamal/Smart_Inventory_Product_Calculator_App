import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';

/* ─── Animated Step ────────────────────────────────────── */
function Step({ icon, title, desc, active, done }) {
    return (
        <div style={{
            display: 'flex', gap: '14px', alignItems: 'flex-start',
            opacity: active || done ? 1 : 0.38,
            transition: 'opacity 0.4s',
        }}>
            <div style={{
                width: '36px', height: '36px', flexShrink: 0, borderRadius: '50%',
                background: done
                    ? 'linear-gradient(135deg, #34d399, #60a5fa)'
                    : active
                        ? 'rgba(52,211,153,0.12)'
                        : 'rgba(255,255,255,0.04)',
                border: done
                    ? 'none'
                    : `1px solid ${active ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.09)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: done ? '14px' : '15px',
                color: done ? '#fff' : active ? '#34d399' : 'rgba(255,255,255,0.35)',
                transition: 'all 0.4s',
            }}>
                {done ? '✓' : icon}
            </div>
            <div>
                <div style={{
                    fontFamily: "'Almarai', sans-serif",
                    fontSize: '0.88rem', fontWeight: '700',
                    color: active || done ? '#fff' : 'rgba(255,255,255,0.45)',
                    marginBottom: '3px',
                }}>{title}</div>
                <div style={{
                    fontFamily: "'Almarai', sans-serif",
                    fontSize: '0.78rem', color: 'rgba(255,255,255,0.32)',
                    lineHeight: 1.6,
                }}>{desc}</div>
            </div>
        </div>
    );
}

export default function CalculatorLogin({ status, canResetPassword }) {
    const [activeStep, setActiveStep] = useState(0);

    const { data, setData, post, processing, errors } = useForm({
        email: '', password: '', remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('calculator.login'));
    };

    useEffect(() => {
        const t1 = setTimeout(() => setActiveStep(1), 350);
        const t2 = setTimeout(() => setActiveStep(2), 900);
        const t3 = setTimeout(() => setActiveStep(3), 1450);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, []);

    const steps = [
        { icon: '🏪', title: 'افتح متجرك في سلة', desc: 'أنشئ حساب تاجر مجاناً على store.salla.sa' },
        { icon: '⚖️', title: 'ثبّت تطبيق مستشار', desc: 'ابحث عن "مستشار" في سوق تطبيقات سلة وثبّته على متجرك' },
        { icon: '✉️', title: 'سجّل دخولك هنا', desc: 'استخدم بريد حساب سلة للوصول إلى لوحة مستشار' },
    ];

    /* Accent color for this app: teal/green */
    const accent     = '#34d399';
    const accentFaint= 'rgba(52,211,153,0.12)';
    const accentBorder='rgba(52,211,153,0.3)';
    const accentGlow = 'rgba(52,211,153,0.08)';

    return (
        <>
            <Head title="مستشار — تسجيل الدخول" />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&display=swap');

                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: #000; color: #fff; -webkit-font-smoothing: antialiased; overflow-x: hidden; }

                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes iridescent {
                    0%   { background-position: 0% 50%; }
                    50%  { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes shimmerBtn {
                    0%   { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                @keyframes floatUp {
                    0%, 100% { transform: translateY(0); }
                    50%      { transform: translateY(-5px); }
                }

                .iri-text {
                    background: linear-gradient(120deg,
                        #fff 0%, #ddd6fe 18%, #a5f3fc 36%,
                        #fde68a 54%, #f9a8d4 72%, #c4b5fd 90%, #fff 100%
                    );
                    background-size: 280% 280%;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: iridescent 6s ease infinite;
                }

                .form-input {
                    width: 100%;
                    padding: 12px 16px;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.09);
                    border-radius: 12px;
                    color: #fff;
                    font-family: 'Almarai', sans-serif;
                    font-size: 0.92rem;
                    outline: none;
                    transition: all 0.25s;
                    direction: rtl;
                }
                .form-input:focus {
                    background: rgba(52,211,153,0.04);
                    border-color: rgba(52,211,153,0.45);
                    box-shadow: 0 0 0 3px rgba(52,211,153,0.07);
                }
                .form-input::placeholder { color: rgba(255,255,255,0.22); }

                .submit-btn-calc {
                    width: 100%;
                    padding: 13px;
                    background: linear-gradient(135deg,
                        rgba(52,211,153,0.22), rgba(96,165,250,0.18));
                    border: 1px solid rgba(52,211,153,0.35);
                    border-radius: 12px;
                    color: #fff;
                    font-family: 'Almarai', sans-serif;
                    font-size: 0.95rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s;
                    position: relative; overflow: hidden;
                }
                .submit-btn-calc:hover {
                    background: linear-gradient(135deg,
                        rgba(52,211,153,0.32), rgba(96,165,250,0.25));
                    border-color: rgba(52,211,153,0.55);
                    transform: translateY(-1px);
                    box-shadow: 0 8px 24px rgba(52,211,153,0.12);
                }
                .submit-btn-calc::after {
                    content: '';
                    position: absolute; top: 0; left: -100%;
                    width: 60%; height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
                    animation: shimmerBtn 2.5s infinite;
                }
                .submit-btn-calc:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

                .error-msg {
                    font-family: 'Almarai', sans-serif;
                    font-size: 0.78rem; color: rgba(248,113,113,0.9);
                    margin-top: 5px;
                    display: flex; align-items: center; gap: 5px;
                }

                ::-webkit-scrollbar { width: 3px; }
                ::-webkit-scrollbar-track { background: #000; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

                @media (max-width: 860px) {
                    .calc-grid  { grid-template-columns: 1fr !important; }
                    .left-panel { display: none !important; }
                }
            `}</style>

            {/* BG */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
                backgroundImage: 'url(/images/hero-bg.png)',
                backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.28,
            }} />
            <div style={{
                position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
                background: 'radial-gradient(ellipse 100% 100% at 50% 50%, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.92) 100%)',
            }} />

            <div style={{ position: 'relative', zIndex: 2, direction: 'rtl', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

                {/* Header */}
                <header style={{
                    padding: '0 2rem', height: '60px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(20px)',
                }}>
                    <Link href="/" style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        textDecoration: 'none', color: 'rgba(255,255,255,0.38)',
                        fontFamily: "'Almarai', sans-serif", fontSize: '0.82rem',
                        transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.38)'}
                    >
                        <span style={{ fontSize: '0.75rem' }}>←</span>
                        العودة للرئيسية
                    </Link>

                    <span className="iri-text" style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: '1.2rem', fontWeight: '700', letterSpacing: '0.1em',
                    }}>QUANTIX</span>

                    <Link href="/calculator/login" style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.09)',
                        borderRadius: '8px', padding: '4px 12px',
                        fontFamily: "'Almarai', sans-serif",
                        fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)',
                        textDecoration: 'none',
                    }}>
                        مستشار
                    </Link>
                </header>

                {/* Body */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div className="calc-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '2rem',
                        width: '100%', maxWidth: '1000px',
                        alignItems: 'center',
                    }}>

                        {/* ── LEFT: Welcome ── */}
                        <div className="left-panel" style={{
                            padding: '2.5rem',
                            background: 'rgba(52,211,153,0.025)',
                            border: '1px solid rgba(52,211,153,0.08)',
                            borderRadius: '24px',
                            backdropFilter: 'blur(20px)',
                            animation: 'fadeUp 0.7s ease 0.1s both',
                        }}>
                            {/* App identity */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.8rem' }}>
                                <div style={{
                                    width: '52px', height: '52px',
                                    background: `linear-gradient(135deg, ${accentFaint}, rgba(96,165,250,0.1))`,
                                    border: `1px solid ${accentBorder}`,
                                    borderRadius: '16px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '22px',
                                    animation: 'floatUp 3.5s ease-in-out infinite',
                                }}>⚖️</div>
                                <div>
                                    <div className="iri-text" style={{
                                        fontFamily: "'Cormorant Garamond', serif",
                                        fontSize: '1.4rem', fontWeight: '700',
                                        letterSpacing: '0.06em',
                                    }}>Mustashar</div>
                                    <div style={{
                                        fontFamily: "'Almarai', sans-serif",
                                        fontSize: '0.75rem', color: 'rgba(255,255,255,0.32)',
                                    }}>حاسبة الكميات الذكية</div>
                                </div>
                            </div>

                            {/* Welcome msg */}
                            <h2 style={{
                                fontFamily: "'Almarai', sans-serif",
                                fontSize: '1.6rem', fontWeight: '800',
                                color: '#fff', lineHeight: 1.25, marginBottom: '0.8rem',
                            }}>
                                أهلاً بك في مستشار 👋
                            </h2>
                            <p style={{
                                fontFamily: "'Almarai', sans-serif",
                                fontSize: '0.9rem', fontWeight: '300',
                                color: 'rgba(255,255,255,0.42)',
                                lineHeight: 1.8, marginBottom: '2.2rem',
                            }}>
                                أداة حساب ذكية تحسب تلقائياً الكمية المثلى لعملائك
                                بناءً على قواعدك الخاصة — قرارات أدق وتكاليف أقل.
                            </p>

                            {/* Feature pills */}
                            <div style={{
                                display: 'flex', flexWrap: 'wrap', gap: '8px',
                                marginBottom: '2rem',
                            }}>
                                {['حساب تلقائي', 'قواعد مخصصة', 'متعدد العملات', 'تقارير مفصلة'].map((f, i) => (
                                    <span key={i} style={{
                                        background: accentFaint,
                                        border: `1px solid ${accentBorder}`,
                                        borderRadius: '100px',
                                        padding: '4px 12px',
                                        fontFamily: "'Almarai', sans-serif",
                                        fontSize: '0.75rem', fontWeight: '700',
                                        color: accent,
                                    }}>{f}</span>
                                ))}
                            </div>

                            <div style={{
                                height: '1px', marginBottom: '2rem',
                                background: 'linear-gradient(to left, transparent, rgba(52,211,153,0.12), transparent)',
                            }} />

                            {/* Steps */}
                            <div style={{
                                fontFamily: "'Almarai', sans-serif",
                                fontSize: '0.78rem', fontWeight: '700',
                                color: 'rgba(255,255,255,0.28)',
                                letterSpacing: '0.12em', textTransform: 'uppercase',
                                marginBottom: '1.4rem',
                            }}>كيف تبدأ؟</div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                {steps.map((s, i) => (
                                    <Step
                                        key={i} {...s}
                                        active={activeStep === i + 1}
                                        done={activeStep > i + 1}
                                    />
                                ))}
                            </div>

                            <a
                                href="https://store.salla.sa"
                                target="_blank" rel="noreferrer"
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    marginTop: '2rem',
                                    fontFamily: "'Almarai', sans-serif",
                                    fontSize: '0.82rem',
                                    color: `${accent}99`,
                                    textDecoration: 'none', transition: 'color 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = accent}
                                onMouseLeave={e => e.currentTarget.style.color = `${accent}99`}
                            >
                                افتح متجرك في سلة الآن
                                <span style={{ fontSize: '0.8rem' }}>↗</span>
                            </a>
                        </div>

                        {/* ── RIGHT: Form ── */}
                        <div style={{
                            padding: '2.5rem',
                            background: 'rgba(255,255,255,0.025)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: '24px',
                            backdropFilter: 'blur(24px)',
                            animation: 'fadeUp 0.7s ease 0.2s both',
                        }}>
                            <h3 style={{
                                fontFamily: "'Almarai', sans-serif",
                                fontSize: '1.35rem', fontWeight: '800',
                                color: '#fff', marginBottom: '0.4rem',
                            }}>تسجيل الدخول</h3>
                            <p style={{
                                fontFamily: "'Almarai', sans-serif",
                                fontSize: '0.85rem', fontWeight: '300',
                                color: 'rgba(255,255,255,0.32)',
                                marginBottom: '2rem',
                            }}>استخدم بريد حساب سلة الخاص بك</p>

                            {status && (
                                <div style={{
                                    padding: '10px 14px', borderRadius: '10px', marginBottom: '1.5rem',
                                    background: 'rgba(52,211,153,0.08)',
                                    border: '1px solid rgba(52,211,153,0.2)',
                                    fontFamily: "'Almarai', sans-serif",
                                    fontSize: '0.85rem', color: 'rgba(52,211,153,0.8)',
                                }}>{status}</div>
                            )}

                            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                {/* Email */}
                                <div>
                                    <label style={{
                                        display: 'block', marginBottom: '6px',
                                        fontFamily: "'Almarai', sans-serif",
                                        fontSize: '0.82rem', fontWeight: '700',
                                        color: 'rgba(255,255,255,0.45)',
                                    }}>البريد الإلكتروني</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="example@store.com"
                                        value={data.email}
                                        onChange={e => setData('email', e.target.value)}
                                        autoComplete="username"
                                        required
                                    />
                                    {errors.email && <div className="error-msg"><span>⚠</span>{errors.email}</div>}
                                </div>

                                {/* Password */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <label style={{
                                            fontFamily: "'Almarai', sans-serif",
                                            fontSize: '0.82rem', fontWeight: '700',
                                            color: 'rgba(255,255,255,0.45)',
                                        }}>كلمة المرور</label>
                                        {canResetPassword && (
                                            <Link href={route('password.request')} style={{
                                                fontFamily: "'Almarai', sans-serif",
                                                fontSize: '0.75rem',
                                                color: `${accent}99`,
                                                textDecoration: 'none', transition: 'color 0.2s',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.color = accent}
                                            onMouseLeave={e => e.currentTarget.style.color = `${accent}99`}
                                            >
                                                نسيت كلمة المرور؟
                                            </Link>
                                        )}
                                    </div>
                                    <input
                                        type="password"
                                        className="form-input"
                                        placeholder="••••••••"
                                        value={data.password}
                                        onChange={e => setData('password', e.target.value)}
                                        autoComplete="current-password"
                                        required
                                    />
                                    {errors.password && <div className="error-msg"><span>⚠</span>{errors.password}</div>}
                                </div>

                                {/* Remember */}
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={e => setData('remember', e.target.checked)}
                                        style={{ width: '16px', height: '16px', accentColor: accent, cursor: 'pointer' }}
                                    />
                                    <span style={{
                                        fontFamily: "'Almarai', sans-serif",
                                        fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)',
                                    }}>تذكرني</span>
                                </label>

                                <button
                                    type="submit"
                                    className="submit-btn-calc"
                                    disabled={processing}
                                >
                                    {processing ? 'جارٍ الدخول...' : 'دخول إلى مستشار ←'}
                                </button>
                            </form>

                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                margin: '1.8rem 0',
                            }}>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                                <span style={{ fontFamily: "'Almarai', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.18)' }}>أو</span>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                            </div>

                            {/* Salla hint */}
                            <div style={{
                                padding: '14px 16px',
                                background: accentGlow,
                                border: `1px solid ${accentBorder.replace('0.3', '0.12')}`,
                                borderRadius: '14px',
                                display: 'flex', alignItems: 'center', gap: '12px',
                            }}>
                                <div style={{
                                    width: '36px', height: '36px', flexShrink: 0,
                                    background: accentFaint,
                                    border: `1px solid ${accentBorder}`,
                                    borderRadius: '10px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '16px',
                                }}>🏪</div>
                                <div>
                                    <div style={{
                                        fontFamily: "'Almarai', sans-serif",
                                        fontSize: '0.82rem', fontWeight: '700',
                                        color: 'rgba(255,255,255,0.55)', marginBottom: '2px',
                                    }}>التسجيل عبر سلة فقط</div>
                                    <div style={{
                                        fontFamily: "'Almarai', sans-serif",
                                        fontSize: '0.75rem',
                                        color: 'rgba(255,255,255,0.28)',
                                        lineHeight: 1.5,
                                    }}>
                                        مستشار متاح لتجار سلة — ثبّت التطبيق من سوق تطبيقات سلة للحصول على حسابك
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                marginTop: '1.5rem', textAlign: 'center',
                                fontFamily: "'Almarai', sans-serif",
                                fontSize: '0.8rem', color: 'rgba(255,255,255,0.22)',
                            }}>
                                تبحث عن{' '}
                                <Link href="/inventory/login" style={{
                                    color: `${accent}99`,
                                    textDecoration: 'none', transition: 'color 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = accent}
                                onMouseLeave={e => e.currentTarget.style.color = `${accent}99`}
                                >
                                    حريص — إدارة المخزون؟
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}