import { Head, Link } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

/**
 * ─── QUANTIX CORE NAVIGATION LOGIC ──────────────────────────────────────────
 * نظام إدارة الحالة للغات وتنسيق المحتوى التفاعلي.
 */
function useLang() {
    const [lang, setLang] = useState('ar');
    const toggle = () => setLang(prev => (prev === 'ar' ? 'en' : 'ar'));
    
    return { 
        lang, 
        toggle, 
        isAr: lang === 'ar' 
    };
}

/**
 * ─── PROFESSIONAL COPYWRITING & TRANSLATIONS ───────────────────────────────
 * مصفوفة النصوص المطورة بأسلوب تسويقي احترافي.
 */
const T = {
    ar: {
        brand:      'QUANTIX',
        nav:        ['الرؤية', 'منظومة التطبيقات', 'الدعم الفني'],
        badge:      'المنظومة المتكاملة للنمو الذكي لمتاجر سلة',
        heroLine1:  'حلول تجارية ذكية',
        heroLine2:  'بأبعاد تقنية متقدمة',
        heroSub:    'منصة محورية تجمع بين ذكاء إدارة المخزون ودقة الحسابات المؤتمتة، صُممت خصيصاً لنخبة تجار سلة الساعين نحو التميز التشغيلي وتعظيم الأرباح.',
        scrollHint: 'استكشف آفاق QUANTIX',
        appsLabel:  'منظومة التطبيقات المتكاملة',
        bottomNote: 'كل حل تقني يعمل باستقلالية تامة لضمان خصوصية البيانات وتشفيرها العالي.',
        footer:     'جميع الحقوق محفوظة لمنصة كوانتيكس الرقمية',
        langBtn:    'ENGLISH INTERFACE',

        app1: {
            badge:    'حريص | HAREES',
            title:    'نظام حريص لإدارة المخزون',
            tagline:  'الأمان الكامل لمخزونك وتواريخ صلاحيتك',
            desc:     'نظام متقدم لمراقبة تواريخ الصلاحية، يقوم بتنظيم المخزون بناءً على الدفعات (Batches)، مع تطبيق ذكي للخصومات التلقائية للمنتجات القريبة من الانتهاء؛ وذلك لضمان استمرارية أرباحك وتقليل الهدر التشغيلي بنسبة تصل إلى 40%.',
            stats: [
                { v: '+٥٠٠', l: 'منتج يتم تتبعه' }, 
                { v: '٤٨س', l: 'إنذار مبكر' }, 
                { v: '١٠٠٪', l: 'أتمتة كاملة' }
            ],
            features: [
                'تتبع دقيق للمخزون بنظام الدفعات (Batch Tracking)', 
                'إطلاق خصومات آلية للمنتجات القريبة من الانتهاء', 
                'حماية الأرباح عبر تقليل الفاقد السنوي', 
                'مزامنة فورية مع لوحة تحكم متجر سلة'
            ],
            cta: 'ابدأ مع حريص الآن',
        },
        app2: {
            badge:    'مستشار | MUSTASHAR',
            title:    'أداة مستشار للحساب الذكي',
            tagline:  'القرار الحسابي الصحيح في كل ثانية',
            desc:     'أداة حسابية ذكية تساعدك في حساب الكميات المثلى لعملائك آلياً بناءً على قواعد الحساب الخاصة بمتجرك؛ مما يقلل من أخطاء الطلبات البشرية ويزيد من كفاءة التوريد والدقة المحاسبية.',
            stats: [
                { v: '+٢٠٠', l: 'تاجر يعتمدها' }, 
                { v: '٩٩٪', l: 'دقة حسابية' }, 
                { v: '٣ث', l: 'سرعة التنفيذ' }
            ],
            features: [
                'حساب الكميات المثلى بناءً على سلوك العميل', 
                'تخصيص قواعد الحساب لكل صنف تجاري', 
                'دعم كامل للعملات الخليجية والعالمية', 
                'تقارير تحليلية للتنبؤ بالطلبات المستقبلية'
            ],
            cta: 'فعل مستشار بمتجرك',
        },
        statsBar: [
            { v: 700,   s: '+',  l: 'شريك تجاري نشط' },
            { v: 15000, s: '+',  l: 'عملية تتبع يومية' },
            { v: 98,    s: '٪', l: 'معدل الدقة والثقة' },
            { v: 24,    s: '/٧', l: 'مركز مساعدة تقني' },
        ],
    },
    en: {
        brand:      'QUANTIX',
        nav:        ['Our Vision', 'App Ecosystem', 'Support'],
        badge:      'The Integrated Ecosystem for Smart Salla Growth',
        heroLine1:  'Smart Business Tools',
        heroLine2:  'With Real Intelligence',
        heroSub:    'An all-in-one pivotal platform combining smart inventory management and an intelligent calculation tool — built for Salla merchants who want smarter decisions and higher profits.',
        scrollHint: 'Explore Quantix Horizons',
        appsLabel:  'Our Integrated Application Suite',
        bottomNote: 'Each application operates independently to ensure data privacy and high-level encryption.',
        footer:     'All rights reserved to Quantix Digital Platform',
        langBtn:    'العربية (الواجهة الكاملة)',

        app1: {
            badge:    'HAREES | Inventory',
            title:    'Harees Expiry Monitoring',
            tagline:  'Securing profits and reducing waste',
            desc:     'An expiry date monitoring system that organizes inventory by batch and apply discounts for near-expiry products to secure your profits and reduce waste effectively by up to 40%.',
            stats: [
                { v: '500+', l: 'Tracked Products' }, 
                { v: '48h', l: 'Early Warning' }, 
                { v: '100%', l: 'Full Automation' }
            ],
            features: [
                'Precision batch-level inventory tracking', 
                'Automated discounts for near-expiry stocks', 
                'Smart profit protection and waste reduction', 
                'Instant synchronization with Salla dashboard'
            ],
            cta: 'Get Started with Harees',
        },
        app2: {
            badge:    'MUSTASHAR | Analytics',
            title:    'Mustashar Smart Calculator',
            tagline:  'Optimal quantities for every customer',
            desc:     'A smart calculation tool helps you automatically calculate the right quantity for customer based on your own calculation rules, ensuring order accuracy and supply chain efficiency.',
            stats: [
                { v: '200+', l: 'Active Merchants' }, 
                { v: '99%', l: 'Calculation Accuracy' }, 
                { v: '3s', l: 'Execution Time' }
            ],
            features: [
                'AI-driven optimal quantity calculation', 
                'Customizable calculation rules per product', 
                'Multi-currency and unit support across Salla', 
                'Detailed analytics for purchase prediction'
            ],
            cta: 'Activate Mustashar Now',
        },
        statsBar: [
            { v: 700,   s: '+',  l: 'Active Merchants' },
            { v: 15000, s: '+',  l: 'Daily Tracked Items' },
            { v: 98,    s: '%',  l: 'Trust & Accuracy Rate' },
            { v: 24,    s: '/7', l: 'Technical Support' },
        ],
    },
};

