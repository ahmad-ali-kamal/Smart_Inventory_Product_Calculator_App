import { Head, Link } from '@inertiajs/react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useLang } from '@/Hooks/useLang';
import LanguageSwitcher from '@/Components/LanguageSwitcher';

/**
 * ─── QUANTIX CORE INTERFACE V4.0 ────────────────────────────────────────────
 * المشروع: منصة كوانتيكس (QUANTIX) - الحل الذكي لتجار سلة.
 * المطور المسؤول: المهندس أحمد علي كمال (Developer A).
 * * التحديثات الحالية:
 * - حذف شارة المنصة ونصوص الهيدر.
 * - تصغير مقاسات الخطوط لكامل الصفحة.
 * - توحيد خطوط أزرار اللغة (Cairo / Plus Jakarta Sans).
 * - شفافية كاملة للأشرطة العلوية والسفلية لدمجها مع النجوم.
 */

/* ─── مصفوفة النصوص والترجمات (CLEAN TRANSLATION ENGINE) ─── */
const T = {
    ar: {
        brand:      'QUANTIX',
        brandAr:    'كوانتيكس',
        welcome:    'أهلاً بك في كوانتيكس.. نظامك الذكي لإدارة متجرك في سلة.',
        slogan:     'لأن التجارة الناجحة تعتمد على الأرقام، لا التوقعات.',
        intro:      "في كوانتيكس، نحن ندرك حجم الخسائر التي يسببها المخزون المهدر والحسابات اليدوية المرهقة. لذلك، صممنا لك أدوات واقعية؛ 'حريص' ليحمي أرباحك من تواريخ الانتهاء، و'مستشار' ليؤتمت حساباتك المعقدة بدقة متناهية. نحن نتولى إدارة أدق تفاصيل عملياتك، لتتفرغ أنت لما يهم فعلياً: توسيع تجارتك.",
        nav:        ['الرؤية الاستراتيجية', 'منظومة التطبيقات', 'مركز الدعم'],
        appsLabel:  'منظومة التطبيقات الذكية',
        bottomNote: 'تشفير بيانات بمعايير مؤسسية عالمية • خصوصية مطلقة لكافة العمليات',
        footer:     'جميع الحقوق محفوظة لمنصة كوانتيكس الرقمية',
        langBtn:    'ENGLISH',

        app1: {
            badge:    'حريص | HAREES',
            title:    'نظام حريص لإدارة المخزون',
            tagline:  'نظام لمراقبة تواريخ الانتهاء يقوم بتنظيم المخزون حسب الدفعة وتطبيق خصومات للمنتجات الوشيكة الانتهاء لتأمين أرباحك وتقليل الهدر.',
            desc:     'نظام متقدم لمراقبة تواريخ الصلاحية، يقوم بتنظيم المخزون بناءً على الدفعات (Batches)، مع تطبيق ذكي للخصومات التلقائية للمنتجات القريبة من الانتهاء؛ وذلك لضمان استمرارية أرباحك وتقليل الهدر التشغيلي.',
            stats: [
                { v: '+٥٠٠', l: 'منتج مُراقب' }, 
                { v: '٤٨س', l: 'تنبيه استباقي' }, 
                { v: '١٠٠٪', l: 'مزامنة آلية' }
            ],
            features: [
                'تتبع دقيق للمخزون بنظام الدفعات الرقمية المستقلة', 
                'نظام الخصومات الآلية الذكي للمنتجات وشيكة الانتهاء', 
                'حماية الأرباح الصافية عبر تقليل الفاقد السنوي للمتجر', 
                'ربط مباشر وفوري مع مخازن منصة سلة'
            ],
            cta: 'ابدأ تجربتك مع حريص',
        },
        app2: {
            badge:    'مستشار | MUSTASHAR',
            title:    'أداة مستشار للحساب الذكي',
            tagline:  'أداة حساب ذكية تساعدك على حساب الكمية الصحيحة للعميل تلقائياً بناءً على قواعد الحساب الخاصة بك.',
            desc:     'أداة حسابية ذكية تساعدك في حساب الكميات المثلى لعملائك آلياً بناءً على قواعد الحساب الخاصة بمتجرك؛ مما يقلل من أخطاء الطلبات البشرية ويزيد من كفاءة الدقة المحاسبية.',
            stats: [
                { v: '+٢٠٠', l: 'تاجر نشط' }, 
                { v: '٩٩٪', l: 'دقة حسابية' }, 
                { v: '٣ث', l: 'سرعة القرار' }
            ],
            features: [
                'أتمتة كاملة لمنطق حساب الكميات المخصصة لكل عميل', 
                'إمكانية تخصيص قواعد حساب مستقلة لكل صنف تجاري', 
                'دعم تقني كامل لجميع العملات والوحدات العالمية', 
                'تقارير تحليلية متقدمة للتنبؤ بحجم الطلبات المستقبلية'
            ],
            cta: 'فعل أداة مستشار بمتجرك',
        },
        statsBar: [
            { v: 700,   s: '+',  l: 'شريك نجاح يعتمدنا' },
            { v: 15000, s: '+',  l: 'منتج يتم تتبعه لحظياً' },
            { v: 98,    s: '٪', l: 'معدل رضا المستخدمين' },
            { v: 24,    s: '/7', l: 'مركز دعم تقني متواصل' },
        ],
    },
    en: {
        brand:      'QUANTIX',
        brandAr:    'كوانتيكس',
        welcome:    'Welcome to Quantix.. Your intelligent system for Salla management.',
        slogan:     'Because successful commerce relies on numbers, not expectations.',
        intro:      "At Quantix, we understand the scale of losses caused by wasted inventory and tedious manual calculations. We designed realistic tools; 'Harees' to protect your profits from expiry dates, and 'Mustashar' to automate your complex calculations with extreme precision. We manage your details so you focus on expanding your business.",
        nav:        ['Strategic Vision', 'App Ecosystem', 'Growth Support'],
        appsLabel:  'Smart Tools Ecosystem',
        bottomNote: 'Data Security is a Priority • Enterprise-Grade Encryption',
        footer:     'All rights reserved to Quantix Digital Platform',
        langBtn:    'العربية',

        app1: {
            badge:    'HAREES | Inventory',
            title:    'Harees Expiry Monitoring',
            tagline:  'An expiry date monitoring system that organizes inventory by batch and apply discounts for near-expiry products to secure your profits and reduce waste.',
            desc:     'An advanced expiry date monitoring system that organizes stock by batches and applies smart automatic discounts to near-expiry items to secure your revenue.',
            stats: [
                { v: '500+', l: 'Tracked Items' }, 
                { v: '48h', l: 'Early Alerts' }, 
                { v: '100%', l: 'Automated' }
            ],
            features: [
                'Full automation for expiry tracking logic workflows', 
                'Smart discounting for near-expiry stock items', 
                'Record-breaking annual waste reduction metrics', 
                'Instant sync with Salla warehouse systems'
            ],
            cta: 'Activate Harees Now',
        },
        app2: {
            badge:    'MUSTASHAR | Calc',
            title:    'Mustashar Smart Calculator',
            tagline:  'A smart calculation tool helps you automatically calculate the right quantity for customer based on your own calculation rules.',
            desc:     'An AI-driven tool that calculates optimal quantities for customers automatically based on your store rules, eliminating human errors and increasing efficiency.',
            stats: [
                { v: '200+', l: 'Active Merchants' }, 
                { v: '99%', l: 'Calc Accuracy' }, 
                { v: '3s', l: 'Decision Speed' }
            ],
            features: [
                'Automated customer quantity logic workflows', 
                'Customizable calculation rules per individual product', 
                'Full multi-currency & unit support across Salla', 
                'Advanced predictive analytics for demand'
            ],
            cta: 'Activate Mustashar Now',
        },
        statsBar: [
            { v: 700,   s: '+',  l: 'Active Partners' },
            { v: 15000, s: '+',  l: 'Daily Tracked Items' },
            { v: 98,    s: '%',  l: 'Client Satisfaction' },
            { v: 24,    s: '/7', l: 'Technical Help' },
        ],
    },
};

