import { useRef, useEffect, useState, useCallback } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import LanguageSwitcher from '@/Components/UI/LanguageSwitcher';

const NAV_ANCHORS = ['/', '/', '/', '/privacy-policy', '/faq'];
const SECTION_IDS = ['hero', 'features', 'platforms'];

function MobileMenuItem({ label, active, onClick, ff }) {
    return (
        <motion.button
            onClick={onClick}
            whileTap={{ scale: 0.97 }}
            style={{
                width: '100%', border: 'none', background: 'transparent',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '0.85rem 1.5rem',
                fontFamily: ff, fontSize: '1.05rem', fontWeight: 600,
                color: active ? 'white' : 'rgba(255,255,255,0.5)',
                textAlign: 'left',
                transition: 'color 0.2s, background 0.2s',
                borderRadius: 12,
            }}
        >
            {active && (
                <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#A855F7', flexShrink: 0,
                }} aria-hidden="true" />
            )}
            {label}
        </motion.button>
    );
}

const menuVariants = {
    hidden: { opacity: 0, clipPath: 'circle(0% at 100% 0%)' },
    visible: { opacity: 1, clipPath: 'circle(150% at 100% 0%)' },
};

const itemVariants = {
    hidden: { opacity: 0, x: 24 },
    visible: (i) => ({
        opacity: 1, x: 0,
        transition: { delay: 0.06 * i, duration: 0.3, ease: [0.22, 1, 0.36, 1] },
    }),
};

