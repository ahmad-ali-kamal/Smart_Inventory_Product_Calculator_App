import { Head, Link } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

/* ─── Language Toggle ──────────────────────────────────── */
function useLang() {
    const [lang, setLang] = useState('ar');
    const toggle = () => setLang(l => l === 'ar' ? 'en' : 'ar');
    return { lang, toggle, isAr: lang === 'ar' };
}

/* ─── Translations ─────────────────────────────────────── */
const T = {
    ar: {
        brand:      'QUANTIX',
        nav:        ['حول المنصة', 'التطبيقات', 'تواصل معنا'],
        badge:      'منصة إدارة تجارية ذكية لمتاجر سلة',
        heroLine1:  'أدوات تجارية',
        heroLine2:  'بذكاء حقيقي',
        heroSub:    'منصة متكاملة تجمع نظام إدارة المخزون وأداة الحساب الذكي في مكان واحد، مصممة لتجار سلة الراغبين في قرارات أذكى وأرباح أعلى.',
        scrollHint: 'اكتشف التطبيقات',
        appsLabel:  'تطبيقاتنا',
        bottomNote: 'كل تطبيق له حساب مستقل • البيانات محمية ومشفرة',
        footer:     'جميع الحقوق محفوظة',
        langBtn:    'ENGLISH', // عرض كامل كما طلبت

        app1: {
            badge:    'حريص',
            title:    'إدارة المخزون الذكية',
            tagline:  'لا تخسر في البضاعة القريبة من الانتهاء',
            desc:     'نظام متكامل لمتابعة تواريخ الصلاحية يُنظّم مخزونك حسب الدفعات، ويُطبّق الخصومات تلقائياً على المنتجات المقاربة للانتهاء — لحماية أرباحك وتقليل الهدر.',
            stats: [{ v: '+٥٠٠', l: 'منتج مُتابَع' }, { v: '٤٨س', l: 'تنبيه مسبق' }, { v: '١٠٠٪', l: 'مزامنة سلة' }],
            features: ['تتبع تواريخ الصلاحية دفعة بدفعة', 'خصومات تلقائية للمنتجات المقاربة', 'إخفاء ذكي للمنتجات المنتهية', 'تزامن فوري مع متجر سلة'],
            cta: 'ابدأ مع حريص',
        },
        app2: {
            badge:    'مستشار',
            title:    'حاسبة الكميات الذكية',
            tagline:  'الكمية الصحيحة في كل طلب',
            desc:     'أداة حساب ذكية تحسب لك تلقائياً الكمية المثلى للعملاء بناءً على قواعد الحساب الخاصة بك — قرارات شراء أدق، وتكاليف أقل.',
            stats: [{ v: '+٢٠٠', l: 'تاجر نشط' }, { v: '٩٨٪', l: 'دقة الحساب' }, { v: '٣ث', l: 'وقت النتيجة' }],
            features: ['حساب الكمية المثلى تلقائياً', 'قواعد حساب مخصصة لكل منتج', 'دعم متعدد العملات والوحدات', 'تقارير مفصلة قابلة للتصدير'],
            cta: 'ابدأ مع مستشار',
        },
        statsBar: [
            { v: 700,   s: '+',  l: 'تاجر نشط' },
            { v: 15000, s: '+',  l: 'منتج مُتابَع' },
            { v: 98,    s: '٪', l: 'رضا المستخدمين' },
            { v: 24,    s: '/٧', l: 'دعم فني' },
        ],
    },
    en: {
        brand:      'QUANTIX',
        nav:        ['About', 'Apps', 'Contact'],
        badge:      'Smart Commerce Platform for Salla Merchants',
        heroLine1:  'Business Tools',
        heroLine2:  'Truly Intelligent',
        heroSub:    'An all-in-one platform combining smart inventory management and an intelligent calculation tool — built for Salla merchants who want smarter decisions and higher profits.',
        scrollHint: 'Discover Apps',
        appsLabel:  'Our Applications',
        bottomNote: 'Each app has its own account • Data is secured & encrypted',
        footer:     'All rights reserved',
        langBtn:    'العربية', // عرض كامل كما طلبت

        app1: {
            badge:    'Harees',
            title:    'Smart Inventory Management',
            tagline:  "Don't lose on near-expiry stock",
            desc:     'An expiry date monitoring system that organizes your inventory by batch and automatically applies discounts for near-expiry products — to secure your profits and reduce waste.',
            stats: [{ v: '500+', l: 'Products' }, { v: '48h', l: 'Early Alert' }, { v: '100%', l: 'Salla Sync' }],
            features: ['Batch-level expiry tracking', 'Auto discounts for near-expiry items', 'Smart auto-hide for expired products', 'Instant Salla store synchronization'],
            cta: 'Start with Harees',
        },
        app2: {
            badge:    'Mustashar',
            title:    'Smart Quantity Calculator',
            tagline:  'The right quantity in every order',
            desc:     'A smart calculation tool that automatically calculates the right quantity for each customer based on your own calculation rules — smarter purchasing decisions, lower costs.',
            stats: [{ v: '200+', l: 'Merchants' }, { v: '98%', l: 'Accuracy' }, { v: '3s', l: 'Result Time' }],
            features: ['Auto optimal quantity calculation', 'Custom rules per product', 'Multi-currency & unit support', 'Detailed exportable reports'],
            cta: 'Start with Mustashar',
        },
        statsBar: [
            { v: 700,   s: '+',  l: 'Active Merchants' },
            { v: 15000, s: '+',  l: 'Products Tracked' },
            { v: 98,    s: '%',  l: 'User Satisfaction' },
            { v: 24,    s: '/7', l: 'Support' },
        ],
    },
};

