import { useRef, useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import LanguageSwitcher from '@/Components/LanguageSwitcher';

const NAV_ANCHORS = ['#features', '#platforms', '#stats'];

/**
 * Scroll-aware navbar that hides on scroll-down and shows on scroll-up.
 * Becomes opaque once the user has scrolled past the navbar height.
 *
 * @param {object} t      - Current language translations
 * @param {string} ff     - Heading font family string
 * @param {string} dir    - Text direction ('ltr' | 'rtl')
 * @param {number} NAV_H  - Navbar height in px (used for hide threshold)
 */
export default function Navbar({ t, ff, dir, NAV_H }) {
    const [hidden, setHidden] = useState(false);
    const [atTop,  setAtTop]  = useState(true);
    const lastY = useRef(0);

    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY;
            setAtTop(y < 10);
            if (Math.abs(y - lastY.current) < 5) return;
            setHidden(y > lastY.current && y > NAV_H * 2);
            lastY.current = y;
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [NAV_H]);

    return (
        <motion.header
            animate={{ y: hidden ? -NAV_H - 4 : 0 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                height: NAV_H,
                backdropFilter: 'blur(20px)',
                background: atTop ? 'rgba(10, 5, 30, 0.0)' : 'rgba(10, 5, 30, 0.72)',
                borderBottom: atTop ? '1px solid transparent' : '1px solid rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'center',
                transition: 'background 0.4s, border-color 0.4s',
            }}
        >
            <div style={{
                maxWidth: 1100, margin: '0 auto', width: '100%', padding: '0 1.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                direction: 'ltr',
            }}>
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
                        <img src="/images/Quantix_logo.png" alt="Quantix" style={{ height: 30 }} />
                        <span style={{
                            fontFamily: "'Changa', sans-serif",
                            fontSize: '1.1rem', fontWeight: 800,
                            letterSpacing: '0.08em', color: 'white',
                        }}>
                            QUANTIX
                        </span>
                    </Link>
                </motion.div>

                {/* Nav links */}
                <motion.nav
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
                >
                    {t.nav.map((item, i) => (
                        <a
                            key={i}
                            href={NAV_ANCHORS[i]}
                            style={{
                                padding: '6px 16px',
                                color: i === 0 ? 'white' : 'rgba(255,255,255,0.5)',
                                textDecoration: 'none',
                                fontFamily: ff,
                                fontSize: '0.82rem', fontWeight: 600,
                                borderRadius: 999,
                                display: 'flex', alignItems: 'center', gap: 5,
                                background: i === 0 ? 'rgba(255,255,255,0.1)' : 'transparent',
                                transition: 'color 0.2s, background 0.2s',
                            }}
                        >
                            {i === 0 && (
                                <span style={{
                                    width: 5, height: 5, borderRadius: '50%',
                                    background: '#A855F7', flexShrink: 0,
                                }} />
                            )}
                            {item}
                        </a>
                    ))}
                </motion.nav>

                {/* Language switcher */}
                <motion.div
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                >
                    <LanguageSwitcher />
                </motion.div>
            </div>
        </motion.header>
    );
}