import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Settings2, Clock, TrendingUp, CheckCircle2, ShoppingBag } from 'lucide-react';
import { useLang } from '@/Hooks/useLang';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import GuestLayout from '@/Layouts/GuestLayout';

/* ─── TRANSLATIONS ─── */
const T = {
    en: {
        nav: ['Features', 'Platforms', 'Stats'],
        heroSub: 'Welcome to Quantix.. Your Intelligent system for Salla management. Because successful come numbers, not expectations',
        exploreCta: 'Explore more',
        platformsCta: 'Our Platforms',
        featuresLabel: 'OUR KEY FEATURE',
        features: [
            {
                title: 'Precision-Driven Calculations',
                desc: 'Advanced algorithms deliver exact quantity and cost calculations, eliminating guesswork and manual errors from every transaction to ensure complete accuracy across your Salla store.',
            },
            {
                title: 'Expiry-Aware Inventory Control',
                desc: "Monitor every product's shelf life automatically with proactive alerts before items approach their expiry date, reducing waste and protecting your revenue streams effectively.",
            },
            {
                title: 'Maximized Profitability',
                desc: 'Smart pricing strategies and real-time margin analysis ensure every transaction contributes to your bottom line, with intelligent insights driving measurable business growth.',
            },
        ],
        pillarsLabel: 'THE TWO PILLARS',
        pillarsTitle: 'Two Platforms. One Ecosystem.',
        pillarsDesc: 'Quantix delivers two specialized sub-platforms designed to handle every dimension of your Salla store.',
        harees: {
            name: 'HAREES',
            desc: "Harees Expiry Monitoring brings intelligent tracking of every product's shelf life — automatically flagging approaching expiry dates to reduce waste and protect your revenue.",
            features: [
                'Smart discounting on near-expiry items',
                'Instant sync with Salla catalog',
                'Multi-batch expiry tracking',
                'Automated alert notifications',
            ],
            cta: 'Explore Harees',
        },
        mustashar: {
            name: 'MUSTASHAR',
            desc: 'Mustashar Smart Calculator embeds a professional calculator directly in your Salla product pages — eliminating human errors and delivering accurate area, quantity, and cost calculations instantly.',
            features: [
                'Customizable calculation rules',
                'Area & cost formula engine',
                'Embeddable product page snippet',
                'VAT-inclusive live pricing',
            ],
            cta: 'Explore Mustashar',
        },
        footer: {
            desc: 'Your intelligent system for Salla management. Because successful commerce relies on numbers, not expectations.',
            product: { label: 'PRODUCT', links: ['Harees', 'Mustashar', 'Integrations', 'Pricing'] },
            company: { label: 'COMPANY', links: ['About', 'Blog', 'Careers', 'Press Kit'] },
            support: { label: 'SUPPORT', links: ['Documentation', 'API Reference', 'Contact Us', 'Status'] },
            copyright: 'All rights reserved to Quantix Digital Platform © 2026',
        },
        statusLabels: { safe: 'Safe', approaching: 'Approaching', expired: 'Expired' },
    },
    ar: {
        nav: ['المميزات', 'المنصات', 'الإحصاء'],
        heroSub: 'أهلاً بك في كوانتيكس.. نظامك الذكي لإدارة متجرك في سلة. لأن التجارة الناجحة تعتمد على الأرقام، لا التوقعات.',
        exploreCta: 'استكشف المزيد',
        platformsCta: 'منصاتنا',
        featuresLabel: 'مميزاتنا الرئيسية',
        features: [
            {
                title: 'حسابات دقيقة بدقة متناهية',
                desc: 'خوارزميات متقدمة تُقدّم حسابات دقيقة للكمية والتكلفة، تُزيل التخمين والأخطاء اليدوية من كل معاملة لضمان الدقة التامة في متجرك.',
            },
            {
                title: 'مراقبة المخزون بوعي تام',
                desc: 'راقب صلاحية كل منتج تلقائياً مع تنبيهات استباقية قبل اقتراب تاريخ الانتهاء، لتقليل الهدر وحماية إيراداتك بفعالية.',
            },
            {
                title: 'تعظيم الربحية',
                desc: 'استراتيجيات تسعير ذكية وتحليل هامش فوري يضمنان مساهمة كل معاملة في أرباحك، مع رؤى ذكية تدفع نمواً تجارياً ملموساً.',
            },
        ],
        pillarsLabel: 'الركيزتان الأساسيتان',
        pillarsTitle: 'منصتان. منظومة واحدة.',
        pillarsDesc: 'كوانتيكس تقدم منصتين فرعيتين متخصصتين مصممتين للتعامل مع كل أبعاد متجرك في سلة.',
        harees: {
            name: 'حريص',
            desc: 'نظام حريص لمراقبة الصلاحية يتتبع بذكاء صلاحية كل منتج — ويُبلّغ تلقائياً عن تواريخ الانتهاء المقتربة لتقليل الهدر وحماية إيراداتك.',
            features: [
                'خصومات ذكية للمنتجات قرب الانتهاء',
                'مزامنة فورية مع كتالوج سلة',
                'تتبع متعدد الدفعات',
                'إشعارات تنبيه تلقائية',
            ],
            cta: 'استكشف حريص',
        },
        mustashar: {
            name: 'مستشار',
            desc: 'حاسبة مستشار الذكية تُدمج آلة حساب احترافية مباشرة في صفحات منتجاتك في سلة — للقضاء على الأخطاء البشرية وتقديم حسابات دقيقة للمساحة والكمية والتكلفة فوراً.',
            features: [
                'قواعد حساب قابلة للتخصيص',
                'محرك معادلات المساحة والتكلفة',
                'مقتطع قابل للتضمين في صفحة المنتج',
                'تسعير حي شامل للضريبة',
            ],
            cta: 'استكشف مستشار',
        },
        footer: {
            desc: 'نظامك الذكي لإدارة متجرك في سلة. لأن التجارة الناجحة تعتمد على الأرقام، لا التوقعات.',
            product: { label: 'المنتجات', links: ['حريص', 'مستشار', 'التكاملات', 'الأسعار'] },
            company: { label: 'الشركة', links: ['من نحن', 'المدونة', 'الوظائف', 'الصحافة'] },
            support: { label: 'الدعم', links: ['التوثيق', 'مرجع API', 'تواصل معنا', 'الحالة'] },
            copyright: 'جميع الحقوق محفوظة لمنصة كوانتيكس الرقمية © 2026',
        },
        statusLabels: { safe: 'آمن', approaching: 'يقترب', expired: 'منتهي' },
    },
};

