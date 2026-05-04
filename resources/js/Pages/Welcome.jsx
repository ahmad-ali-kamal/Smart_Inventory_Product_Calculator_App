import { Head, Link } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
import { useLang } from '@/hooks/useLang';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import GuestLayout from '@/Layouts/GuestLayout';

/* ─── TRANSLATION ENGINE ─── */
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
                { v: '٤٨س',  l: 'تنبيه استباقي' },
                { v: '١٠٠٪', l: 'مزامنة آلية' },
            ],
            features: [
                'تتبع دقيق للمخزون بنظام الدفعات الرقمية المستقلة',
                'نظام الخصومات الآلية الذكي للمنتجات وشيكة الانتهاء',
                'حماية الأرباح الصافية عبر تقليل الفاقد السنوي للمتجر',
                'ربط مباشر وفوري مع مخازن منصة سلة',
            ],
            cta: 'ابدأ تجربتك مع حريص',
        },
        app2: {
            badge:    'مستشار | MUSTASHAR',
            title:    'أداة مستشار للحساب الذكي',
            tagline:  'أداة حساب ذكية تساعدك على حساب الكمية الصحيحة للعميل تلقائياً بناءً على قواعد الحساب الخاصة بك.',
            desc:     'أداة حسابية ذكية تساعدك في حساب الكميات المثلى لعملائك آلياً بناءً على قواعد الحساب بمتجرك؛ مما يقلل من أخطاء الطلبات البشرية ويزيد من كفاءة الدقة المحاسبية.',
            stats: [
                { v: '+٢٠٠', l: 'تاجر نشط' },
                { v: '٩٩٪',  l: 'دقة حسابية' },
                { v: '٣ث',   l: 'سرعة القرار' },
            ],
            features: [
                'أتمتة كاملة لمنطق حساب الكميات المخصصة لكل عميل',
                'إمكانية تخصيص قواعد حساب مستقلة لكل صنف تجاري',
                'دعم تقني كامل لجميع العملات والوحدات العالمية',
                'تقارير تحليلية متقدمة للتنبؤ بحجم الطلبات المستقبلية',
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
            tagline:  'An expiry date monitoring system that organizes inventory by batch and applies discounts for near-expiry products to secure your profits and reduce waste.',
            desc:     'An advanced expiry date monitoring system that organizes stock by batches and applies smart automatic discounts to near-expiry items to secure your revenue.',
            stats: [
                { v: '500+', l: 'Tracked Items' },
                { v: '48h',  l: 'Early Alerts' },
                { v: '100%', l: 'Automated' },
            ],
            features: [
                'Full automation for expiry tracking logic workflows',
                'Smart discounting for near-expiry stock items',
                'Record-breaking annual waste reduction metrics',
                'Instant sync with Salla warehouse systems',
            ],
            cta: 'Activate Harees Now',
        },
        app2: {
            badge:    'MUSTASHAR | Calc',
            title:    'Mustashar Smart Calculator',
            tagline:  'A smart calculation tool helps you automatically calculate the right quantity for customers based on your own calculation rules.',
            desc:     'An AI-driven tool that calculates optimal quantities for customers automatically based on your store rules, eliminating human errors and increasing efficiency.',
            stats: [
                { v: '200+', l: 'Active Merchants' },
                { v: '99%',  l: 'Calc Accuracy' },
                { v: '3s',   l: 'Decision Speed' },
            ],
            features: [
                'Automated customer quantity logic workflows',
                'Customizable calculation rules per individual product',
                'Full multi-currency & unit support across Salla',
                'Advanced predictive analytics for demand',
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

/* ─── COUNTER COMPONENT ─── */
function Counter({ end, suffix }) {
    const [num, setNum] = useState(0);
    useEffect(() => {
        let current = 0;
        const duration = 2500;
        const step = end / (duration / 25);
        const timer = setInterval(() => {
            current += step;
            if (current >= end) { setNum(end); clearInterval(timer); }
            else { setNum(Math.floor(current)); }
        }, 25);
        return () => clearInterval(timer);
    }, [end]);
    return <>{num.toLocaleString()}{suffix}</>;
}

/* ─── APP CARD COMPONENT ─── */
function AppCard({ data, loginUrl, isAr, ff, ffSub }) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: hovered ? 'rgba(23, 20, 42, 0.85)' : 'rgba(23, 20, 42, 0.6)',
                border: `1px solid ${hovered ? 'rgba(120, 112, 175, 0.4)' : 'rgba(120, 112, 175, 0.15)'}`,
                borderRadius: '32px',
                padding: '3.5rem',
                backdropFilter: 'blur(20px)',
                transition: 'all 0.4s ease',
                transform: hovered ? 'translateY(-4px)' : 'none',
                boxShadow: hovered ? '0 30px 80px rgba(82, 39, 255, 0.15)' : 'none',
            }}
        >
            {/* Badge */}
            <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '5px 14px',
                background: 'rgba(196, 181, 253, 0.08)',
                border: '1px solid rgba(196, 181, 253, 0.2)',
                borderRadius: '20px',
                marginBottom: '1.8rem',
            }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#c4b5fd', opacity: 0.8, flexShrink: 0 }} />
                <span style={{ fontFamily: ffSub, fontSize: '0.72rem', color: '#c4b5fd', letterSpacing: '0.1em', fontWeight: '700' }}>
                    {data.badge}
                </span>
            </div>

            {/* Title */}
            <h3 style={{
                fontFamily: ff,
                fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)',
                fontWeight: '800',
                color: '#fff',
                marginBottom: '1rem',
                lineHeight: 1.25,
            }}>
                {data.title}
            </h3>

            {/* Tagline */}
            <p style={{
                fontFamily: ffSub,
                fontSize: '0.9rem',
                color: 'rgba(255,255,255,0.55)',
                lineHeight: 1.8,
                marginBottom: '2rem',
            }}>
                {data.tagline}
            </p>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
                {data.stats.map((s, i) => (
                    <div key={i} style={{ textAlign: isAr ? 'right' : 'left' }}>
                        <div style={{ fontFamily: ff, fontSize: '1.8rem', fontWeight: '900', color: '#c4b5fd', lineHeight: 1 }}>
                            {s.v}
                        </div>
                        <div style={{ fontFamily: ffSub, fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px', letterSpacing: '0.05em' }}>
                            {s.l}
                        </div>
                    </div>
                ))}
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(120, 112, 175, 0.15)', marginBottom: '2rem' }} />

            {/* Features */}
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2.5rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.features.map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontFamily: ffSub, fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
                        <span style={{ color: '#a5f3fc', flexShrink: 0, marginTop: '2px' }}>✦</span>
                        {f}
                    </li>
                ))}
            </ul>

            {/* CTA */}
            <Link
                href={loginUrl}
                style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '0.9rem 2rem',
                    background: hovered
                        ? 'linear-gradient(135deg, #6b52ff 0%, #9f7aea 100%)'
                        : 'rgba(136, 132, 191, 0.15)',
                    border: `1px solid ${hovered ? 'transparent' : 'rgba(136, 132, 191, 0.3)'}`,
                    borderRadius: '14px',
                    color: '#fff',
                    fontFamily: ff,
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                    letterSpacing: '0.02em',
                }}
            >
                {data.cta}
            </Link>
        </div>
    );
}

