import { Head, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useLang } from '@/Hooks/useLang';

/* ─── Translations ─────────────────────────────────────── */
const T = {
    ar: {
        pageTitle:    'مستشار — تسجيل الدخول',
        backHome:     'العودة للرئيسية',
        appSub:       'حاسبة الكميات الذكية',
        welcomeTitle: 'أهلاً بك في مستشار 👋',
        welcomeDesc:  'أداة حساب ذكية تحسب تلقائياً الكمية المثلى للعملاء بناءً على قواعد الحساب الخاصة بك — قرارات أدق وتكاليف أقل.',
        features:     ['حساب تلقائي', 'قواعد مخصصة', 'متعدد العملات', 'تقارير مفصلة'],
        howToStart:   'كيف تبدأ؟',
        sallaLink:    'افتح متجرك في سلة الآن',
        loginTitle:   'تسجيل الدخول',
        loginDesc:    'ادخل مباشرةً عبر حساب سلة',
        sallaBtn:     'دخول عبر سلة ←',
        orText:       'أو',
        sallaOnly:    'التسجيل عبر سلة فقط',
        sallaOnlyDesc:'مستشار متاح لتجار سلة — ثبّت التطبيق من سوق تطبيقات سلة للحصول على حسابك',
        switchText:   'تبحث عن',
        switchLink:   'حريص — إدارة المخزون؟',
        langBtn:      'ENGLISH',
        steps: [
            { icon: '🏪', title: 'افتح متجرك في سلة',  desc: 'أنشئ حساب تاجر مجاناً على salla.sa' },
            { icon: '⚖️', title: 'ثبّت تطبيق مستشار', desc: 'ابحث عن "مستشار" في سوق تطبيقات سلة وثبّته على متجرك' },
            { icon: '✉️', title: 'سجّل دخولك هنا',    desc: 'استخدم بريد حساب سلة للوصول إلى لوحة مستشار' },
        ],
    },
    en: {
        pageTitle:    'Mustashar — Login',
        backHome:     'Back to Home',
        appSub:       'Smart Quantity Calculator',
        welcomeTitle: 'Welcome to Mustashar 👋',
        welcomeDesc:  'A smart calculation tool that automatically calculates the right quantity for each customer based on your own rules — smarter purchasing decisions, lower costs.',
        features:     ['Auto calculation', 'Custom rules', 'Multi-currency', 'Detailed reports'],
        howToStart:   'How to get started?',
        sallaLink:    'Open your store on Salla now',
        loginTitle:   'Sign In',
        loginDesc:    'Sign in directly with your Salla account',
        sallaBtn:     'Continue with Salla →',
        orText:       'or',
        sallaOnly:    'Registration via Salla only',
        sallaOnlyDesc:"Mustashar is available to Salla merchants — install the app from Salla's App Market to get your account.",
        switchText:   'Looking for',
        switchLink:   'Harees — Inventory Management?',
        langBtn:      'العربية',
        steps: [
            { icon: '🏪', title: 'Open your store on Salla',    desc: 'Create a free merchant account at salla.sa' },
            { icon: '⚖️', title: 'Install the Mustashar app',  desc: "Search for \"Mustashar\" in Salla's App Market and install it" },
            { icon: '✉️', title: 'Sign in here',                desc: 'Use your Salla account email to access your dashboard' },
        ],
    },
};

/* ─── Step Component ───────────────────────────────────── */
function Step({ icon, title, desc, active, done, ff }) {
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
                    : active ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)',
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
                <div style={{ fontFamily: ff, fontSize: '0.88rem', fontWeight: '700',
                    color: active || done ? '#fff' : 'rgba(255,255,255,0.45)', marginBottom: '3px' }}>
                    {title}
                </div>
                <div style={{ fontFamily: ff, fontSize: '0.78rem', color: 'rgba(255,255,255,0.32)', lineHeight: 1.6 }}>
                    {desc}
                </div>
            </div>
        </div>
    );
}