/* ─── STATUS PILL ─── */
const statusConfig = {
    safe:        { bg: '#DCFCE7', color: '#15803D', dot: '#22C55E' },
    approaching: { bg: '#FEF3C7', color: '#B45309', dot: '#F59E0B' },
    expired:     { bg: '#FEE2E2', color: '#B91C1C', dot: '#EF4444' },
};

function StatusPill({ status, label }) {
    const cfg = statusConfig[status];
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: cfg.bg, color: cfg.color,
            borderRadius: 999, padding: '3px 10px',
            fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
        }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
            {label}
        </span>
    );
}

/* ─── STATUS CARD ─── */
function StatusCard({ status, label, delay }) {
    return (
        <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay }}
            style={{
                background: 'white', borderRadius: 16, padding: '10px 14px',
                width: 210, boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                display: 'flex', alignItems: 'center', gap: 10,
            }}
        >
            <div style={{
                width: 32, height: 32, borderRadius: 9, background: '#EDE9FE',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
                <ShoppingBag size={16} color="#7C3AED" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ height: 7, background: '#E5E7EB', borderRadius: 4, marginBottom: 5, width: '80%' }} />
                <div style={{ height: 5, background: '#F3F4F6', borderRadius: 4, width: '60%' }} />
            </div>
            <StatusPill status={status} label={label} />
        </motion.div>
    );
}

