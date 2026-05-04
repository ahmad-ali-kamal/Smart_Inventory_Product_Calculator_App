import { Head, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useLang } from '@/hooks/useLang';
import GuestLayout from '@/Layouts/GuestLayout';

/* ─── Translations ─────────────────────────────────────── */
const T = {
    ar: {
        pageTitle:    'حريص — تسجيل الدخول',
        backHome:     'العودة للرئيسية',
        appName:      'حريص',
        appSub:       'إدارة المخزون الذكية',
        welcomeTitle: 'أهلاً بك في حريص',
        welcomeDesc:  'نظام متكامل لمتابعة تواريخ الصلاحية، يُنظّم مخزونك دفعةً بدفعة ويحمي أرباحك من الهدر.',
        loginTitle:   'تسجيل الدخول',
        loginDesc:    'ادخل مباشرةً عبر حساب سلة',
        sallaBtn:     'دخول عبر سلة ←',
        orText:       'أو',
        sallaOnly:    'التسجيل عبر سلة فقط',
        sallaOnlyDesc:'حريص متاح حصرياً لتجار سلة — ثبّت التطبيق من متجر سلة للحصول على حسابك',
        steps: [
            { title: 'افتح متجرك في سلة',  desc: 'إنشاء حساب تاجر مجاني في منصة سلة' },
            { title: 'ثبّت تطبيق حريص',    desc: 'ابحث عن "حريص" في سوق تطبيقات سلة' },
            { title: 'سجّل دخولك هنا',     desc: 'استخدم بريد حساب سلة للدخول' },
        ],
    },
    en: {
        pageTitle:    'Harees — Login',
        backHome:     'Back to Home',
        appName:      'Harees',
        appSub:       'Smart Inventory Management',
        welcomeTitle: 'Welcome to Harees',
        welcomeDesc:  'A complete expiry monitoring system that organizes your inventory batch by batch.',
        loginTitle:   'Sign In',
        loginDesc:    'Sign in directly with your Salla account',
        sallaBtn:     'Continue with Salla →',
        orText:       'or',
        sallaOnly:    'Registration via Salla only',
        sallaOnlyDesc:'Harees is exclusively available to Salla merchants.',
        steps: [
            { title: 'Open your store on Salla',  desc: 'Create a free merchant account' },
            { title: 'Install Harees app',         desc: 'Search for "Harees" in App Market' },
            { title: 'Sign in here',               desc: 'Use your Salla email to access' },
        ],
    },
};