/* ─── المكونات المساعدة (UI COMPONENTS) ─── */

/**
 * مكون العداد الرقمي
 */
function Counter({ end, suffix }) {
    const [num, setNum] = useState(0);
    useEffect(() => {
        let current = 0;
        const duration = 2500; 
        const step = end / (duration / 25);
        const timer = setInterval(() => {
            current += step;
            if (current >= end) {
                setNum(end);
                clearInterval(timer);
            } else {
                setNum(Math.floor(current));
            }
        }, 25);
        return () => clearInterval(timer);
    }, [end]);
    return <>{num.toLocaleString()}{suffix}</>;
}

/**
 * مكون بطاقة التطبيق (Premium Component) - تم تصغير الخطوط كما طلب المهندس
 */
function AppCard({ data, loginUrl, isAr, ff }) {
    const [isHovered, setIsHovered] = useState(false);
    
    const cardStyles = {
        container: {
            background: isHovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${isHovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'}`,
            borderRadius: '40px',
            padding: '3.5rem',
            backdropFilter: 'blur(50px)',
            WebkitBackdropFilter: 'blur(50px)',
            transition: 'all 0.75s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: isHovered ? 'translateY(-20px)' : 'translateY(0)',
            boxShadow: isHovered 
                ? '0 60px 120px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.05) inset' 
                : '0 20px 50px rgba(0,0,0,0.4)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            cursor: 'default'
        },
        glow: {
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle at center, rgba(160,100,255,0.22), transparent 75%)',
            opacity: isHovered ? 1 : 0.35,
            transition: 'opacity 1s ease-in-out',
            pointerEvents: 'none'
        },
        badge: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '100px',
            padding: '10px 24px',
            fontFamily: ff,
            fontSize: '0.85rem',
            fontWeight: '900',
            color: '#fff',
            marginBottom: '2.5rem',
            width: 'fit-content',
            textTransform: 'uppercase'
        },
        dot: {
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #c084fc, #60a5fa)',
            boxShadow: '0 0 12px rgba(192,132,252,1)'
        },
        title: {
            fontFamily: ff,
            fontSize: '2.1rem', // تصغير مقاس خط العنوان
            fontWeight: '900',
            color: '#fff',
            margin: '0 0 1rem',
            lineHeight: 1.1,
            letterSpacing: '-0.04em'
        },
        tagline: {
            fontFamily: ff,
            fontSize: '0.95rem', // تصغير التاج لاين
            color: '#c084fc',
            margin: '0 0 2rem',
            fontWeight: '800',
            lineHeight: 1.6,
            opacity: 0.95
        },
        desc: {
            fontFamily: ff,
            fontSize: '1.05rem', // تصغير مقاس الوصف
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.9,
            margin: '0 0 3.5rem',
            fontWeight: '600',
            flexGrow: 1
        },
        statVal: {
            fontFamily: ff,
            fontSize: '1.8rem',
            fontWeight: '900',
            color: '#fff',
            lineHeight: 1
        },
        btn: {
            width: '100%',
            padding: '1.6rem',
            background: isHovered ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.22)',
            borderRadius: '24px',
            color: '#fff',
            fontFamily: ff,
            fontSize: '1.2rem',
            fontWeight: '900',
            cursor: 'pointer',
            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            boxShadow: '0 15px 35px rgba(0,0,0,0.3)'
        }
    };

    return (
        <div onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} style={cardStyles.container}>
            <div style={cardStyles.glow} />
            <div style={cardStyles.badge}>
                <div style={cardStyles.dot} />
                {data.badge}
            </div>
            <h3 style={cardStyles.title}>{data.title}</h3>
            <p style={cardStyles.tagline}>{data.tagline}</p>
            <p style={cardStyles.desc}>{data.desc}</p>

            <div style={{ display: 'flex', gap: '3.5rem', paddingBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.12)', marginBottom: '2.5rem' }}>
                {data.stats.map((item, idx) => (
                    <div key={idx}>
                        <div style={cardStyles.statVal}>{item.v}</div>
                        <div style={{ fontFamily: ff, fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', marginTop: '8px', fontWeight: '800', textTransform: 'uppercase' }}>{item.l}</div>
                    </div>
                ))}
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 4rem' }}>
                {data.features.map((feat, idx) => (
                    <li key={idx} style={{ display: 'flex', gap: '15px', marginBottom: '1.2rem', color: 'rgba(255,255,255,0.9)', fontWeight: '700', fontSize: '1rem' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#c084fc', marginTop: '10px', flexShrink: 0 }} />
                        {feat}
                    </li>
                ))}
            </ul>

            <Link href={loginUrl} style={{ textDecoration: 'none' }}>
                <button style={cardStyles.btn}>
                    {data.cta} <span style={{ transform: isAr ? 'rotate(180deg)' : 'none', fontSize: '1.6rem' }}>→</span>
                </button>
            </Link>
        </div>
    );
}

/* ─── المكون الرئيسي للصفحة (MAIN ARCHITECTURE) ─── */

export default function Welcome() {
    const { lang, toggle, isAr, dir } = useLang();
    const t = T[lang];
    
    // توحيد الخطوط المعتمدة (Cairo للعربي و Plus Jakarta Sans للإنجليزي)
    const ff = isAr ? "'Cairo', sans-serif" : "'Plus Jakarta Sans', sans-serif";
    const bgPrimary = '#000000'; // اللون الأسود الموحد المتناغم مع النجوم

    const canvasRef = useRef(null);
    const [scrollY, setScrollY] = useState(0);
    const [isMounted, setIsMounted] = useState(false);

    // تتبع التمرير لتعديل شفافية الخلفية
    useEffect(() => {
        const onScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', onScroll, { passive: true });
        setIsMounted(true);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    /**
     * محرك النجوم (Galaxy Canvas Engine)
     */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        const setCanvasSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        setCanvasSize();

        const stars = Array.from({ length: 220 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.1,
            speed: Math.random() * 0.4 + 0.05,
            opacity: Math.random()
        }));

        let animationFrame;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            stars.forEach(s => {
                s.y -= s.speed;
                if (s.y < 0) s.y = canvas.height;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`;
                ctx.fill();
            });
            animationFrame = requestAnimationFrame(animate);
        };
        animate();

        window.addEventListener('resize', setCanvasSize);
        return () => {
            cancelAnimationFrame(animationFrame);
            window.removeEventListener('resize', setCanvasSize);
        };
    }, []);

    const suites = useMemo(() => [
        { data: t.app1, loginUrl: '/harees/login' },
        { data: t.app2, loginUrl: '/mustashar/login' },
    ], [t]);

    const dynamicOpacity = Math.min(scrollY / 1500, 0.98);

    return (
        <>
            <Head title="Quantix | Smart Merchant Suite" />

            {/* تعريف الأنماط لضمان توحيد الخطوط والمقاسات الصغيرة المطلوبة */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@700;800;900&family=Plus+Jakarta+Sans:wght@700;800;900&display=swap');

                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                html { scroll-behavior: smooth; background-color: ${bgPrimary}; }
                
                body { 
                    background: ${bgPrimary}; 
                    color: #fff; 
                    overflow-x: hidden; 
                    font-family: ${ff};
                    -webkit-font-smoothing: antialiased;
                }

                @keyframes revealUp { 
                    from { opacity: 0; transform: translateY(60px); filter: blur(30px); } 
                    to { opacity: 1; transform: translateY(0); filter: blur(0); } 
                }

                @keyframes brandShimmer { 
                    0% { background-position: 0% 50%; } 
                    50% { background-position: 100% 50%; } 
                    100% { background-position: 0% 50%; } 
                }

                .quantix-nav-link { 
                    font-size: 1.2rem; // تصغير خط الروابط
                    color: rgba(255,255,255,0.7); 
                    text-decoration: none; 
                    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); 
                    font-weight: 900;
                    letter-spacing: 0.01em;
                }
                .quantix-nav-link:hover { 
                    color: #fff; 
                    transform: translateY(-5px); 
                    text-shadow: 0 0 40px rgba(192,132,252,1);
                }

                .shimmer-text {
                    background: linear-gradient(90deg, #fff, #c084fc, #6366f1, #fff);
                    background-size: 200% auto; 
                    -webkit-background-clip: text; 
                    -webkit-text-fill-color: transparent;
                    animation: brandShimmer 10s linear infinite;
                }

                /* توحيد خطوط أزرار تبديل اللغة داخل المكون */
                [data-language-switcher] button {
                    font-family: ${ff} !important;
                    font-weight: 900 !important;
                    font-size: 1.05rem !important;
                }

                ::-webkit-scrollbar { width: 12px; }
                ::-webkit-scrollbar-track { background: ${bgPrimary}; }
                ::-webkit-scrollbar-thumb { 
                    background: rgba(255,255,255,0.12); 
                    border-radius: 20px; 
                    border: 4px solid ${bgPrimary};
                }

                @media (max-width: 1200px) {
                    .quantix-desktop-nav { display: none !important; }
                    .quantix-header-grid { grid-template-columns: 1fr auto !important; padding: 0 3rem !important; }
                }
            `}</style>

            {/* نظام الخلفية الموحد */}
            <canvas ref={canvasRef} style={{
                position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
                background: `radial-gradient(circle at 50% 50%, #080315 0%, #000 100%)`
            }} />
            
            {/* طبقة التدرج لعمق المحتوى */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
                background: `linear-gradient(to bottom, transparent, rgba(0,0,0,${dynamicOpacity}))`,
                transition: 'background 0.7s ease-out'
            }} />

            {/* ══ الهيدر الرئيسي (HEADER) - شفاف ونظيف كما طلبت ══ */}
            <header style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: '100px',
                backdropFilter: 'blur(15px)', background: 'rgba(0,0,0,0.1)',
                borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center'
            }}>
                <div className="quantix-header-grid" style={{
                    maxWidth: '1900px', margin: '0 auto', width: '100%', padding: '0 8rem',
                    display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', alignItems: 'center', direction: 'ltr'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }} data-language-switcher>
                        <LanguageSwitcher />
                    </div>

                    <nav className="quantix-desktop-nav" style={{ display: 'flex', gap: '6rem', justifyContent: 'center', direction: dir }}>
                        {t.nav.map((item, idx) => (
                            <a key={idx} className="quantix-nav-link" href={`#${['vis','aps','help'][idx]}`} style={{ fontFamily: ff }}>{item}</a>
                        ))}
                    </nav>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {/* تم مسح نصوص كوانتيكس من هنا والاكتفاء بالشعار */}
                        <Link href="/">
                            <img src="/images/Quantix_logo.png" alt="Quantix Logo" style={{ 
                                height: '55px', width: 'auto', 
                                filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.2))' 
                            }} />
                        </Link>
                    </div>
                </div>
            </header>

            {/* ══ طبقات المحتوى (MAIN CONTENT) ══ */}
            <main style={{ position: 'relative', zIndex: 2, direction: dir }}>
                
                {/* القسم الأول: تم حذف الشارة (Badge) وتصغير الخط */}
                <section id="vis" style={{ 
                    height: '100vh', display: 'flex', flexDirection: 'column', 
                    justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '0 12%' 
                }}>
                    <div style={{ 
                        animation: 'revealUp 2.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                        opacity: isMounted ? 1 : 0 
                    }}>
                        <h1 style={{ 
                            fontFamily: ff, fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)', // تصغير مقاس الخط الرئيسي
                            fontWeight: '900', color: '#fff', lineHeight: 1.3, 
                            marginBottom: '3rem', maxWidth: '1100px' 
                        }}>
                            <span className="shimmer-text">{t.welcome}</span> 
                            <br /> 
                            {t.slogan}
                        </h1>

                        <p style={{ 
                            fontFamily: ff, fontSize: 'clamp(0.95rem, 1.4vw, 1.15rem)', // تصغير الوصف
                            fontWeight: '700', lineHeight: 2.1, 
                            color: 'rgba(255,255,255,0.8)', maxWidth: '850px', margin: '0 auto' 
                        }}>
                            {t.intro}
                        </p>
                    </div>
                </section>

                {/* القسم الثاني: منظومة التطبيقات */}
                <section id="aps" style={{ maxWidth: '1700px', margin: '0 auto', padding: '8rem 8rem 18rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3.5rem', marginBottom: '10rem' }}>
                        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(192,132,252,0.3), transparent)' }} />
                        <span style={{ 
                            fontFamily: ff, fontSize: '0.95rem', color: 'rgba(255,255,255,0.4)', 
                            letterSpacing: '0.6em', textTransform: 'uppercase', fontWeight: '900' 
                        }}>{t.appsLabel}</span>
                        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(192,132,252,0.3), transparent)' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6rem' }}>
                        {suites.map((suite, idx) => (
                            <AppCard key={idx} data={suite.data} loginUrl={suite.loginUrl} isAr={isAr} ff={ff} />
                        ))}
                    </div>
                </section>

                {/* القسم الثالث: الإحصائيات - أكثر شفافية */}
                <div style={{ 
                    background: 'rgba(11, 14, 43, 0.35)', 
                    backdropFilter: 'blur(80px)', 
                    padding: '16rem 8rem', 
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)'
                }}>
                    <div style={{ 
                        maxWidth: '1600px', margin: '0 auto', 
                        display: 'flex', justifyContent: 'space-around', 
                        gap: '10rem', flexWrap: 'wrap', textAlign: 'center' 
                    }}>
                        {t.statsBar.map((item, idx) => (
                            <div key={idx}>
                                <div style={{ 
                                    fontFamily: ff, fontSize: '6.5rem', fontWeight: '900', // تصغير أرقام الإحصائيات
                                    color: '#fff', lineHeight: 1, textShadow: '0 40px 80px rgba(0,0,0,0.8)' 
                                }}>
                                    <Counter end={item.v} suffix={item.s} />
                                </div>
                                <div style={{ 
                                    fontFamily: ff, fontSize: '1.4rem', color: '#c084fc', 
                                    marginTop: '35px', textTransform: 'uppercase', 
                                    letterSpacing: '0.25em', fontWeight: '900' 
                                }}>{item.l}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ══ الشريط السفلي (FOOTER) - نصوص كوانتيكس باللغتين هنا فقط ══ */}
                <footer id="help" style={{ 
                    padding: '12rem 8rem', display: 'flex', flexDirection: 'column', 
                    alignItems: 'center', justifyContent: 'center', gap: '60px', 
                    background: 'transparent' // شفاف تماماً لدمجه مع النجوم
                }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                        <img 
                            src="/images/Quantix_logo.png" 
                            alt="Quantix Final Logo" 
                            style={{ height: '85px', opacity: 1, filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.2))' }} 
                        />
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '10px',
                            borderRight: isAr ? '4px solid rgba(255,255,255,0.15)' : 'none',
                            borderLeft: !isAr ? '4px solid rgba(255,255,255,0.15)' : 'none',
                            paddingRight: isAr ? '45px' : '0',
                            paddingLeft: !isAr ? '45px' : '0'
                        }}>
                            <span style={{ 
                                fontFamily: "'Cairo', sans-serif", fontSize: '2.4rem', // تصغير خط الشريط السفلي
                                fontWeight: '900', color: '#fff', letterSpacing: '1px', lineHeight: 1 
                            }}>كوانتيكس</span>
                            <span style={{ 
                                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '2.4rem', 
                                fontWeight: '900', color: '#fff', letterSpacing: '6px', lineHeight: 1 
                            }}>QUANTIX</span>
                        </div>
                    </div>
                    
                    <div style={{ 
                        width: '180px', height: '1px', 
                        background: 'linear-gradient(to right, transparent, rgba(192,132,252,0.5), transparent)' 
                    }} />
                    
                    <span style={{ 
                        fontFamily: ff, fontSize: '1.2rem', 
                        color: 'rgba(255,255,255,0.4)', fontWeight: '800', letterSpacing: '0.04em'
                    }}>
                        © {new Date().getFullYear()} {t.footer}
                    </span>

                </footer>

            </main>
        </>
    );
}