export default function Navbar({ t, ff, dir, NAV_H }) {
    const [hidden, setHidden] = useState(false);
    const [activeSection, setActiveSection] = useState(0);
    const [mobileOpen, setMobileOpen] = useState(false);
    const lastY = useRef(0);
    const { url } = usePage();
    const isHome = url === '/';
    const navLabels = t('nav', { returnObjects: true });

    useEffect(() => {
        if (!isHome) return;

        const ids = ['hero', 'features', 'platforms'];
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        const idx = ids.indexOf(entry.target.id);
                        if (idx !== -1) setActiveSection(idx);
                    }
                }
            },
            { threshold: 0.3, rootMargin: `-${NAV_H}px 0px 0px 0px` }
        );

        const elements = ids.map(id => document.getElementById(id)).filter(Boolean);
        elements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, [isHome, NAV_H]);

    const activeIndex = isHome
        ? activeSection
        : NAV_ANCHORS.findIndex(route => route === url);

    const goToSection = useCallback((anchor, labelIndex) => {
        setMobileOpen(false);
        if (isHome) {
            const el = document.querySelector(anchor);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveSection(labelIndex);
        } else {
            router.visit('/', {
                preserveState: false,
                preserveScroll: false,
                onSuccess: () => {
                    window.location.hash = anchor;
                    setTimeout(() => {
                        const el = document.querySelector(anchor);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 300);
                },
            });
        }
    }, [isHome]);

    const navigateTo = useCallback((route) => {
        setMobileOpen(false);
        router.visit(route, { preserveState: false, preserveScroll: false });
    }, []);

    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY;
            if (Math.abs(y - lastY.current) < 5) return;
            setHidden(y > lastY.current && y > NAV_H * 2);
            lastY.current = y;
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [NAV_H]);

    useEffect(() => {
        if (!mobileOpen) return;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    const isRtl = dir === 'rtl';

    return (
        <>
            <motion.header
                role="banner"
                animate={{ y: hidden ? -NAV_H - 4 : 0 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                    height: NAV_H,
                    backdropFilter: 'blur(20px)',
                    background: 'rgba(10, 5, 30, 0.0)',
                    borderBottom: '1px solid transparent',
                    display: 'flex', alignItems: 'center',
                }}
            >
                <div style={{
                    maxWidth: 1320, margin: '0 auto', width: '100%',
                    padding: '0 clamp(0.75rem, 3vw, 2rem)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    direction: 'ltr',
                }}>

                    {/* ── Logo ── */}
                    <motion.div
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
                            <img src={"/logos/Quantix_logo.png"} alt="Quantix" style={{ height: 28 }} />
                            <span style={{
                                fontFamily: "'Changa', sans-serif",
                                fontSize: '1rem', fontWeight: 800,
                                letterSpacing: '0.08em', color: 'white',
                            }}>
                                QUANTIX
                            </span>
                        </Link>
                    </motion.div>

                    {/* ── Desktop pill nav (hidden on mobile) ── */}
                    <motion.nav
                        aria-label={isRtl ? 'التنقل الرئيسي' : 'Main navigation'}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            display: 'flex', alignItems: 'center',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 999, padding: '3px',
                            direction: dir,
                        }}
                        className="q-desk-nav"
                    >
                        {navLabels.map((label, i) => {
                            const active = activeIndex === i;
                            const isSection = i < 3;
                            const route = NAV_ANCHORS[i];

                            if (isSection) {
                                return (
                                    <button
                                        key={i}
                                        onClick={() => goToSection(SECTION_IDS[i] === 'hero' ? '/' : '#' + SECTION_IDS[i], i)}
                                        aria-current={active ? 'true' : undefined}
                                        style={{
                                            padding: '6px max(10px, 1vw)',
                                            color: active ? 'white' : 'rgba(255,255,255,0.5)',
                                            background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontFamily: ff,
                                            fontSize: 'clamp(0.72rem, 1vw, 0.85rem)', fontWeight: 600,
                                            borderRadius: 999,
                                            display: 'flex', alignItems: 'center', gap: 5,
                                            transition: 'color 0.2s, background 0.2s',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {active && (
                                            <span style={{
                                                width: 5, height: 5, borderRadius: '50%',
                                                background: '#A855F7', flexShrink: 0,
                                            }} aria-hidden="true" />
                                        )}
                                        {label}
                                    </button>
                                );
                            }

                            return (
                                <Link
                                    key={i}
                                    href={route}
                                    aria-current={active ? 'true' : undefined}
                                    style={{
                                        padding: '6px max(10px, 1vw)',
                                        color: active ? 'white' : 'rgba(255,255,255,0.5)',
                                        background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                                        textDecoration: 'none',
                                        fontFamily: ff,
                                        fontSize: 'clamp(0.72rem, 1vw, 0.85rem)', fontWeight: 600,
                                        borderRadius: 999,
                                        display: 'flex', alignItems: 'center', gap: 5,
                                        transition: 'color 0.2s, background 0.2s',
                                        whiteSpace: 'nowrap',
                                    }}
                                    onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'white'; }}
                                    onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                                >
                                    {active && (
                                        <span style={{
                                            width: 5, height: 5, borderRadius: '50%',
                                            background: '#A855F7', flexShrink: 0,
                                        }} aria-hidden="true" />
                                    )}
                                    {label}
                                </Link>
                            );
                        })}
                    </motion.nav>

                    {/* ── Desktop language switcher + Mobile hamburger ── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="q-desk-lang">
                            <LanguageSwitcher />
                        </div>
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                            style={{
                                display: 'none', /* shown via media query */
                                background: 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: 8,
                                cursor: 'pointer',
                                width: 36, height: 36,
                                alignItems: 'center', justifyContent: 'center',
                                color: 'white',
                            }}
                            className="q-mob-hamburger"
                        >
                            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                    </div>
                </div>
            </motion.header>

            {/* ── Mobile full-screen overlay menu ── */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        variants={menuVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            zIndex: 99,
                            background: 'rgba(10, 5, 30, 0.97)',
                            backdropFilter: 'blur(24px)',
                            display: 'flex', flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            paddingTop: NAV_H + 20,
                            paddingBottom: 40,
                            overflowY: 'auto',
                            direction: dir,
                        }}
                    >
                        <div style={{
                            width: '100%',
                            maxWidth: 360,
                            margin: '0 auto',
                            padding: '0 1.5rem',
                            display: 'flex', flexDirection: 'column', gap: 4,
                        }}>
                            {navLabels.map((label, i) => {
                                const active = activeIndex === i;
                                const isSection = i < 3;

                                const handleClick = () => {
                                    if (isSection) {
                                        goToSection(
                                            SECTION_IDS[i] === 'hero' ? '/' : '#' + SECTION_IDS[i],
                                            i
                                        );
                                    } else {
                                        navigateTo(NAV_ANCHORS[i]);
                                    }
                                };

                                return (
                                    <motion.div
                                        key={i}
                                        custom={i}
                                        variants={itemVariants}
                                        initial="hidden"
                                        animate="visible"
                                    >
                                        <MobileMenuItem
                                            label={label}
                                            active={active}
                                            onClick={handleClick}
                                            ff={ff}
                                        />
                                    </motion.div>
                                );
                            })}

                            {/* Mobile language switcher */}
                            <motion.div
                                custom={navLabels.length}
                                variants={itemVariants}
                                initial="hidden"
                                animate="visible"
                                style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}
                            >
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                    padding: '0.6rem 1.25rem',
                                    background: 'rgba(255,255,255,0.06)',
                                    borderRadius: 999,
                                    border: '1px solid rgba(255,255,255,0.08)',
                                }}>
                                    <LanguageSwitcher />
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                @media (max-width: 820px) {
                    .q-desk-nav { display: none !important; }
                    .q-desk-lang { display: none !important; }
                    .q-mob-hamburger { display: flex !important; }
                }
            `}</style>
        </>
    );
}