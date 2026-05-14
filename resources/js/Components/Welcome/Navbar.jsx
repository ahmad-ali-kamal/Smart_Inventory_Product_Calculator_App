/**
 * @file Navbar.jsx
 * @project Quantix — Intelligent Salla Store Management Platform
 *
 * Fixed-position, scroll-aware navigation bar rendered at the top of every
 * guest-facing page. Key behaviours:
 *
 *  - **Hide on scroll-down / show on scroll-up** — the bar slides above the
 *    viewport when the user scrolls down (past 2× NAV_H) and reappears the
 *    moment they scroll back up. Animated via Framer Motion.
 *  - **Transparent → opaque** — the background transitions from fully
 *    transparent (at the page top) to a frosted-glass dark surface once the
 *    user has scrolled past the fold.
 *  - **Pill nav** — anchor links to page sections rendered in a rounded
 *    pill-style container; the first item carries an active-state indicator.
 *  - **Language switcher** — uses the shared <LanguageSwitcher> component to
 *    toggle between Arabic and English.
 */

import { useRef, useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import LanguageSwitcher from '@/Components/UI/LanguageSwitcher';

/** Ordered list of in-page anchor targets, aligned with t.nav labels. */
const NAV_ANCHORS = ['#features', '#platforms', '#stats'];

/**
 * Navbar
 *
 * Scroll-aware fixed navigation bar with hide-on-scroll, transparent-to-opaque
 * background transition, pill-style anchor links, and a language switcher.
 *
 * @param {object} props
 * @param {object}   props.t      - Current language translations.
 *   Expected shape: `{ nav: string[] }` — ordered array of nav link labels.
 * @param {string}   props.ff     - CSS font-family string for nav link text.
 * @param {string}   props.dir    - Text direction: `'ltr'` or `'rtl'`.
 * @param {number}   props.NAV_H  - Navbar height in px; used as the hide
 *                                  threshold (bar hides after scrolling 2× this value).
 * @returns {JSX.Element}
 */
export default function Navbar({ t, ff, dir, NAV_H }) {
    /** Whether the navbar is currently hidden (slid above viewport). */
    const [hidden, setHidden] = useState(false);

    /** Whether the page scroll position is at (or very near) the top. */
    const [atTop,  setAtTop]  = useState(true);

    /** Tracks the previous scroll Y position to determine scroll direction. */
    const lastY = useRef(0);

    useEffect(() => {
        /**
         * Passive scroll listener.
         * - Sets `atTop` to control the background transparency.
         * - Ignores micro-jitters smaller than 5 px.
         * - Hides the bar when scrolling DOWN past 2× NAV_H;
         *   reveals it when scrolling UP.
         */
        const onScroll = () => {
            const y = window.scrollY;

            // Update transparent-background flag
            setAtTop(y < 10);

            // Ignore tiny scroll deltas to avoid jitter
            if (Math.abs(y - lastY.current) < 5) return;

            // Hide when scrolling down past the threshold; show when scrolling up
            setHidden(y > lastY.current && y > NAV_H * 2);
            lastY.current = y;
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [NAV_H]);

    return (
        /* Slide the entire header off-screen via `y` when `hidden` is true */
        <motion.header
            animate={{ y: hidden ? -NAV_H - 4 : 0 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                height: NAV_H,
                backdropFilter: 'blur(20px)',
                /* Transparent at top → frosted dark when scrolled */
                background: atTop ? 'rgba(10, 5, 30, 0.0)' : 'rgba(10, 5, 30, 0.72)',
                borderBottom: atTop ? '1px solid transparent' : '1px solid rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'center',
                transition: 'background 0.4s, border-color 0.4s',
            }}
        >
            <div style={{
                maxWidth: 1100, margin: '0 auto', width: '100%', padding: '0 1.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                direction: 'ltr', // Inner layout always LTR for consistent logo/nav/lang order
            }}>

                {/* ── Logo: slides in from the left on mount ── */}
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

                {/* ── Pill nav: anchor links drop in from the top on mount ── */}
                <motion.nav
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        display: 'flex', alignItems: 'center',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 999, padding: '3px',
                        direction: dir, // Respect locale direction inside the pill
                    }}
                >
                    {t.nav.map((item, i) => (
                        <a
                            key={i}
                            href={NAV_ANCHORS[i]}
                            style={{
                                padding: '6px 16px',
                                /* First item acts as the "active" indicator */
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
                            {/* Active dot indicator on the first nav item */}
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

                {/* ── Language switcher: slides in from the right on mount ── */}
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