/* ─── PAGE ─── */
export default function Welcome() {
    const { lang, isAr, dir } = useLang();
    const t = T[lang];
    const [isMounted, setIsMounted] = useState(false);

    // ✅ نفس الخطوط الأصلية من الكود القديم — Cairo للعربي، Plus Jakarta Sans للإنجليزي
    const ff    = isAr ? "'Cairo', sans-serif"             : "'Plus Jakarta Sans', sans-serif";
    const ffSub = isAr ? "'Cairo', sans-serif"             : "'Plus Jakarta Sans', sans-serif";

    useEffect(() => {
        const t = setTimeout(() => setIsMounted(true), 100);
        return () => clearTimeout(t);
    }, []);

    const suites = useMemo(() => [
        { data: t.app1, loginUrl: '/harees/login' },
        { data: t.app2, loginUrl: '/mustashar/login' },
    ], [t]);

    return (
        <>
            <Head title="QUANTIX — منصة إدارة المتاجر الذكية" />
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@700;800;900&family=Plus+Jakarta+Sans:wght@700;800;900&display=swap');

                /*
                 * ✅ لا نحتاج لتعريف خلفية هنا — GuestLayout يتولى ذلك
                 * body يرث #0F0E17 من app.css مباشرة
                 */
                body { color: #E6E1F5; font-family: ${ff}; overflow-x: hidden; margin: 0; }

                .quantix-brand-gradient {
                    background: linear-gradient(120deg, #fff 0%, #ddd6fe 18%, #a5f3fc 36%, #fde68a 54%, #f9a8d4 72%, #c4b5fd 90%, #fff 100%);
                    background-size: 280% 280%;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: iridescent 6s ease infinite;
                }

                .shimmer-text {
                    background: linear-gradient(120deg, #fff 0%, #e0d7ff 25%, #fff 50%, #c4b5fd 75%, #fff 100%);
                    background-size: 250% 100%;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: shimmer 4s ease infinite;
                }

                @keyframes iridescent {
                    0%   { background-position: 0% 50%; }
                    50%  { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                @keyframes shimmer {
                    0%   { background-position: 100% 0; }
                    100% { background-position: -100% 0; }
                }

                @keyframes revealUp {
                    from { opacity: 0; transform: translateY(40px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                .quantix-nav-link {
                    color: rgba(255,255,255,0.55);
                    text-decoration: none;
                    font-size: 0.88rem;
                    font-weight: 600;
                    letter-spacing: 0.03em;
                    transition: color 0.2s;
                    font-family: ${ff};
                }
                .quantix-nav-link:hover { color: rgba(255,255,255,0.95); }

                @media (max-width: 900px) {
                    .quantix-desktop-nav { display: none !important; }
                    .quantix-header-grid { grid-template-columns: 1fr 1fr !important; padding: 0 2rem !important; }
                }
            `}</style>

            {/* ══ HEADER ══ */}
            <header style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: '90px',
                backdropFilter: 'blur(20px)', background: 'rgba(15, 14, 23, 0.7)',
                borderBottom: '1px solid rgba(120, 112, 175, 0.1)',
                display: 'flex', alignItems: 'center',
            }}>
                <div className="quantix-header-grid" style={{
                    maxWidth: '1900px', margin: '0 auto', width: '100%', padding: '0 8rem',
                    display: 'grid', gridTemplateColumns: '1fr 2fr 1fr',
                    alignItems: 'center', direction: 'ltr',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <LanguageSwitcher />
                    </div>

                    <nav className="quantix-desktop-nav" style={{
                        display: 'flex', gap: '6rem', justifyContent: 'center', direction: dir,
                    }}>
                        {t.nav.map((item, idx) => (
                            <a key={idx} className="quantix-nav-link" href={`#${['vis', 'aps', 'help'][idx]}`}>
                                {item}
                            </a>
                        ))}
                    </nav>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '14px' }}>
                        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none' }}>
                            <img
                                src="/images/Quantix_logo.png"
                                alt="Quantix Logo"
                                style={{ height: '50px', width: 'auto', filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.2))' }}
                            />
                            <span className="quantix-brand-gradient" style={{
                                fontFamily: "'Cormorant Garamond', serif",
                                fontSize: '1.6rem', fontWeight: '900', letterSpacing: '0.12em',
                            }}>
                                QUANTIX
                            </span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* ══ MAIN CONTENT ══ */}
            <main style={{ position: 'relative', direction: dir }}>

                {/* § Hero / Vision */}
                <section id="vis" style={{
                    height: '100vh', display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center',
                    textAlign: 'center', padding: '0 12%',
                }}>
                    <div style={{
                        animation: 'revealUp 2.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                        opacity: isMounted ? 1 : 0,
                    }}>
                        <h1 style={{
                            fontFamily: ff,
                            fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)',
                            fontWeight: '800', color: '#fff',
                            lineHeight: 1.3, marginBottom: '3rem',
                            maxWidth: '1100px',
                        }}>
                            <span className="shimmer-text">{t.welcome}</span>
                            <br />
                            {t.slogan}
                        </h1>
                        <p style={{
                            fontFamily: ffSub,
                            fontSize: 'clamp(0.95rem, 1.4vw, 1.15rem)',
                            fontWeight: '600', lineHeight: 2.1,
                            color: 'rgba(255,255,255,0.8)',
                            maxWidth: '850px', margin: '0 auto',
                        }}>
                            {t.intro}
                        </p>
                    </div>
                </section>

                {/* § App Ecosystem */}
                <section id="aps" style={{
                    maxWidth: '1700px', margin: '0 auto',
                    padding: '8rem 8rem 18rem',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3.5rem', marginBottom: '10rem' }}>
                        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(192,132,252,0.3), transparent)' }} />
                        <span style={{
                            fontFamily: ffSub, fontSize: '0.95rem',
                            color: 'rgba(255,255,255,0.4)',
                            letterSpacing: '0.6em', textTransform: 'uppercase', fontWeight: '900',
                        }}>
                            {t.appsLabel}
                        </span>
                        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(192,132,252,0.3), transparent)' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6rem' }}>
                        {suites.map((suite, idx) => (
                            <AppCard key={idx} data={suite.data} loginUrl={suite.loginUrl} isAr={isAr} ff={ff} ffSub={ffSub} />
                        ))}
                    </div>
                </section>

                {/* § Stats Bar */}
                <div style={{
                    background: 'rgba(15, 14, 23, 0.2)',
                    backdropFilter: 'blur(30px)',
                    padding: '16rem 8rem',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                    <div style={{
                        maxWidth: '1600px', margin: '0 auto',
                        display: 'flex', justifyContent: 'space-around',
                        gap: '10rem', flexWrap: 'wrap', textAlign: 'center',
                    }}>
                        {t.statsBar.map((item, idx) => (
                            <div key={idx}>
                                <div style={{
                                    fontFamily: ff, fontSize: '6.5rem', fontWeight: '900',
                                    color: '#fff', lineHeight: 1,
                                    textShadow: '0 40px 80px rgba(0,0,0,0.5)',
                                }}>
                                    <Counter end={item.v} suffix={item.s} />
                                </div>
                                <div style={{
                                    fontFamily: ffSub, fontSize: '1.4rem',
                                    color: '#c084fc', marginTop: '35px',
                                    textTransform: 'uppercase', letterSpacing: '0.25em', fontWeight: '900',
                                }}>
                                    {item.l}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* § Footer */}
                <footer id="help" style={{
                    padding: '12rem 8rem',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: '60px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                        <img
                            src="/images/Quantix_logo.png" alt="Quantix Logo"
                            style={{ height: '85px', opacity: 1, filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.2))' }}
                        />
                        <div style={{
                            display: 'flex', flexDirection: 'column', gap: '10px',
                            borderRight: isAr ? '4px solid rgba(255,255,255,0.15)' : 'none',
                            borderLeft: !isAr ? '4px solid rgba(255,255,255,0.15)' : 'none',
                            paddingRight: isAr ? '45px' : '0',
                            paddingLeft: !isAr ? '45px' : '0',
                        }}>
                            <span style={{ fontFamily: ffSub, fontSize: '2.4rem', fontWeight: '900', color: '#fff', letterSpacing: '1px', lineHeight: 1 }}>كوانتيكس</span>
                            <span style={{ fontFamily: ff, fontSize: '2.4rem', fontWeight: '900', color: '#fff', letterSpacing: '6px', lineHeight: 1 }}>QUANTIX</span>
                        </div>
                    </div>
                    <div style={{ width: '180px', height: '1px', background: 'linear-gradient(to right, transparent, rgba(192,132,252,0.5), transparent)' }} />
                    <span style={{ fontFamily: ffSub, fontSize: '1.2rem', color: 'rgba(255,255,255,0.6)', fontWeight: '800', letterSpacing: '0.04em' }}>
                        © {new Date().getFullYear()} {t.footer}
                    </span>
                    <p style={{ fontFamily: ffSub, fontSize: '0.9rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>
                        {t.bottomNote}
                    </p>
                </footer>
            </main>
        </>
    );
}

/*
 * ✅ PERSISTENT LAYOUT — الجزء الأساسي لمنع إعادة mount الخلفية
 *
 * بدلاً من تغليف المحتوى داخل GuestLayout في الـ return،
 * نستخدم خاصية .layout الخاصة بـ Inertia.
 *
 * هذا يعني:
 * - عند الانتقال من Welcome → Login، GuestLayout لا تُعاد إنشاؤها
 * - LiquidEther تظل تعمل بدون انقطاع ← لا وميض ← لا إعادة تحميل
 * - فقط محتوى الصفحة (الـ children) يتغير
 */
Welcome.layout = page => <GuestLayout>{page}</GuestLayout>;