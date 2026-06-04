/**
 * @file HeroSection.jsx
 * @project Quantix — Intelligent Salla Store Management Platform
 *
 * Full-viewport hero section — the first thing visitors see on the landing page.
 *
 * Visual layers (bottom → top):
 *  1. **Parallax zoom background** — a purple gradient that scales from 1× to
 *     1.18× as the user scrolls through the section, driven by Framer Motion's
 *     `useScroll` + `useSpring` for a smooth, physics-based feel.
 *  2. **Noise overlay** — an inline SVG fractal-noise texture at low opacity
 *     to break up the flat gradient and add tactile depth.
 *  3. **Orbiting glow blobs** — two large radial-gradient circles that rotate
 *     in opposite directions indefinitely.
 *  4. **Content column** — fades out and translates upward as the user scrolls
 *     past 45% of the section height.
 *  5. **Curved SVG divider** — a white arc at the bottom that visually connects
 *     the hero into the next (white-background) section.
 *
 * The content column is a two-column grid:
 *  - Left  → headline (<SplitText>), subtitle, CTA button
 *  - Right → <HeroRight> floating widgets
 */

import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Link } from '@inertiajs/react';
import SplitText from '@/Components/ui/SplitText';
import HeroRight  from '@/Components/Welcome/hero/HeroRight';

/**
 * HeroSection
 *
 * Full-viewport hero with a parallax zoom background, split-text headline,
 * animated subtitle/CTA, and floating product widgets on the right.
 *
 * @param {object} props
 * @param {Function} props.t        - i18next translation function scoped to 'welcome'.
 * @param {string} props.ff         - CSS font-family string for headings / labels.
 * @param {string} props.bodyFont   - CSS font-family string for body copy.
 * @param {string} props.dir        - Text direction: `'ltr'` or `'rtl'`.
 * @param {number} props.NAV_H      - Navbar height in px; used as top padding
 *                                    so hero content clears the fixed bar.
 * @returns {JSX.Element}
 */