/* ─── SCAN CARD ─── */
function ScanCard({ delay }) {
    return (
        <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay }}
            style={{
                background: 'white', borderRadius: 13, padding: '9px 12px',
                width: 194, boxShadow: '0 6px 20px rgba(0,0,0,0.10)',
                display: 'flex', alignItems: 'center', gap: 9,
            }}
        >
            <div style={{
                width: 29, height: 29, borderRadius: 7, background: '#EFF6FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <ShoppingBag size={14} color="#3B82F6" />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ height: 6, background: '#E5E7EB', borderRadius: 4, marginBottom: 4, width: '75%' }} />
                <div style={{ height: 5, background: '#F3F4F6', borderRadius: 4, width: '55%' }} />
            </div>
        </motion.div>
    );
}

/* ─── CALCULATOR 3D — purple/mauve theme ─── */
function Calculator3D() {
    const rows = [
        [{ l: 'C', t: 'clear' }, { l: '±', t: 'fn' }, { l: '%', t: 'fn' }, { l: '÷', t: 'op' }],
        [{ l: '7', t: 'num' }, { l: '8', t: 'num' }, { l: '9', t: 'num' }, { l: '×', t: 'op' }],
        [{ l: '4', t: 'num' }, { l: '5', t: 'num' }, { l: '6', t: 'num' }, { l: '-', t: 'op' }],
        [{ l: '1', t: 'num' }, { l: '2', t: 'num' }, { l: '3', t: 'num' }, { l: '+', t: 'op' }],
    ];

    /* Purple/mauve palette */
    const btnColor = (type) => {
        if (type === 'op')    return '#A855F7';   /* light purple — operators  */
        if (type === 'clear') return '#5B21B6';   /* dark purple  — clear      */
        if (type === 'fn')    return '#6D28D9';   /* mid purple   — ±/%        */
        return '#7C3AED';                         /* base purple  — digits     */
    };

    return (
        <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            style={{ position: 'relative', transform: 'perspective(500px) rotateX(8deg) rotateY(-15deg)' }}
        >
            {/* 3D depth */}
            <div style={{
                position: 'absolute', top: 10, left: 10, right: -10, bottom: -10,
                background: '#3B0D82', borderRadius: 22, zIndex: 0,
            }} />
            {/* Body — purple gradient */}
            <div style={{
                position: 'relative', zIndex: 1,
                background: 'linear-gradient(155deg, #6D28D9 0%, #9333EA 100%)',
                borderRadius: 22, padding: 11, width: 162,
                boxShadow: '0 20px 50px rgba(76,29,149,0.45)',
            }}>
                {/* Display */}
                <div style={{ background: '#3B0764', borderRadius: 11, padding: '7px 11px', marginBottom: 9 }}>
                    <div style={{ fontSize: 10, color: 'rgba(233,213,255,0.45)', marginBottom: 2, textAlign: 'right' }}>10 سم</div>
                    <div style={{ fontSize: 26, color: '#E9D5FF', fontWeight: 700, textAlign: 'right', lineHeight: 1 }}>12</div>
                </div>
                {/* Digit + operator rows */}
                {rows.map((row, ri) => (
                    <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginBottom: 4 }}>
                        {row.map((btn, bi) => (
                            <div key={bi} style={{
                                background: btnColor(btn.t), borderRadius: 7, height: 28,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontSize: 11, fontWeight: 700,
                            }}>
                                {btn.l}
                            </div>
                        ))}
                    </div>
                ))}
                {/* Last row: 0, ., = */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 4 }}>
                    {[{ l: '0', t: 'num' }, { l: '.', t: 'num' }, { l: '=', t: 'op' }].map((btn, bi) => (
                        <div key={bi} style={{
                            background: btnColor(btn.t), borderRadius: 7, height: 28,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: 11, fontWeight: 700,
                        }}>
                            {btn.l}
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

/* ─── HERO RIGHT COLUMN ─── */
function HeroRight({ t }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 22,
            justifyContent: 'center', padding: '1.5rem 0',
        }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <ScanCard delay={0.3} />
                <StatusCard status="safe"        label={t.statusLabels.safe}        delay={0} />
                <StatusCard status="approaching" label={t.statusLabels.approaching} delay={0.8} />
                <StatusCard status="expired"     label={t.statusLabels.expired}     delay={1.6} />
            </div>
            <div style={{ flexShrink: 0, paddingTop: '1.5rem' }}>
                <Calculator3D />
            </div>
        </div>
    );
}

/* ─── FEATURES SECTION ─── */
const featureIcons = [
    { Icon: Settings2,  iconBg: '#EDE9FE', iconColor: '#7C3AED' },
    { Icon: Clock,      iconBg: '#CCFBF1', iconColor: '#0D9488' },
    { Icon: TrendingUp, iconBg: '#DCFCE7', iconColor: '#15803D' },
];

function FeaturesSection({ t, ff, bodyFont }) {
    return (
        <section id="features" style={{ background: '#FFFFFF', padding: '4rem 1.5rem' }}>
            <div style={{ maxWidth: 960, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.75rem' }}>
                    <p style={{ fontFamily: ff, fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.18em', color: '#6B7280', marginBottom: '0.5rem' }}>
                        {t.featuresLabel}
                    </p>
                    <div style={{ width: 50, height: 3, background: 'linear-gradient(90deg, #7C3AED, #A855F7)', borderRadius: 2, margin: '0 auto' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                    {t.features.map((feat, i) => {
                        const { Icon, iconBg, iconColor } = featureIcons[i];
                        return (
                            <div key={i} style={{
                                border: '1px solid #F3F4F6', borderRadius: 18,
                                padding: '1.75rem 1.5rem',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                            }}>
                                <div style={{
                                    width: 46, height: 46, borderRadius: 12, background: iconBg,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginBottom: '1rem',
                                }}>
                                    <Icon size={22} color={iconColor} />
                                </div>
                                <h3 style={{ fontFamily: ff, fontSize: '1rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>
                                    {feat.title}
                                </h3>
                                <p style={{ fontFamily: bodyFont, fontSize: '0.84rem', color: '#6B7280', lineHeight: 1.7 }}>
                                    {feat.desc}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

/* ─── PLATFORM CARD ─── */
function PlatformCard({ data, imgSrc, accentColor, loginUrl, ff, bodyFont }) {
    return (
        <div style={{ border: '1px solid #E5E7EB', borderRadius: 18, background: 'white', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
                <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: accentColor + '18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <ShoppingBag size={18} color={accentColor} />
                </div>
                <h3 style={{ fontFamily: ff, fontSize: '1.2rem', fontWeight: 800, color: accentColor }}>
                    {data.name}
                </h3>
            </div>

            <p style={{ fontFamily: bodyFont, fontSize: '0.84rem', color: '#6B7280', lineHeight: 1.7, marginBottom: '1rem' }}>
                {data.desc}
            </p>

            <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: '1.25rem', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                <img src={imgSrc} alt={data.name} style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.25rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.features.map((feat, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: bodyFont, fontSize: '0.84rem', color: '#374151' }}>
                        <CheckCircle2 size={15} color={accentColor} style={{ flexShrink: 0 }} />
                        {feat}
                    </li>
                ))}
            </ul>

            <Link
                href={loginUrl}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '0.65rem 1.25rem',
                    background: accentColor, color: 'white',
                    borderRadius: 9, fontFamily: ff, fontSize: '0.85rem', fontWeight: 700,
                    textDecoration: 'none',
                }}
            >
                {data.cta} →
            </Link>
        </div>
    );
}

/* ─── PLATFORMS SECTION ─── */
function PlatformsSection({ t, ff, bodyFont }) {
    return (
        <section id="platforms" style={{ background: '#F9FAFB', padding: '4rem 1.5rem' }}>
            <div style={{ maxWidth: 960, margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', justifyContent: 'center', marginBottom: '1.25rem' }}>
                    <div style={{ flex: 1, height: 1, background: '#D1D5DB', maxWidth: 160 }} />
                    <span style={{ fontFamily: ff, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.2em', color: '#7C3AED', whiteSpace: 'nowrap' }}>
                        — {t.pillarsLabel} —
                    </span>
                    <div style={{ flex: 1, height: 1, background: '#D1D5DB', maxWidth: 160 }} />
                </div>

                <h2 style={{ textAlign: 'center', fontFamily: ff, fontSize: 'clamp(1.6rem, 3vw, 2.25rem)', fontWeight: 800, color: '#111827', marginBottom: '0.75rem' }}>
                    {t.pillarsTitle}
                </h2>
                <p style={{ textAlign: 'center', fontFamily: bodyFont, fontSize: '0.9rem', color: '#6B7280', maxWidth: 500, margin: '0 auto 2.75rem' }}>
                    {t.pillarsDesc}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    <PlatformCard
                        data={t.harees}
                        imgSrc="/images/hareesDashboard.png"
                        accentColor="#7C3AED"
                        loginUrl="/harees/login"
                        ff={ff}
                        bodyFont={bodyFont}
                    />
                    <PlatformCard
                        data={t.mustashar}
                        imgSrc="/images/mustasharSettings.png"
                        accentColor="#7C3AED"
                        loginUrl="/mustashar/login"
                        ff={ff}
                        bodyFont={bodyFont}
                    />
                </div>
            </div>
        </section>
    );
}

/* ─── FOOTER — white background, dark text ─── */
function Footer({ t, ff, bodyFont }) {
    const { desc, product, company, support, copyright } = t.footer;
    const cols = [product, company, support];

    return (
        <footer id="stats" style={{
            background: '#ffffff',
            borderTop: '1px solid #E5E7EB',
            padding: '3rem 1.5rem 1.75rem',
            color: '#1A1A1A',
        }}>
            <div style={{ maxWidth: 960, margin: '0 auto' }}>
                {/* Top grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(160px, 220px) 1fr 1fr 1fr', gap: '2rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
                    {/* Brand */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: '0.75rem', direction: 'ltr' }}>
                            <img src="/images/Quantix_logo.png" alt="Quantix" style={{ height: 36 }} />
                            <span style={{ fontFamily: "'Changa', sans-serif", fontSize: '1.15rem', fontWeight: 800, letterSpacing: '0.08em', color: '#1A1A1A' }}>
                                QUANTIX
                            </span>
                        </div>
                        <p style={{ fontFamily: bodyFont, fontSize: '0.78rem', color: '#6B7280', lineHeight: 1.7 }}>
                            {desc}
                        </p>
                    </div>

                    {/* Nav columns */}
                    {cols.map((col, i) => (
                        <div key={i}>
                            <h4 style={{ fontFamily: ff, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.14em', color: '#9CA3AF', marginBottom: '1rem' }}>
                                {col.label}
                            </h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                                {col.links.map((link, li) => (
                                    <li key={li}>
                                        <a href="#" style={{ fontFamily: bodyFont, fontSize: '0.84rem', color: '#4B5563', textDecoration: 'none' }}>
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: '#E5E7EB', marginBottom: '1.25rem' }} />

                {/* Copyright */}
                <p style={{ textAlign: 'center', fontFamily: bodyFont, fontSize: '0.78rem', color: '#9CA3AF' }}>
                    {copyright}
                </p>
            </div>
        </footer>
    );
}

/* ─── MAIN WELCOME COMPONENT ─── */
export default function Welcome() {
    const { lang, isAr, dir } = useLang();
    const t = T[lang];

    const ff       = isAr ? "'Cairo', sans-serif"  : "'Changa', sans-serif";
    const bodyFont = "'Cairo', sans-serif";

    /* Navbar height — used for hero padding-top offset */
    const NAV_H = 58;

    return (
        <>
            <Head title="QUANTIX — منصة إدارة المتاجر الذكية" />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Changa:wght@700;800&family=Cairo:wght@400;600;700;800&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                body { overflow-x: hidden; }

                @media (max-width: 960px) {
                    .q-hero-grid   { grid-template-columns: 1fr !important; }
                    .q-hero-visual { display: none !important; }
                    .q-hero-text   { align-items: center !important; text-align: center !important; }
                    .q-hero-btns   { justify-content: center !important; }
                }
                @media (max-width: 680px) {
                    .q-footer-grid  { grid-template-columns: 1fr 1fr !important; }
                    .q-footer-brand { grid-column: span 2 !important; }
                }
                @media (max-width: 400px) {
                    .q-footer-grid  { grid-template-columns: 1fr !important; }
                    .q-footer-brand { grid-column: auto !important; }
                }
            `}</style>

            {/* ══ NAVBAR ══ */}
            <header style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                height: NAV_H,
                backdropFilter: 'blur(20px)',
                background: 'rgba(10, 5, 30, 0.65)',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'center',
            }}>
                <div style={{
                    maxWidth: 1100, margin: '0 auto', width: '100%', padding: '0 1.5rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    direction: 'ltr',
                }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
                        <img src="/images/Quantix_logo.png" alt="Quantix" style={{ height: 30 }} />
                        <span style={{ fontFamily: "'Changa', sans-serif", fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.08em', color: 'white' }}>
                            QUANTIX
                        </span>
                    </Link>

                    <nav style={{
                        display: 'flex', alignItems: 'center',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 999, padding: '3px',
                        direction: dir,
                    }}>
                        {t.nav.map((item, i) => (
                            <a key={i}
                                href={['#features', '#platforms', '#stats'][i]}
                                style={{
                                    padding: '6px 16px',
                                    color: i === 0 ? 'white' : 'rgba(255,255,255,0.5)',
                                    textDecoration: 'none',
                                    fontFamily: bodyFont,
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                    borderRadius: 999,
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    background: i === 0 ? 'rgba(255,255,255,0.1)' : 'transparent',
                                }}
                            >
                                {i === 0 && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#A855F7', flexShrink: 0 }} />}
                                {item}
                            </a>
                        ))}
                    </nav>

                    <LanguageSwitcher />
                </div>
            </header>

            {/* ══ MAIN ══ */}
            <main dir={dir}>

                {/* § HERO — with smooth curved arc at bottom */}
                <section style={{
                    background: 'linear-gradient(155deg, #110330 0%, #2A0868 38%, #3B0F90 62%, #1C0445 100%)',
                    minHeight: '100vh',
                    paddingTop: NAV_H,
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden',
                    position: 'relative',
                }}>
                    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem 5rem', width: '100%' }}>
                        <div className="q-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', alignItems: 'center' }}>

                            {/* Left */}
                            <div className="q-hero-text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <h1 style={{
                                    fontFamily: "'Changa', sans-serif",
                                    fontSize: 'clamp(3rem, 7vw, 6rem)',
                                    fontWeight: 800,
                                    color: 'white',
                                    letterSpacing: '0.06em',
                                    lineHeight: 1,
                                    marginBottom: '1.25rem',
                                    direction: 'ltr',
                                }}>
                                    QUANTIX
                                </h1>

                                <p style={{
                                    fontFamily: bodyFont,
                                    fontSize: 'clamp(0.85rem, 1.3vw, 0.98rem)',
                                    color: 'rgba(255,255,255,0.62)',
                                    lineHeight: 1.8,
                                    marginBottom: '2rem',
                                    maxWidth: 420,
                                }}>
                                    {t.heroSub}
                                </p>

                                <div className="q-hero-btns" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                 
                                    <a href="#platforms" style={{
                                        padding: '0.75rem 1.75rem',
                                        background: '#0F0E17',
                                        color: 'white',
                                        borderRadius: 9,
                                        fontFamily: ff,
                                        fontSize: '0.85rem',
                                        fontWeight: 700,
                                        textDecoration: 'none',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                    }}>
                                        {t.platformsCta}
                                    </a>
                                </div>
                            </div>

                            {/* Right */}
                            <div className="q-hero-visual">
                                <HeroRight t={t} />
                            </div>
                        </div>
                    </div>

                    {/* ── Smooth curved arc — transitions hero into the white section below ── */}
                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        lineHeight: 0, zIndex: 2, pointerEvents: 'none',
                    }}>
                        <svg
                            viewBox="0 0 1440 72"
                            preserveAspectRatio="none"
                            style={{ display: 'block', width: '100%', height: 72 }}
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M0,72 Q720,0 1440,72 L1440,72 L0,72 Z" fill="#ffffff" />
                        </svg>
                    </div>
                </section>

                {/* § FEATURES */}
                <FeaturesSection t={t} ff={ff} bodyFont={bodyFont} />

                {/* § PLATFORMS */}
                <PlatformsSection t={t} ff={ff} bodyFont={bodyFont} />

                {/* § FOOTER */}
                <Footer t={t} ff={ff} bodyFont={bodyFont} />

            </main>
        </>
    );
}

Welcome.layout = page => <GuestLayout>{page}</GuestLayout>;
