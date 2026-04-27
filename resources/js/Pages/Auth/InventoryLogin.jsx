import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

/* ─── Step indicator ───────────────────────────────────── */
function Step({ num, title, desc, icon, active, done }) {
    return (
        <div style={{
            display: 'flex', gap: '14px', alignItems: 'flex-start',
            opacity: active || done ? 1 : 0.4,
            transition: 'opacity 0.3s',
        }}>
            <div style={{
                width: '36px', height: '36px', flexShrink: 0,
                borderRadius: '50%',
                background: done
                    ? 'linear-gradient(135deg, #c084fc, #60a5fa)'
                    : active
                        ? 'rgba(192,132,252,0.15)'
                        : 'rgba(255,255,255,0.05)',
                border: done
                    ? 'none'
                    : `1px solid ${active ? 'rgba(192,132,252,0.5)' : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: done ? '14px' : '16px',
                color: done ? '#fff' : active ? '#c084fc' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.4s',
            }}>
                {done ? '✓' : icon}
            </div>
            <div>
                <div style={{
                    fontFamily: "'Almarai', sans-serif",
                    fontSize: '0.88rem', fontWeight: '700',
                    color: active || done ? '#fff' : 'rgba(255,255,255,0.5)',
                    marginBottom: '3px',
                }}>{title}</div>
                <div style={{
                    fontFamily: "'Almarai', sans-serif",
                    fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)',
                    lineHeight: 1.6,
                }}>{desc}</div>
            </div>
        </div>
    );
}

export default function InventoryLogin({ status, canResetPassword }) {
    const [activeStep, setActiveStep] = useState(0);
    const canvasRef = useRef(null);

    const { data, setData, post, processing, errors } = useForm({
        email: '', password: '', remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('inventory.login'));
    };

    /* Particles */
    useEffect(() => {
        const c = canvasRef.current;
        if (!c) return;
        const ctx = c.getContext('2d');
        const setSize = () => { c.width = c.offsetWidth; c.height = c.offsetHeight; };
        setSize();
        const pts = Array.from({ length: 30 }, () => ({
            x: Math.random() * c.width, y: Math.random() * c.height,
            r: Math.random() * 1 + 0.2,
            dx: (Math.random() - 0.5) * 0.15,
            dy: (Math.random() - 0.5) * 0.15,
            a: Math.random() * 0.25 + 0.04,
        }));
        let raf;
        const draw = () => {
            ctx.clearRect(0, 0, c.width, c.height);
            pts.forEach(p => {
                p.x += p.dx; p.y += p.dy;
                if (p.x < 0 || p.x > c.width) p.dx *= -1;
                if (p.y < 0 || p.y > c.height) p.dy *= -1;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${p.a})`; ctx.fill();
            });
            raf = requestAnimationFrame(draw);
        };
        draw();
        window.addEventListener('resize', setSize);
        return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', setSize); };
    }, []);

    /* Animate steps on load */
    useEffect(() => {
        const t1 = setTimeout(() => setActiveStep(1), 300);
        const t2 = setTimeout(() => setActiveStep(2), 800);
        const t3 = setTimeout(() => setActiveStep(3), 1300);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, []);

    const steps = [
        { icon: '🏪', title: 'افتح متجرك في سلة', desc: 'إنشاء حساب تاجر في منصة سلة مجاناً على salla.sa' },
        { icon: '📦', title: 'ثبّت تطبيق حريص', desc: 'ابحث عن "حريص" في سوق التطبيقات داخل لوحة سلة وثبّته' },
        { icon: '✉️', title: 'سجّل دخولك هنا', desc: 'استخدم البريد الإلكتروني الخاص بحساب سلة للدخول' },
    ];

    return (
        <>
            <Head title="حريص — تسجيل الدخول" />

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
                @keyframes shimmer {
                    0%   { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
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
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    color: #fff;
                    font-family: 'Almarai', sans-serif;
                    font-size: 0.92rem;
                    outline: none;
                    transition: all 0.25s;
                    direction: rtl;
                }
                .form-input:focus {
                    background: rgba(255,255,255,0.07);
                    border-color: rgba(192,132,252,0.5);
                    box-shadow: 0 0 0 3px rgba(192,132,252,0.08);
                }
                .form-input::placeholder { color: rgba(255,255,255,0.25); }

                .submit-btn {
                    width: 100%;
                    padding: 13px;
                    background: linear-gradient(135deg, rgba(192,132,252,0.25), rgba(96,165,250,0.2));
                    border: 1px solid rgba(192,132,252,0.35);
                    border-radius: 12px;
                    color: #fff;
                    font-family: 'Almarai', sans-serif;
                    font-size: 0.95rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s;
                    position: relative;
                    overflow: hidden;
                }
                .submit-btn:hover {
                    background: linear-gradient(135deg, rgba(192,132,252,0.35), rgba(96,165,250,0.3));
                    border-color: rgba(192,132,252,0.55);
                    transform: translateY(-1px);
                    box-shadow: 0 8px 24px rgba(192,132,252,0.15);
                }
                .submit-btn::after {
                    content: '';
                    position: absolute;
                    top: 0; left: -100%;
                    width: 60%; height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
                    animation: shimmer 2.5s infinite;
                }
                .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

                .error-msg {
                    font-family: 'Almarai', sans-serif;
                    font-size: 0.78rem;
                    color: rgba(248,113,113,0.9);
                    margin-top: 5px;
                    display: flex; align-items: center; gap: 5px;
                }

                ::-webkit-scrollbar { width: 3px; }
                ::-webkit-scrollbar-track { background: #000; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

                @media (max-width: 860px) {
                    .login-grid { grid-template-columns: 1fr !important; }
                    .left-panel { display: none !important; }
                }
            `}</style>

            {/* BG */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
                backgroundImage: 'url(/images/hero-bg.png)',
                backgroundSize: 'cover', backgroundPosition: 'center',
                opacity: 0.3,
            }} />
            <div style={{
                position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
                background: 'radial-gradient(ellipse 100% 100% at 50% 50%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.9) 100%)',
            }} />

            <div style={{ position: 'relative', zIndex: 2, direction: 'rtl', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

                {/* Header */}
                <header style={{
                    padding: '0 2rem', height: '60px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)',
                }}>
                    <Link href="/" style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        textDecoration: 'none',
                        color: 'rgba(255,255,255,0.4)',
                        fontFamily: "'Almarai', sans-serif",
                        fontSize: '0.82rem',
                        transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                    >
                        <span style={{ fontSize: '0.75rem' }}>←</span>
                        العودة للرئيسية
                    </Link>

                    <span style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: '1.2rem', fontWeight: '700',
                        letterSpacing: '0.1em',
                    }} className="iri-text">QUANTIX</span>

                    <Link href="/inventory/login" style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px', padding: '4px 12px',
                        fontFamily: "'Almarai', sans-serif",
                        fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)',
                        textDecoration: 'none',
                    }}>
                        حريص
                    </Link>
                </header>

                {/* Body */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div className="login-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '2rem',
                        width: '100%',
                        maxWidth: '1000px',
                        alignItems: 'center',
                    }}>

                        {/* ── LEFT: Welcome + How to register ── */}
                        <div className="left-panel" style={{
                            padding: '2.5rem',
                            background: 'rgba(255,255,255,0.025)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: '24px',
                            backdropFilter: 'blur(20px)',
                            animation: 'fadeUp 0.7s ease 0.1s both',
                        }}>
                            <canvas ref={canvasRef} style={{
                                position: 'absolute', opacity: 0, pointerEvents: 'none',
                            }} />

                            {/* App identity */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.8rem' }}>
                                <div style={{
                                    width: '52px', height: '52px',
                                    background: 'linear-gradient(135deg, rgba(192,132,252,0.2), rgba(96,165,250,0.15))',
                                    border: '1px solid rgba(192,132,252,0.25)',
                                    borderRadius: '16px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '22px',
                                }}>📦</div>
                                <div>
                                    <div style={{
                                        fontFamily: "'Cormorant Garamond', serif",
                                        fontSize: '1.4rem', fontWeight: '700',
                                        letterSpacing: '0.06em',
                                    }} className="iri-text">Harees</div>
                                    <div style={{
                                        fontFamily: "'Almarai', sans-serif",
                                        fontSize: '0.75rem',
                                        color: 'rgba(255,255,255,0.35)',
                                    }}>إدارة المخزون الذكية</div>
                                </div>
                            </div>

                            {/* Welcome message */}
                            <h2 style={{
                                fontFamily: "'Almarai', sans-serif",
                                fontSize: '1.6rem', fontWeight: '800',
                                color: '#fff', lineHeight: 1.25,
                                marginBottom: '0.8rem',
                            }}>
                                أهلاً بك في حريص 👋
                            </h2>
                            <p style={{
                                fontFamily: "'Almarai', sans-serif",
                                fontSize: '0.9rem', fontWeight: '300',
                                color: 'rgba(255,255,255,0.45)',
                                lineHeight: 1.8,
                                marginBottom: '2.2rem',
                            }}>
                                نظام متكامل لمتابعة تواريخ الصلاحية، يُنظّم مخزونك دفعةً بدفعة
                                ويحمي أرباحك من الهدر. سجّل دخولك للبدء فوراً.
                            </p>

                            {/* Divider */}
                            <div style={{
                                height: '1px', marginBottom: '2rem',
                                background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.08), transparent)',
                            }} />

                            {/* How to register */}
                            <div style={{
                                fontFamily: "'Almarai', sans-serif",
                                fontSize: '0.78rem', fontWeight: '700',
                                color: 'rgba(255,255,255,0.3)',
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                marginBottom: '1.4rem',
                            }}>
                                كيف تبدأ؟
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                {steps.map((s, i) => (
                                    <Step
                                        key={i}
                                        {...s}
                                        active={activeStep === i + 1}
                                        done={activeStep > i + 1}
                                    />
                                ))}
                            </div>

                            {/* Salla link */}
                            <a
                                href="https://salla.sa/"
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    marginTop: '2rem',
                                    fontFamily: "'Almarai', sans-serif",
                                    fontSize: '0.82rem',
                                    color: 'rgba(192,132,252,0.7)',
                                    textDecoration: 'none',
                                    transition: 'color 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = '#c084fc'}
                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(192,132,252,0.7)'}
                            >
                                افتح متجرك في سلة الآن
                                <span style={{ fontSize: '0.8rem' }}>↗</span>
                            </a>
                        </div>

                        {/* ── RIGHT: Login Form ── */}
                        <div style={{
                            padding: '2.5rem',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)',
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
                                color: 'rgba(255,255,255,0.35)',
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
                                        color: 'rgba(255,255,255,0.5)',
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
                                            color: 'rgba(255,255,255,0.5)',
                                        }}>كلمة المرور</label>
                                        {canResetPassword && (
                                            <Link href={route('password.request')} style={{
                                                fontFamily: "'Almarai', sans-serif",
                                                fontSize: '0.75rem',
                                                color: 'rgba(192,132,252,0.6)',
                                                textDecoration: 'none',
                                                transition: 'color 0.2s',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.color = '#c084fc'}
                                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(192,132,252,0.6)'}
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
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    cursor: 'pointer',
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={e => setData('remember', e.target.checked)}
                                        style={{
                                            width: '16px', height: '16px',
                                            accentColor: '#c084fc', cursor: 'pointer',
                                        }}
                                    />
                                    <span style={{
                                        fontFamily: "'Almarai', sans-serif",
                                        fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)',
                                    }}>تذكرني</span>
                                </label>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    className="submit-btn"
                                    disabled={processing}
                                >
                                    {processing ? 'جارٍ الدخول...' : 'دخول إلى حريص ←'}
                                </button>
                            </form>

                            {/* Divider */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                margin: '1.8rem 0',
                            }}>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                                <span style={{
                                    fontFamily: "'Almarai', sans-serif",
                                    fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)',
                                }}>أو</span>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                            </div>

                            {/* Salla OAuth hint */}
                            <div style={{
                                padding: '14px 16px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: '14px',
                                display: 'flex', alignItems: 'center', gap: '12px',
                            }}>
                                <div style={{
                                    width: '36px', height: '36px', flexShrink: 0,
                                    background: 'rgba(255,255,255,0.06)',
                                    borderRadius: '10px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '16px',
                                }}>🏪</div>
                                <div>
                                    <div style={{
                                        fontFamily: "'Almarai', sans-serif",
                                        fontSize: '0.82rem', fontWeight: '700',
                                        color: 'rgba(255,255,255,0.6)', marginBottom: '2px',
                                    }}>التسجيل عبر سلة فقط</div>
                                    <div style={{
                                        fontFamily: "'Almarai', sans-serif",
                                        fontSize: '0.75rem',
                                        color: 'rgba(255,255,255,0.28)',
                                        lineHeight: 1.5,
                                    }}>
                                        حريص متاح حصرياً لتجار سلة — ثبّت التطبيق من متجر سلة للحصول على حسابك
                                    </div>
                                </div>
                            </div>

                            {/* Switch app */}
                            <div style={{
                                marginTop: '1.5rem',
                                textAlign: 'center',
                                fontFamily: "'Almarai', sans-serif",
                                fontSize: '0.8rem',
                                color: 'rgba(255,255,255,0.25)',
                            }}>
                                تبحث عن{' '}
                                <Link href="/calculator/login" style={{
                                    color: 'rgba(192,132,252,0.6)',
                                    textDecoration: 'none',
                                    transition: 'color 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = '#c084fc'}
                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(192,132,252,0.6)'}
                                >
                                    مستشار — حاسبة الكميات؟
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}