export default function HeroSection({ t, ff, bodyFont, dir, NAV_H }) {
    /** Ref attached to the section element so useScroll can track its progress. */
    const heroRef = useRef(null);

    /**
     * Track how far the user has scrolled through this section specifically.
     * `offset: ['start start', 'end start']` means:
     *  - 0  when the section's top aligns with the viewport top
     *  - 1  when the section's bottom aligns with the viewport top (fully scrolled past)
     */
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ['start start', 'end start'],
    });

    /* Background zooms from 1× → 1.18× as the user scrolls through the hero */
    const rawScale = useTransform(scrollYProgress, [0, 1], [1, 1.18]);

    /* Apply a spring to the scale for organic, physics-based easing */
    const scale    = useSpring(rawScale, { stiffness: 80, damping: 22 });

    /* Hero content fades + slides up as scroll progress approaches 60% */
    const contentY       = useTransform(scrollYProgress, [0, 0.6],  [0, -60]);
    const contentOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);

    return (
        <section
            ref={heroRef}
            style={{
                minHeight: '100vh',
                paddingTop: NAV_H,        // Offset for fixed navbar height
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',       // Clip zoomed background at section edges
                position: 'relative',
            }}
        >
            {/* ── Layer 1: Parallax zoom background (gradient) ── */}
            <motion.div
                style={{
                    position: 'absolute', inset: 0,
                    scale,                // Driven by scroll spring
                    background: `
                        radial-gradient(circle at 20% 30%, rgba(255,255,255,0.18) 0%, transparent 28%),
                        radial-gradient(circle at 80% 70%, rgba(255,255,255,0.10) 0%, transparent 24%),
                        linear-gradient(
                            135deg,
                            #8D82FF 0%,
                            #978DFF 22%,
                            #A39AFF 45%,
                            #9387FF 68%,
                            #B4ABFF 100%
                        )
                    `,
                    backgroundBlendMode: 'soft-light',
                    transformOrigin: 'center center',
                }}
            />

            {/* ── Layer 2: Noise texture overlay — adds grain for depth ── */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
                background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
                opacity: 0.4,
            }} />

            {/* ── Layer 3a: Clockwise orbiting glow blob (top-left) ── */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
                style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}
            >
                <div style={{
                    position: 'absolute', top: '12%', left: '8%',
                    width: 340, height: 340, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.13) 0%, transparent 70%)',
                    filter: 'blur(30px)',
                }} />
            </motion.div>

            {/* ── Layer 3b: Counter-clockwise orbiting glow blob (bottom-right) ── */}
            <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 34, repeat: Infinity, ease: 'linear' }}
                style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}
            >
                <div style={{
                    position: 'absolute', bottom: '18%', right: '6%',
                    width: 260, height: 260, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(168,85,247,0.22) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                }} />
            </motion.div>

            {/* ── Layer 4: Main content — fades + slides up on scroll ── */}
            <motion.div
                style={{ y: contentY, opacity: contentOpacity, position: 'relative', zIndex: 2, width: '100%' }}
            >
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem 5rem', width: '100%' }}>
                    <div
                        className="q-hero-grid"
                        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', alignItems: 'center' }}
                    >
                        {/* ── Left: text content ── */}
                        <div className="q-hero-text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>

                            {/* "NEW" feature badge — fades in first (lowest delay) */}
                            <motion.div
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                    background: 'rgba(255,255,255,0.12)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: 999,
                                    padding: '5px 14px 5px 8px',
                                    marginBottom: '1.25rem',
                                }}
                            >
                                {/* "NEW" pill */}
                                <span style={{
                                    background: '#A855F7', color: 'white',
                                    borderRadius: 999, padding: '2px 8px',
                                    fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
                                    fontFamily: "'Changa', sans-serif",
                                }}>
                                    NEW
                                </span>
                                {/* Badge label */}
                                <span style={{
                                    color: 'rgba(255,255,255,0.8)',
                                    fontSize: '0.78rem', fontFamily: ff, fontWeight: 600,
                                }}>
                                    Intelligent Salla Management
                                </span>
                            </motion.div>

                            {/* Main headline — uses <SplitText> for per-character stagger entrance */}
                            <h1 style={{
                                fontFamily: "'Changa', sans-serif",
                                fontSize: 'clamp(3rem, 7vw, 6rem)',
                                fontWeight: 800,
                                color: 'white',
                                letterSpacing: '0.06em',
                                lineHeight: 1,
                                marginBottom: '1.25rem',
                                direction: 'ltr', // Brand name always LTR
                            }}>
                                <SplitText text="QUANTIX" wordDelay={0.08} />
                            </h1>

                            {/* Sub-headline — delayed to appear after the headline completes */}
                            <motion.p
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.7, delay: 0.52, ease: [0.22, 1, 0.36, 1] }}
                                style={{
                                    fontFamily: bodyFont,
                                    fontSize: 'clamp(0.85rem, 1.3vw, 0.98rem)',
                                    color: 'rgba(255,255,255,0.62)',
                                    lineHeight: 1.8,
                                    marginBottom: '2rem',
                                    maxWidth: 420,
                                }}
                            >
                                {t('heroSub')}
                            </motion.p>

                            {/* CTA button group — last element to appear in the stagger sequence */}
                            <motion.div
                                className="q-hero-btns"
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.72, ease: [0.22, 1, 0.36, 1] }}
                                style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}
                            >
                                {/* Primary CTA — anchors to the Platforms section */}
                                <a
                                    href="#platforms"
                                    style={{
                                        padding: '0.75rem 1.75rem',
                                        background: '#0F0E17',
                                        color: 'white',
                                        borderRadius: 9,
                                        fontFamily: ff,
                                        fontSize: '0.85rem', fontWeight: 700,
                                        textDecoration: 'none',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                    }}
                                    /* Subtle lift + shadow on hover */
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.35)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = '';
                                        e.currentTarget.style.boxShadow = '';
                                    }}
                                >
                                    {t('exploreCta')}
                                </a>
                            </motion.div>
                        </div>

                        {/* ── Right: floating widget column ── */}
                        <div className="q-hero-visual">
                            <HeroRight t={t} />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── Layer 5: Curved SVG arc divider ── */}
            {/* Creates a smooth white wave that merges the hero into the next section */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                lineHeight: 0, zIndex: 3, pointerEvents: 'none',
            }}>
                <svg
                    viewBox="0 0 1440 72"
                    preserveAspectRatio="none"
                    style={{ display: 'block', width: '100%', height: 72 }}
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* Quadratic bezier arc: flat edges → dipped centre */}
                    <path d="M0,72 Q720,0 1440,72 L1440,72 L0,72 Z" fill="#ffffff" />
                </svg>
            </div>
        </section>
    );
}