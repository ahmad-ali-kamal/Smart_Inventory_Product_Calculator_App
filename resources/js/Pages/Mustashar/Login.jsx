import { Head, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useLang } from '@/Hooks/useLang';
import GuestLayout from '@/Layouts/GuestLayout';

/* ─── Translations ─────────────────────────────────────── */
const T = {
    ar: {
        pageTitle:    'مستشار — تسجيل الدخول',
        backHome:     'العودة للرئيسية',
        appName:      'مستشار',
        appSub:       'حاسبة الكميات الذكية',
        welcomeTitle: 'أهلاً بك في مستشار',
        welcomeDesc:  'أداة حساب ذكية تحسب تلقائياً الكمية المثلى للعملاء بناءً على قواعد الحساب الخاصة بك — قرارات أدق وتكاليف أقل.',
        loginTitle:   'تسجيل الدخول',
        loginDesc:    'ادخل مباشرةً عبر حساب سلة',
        sallaBtn:     'دخول عبر سلة ←',
        orText:       'أو',
        sallaOnly:    'التسجيل عبر سلة فقط',
        sallaOnlyDesc:'مستشار متاح لتجار سلة — ثبّت التطبيق من سوق تطبيقات سلة للحصول على حسابك',
        steps: [
            { title: 'افتح متجرك في سلة',  desc: 'أنشئ حساب تاجر مجاناً على salla.sa' },
            { title: 'ثبّت تطبيق مستشار', desc: 'ابحث عن "مستشار" في سوق تطبيقات سلة وثبّته على متجرك' },
            { title: 'سجّل دخولك هنا',    desc: 'استخدم بريد حساب سلة للوصول إلى لوحة مستشار' },
        ],
    },
    en: {
        pageTitle:    'Mustashar — Login',
        backHome:     'Back Home',
        appName:      'Mustashar',
        appSub:       'Smart Quantity Calculator',
        welcomeTitle: 'Welcome to Mustashar',
        welcomeDesc:  'A smart calculation tool that automatically calculates the optimal quantity for customers based on your calculation rules.',
        loginTitle:   'Login',
        loginDesc:    'Access directly via Salla account',
        sallaBtn:     'Login via Salla ←',
        orText:       'OR',
        sallaOnly:    'Salla Login Only',
        sallaOnlyDesc:'Mustashar is available for Salla merchants — install the app from Salla App Store to get your account',
        steps: [
            { title: 'Open your store',  desc: 'Create a merchant account for free on salla.sa' },
            { title: 'Install App',      desc: 'Search for "Mustashar" in Salla App Store and install it' },
            { title: 'Login here',       desc: 'Use your Salla account email to access the dashboard' },
        ],
    },
};

function MustasharIcon({ size = 24 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="url(#mustashar-grad)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" fill="none"/>
            <path d="M2 17L12 22L22 17"
                stroke="url(#mustashar-grad)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
            <path d="M2 12L12 17L22 12"
                stroke="url(#mustashar-grad)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
            <defs>
                <linearGradient id="mustashar-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
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

export default function MustasharLogin({ status }) {
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

                .app-name-gradient {
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
                                    <MustasharIcon size={26} />
                                </div>
                                <div>
                                    <div className="app-name-gradient" style={{
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

                            <a href="/auth/salla?app=calculator" className="submit-btn" style={{ fontFamily: ff }}>
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
 * نفس الـ GuestLayout — Inertia تُعيد استخدام الـ instance دون إعادة mount
 */
MustasharLogin.layout = page => <GuestLayout>{page}</GuestLayout>;