/* ─── Page ─────────────────────────────────────────────── */
export default function CalculatorLogin({ status }) {
    const { lang, toggle, isAr, dir, ff } = useLang();
    const t = T[lang];
    const [activeStep, setActiveStep] = useState(0);

    const accent      = '#34d399';
    const accentFaint = 'rgba(52,211,153,0.12)';
    const accentBorder= 'rgba(52,211,153,0.3)';
    const accentGlow  = 'rgba(52,211,153,0.08)';

    /* Step animation — reruns on lang change */
    useEffect(() => {
        setActiveStep(0);
        const t1 = setTimeout(() => setActiveStep(1), 350);
        const t2 = setTimeout(() => setActiveStep(2), 900);
        const t3 = setTimeout(() => setActiveStep(3), 1450);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [lang]);

    return (
        <>
            <Head title={t.pageTitle} />

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
                        #fde68a 54%, #f9a8d4 72%, #c4b5fd 90%, #fff 100%);
                    background-size: 280% 280%;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: iridescent 6s ease infinite;
                }

                .submit-btn-calc {
                    width: 100%;
                    padding: 13px;
                    background: linear-gradient(135deg, rgba(52,211,153,0.22), rgba(96,165,250,0.18));
                    border: 1px solid rgba(52,211,153,0.35);
                    border-radius: 12px; color: #fff;
                    font-size: 0.95rem; font-weight: 700;
                    cursor: pointer; transition: all 0.3s;
                    position: relative; overflow: hidden;
                    display: block; text-align: center; text-decoration: none;
                }
                .submit-btn-calc:hover {
                    background: linear-gradient(135deg, rgba(52,211,153,0.32), rgba(96,165,250,0.25));
                    border-color: rgba(52,211,153,0.55);
                    transform: translateY(-1px);
                    box-shadow: 0 8px 24px rgba(52,211,153,0.12);
                }
                .submit-btn-calc::after {
                    content: ''; position: absolute; top: 0; left: -100%;
                    width: 60%; height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
                    animation: shimmerBtn 2.5s infinite;
                }

                .lang-btn {
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.12);
                    border-radius: 8px; padding: 5px 14px;
                    color: rgba(255,255,255,0.65);
                    font-size: 0.82rem; font-weight: 700;
                    cursor: pointer; letter-spacing: 0.05em;
                    transition: all 0.2s;
                }
                .lang-btn:hover {
                    background: rgba(255,255,255,0.1); color: #fff;
                    border-color: rgba(255,255,255,0.22);
                }

                ::-webkit-scrollbar { width: 3px; }
                ::-webkit-scrollbar-track { background: #000; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

                @media (max-width: 860px) {
                    .calc-grid { grid-template-columns: 1fr !important; }
                    .calc-left  { display: none !important; }
                }
            `}</style>

            {/* BG */}
            <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none',
                backgroundImage:'url(/images/hero-bg.png)',
                backgroundSize:'cover', backgroundPosition:'center', opacity:0.28 }} />
            <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none',
                background:'radial-gradient(ellipse 100% 100% at 50% 50%, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.92) 100%)' }} />

            <div style={{ position:'relative', zIndex:2, direction: dir, minHeight:'100vh', display:'flex', flexDirection:'column' }}>

                {/* ── Header ── */}
                <header style={{
                    padding:'0 2rem', height:'62px',
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    borderBottom:'1px solid rgba(255,255,255,0.06)',
                    background:'rgba(0,0,0,0.45)', backdropFilter:'blur(20px)',
                    position:'sticky', top:0, zIndex:50,
                }}>
                    <Link href="/" style={{
                        display:'flex', alignItems:'center', gap:'8px',
                        textDecoration:'none', color:'rgba(255,255,255,0.38)',
                        fontFamily: ff, fontSize:'0.82rem', transition:'color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.38)'}
                    >
                        <span style={{ transform: isAr ? 'none' : 'scaleX(-1)', display:'inline-block', fontSize:'0.75rem' }}>←</span>
                        {t.backHome}
                    </Link>

                    <span className="iri-text" style={{
                        fontFamily:"'Cormorant Garamond', serif",
                        fontSize:'1.25rem', fontWeight:'700', letterSpacing:'0.1em',
                    }}>QUANTIX</span>

                    {/* ✅ زر اللغة دائماً موجود */}
                    <button
                        className="lang-btn"
                        onClick={toggle}
                        style={{ fontFamily: isAr ? "'Cormorant Garamond', serif" : "'Almarai', sans-serif" }}
                    >
                        {t.langBtn}
                    </button>
                </header>

                {/* ── Body ── */}
                <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
                    <div className="calc-grid" style={{
                        display:'grid', gridTemplateColumns:'1fr 1fr',
                        gap:'2rem', width:'100%', maxWidth:'1000px', alignItems:'center',
                    }}>

                        {/* ── LEFT ── */}
                        <div className="calc-left" style={{
                            padding:'2.5rem',
                            background: accentGlow,
                            border:`1px solid ${accentBorder.replace('0.3','0.08')}`,
                            borderRadius:'24px', backdropFilter:'blur(20px)',
                            animation:'fadeUp 0.7s ease 0.1s both',
                        }}>
                            {/* App identity */}
                            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'1.8rem' }}>
                                <div style={{
                                    width:'52px', height:'52px',
                                    background:`linear-gradient(135deg, ${accentFaint}, rgba(96,165,250,0.1))`,
                                    border:`1px solid ${accentBorder}`,
                                    borderRadius:'16px',
                                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px',
                                    animation:'floatUp 3.5s ease-in-out infinite',
                                }}>⚖️</div>
                                <div>
                                    <div className="iri-text" style={{
                                        fontFamily:"'Cormorant Garamond', serif",
                                        fontSize:'1.4rem', fontWeight:'700', letterSpacing:'0.06em',
                                    }}>Mustashar</div>
                                    <div style={{ fontFamily: ff, fontSize:'0.75rem', color:'rgba(255,255,255,0.32)' }}>
                                        {t.appSub}
                                    </div>
                                </div>
                            </div>

                            <h2 style={{ fontFamily: ff, fontSize:'1.6rem', fontWeight:'800', color:'#fff', lineHeight:1.25, marginBottom:'0.8rem' }}>
                                {t.welcomeTitle}
                            </h2>
                            <p style={{ fontFamily: ff, fontSize:'0.9rem', fontWeight:'300', color:'rgba(255,255,255,0.42)', lineHeight:1.8, marginBottom:'2rem' }}>
                                {t.welcomeDesc}
                            </p>

                            {/* Feature pills — original preserved */}
                            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'2rem' }}>
                                {t.features.map((f, i) => (
                                    <span key={i} style={{
                                        background: accentFaint, border:`1px solid ${accentBorder}`,
                                        borderRadius:'100px', padding:'4px 12px',
                                        fontFamily: ff, fontSize:'0.75rem', fontWeight:'700',
                                        color: accent,
                                    }}>{f}</span>
                                ))}
                            </div>

                            <div style={{ height:'1px', marginBottom:'2rem',
                                background:`linear-gradient(to left, transparent, ${accentBorder.replace('0.3','0.15')}, transparent)` }} />

                            <div style={{ fontFamily: ff, fontSize:'0.76rem', fontWeight:'700',
                                color:'rgba(255,255,255,0.28)', letterSpacing:'0.12em',
                                textTransform:'uppercase', marginBottom:'1.4rem' }}>
                                {t.howToStart}
                            </div>

                            <div style={{ display:'flex', flexDirection:'column', gap:'1.2rem' }}>
                                {t.steps.map((s, i) => (
                                    <Step key={i} {...s} ff={ff}
                                        active={activeStep === i+1} done={activeStep > i+1} />
                                ))}
                            </div>

                            <a href="https://salla.sa/" target="_blank" rel="noreferrer" style={{
                                display:'inline-flex', alignItems:'center', gap:'6px', marginTop:'2rem',
                                fontFamily: ff, fontSize:'0.82rem',
                                color:`${accent}99`, textDecoration:'none', transition:'color 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = accent}
                            onMouseLeave={e => e.currentTarget.style.color = `${accent}99`}
                            >
                                {t.sallaLink} <span>↗</span>
                            </a>
                        </div>

                        {/* ── RIGHT: Login ── */}
                        <div style={{
                            padding:'2.5rem',
                            background:'rgba(255,255,255,0.025)',
                            border:'1px solid rgba(255,255,255,0.07)',
                            borderRadius:'24px', backdropFilter:'blur(24px)',
                            animation:'fadeUp 0.7s ease 0.2s both',
                        }}>
                            <h3 style={{ fontFamily: ff, fontSize:'1.35rem', fontWeight:'800', color:'#fff', marginBottom:'0.4rem' }}>
                                {t.loginTitle}
                            </h3>
                            <p style={{ fontFamily: ff, fontSize:'0.85rem', fontWeight:'300', color:'rgba(255,255,255,0.32)', marginBottom:'2rem' }}>
                                {t.loginDesc}
                            </p>

                            {status && (
                                <div style={{ padding:'10px 14px', borderRadius:'10px', marginBottom:'1.5rem',
                                    background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.2)',
                                    fontFamily: ff, fontSize:'0.85rem', color:'rgba(52,211,153,0.8)' }}>
                                    {status}
                                </div>
                            )}

                            {/* ✅ OAuth Salla button — original logic preserved */}
                            <div style={{ marginTop: 30 }}>
                                <a
                                    href="/auth/salla?app=calculator"
                                    className="submit-btn-calc"
                                    style={{ fontFamily: ff }}
                                >
                                    {t.sallaBtn}
                                </a>
                            </div>

                            {/* Divider */}
                            <div style={{ display:'flex', alignItems:'center', gap:'12px', margin:'1.8rem 0' }}>
                                <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.06)' }} />
                                <span style={{ fontFamily: ff, fontSize:'0.75rem', color:'rgba(255,255,255,0.18)' }}>
                                    {t.orText}
                                </span>
                                <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.06)' }} />
                            </div>

                            {/* Salla hint card */}
                            <div style={{
                                padding:'14px 16px', background: accentGlow,
                                border:`1px solid ${accentBorder.replace('0.3','0.12')}`,
                                borderRadius:'14px', display:'flex', alignItems:'center', gap:'12px',
                            }}>
                                <div style={{
                                    width:'36px', height:'36px', flexShrink:0,
                                    background: accentFaint, border:`1px solid ${accentBorder}`,
                                    borderRadius:'10px',
                                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px',
                                }}>🏪</div>
                                <div>
                                    <div style={{ fontFamily: ff, fontSize:'0.82rem', fontWeight:'700',
                                        color:'rgba(255,255,255,0.55)', marginBottom:'2px' }}>
                                        {t.sallaOnly}
                                    </div>
                                    <div style={{ fontFamily: ff, fontSize:'0.75rem',
                                        color:'rgba(255,255,255,0.28)', lineHeight:1.5 }}>
                                        {t.sallaOnlyDesc}
                                    </div>
                                </div>
                            </div>

                            {/* Switch app */}
                            <div style={{ marginTop:'1.5rem', textAlign:'center',
                                fontFamily: ff, fontSize:'0.8rem', color:'rgba(255,255,255,0.22)' }}>
                                {t.switchText}{' '}
                                <Link href="/inventory/login" style={{
                                    color:`${accent}99`, textDecoration:'none', transition:'color 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = accent}
                                onMouseLeave={e => e.currentTarget.style.color = `${accent}99`}
                                >
                                    {t.switchLink}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}