/** * ─── ANIMATED COUNTER COMPONENT ──────────────────────────────────────────
 */
function Counter({ end, suffix }) {
    const [n, setN] = useState(0);
    useEffect(() => {
        let current = 0;
        const duration = 2000;
        const frameRate = 30;
        const totalFrames = duration / frameRate;
        const increment = end / totalFrames;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
                setN(end);
                clearInterval(timer);
            } else {
                setN(Math.floor(current));
            }
        }, frameRate);
        
        return () => clearInterval(timer);
    }, [end]);
    
    return <>{n.toLocaleString()}{suffix}</>;
}

/** * ─── PREMIUM APP CARD COMPONENT ──────────────────────────────────────────
 */
function AppCard({ data, loginUrl, isAr }) {
    const [isHovered, setIsHovered] = useState(false);
    const ff = isAr ? "'IBM Plex Sans Arabic', sans-serif" : "'Inter', sans-serif";
    const ffNum = "'Inter', sans-serif";

    const cardStyles = {
        background: isHovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isHovered ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '30px',
        padding: '3rem',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        transition: 'all 0.6s cubic-bezier(0.2, 1, 0.3, 1)',
        transform: isHovered ? 'translateY(-15px)' : 'translateY(0)',
        boxShadow: isHovered 
            ? '0 50px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05) inset' 
            : '0 15px 45px rgba(0,0,0,0.3)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
    };

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={cardStyles}
        >
            <div style={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '350px',
                height: '350px',
                background: 'radial-gradient(circle at center, rgba(160,100,255,0.2), transparent 75%)',
                opacity: isHovered ? 1 : 0.5,
                transition: 'opacity 0.8s ease',
                pointerEvents: 'none',
            }} />

            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '100px',
                padding: '8px 20px',
                fontFamily: ff,
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#fff',
                marginBottom: '2rem',
                width: 'fit-content'
            }}>
                <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #c084fc, #60a5fa)',
                    boxShadow: '0 0 15px rgba(192,132,252,0.9)',
                }} />
                {data.badge}
            </div>

            <h3 style={{
                fontFamily: ff,
                fontSize: isAr ? '2.4rem' : '2.6rem',
                fontWeight: '800',
                color: '#fff',
                margin: '0 0 0.8rem',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
            }}>{data.title}</h3>

            <p style={{
                fontFamily: ff,
                fontSize: '1.15rem',
                color: '#c084fc',
                margin: '0 0 1.8rem',
                fontWeight: '500'
            }}>{data.tagline}</p>

            <p style={{
                fontFamily: ff,
                fontSize: '1.05rem',
                color: 'rgba(255,255,255,0.65)',
                lineHeight: 1.9,
                margin: '0 0 2.5rem',
                flexGrow: 1
            }}>{data.desc}</p>

            <div style={{
                display: 'flex',
                gap: '3rem',
                paddingBottom: '2.5rem',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                marginBottom: '2.5rem',
            }}>
                {data.stats.map((stat, idx) => (
                    <div key={idx}>
                        <div style={{
                            fontFamily: ffNum,
                            fontSize: '2.2rem',
                            fontWeight: '700',
                            color: '#fff',
                            lineHeight: 1
                        }}>{stat.v}</div>
                        <div style={{
                            fontFamily: ff,
                            fontSize: '0.8rem',
                            color: 'rgba(255,255,255,0.4)',
                            marginTop: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em'
                        }}>{stat.l}</div>
                    </div>
                ))}
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 3rem' }}>
                {data.features.map((feat, idx) => (
                    <li key={idx} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '15px',
                        fontFamily: ff,
                        fontSize: '1.05rem',
                        color: 'rgba(255,255,255,0.75)',
                        marginBottom: '1.2rem',
                    }}>
                        <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#c084fc',
                            marginTop: '10px',
                            flexShrink: 0
                        }} />
                        {feat}
                    </li>
                ))}
            </ul>

            <Link href={loginUrl} style={{ textDecoration: 'none' }}>
                <button style={{
                    width: '100%',
                    padding: '1.4rem',
                    background: isHovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '20px',
                    color: '#fff',
                    fontFamily: ff,
                    fontSize: '1.2rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.4s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '15px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}>
                    {data.cta}
                    <span style={{ 
                        display: 'inline-block',
                        transform: isAr ? 'rotate(180deg)' : 'none',
                        fontSize: '1.4rem'
                    }}>→</span>
                </button>
            </Link>
        </div>
    );
}