/* ─── Counter Logic ────────────────────────────────────── */
function Counter({ end, suffix }) {
    const [n, setN] = useState(0);
    useEffect(() => {
        let c = 0;
        const step = end / 60;
        const t = setInterval(() => {
            c += step;
            if (c >= end) { setN(end); clearInterval(t); }
            else setN(Math.floor(c));
        }, 28);
        return () => clearInterval(t);
    }, [end]);
    return <>{n.toLocaleString()}{suffix}</>;
}

/* ─── App Card Component ───────────────────────────────── */
function AppCard({ data, loginUrl, isAr }) {
    const [hov, setHov] = useState(false);
    const ff = isAr ? "'Almarai', sans-serif" : "'Cormorant Garamond', serif";
    const ffNum = "'Cormorant Garamond', serif";

    return (
        <div
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                background: hov ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.025)',
                border: `1px solid ${hov ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: '22px',
                padding: '2.2rem',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                transition: 'all 0.45s cubic-bezier(0.34,1.56,0.64,1)',
                transform: hov ? 'translateY(-8px)' : 'translateY(0)',
                boxShadow: hov
                    ? '0 28px 70px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05) inset'
                    : '0 4px 24px rgba(0,0,0,0.3)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <div style={{
                position: 'absolute', top: 0, right: 0,
                width: '200px', height: '200px',
                background: 'radial-gradient(circle at top right, rgba(160,100,255,0.1), transparent 70%)',
                opacity: hov ? 1 : 0.3,
                transition: 'opacity 0.5s',
                pointerEvents: 'none',
            }} />

            <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '100px',
                padding: '4px 14px',
                fontFamily: ff,
                fontSize: isAr ? '0.82rem' : '0.78rem',
                fontWeight: isAr ? '700' : '600',
                color: 'rgba(255,255,255,0.6)',
                letterSpacing: isAr ? '0.01em' : '0.12em',
                textTransform: isAr ? 'none' : 'uppercase',
                marginBottom: '1.2rem',
            }}>
                <span style={{
                    width: '5px', height: '5px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #c084fc, #60a5fa)',
                    boxShadow: '0 0 8px rgba(192,132,252,0.5)',
                    display: 'inline-block',
                }} />
                {data.badge}
            </div>

            <h3 style={{
                fontFamily: ff,
                fontSize: isAr ? '1.75rem' : '2rem',
                fontWeight: isAr ? '800' : '700',
                color: '#fff',
                margin: '0 0 0.35rem',
                lineHeight: 1.15,
                letterSpacing: isAr ? '-0.01em' : '-0.02em',
            }}>{data.title}</h3>

            <p style={{
                fontFamily: ff,
                fontSize: isAr ? '0.88rem' : '0.9rem',
                color: 'rgba(200,170,255,0.7)',
                margin: '0 0 1rem',
                fontStyle: isAr ? 'normal' : 'italic',
                fontWeight: isAr ? '400' : '400',
            }}>{data.tagline}</p>

            <p style={{
                fontFamily: ff,
                fontSize: isAr ? '0.9rem' : '0.95rem',
                color: 'rgba(255,255,255,0.48)',
                lineHeight: 1.75,
                margin: '0 0 1.8rem',
                fontWeight: isAr ? '300' : '400',
            }}>{data.desc}</p>

            <div style={{
                display: 'flex', gap: '1.5rem',
                paddingBottom: '1.5rem',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                marginBottom: '1.5rem',
            }}>
                {data.stats.map((s, i) => (
                    <div key={i}>
                        <div style={{
                            fontFamily: ffNum,
                            fontSize: '1.55rem', fontWeight: '700', color: '#fff', lineHeight: 1,
                        }}>{s.v}</div>
                        <div style={{
                            fontFamily: ff,
                            fontSize: '0.72rem', color: 'rgba(255,255,255,0.32)',
                            marginTop: '4px', fontWeight: isAr ? '400' : '400',
                        }}>{s.l}</div>
                    </div>
                ))}
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.8rem' }}>
                {data.features.map((f, i) => (
                    <li key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        fontFamily: ff,
                        fontSize: isAr ? '0.88rem' : '0.9rem',
                        color: 'rgba(255,255,255,0.5)',
                        marginBottom: '0.6rem',
                        fontWeight: isAr ? '400' : '400',
                    }}>
                        <span style={{
                            width: '4px', height: '4px', borderRadius: '50%', flexShrink: 0,
                            background: 'linear-gradient(135deg, #c084fc, #67e8f9)',
                            display: 'inline-block',
                        }} />
                        {f}
                    </li>
                ))}
            </ul>

            <Link href={loginUrl}>
                <button style={{
                    width: '100%',
                    padding: '0.95rem',
                    background: hov
                        ? 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(180,100,255,0.12))'
                        : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${hov ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.09)'}`,
                    borderRadius: '12px',
                    color: hov ? '#fff' : 'rgba(255,255,255,0.7)',
                    fontFamily: ff,
                    fontSize: isAr ? '0.95rem' : '1rem',
                    fontWeight: isAr ? '700' : '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '8px',
                    letterSpacing: isAr ? '0.01em' : '0.02em',
                }}>
                    {data.cta}
                    <span style={{
                        display: 'inline-block',
                        transform: isAr ? 'scaleX(-1)' : 'none',
                        fontSize: '0.85em',
                    }}>→</span>
                </button>
            </Link>
        </div>
    );
}