function HareesIcon({ size = 24 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 6.5V12C3 16.5 7 20.5 12 22C17 20.5 21 16.5 21 12V6.5L12 2Z"
                stroke="url(#harees-grad)" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
            <path d="M9 12l2 2 4-4" stroke="url(#harees-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <defs>
                <linearGradient id="harees-grad" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#c4b5fd"/>
                    <stop offset="100%" stopColor="#a5f3fc"/>
                </linearGradient>
            </defs>
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L20 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

function Step({ title, desc, active, done, ff }) {
    return (
        <div style={{
            display: 'flex', gap: '14px', alignItems: 'flex-start',
            opacity: active || done ? 1 : 0.35,
            transition: 'opacity 0.3s',
        }}>
            <div style={{
                width: '36px', height: '36px', flexShrink: 0, borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF9FFC, #5227FF)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.4s',
                boxShadow: active || done ? '0 0 12px rgba(136,132,191,0.4)' : 'none',
            }}>
                <CheckIcon />
            </div>
            <div>
                <div style={{ fontFamily: ff, fontSize: '0.88rem', fontWeight: '700', color: active || done ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                    {title}
                </div>
                <div style={{ fontFamily: ff, fontSize: '0.78rem', color: 'rgba(230, 225, 245, 0.4)', lineHeight: 1.6 }}>
                    {desc}
                </div>
            </div>
        </div>
    );
}

export default function HareesLogin({ status }) {
    const { lang, isAr, dir, ff } = useLang();
    const t = T[lang];
    const [activeStep, setActiveStep] = useState(0);

    useEffect(() => {
        setActiveStep(0);
        const timers = [
            setTimeout(() => setActiveStep(1), 300),
            setTimeout(() => setActiveStep(2), 800),
            setTimeout(() => setActiveStep(3), 1300),
        ];
        return () => timers.forEach(clearTimeout);
    }, [lang]);

    return (
        <>
            <Head title={t.pageTitle} />
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800&family=Cormorant+Garamond:wght@700;900&display=swap');

                /*
                 * ✅ لا نُعيد تعريف الخلفية هنا — GuestLayout يتولى ذلك
                 * هذا يمنع أي تعارض أو وميض ناتج عن إعادة تعريف background
                 */
                body { color: #E6E1F5; font-family: ${ff}; overflow-x: hidden; margin: 0; }

                .iri-text {
                    background: linear-gradient(120deg, #fff 0%, #ddd6fe 18%, #a5f3fc 36%, #fde68a 54%, #f9a8d4 72%, #c4b5fd 90%, #fff 100%);
                    background-size: 280% 280%;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: iridescent 6s ease infinite;
                }
                @keyframes iridescent {
                    0%   { background-position: 0% 50%; }
                    50%  { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                .harees-gradient {
                    background: linear-gradient(90deg, #c4b5fd 0%, #818cf8 40%, #a5f3fc 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .login-card {
                    background: rgba(23, 20, 42, 0.4);
                    border: 1px solid rgba(120, 112, 175, 0.15);
                    border-radius: 30px;
                    backdrop-filter: blur(20px);
                    transition: all 0.5s ease;
                }

                .submit-btn {
                    width: 100%; padding: 1rem; background: #8884BF;
                    border-radius: 15px; color: #fff; font-weight: 700;
                    border: none; cursor: pointer; transition: all 0.3s;
                    text-decoration: none; display: block; text-align: center;
                    font-family: inherit;
                }
                .submit-btn:hover { background: #6b67a1; transform: translateY(-2px); }

                @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

                @media (max-width: 860px) { .inv-left { display: none !important; } .inv-grid { grid-template-columns: 1fr !important; } }
            `}</style>

            {/* ✅ لا يوجد هنا LiquidEther — الخلفية موجودة في GuestLayout */}

            <div style={{ direction: dir, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

                <header style={{
                    padding: '0 2rem', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'rgba(15, 14, 23, 0.7)', backdropFilter: 'blur(15px)',
                    borderBottom: '1px solid rgba(120, 112, 175, 0.1)',
                    position: 'sticky', top: 0, zIndex: 50,
                }}>
                    <Link href="/" style={{ color: '#8A86A2', textDecoration: 'none', fontSize: '0.9rem', fontFamily: ff }}>
                        {isAr ? '←' : '→'} {t.backHome}
                    </Link>
                    <span className="iri-text" style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: '1.5rem', fontWeight: '900', letterSpacing: '0.1em',
                    }}>QUANTIX</span>
                </header>

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div className="inv-grid" style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem',
                        width: '100%', maxWidth: '1000px', alignItems: 'stretch',
                    }}>

                        {/* Left: Welcome panel */}
                        <div className="login-card inv-left" style={{
                            padding: '3rem', animation: 'fadeUp 0.7s ease 0.1s both',
                            display: 'flex', flexDirection: 'column',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
                                <div style={{
                                    width: '52px', height: '52px', flexShrink: 0,
                                    background: 'rgba(136, 132, 191, 0.1)',
                                    border: '1px solid rgba(120, 112, 175, 0.2)',
                                    borderRadius: '16px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <HareesIcon size={26} />
                                </div>
                                <div>
                                    <div className="harees-gradient" style={{
                                        fontSize: '1.5rem', fontWeight: '800',
                                        fontFamily: "'Cormorant Garamond', serif",
                                        letterSpacing: '0.05em',
                                    }}>{t.appName}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#8A86A2' }}>{t.appSub}</div>
                                </div>
                            </div>

                            <h2 style={{ fontFamily: ff, fontSize: '1.8rem', fontWeight: '800', marginBottom: '1rem' }}>
                                {t.welcomeTitle}
                            </h2>
                            <p style={{ color: '#8A86A2', lineHeight: 1.7, marginBottom: '2.5rem' }}>{t.welcomeDesc}</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: 'auto' }}>
                                {t.steps.map((s, i) => (
                                    <Step key={i} {...s} ff={ff} active={activeStep === i + 1} done={activeStep > i + 1} />
                                ))}
                            </div>
                        </div>

                        {/* Right: Login form */}
                        <div className="login-card" style={{
                            padding: '3rem', animation: 'fadeUp 0.7s ease 0.2s both',
                            display: 'flex', flexDirection: 'column',
                        }}>
                            <h3 style={{ fontFamily: ff, fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.5rem' }}>{t.loginTitle}</h3>
                            <p style={{ color: '#8A86A2', marginBottom: '2rem' }}>{t.loginDesc}</p>

                            {status && <div style={{ color: '#c4b5fd', marginBottom: '1rem' }}>{status}</div>}

                            <a href="/auth/salla?app=management" className="submit-btn" style={{ fontFamily: ff }}>
                                {t.sallaBtn}
                            </a>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '2rem 0' }}>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(120, 112, 175, 0.2)' }} />
                                <span style={{ color: '#8A86A2', fontSize: '0.8rem' }}>{t.orText}</span>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(120, 112, 175, 0.2)' }} />
                            </div>

                            <div style={{
                                padding: '1.5rem', background: 'rgba(255,255,255,0.03)',
                                borderRadius: '20px', border: '1px solid rgba(120, 112, 175, 0.1)',
                                marginTop: 'auto',
                            }}>
                                <div style={{ fontWeight: '700', color: '#fff', marginBottom: '5px', fontSize: '0.9rem' }}>{t.sallaOnly}</div>
                                <div style={{ fontSize: '0.8rem', color: '#8A86A2', lineHeight: 1.5 }}>{t.sallaOnlyDesc}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

/*
 * ✅ PERSISTENT LAYOUT
 * نفس الـ GuestLayout المستخدم في Welcome.jsx
 * Inertia تكتشف أن الـ layout متطابق ← لا تُعيد mount ← الخلفية تستمر
 */
HareesLogin.layout = page => <GuestLayout>{page}</GuestLayout>;