/** * ─── MAIN QUANTIX WELCOME COMPONENT ──────────────────────────────────────
 */
export default function Welcome() {
    const { lang, toggle, isAr } = useLang();
    const t = T[lang];
    const dir = isAr ? 'rtl' : 'ltr';
    const ff   = isAr ? "'IBM Plex Sans Arabic', sans-serif" : "'Inter', sans-serif";
    const ffEn = "'Inter', sans-serif";
    const canvasRef = useRef(null);

    /**
     * تأثير الجزيئات المتفاعلة مع الخلفية الهادئة
     */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();

        const particles = Array.from({ length: 80 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 2 + 0.5,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            op: Math.random() * 0.4 + 0.1
        }));

        let anim;
        const loop = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${p.op})`;
                ctx.fill();
            });
            anim = requestAnimationFrame(loop);
        };
        loop();

        window.addEventListener('resize', resize);
        return () => {
            cancelAnimationFrame(anim);
            window.removeEventListener('resize', resize);
        };
    }, []);

    const applications = [
        { data: t.app1, loginUrl: '/inventory/login' },
        { data: t.app2, loginUrl: '/calculator/login' },
    ];

    return (
        <>
            <Head title="Quantix | Smart Commerce Ecosystem" />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap');

                *, *::before, *::after { 
                    box-sizing: border-box; 
                    margin: 0; 
                    padding: 0; 
                }
                
                html { 
                    scroll-behavior: smooth; 
                }

                body { 
                    background: #000; 
                    color: #fff; 
                    overflow-x: hidden; 
                    font-family: ${ff};
                    -webkit-font-smoothing: antialiased;
                }

                @keyframes scrollBounce { 
                    0%, 20%, 50%, 80%, 100% { transform: translateY(0) translateX(-50%); } 
                    40% { transform: translateY(-20px) translateX(-50%); } 
                    60% { transform: translateY(-10px) translateX(-50%); } 
                }
                
                @keyframes masterShimmer { 
                    0% { background-position: 0% 50%; } 
                    50% { background-position: 100% 50%; } 
                    100% { background-position: 0% 50%; } 
                }

                .quantix-nav-item { 
                    font-size: 1.25rem; 
                    color: rgba(255,255,255,0.45); 
                    text-decoration: none; 
                    transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1); 
                    white-space: nowrap; 
                    font-weight: 500;
                }
                .quantix-nav-item:hover { 
                    color: #fff; 
                    transform: translateY(-5px); 
                    text-shadow: 0 0 30px rgba(255,255,255,0.6);
                }

                .quantix-lang-switch {
                    background: rgba(255,255,255,0.08); 
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 18px; 
                    padding: 14px 35px; 
                    color: #fff;
                    font-size: 1.1rem; 
                    font-weight: 700; 
                    cursor: pointer; 
                    transition: all 0.4s ease;
                    backdrop-filter: blur(15px);
                }
                .quantix-lang-switch:hover { 
                    background: rgba(255,255,255,0.18); 
                    border-color: #fff; 
                    transform: scale(1.05) translateY(-2px);
                    box-shadow: 0 10px 40px rgba(255,255,255,0.1);
                }

                .quantix-hero-gradient {
                    background: linear-gradient(90deg, #c084fc, #6366f1, #0ea5e9, #10b981, #f59e0b, #c084fc);
                    background-size: 300% auto; 
                    -webkit-background-clip: text; 
                    -webkit-text-fill-color: transparent;
                    animation: masterShimmer 8s linear infinite;
                }

                ::-webkit-scrollbar { width: 8px; }
                ::-webkit-scrollbar-track { background: #000; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 20px; }

                @media (max-width: 1100px) {
                    .quantix-nav-desktop { display: none !important; }
                    .quantix-header-grid { grid-template-columns: 1fr auto !important; padding: 0 2.5rem !important; }
                }
            `}</style>

            <canvas ref={canvasRef} style={{
                position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
            }} />

            {/* ══ HEADER: THE CONTROL BAR ══ */}
            <header style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: '110px',
                backdropFilter: 'blur(40px)', background: 'rgba(0,0,0,0.6)',
                borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center'
            }}>
                <div className="quantix-header-grid" style={{
                    maxWidth: '1800px', margin: '0 auto', width: '100%', padding: '0 8rem',
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'center', direction: 'ltr'
                }}>
                    {/* LANG SWITCH (LEFT) */}
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <button className="quantix-lang-switch" onClick={toggle} style={{ fontFamily: isAr ? ffEn : ff }}>
                            {t.langBtn}
                        </button>
                    </div>

                    {/* MAIN NAV (CENTER) */}
                    <nav className="quantix-nav-desktop" style={{ display: 'flex', gap: '6.5rem', justifyContent: 'center', direction: dir }}>
                        {t.nav.map((label, i) => (
                            <a key={i} className="quantix-nav-item" href={`#${['about','apps','contact'][i]}`} style={{ fontFamily: ff }}>
                                {label}
                            </a>
                        ))}
                    </nav>

                    {/* EMPTY BALANCER (RIGHT) */}
                    <div />
                </div>
            </header>

            {/* ══ SECTION 1: THE VISUAL EXPERIENCE (GIF ONLY) ══ */}
            <section style={{
                height: '100vh', width: '100%', position: 'relative', overflow: 'hidden',
                backgroundImage: 'url(/images/hero-visual.gif)', 
                backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#000'
            }}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
                
                {/* SCROLL HINT */}
                <div style={{
                    position: 'absolute', bottom: '80px', left: '50%',
                    textAlign: 'center', animation: 'scrollBounce 3s infinite', cursor: 'default'
                }}>
                    <p style={{ 
                        fontFamily: ff, fontSize: '1rem', color: 'rgba(255,255,255,0.7)', 
                        letterSpacing: '0.6em', textTransform: 'uppercase', marginBottom: '25px' 
                    }}>
                        {t.scrollHint}
                    </p>
                    <div style={{ 
                        width: '2px', height: '80px', 
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0.8), transparent)', 
                        margin: '0 auto' 
                    }} />
                </div>
            </section>

            {/* ══ SECTION 2: THE KNOWLEDGE BASE & APPS ══ */}
            <main style={{ 
                position: 'relative', zIndex: 2, direction: dir,
                backgroundImage: 'url(/images/content-bg.jpg)', 
                backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed'
            }}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: -1 }} />

                {/* THE HERO MESSAGE */}
                <section id="about" style={{ maxWidth: '1200px', margin: '0 auto', padding: '18rem 3rem 12rem', textAlign: 'center' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '18px', background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.2)', borderRadius: '100px', padding: '16px 45px',
                        marginBottom: '5.5rem', fontFamily: ff, fontSize: '1.05rem', color: '#fff',
                        backdropFilter: 'blur(15px)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{ 
                            width: '12px', height: '12px', borderRadius: '50%', 
                            background: '#c084fc', boxShadow: '0 0 30px #c084fc' 
                        }} />
                        {t.badge}
                    </div>

                    <h1 style={{
                        fontFamily: ff, 
                        fontSize: isAr ? 'clamp(4.5rem, 12vw, 8.5rem)' : 'clamp(5rem, 13vw, 9.5rem)',
                        fontWeight: '800', color: '#fff', lineHeight: 1.0, 
                        marginBottom: '4rem', letterSpacing: '-0.05em'
                    }}>
                        {t.heroLine1} <br />
                        <span className="quantix-hero-gradient">{t.heroLine2}</span>
                    </h1>

                    <p style={{
                        fontFamily: ff, fontSize: '1.6rem', fontWeight: '300', lineHeight: 2.1,
                        color: 'rgba(255,255,255,0.7)', maxWidth: '900px', margin: '0 auto'
                    }}>
                        {t.heroSub}
                    </p>
                </section>

                {/* THE APPLICATION GRID */}
                <section id="apps" style={{ maxWidth: '1600px', margin: '0 auto', padding: '8rem 4rem 20rem' }}>
                    <div style={{ 
                        display: 'flex', alignItems: 'center', gap: '2.5rem', marginBottom: '8rem' 
                    }}>
                        <div style={{ 
                            flex: 1, height: '1px', 
                            background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent)' 
                        }} />
                        <span style={{ 
                            fontFamily: ff, fontSize: '0.9rem', color: 'rgba(255,255,255,0.3)', 
                            letterSpacing: '0.4em', textTransform: 'uppercase', fontWeight: '600'
                        }}>{t.appsLabel}</span>
                        <div style={{ 
                            flex: 1, height: '1px', 
                            background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent)' 
                        }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6rem' }}>
                        {applications.map((app, i) => (
                            <AppCard key={i} data={app.data} loginUrl={app.loginUrl} isAr={isAr} />
                        ))}
                    </div>

                    <p style={{ 
                        textAlign: 'center', fontFamily: ff, fontSize: '1.2rem', 
                        color: 'rgba(255,255,255,0.35)', marginTop: '10rem', letterSpacing: '0.05em' 
                    }}>
                        {t.bottomNote}
                    </p>
                </section>

                {/* BIG STATS DIVIDER */}
                <div style={{ 
                    borderTop: '1px solid rgba(255,255,255,0.2)', 
                    borderBottom: '1px solid rgba(255,255,255,0.2)', 
                    background: 'rgba(0,0,0,0.85)', 
                    backdropFilter: 'blur(50px)', 
                    padding: '12rem 4rem' 
                }}>
                    <div style={{ 
                        maxWidth: '1500px', margin: '0 auto', 
                        display: 'flex', justifyContent: 'space-around', 
                        gap: '8rem', flexWrap: 'wrap', textAlign: 'center' 
                    }}>
                        {t.statsBar.map((item, i) => (
                            <div key={i}>
                                <div style={{ 
                                    fontFamily: ffEn, fontSize: '6rem', fontWeight: '800', 
                                    color: '#fff', lineHeight: 1, textShadow: '0 20px 50px rgba(0,0,0,0.8)' 
                                }}>
                                    <Counter end={item.v} suffix={item.s} />
                                </div>
                                <div style={{ 
                                    fontFamily: ff, fontSize: '1.3rem', 
                                    color: '#c084fc', marginTop: '30px', 
                                    textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: '600'
                                }}>{item.l}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* THE FINAL CONTACT FOOTER */}
                <footer id="contact" style={{ 
                    padding: '12rem 4rem', display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', gap: '50px', background: '#000' 
                }}>
                    <span style={{ 
                        fontFamily: ffEn, fontSize: '2.2rem', fontWeight: '900', 
                        color: 'rgba(255,255,255,0.4)', letterSpacing: '0.4em' 
                    }}>QUANTIX</span>
                    
                    <div style={{ 
                        width: '12px', height: '12px', borderRadius: '50%', 
                        background: 'rgba(255,255,255,0.3)' 
                    }} />
                    
                    <span style={{ 
                        fontFamily: ff, fontSize: '1.2rem', 
                        color: 'rgba(255,255,255,0.35)', fontWeight: '500' 
                    }}>
                        © {new Date().getFullYear()} {t.footer}
                    </span>
                </footer>
            </main>
        </>
    );
}