/* ─── Main Welcome Component ───────────────────────────── */
export default function Welcome() {
    const { lang, toggle, isAr } = useLang();
    const t = T[lang];
    const dir = isAr ? 'rtl' : 'ltr';
    const ff   = isAr ? "'Almarai', sans-serif" : "'Cormorant Garamond', serif";
    const ffEn = "'Cormorant Garamond', serif";
    const canvasRef = useRef(null);

    /* Particles Effect */
    useEffect(() => {
        const c = canvasRef.current;
        if (!c) return;
        const ctx = c.getContext('2d');
        const setSize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
        setSize();
        const pts = Array.from({ length: 45 }, () => ({
            x: Math.random() * c.width, y: Math.random() * c.height,
            r: Math.random() * 1 + 0.3,
            dx: (Math.random() - 0.5) * 0.18,
            dy: (Math.random() - 0.5) * 0.18,
            a: Math.random() * 0.28 + 0.04,
        }));
        let raf;
        const draw = () => {
            ctx.clearRect(0, 0, c.width, c.height);
            pts.forEach(p => {
                p.x += p.dx; p.y += p.dy;
                if (p.x < 0 || p.x > c.width)  p.dx *= -1;
                if (p.y < 0 || p.y > c.height)  p.dy *= -1;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${p.a})`;
                ctx.fill();
            });
            raf = requestAnimationFrame(draw);
        };
        draw();
        window.addEventListener('resize', setSize);
        return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', setSize); };
    }, []);

    const apps = [
        { data: t.app1, loginUrl: '/inventory/login' },
        { data: t.app2, loginUrl: '/calculator/login' },
    ];

    return (
        <>
            <Head title="Quantix" />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap');

                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                html { scroll-behavior: smooth; }

                body {
                    background: #000;
                    color: #fff;
                    overflow-x: hidden;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                }

                @keyframes iridescent {
                    0%   { background-position: 0%   50%; }
                    50%  { background-position: 100% 50%; }
                    100% { background-position: 0%   50%; }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes dotPulse {
                    0%,100% { opacity: 0.6; transform: scale(1); }
                    50%     { opacity: 1;   transform: scale(1.3); }
                }

                .brand-logo {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 1.8rem; /* تكبير الشعار */
                    font-weight: 700;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    background: linear-gradient(
                        120deg,
                        #fff 0%, #ddd6fe 18%,
                        #a5f3fc 36%, #fde68a 54%,
                        #f9a8d4 72%, #c4b5fd 90%, #fff 100%
                    );
                    background-size: 280% 280%;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: iridescent 6s ease infinite;
                }

                .hero-line2 {
                    display: block;
                    background: linear-gradient(
                        90deg,
                        #c084fc 0%, #818cf8 20%,
                        #38bdf8 40%, #34d399 60%,
                        #fbbf24 80%, #f472b6 100%
                    );
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: iridescent 4s ease infinite, fadeUp 0.9s ease 0.45s both;
                }

                .anim-1 { animation: fadeUp 0.8s ease 0.1s both; }
                .anim-2 { animation: fadeUp 0.8s ease 0.25s both; }
                .anim-3 { animation: fadeUp 0.8s ease 0.4s both; }
                .anim-4 { animation: fadeUp 0.8s ease 0.6s both; }
                .anim-5 { animation: fadeUp 0.8s ease 0.8s both; }

                ::-webkit-scrollbar { width: 3px; }
                ::-webkit-scrollbar-track { background: #000; }
                ::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.12);
                    border-radius: 4px;
                }

                .nav-a {
                    font-size: 1rem; /* تكبير روابط التنقل */
                    font-weight: 500;
                    color: rgba(255,255,255,0.55);
                    text-decoration: none;
                    letter-spacing: 0.04em;
                    transition: color 0.2s;
                    white-space: nowrap;
                }
                .nav-a:hover { color: rgba(255,255,255,1); }

                .lang-toggle {
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.12);
                    border-radius: 10px;
                    padding: 8px 18px; /* تكبير الزر */
                    color: rgba(255,255,255,0.8);
                    font-size: 0.9rem; /* تكبير الخط */
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    letter-spacing: 0.05em;
                    white-space: nowrap;
                }
                .lang-toggle:hover {
                    background: rgba(255,255,255,0.1);
                    color: #fff;
                    border-color: rgba(255,255,255,0.25);
                }

                .section-divider {
                    display: flex; align-items: center; gap: 1rem;
                    margin-bottom: 3rem;
                }
                .div-line {
                    flex: 1; height: 1px;
                    background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent);
                }
                .div-label {
                    font-size: 0.72rem;
                    color: rgba(255,255,255,0.22);
                    letter-spacing: 0.18em;
                    text-transform: uppercase;
                    white-space: nowrap;
                }

                @media (max-width: 820px) {
                    .apps-grid { grid-template-columns: 1fr !important; }
                    .stats-row { flex-wrap: wrap; gap: 2rem !important; }
                    .header-content { grid-template-columns: 1fr auto !important; padding: 0 1rem !important; }
                    .nav-links { display: none !important; }
                }
            `}</style>

            <canvas ref={canvasRef} style={{
                position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
            }} />

            <div style={{
                position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
                backgroundImage: 'url(/images/hero-bg.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: 0.5,
            }} />

            <div style={{
                position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
                background: [
                    'radial-gradient(ellipse 100% 65% at 50% 50%, transparent 15%, rgba(0,0,0,0.75) 100%)',
                    'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 25%, transparent 72%, rgba(0,0,0,0.7) 100%)',
                ].join(', '),
            }} />

            <div style={{ position: 'relative', zIndex: 2, direction: dir }}>

                {/* ══ FIXED HEADER ══ */}
                <header style={{
                    position: 'fixed', 
                    top: 0, left: 0, right: 0,
                    zIndex: 100,
                    height: '76px', // ارتفاع أكبر للهيدر
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    background: 'rgba(0,0,0,0.6)',
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <div className="header-content" style={{
                        width: '100%',
                        maxWidth: '1300px',
                        margin: '0 auto',
                        padding: '0 3rem',
                        display: 'grid',
                        gridTemplateColumns: '1fr auto 1fr', // ضمان بقاء الشعار في النصف تماماً
                        alignItems: 'center',
                        gap: '1.5rem',
                        direction: 'ltr' // تثبيت الهيكل لضمان عدم قفز الأزرار عند تغيير اللغة
                    }}>
                        {/* يسار: زر اللغة (موقع ثابت) */}
                        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                            <button
                                className="lang-toggle"
                                onClick={toggle}
                                style={{ fontFamily: isAr ? ffEn : ff }}
                            >
                                {t.langBtn}
                            </button>
                        </div>

                        {/* منتصف: الشعار (موقع ثابت في المركز) */}
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <span className="brand-logo">QUANTIX</span>
                        </div>

                        {/* يمين: الروابط (موقع ثابت) */}
                        <nav className="nav-links" style={{
                            display: 'flex',
                            gap: '2.5rem',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            direction: dir // محتوى الروابط يتبع لغة الصفحة
                        }}>
                            {t.nav.map((item, i) => (
                                <a
                                    key={i}
                                    className="nav-a"
                                    href={`#${['about','apps','contact'][i]}`}
                                    style={{ fontFamily: ff }}
                                >
                                    {item}
                                </a>
                            ))}
                        </nav>
                    </div>
                </header>

                <div style={{ height: '76px' }} />

                {/* ══ HERO SECTION ══ */}
                <section style={{
                    maxWidth: '820px', margin: '0 auto',
                    padding: '8rem 2rem 5rem',
                    textAlign: 'center',
                }}>
                    <div className="anim-1" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '100px',
                        padding: '6px 20px',
                        marginBottom: '2.5rem',
                        fontFamily: ff,
                        fontSize: isAr ? '0.85rem' : '0.8rem',
                        color: 'rgba(255,255,255,0.45)',
                    }}>
                        <span style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #c084fc, #60a5fa)',
                            boxShadow: '0 0 10px rgba(192,132,252,0.6)',
                            animation: 'dotPulse 2s ease infinite',
                        }} />
                        {t.badge}
                    </div>

                    <h1 className="anim-2" style={{
                        fontFamily: ff,
                        fontSize: isAr ? 'clamp(2.8rem, 7.5vw, 5.2rem)' : 'clamp(3rem, 8vw, 6rem)',
                        fontWeight: isAr ? '800' : '700',
                        color: '#fff',
                        lineHeight: 1.08,
                        marginBottom: '0.2rem',
                    }}>
                        {t.heroLine1}
                        <br />
                        <span className="hero-line2" style={{ fontFamily: ff }}>{t.heroLine2}</span>
                    </h1>

                    <p className="anim-3" style={{
                        fontFamily: ff,
                        fontSize: isAr ? '1.1rem' : '1.15rem',
                        fontWeight: isAr ? '300' : '400',
                        lineHeight: 1.8,
                        color: 'rgba(255,255,255,0.45)',
                        maxWidth: '580px',
                        margin: '2.5rem auto 4.5rem',
                    }}>
                        {t.heroSub}
                    </p>

                    <div className="anim-4" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '1px', height: '50px', background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.3))' }} />
                        <span style={{ fontFamily: ff, fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                            {t.scrollHint}
                        </span>
                    </div>
                </section>

                {/* ══ APPLICATIONS SECTION ══ */}
                <section id="apps" style={{ maxWidth: '1180px', margin: '0 auto', padding: '4rem 2rem 8rem' }}>
                    <div className="section-divider">
                        <div className="div-line" />
                        <span className="div-label" style={{ fontFamily: ff }}>{t.appsLabel}</span>
                        <div className="div-line" />
                    </div>

                    <div className="apps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.8rem' }}>
                        {apps.map((app, i) => (
                            <AppCard key={i} data={app.data} loginUrl={app.loginUrl} isAr={isAr} />
                        ))}
                    </div>

                    <p style={{ textAlign: 'center', fontFamily: ff, fontSize: '0.85rem', color: 'rgba(255,255,255,0.2)', marginTop: '3.5rem' }}>
                        {t.bottomNote}
                    </p>
                </section>

                {/* ══ STATISTICS BAR ══ */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(16px)', padding: '4rem 2rem' }}>
                    <div className="stats-row" style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-around', gap: '2rem', textAlign: 'center' }}>
                        {t.statsBar.map((s, i) => (
                            <div key={i}>
                                <div style={{ fontFamily: ffEn, fontSize: '2.8rem', fontWeight: '700', color: '#fff', lineHeight: 1 }}>
                                    <Counter end={s.v} suffix={s.s} />
                                </div>
                                <div style={{ fontFamily: ff, fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>{s.l}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ══ FOOTER SECTION ══ */}
                <footer style={{ padding: '3.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                    <span style={{ fontFamily: ffEn, fontSize: '1.1rem', fontWeight: '700', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em' }}>QUANTIX</span>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
                    <span style={{ fontFamily: ff, fontSize: '0.85rem', color: 'rgba(255,255,255,0.2)' }}>
                        © {new Date().getFullYear()} {t.footer}
                    </span>
                </footer>
            </div>
        </>
    );
}