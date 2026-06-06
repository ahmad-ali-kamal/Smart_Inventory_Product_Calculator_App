/**
 * @file PlatformsSection.jsx
 * @description Renders the "Platforms" marketing section for the Mustashar & Harees
 *   landing page. Displays two side-by-side product cards — one for each platform —
 *   each containing a screenshot, feature checklist, and a CTA login link.
 *
 *   Consumed by the main landing-page layout and driven entirely by the `t`
 *   translations prop, making it locale-agnostic.
 *
 * @module PlatformsSection
 */

import { motion } from 'framer-motion';
import { Link } from '@inertiajs/react';
import { ShoppingBag, CheckCircle2 } from 'lucide-react';
import Reveal from '@/Components/ui/Reveal';

// ---------------------------------------------------------------------------
// Hardcoded UI strings (not driven by the `t` prop).
// Move these values into your i18n JSON file and delete this object once ready.
// ---------------------------------------------------------------------------
/** @type {object} Static strings used internally by PlatformsSection. */
const t_static = {
    /** Arrow character appended to every CTA button label. */
    ctaArrow: '→',
};

/* ─────────────────────────────────────────────
   PlatformCard
   Individual platform card with image, feature list, and CTA link.
───────────────────────────────────────────── */

/**
 * @typedef {object} PlatformData
 * @property {string}   name      - Display name of the platform.
 * @property {string}   desc      - Short marketing description.
 * @property {string[]} features  - Bullet-point feature list.
 * @property {string}   cta       - Label for the call-to-action button.
 */

/**
 * PlatformCard
 *
 * Displays a single platform's branding, description, screenshot, feature
 * checklist, and a login CTA. Lifts slightly on hover via Framer Motion.
 *
 * @param {object}       props
 * @param {PlatformData} props.data        - Platform content (name, desc, features, cta).
 * @param {string}       props.imgSrc      - Absolute or relative URL for the platform screenshot.
 * @param {string}       props.accentColor - Hex colour used for the icon, heading, and checkmarks.
 * @param {string}       props.loginUrl    - Inertia `href` target for the CTA button.
 * @param {string}       props.ff          - CSS font-family string applied to headings and CTA.
 * @param {string}       props.bodyFont    - CSS font-family string applied to body text and feature list.
 * @returns {JSX.Element}
 */
function PlatformCard({ data, imgSrc, accentColor, loginUrl, ff, bodyFont }) {
    return (
        <motion.div
            /* Subtle lift + shadow on hover to draw attention to the active card */
            whileHover={{ y: -5, boxShadow: '0 20px 48px rgba(124,58,237,0.13)' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
                border: '1px solid #E5E7EB', borderRadius: 18,
                background: 'white', padding: '1.5rem', cursor: 'default',
            }}
        >
            {/* ── Header: tinted icon badge + platform name ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
                {/* Icon badge — background opacity derived from accentColor + '18' (hex alpha) */}
                <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: accentColor + '18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <ShoppingBag size={18} color={accentColor} />
                </div>

                {/* Platform name */}
                <h3 style={{ fontFamily: ff, fontSize: '1.2rem', fontWeight: 800, color: accentColor }}>
                    {data.name}
                </h3>
            </div>

            {/* ── Short marketing description ── */}
            <p style={{
                fontFamily: bodyFont,
                fontSize: '0.84rem', color: '#6B7280', lineHeight: 1.7,
                marginBottom: '1rem',
            }}>
                {data.desc}
            </p>

            {/* ── Platform screenshot ── */}
            <div style={{
                borderRadius: 10, overflow: 'hidden',
                marginBottom: '1.25rem',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            }}>
                <img src={imgSrc} alt={data.name} style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
            </div>

            {/* ── Feature checklist ── */}
            <ul style={{
                listStyle: 'none', padding: 0,
                margin: '0 0 1.25rem',
                display: 'flex', flexDirection: 'column', gap: 8,
            }}>
                {/* Each feature rendered with a coloured checkmark icon */}
                {data.features.map((feat, i) => (
                    <li key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        fontFamily: bodyFont, fontSize: '0.84rem', color: '#374151',
                    }}>
                        <CheckCircle2 size={15} color={accentColor} style={{ flexShrink: 0 }} />
                        {feat}
                    </li>
                ))}
            </ul>

            {/* ── Call-to-action: navigates to the platform's login page ── */}
            <Link
                href={loginUrl}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '0.65rem 1.25rem',
                    background: '#0F0E17', color: 'white',
                    borderRadius: 9, fontFamily: ff,
                    fontSize: '0.85rem', fontWeight: 700,
                    textDecoration: 'none',
                    transition: 'opacity 0.2s',
                }}
                /* Dim button slightly on hover for tactile feedback */
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
                {data.cta} {t_static.ctaArrow}
            </Link>
        </motion.div>
    );
}

/* ─────────────────────────────────────────────
   PlatformsSection
   Section wrapper with header and two PlatformCards.
───────────────────────────────────────────── */

/**
 * PlatformsSection
 *
 * Top-level section that presents the two core platforms — Harees and Mustashar —
 * side by side. The section header is driven by `t.pillarsLabel`, `t.pillarsTitle`,
 * and `t.pillarsDesc`. Each card receives its own translation slice (`t.harees` /
 * `t.mustashar`) along with static asset URLs and login routes.
 *
 * Wrapped in a light-grey background (`#F9FAFB`) to visually separate it from the
 * adjacent white sections.
 *
 * @param {object} props
 * @param {Function} props.t - i18next translation function scoped to 'welcome'.
 * @param {string} props.ff       - CSS font-family string for headings.
 * @param {string} props.bodyFont - CSS font-family string for body / descriptive text.
 * @returns {JSX.Element}
 */
export default function PlatformsSection({ t, ff, bodyFont }) {
    return (
        <section id="platforms" style={{ background: '#F9FAFB', padding: '4rem 1.5rem' }}>
            <div style={{ maxWidth: 960, margin: '0 auto' }}>

                {/* ── Section header: eyebrow label → h2 → supporting copy ── */}
                <Reveal>
                    {/* Decorated eyebrow: horizontal rules flanking a label */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '1.25rem',
                        justifyContent: 'center', marginBottom: '1.25rem',
                    }}>
                        {/* Left rule */}
                        <div style={{ flex: 1, height: 1, background: '#D1D5DB', maxWidth: 160 }} />

                        {/* Eyebrow label — sourced from translations */}
                        <span style={{
                            fontFamily: ff,
                            fontSize: '0.7rem', fontWeight: 800,
                            letterSpacing: '0.2em', color: '#7C3AED', whiteSpace: 'nowrap',
                        }}>
                            — {t('pillarsLabel')} —
                        </span>

                        {/* Right rule */}
                        <div style={{ flex: 1, height: 1, background: '#D1D5DB', maxWidth: 160 }} />
                    </div>

                    {/* Main section heading */}
                    <h2 style={{
                        textAlign: 'center', fontFamily: ff,
                        fontSize: 'clamp(1.6rem, 3vw, 2.25rem)',
                        fontWeight: 800, color: '#111827', marginBottom: '0.75rem',
                    }}>
                        {t('pillarsTitle')}
                    </h2>

                    {/* Supporting description */}
                    <p style={{
                        textAlign: 'center', fontFamily: bodyFont,
                        fontSize: '0.9rem', color: '#6B7280',
                        maxWidth: 500, margin: '0 auto 2.75rem',
                    }}>
                        {t('pillarsDesc')}
                    </p>
                </Reveal>

                {/* ── Platform cards grid: auto-fills to 1 or 2 columns ── */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1.5rem',
                }}>
                    {/* Harees platform card — slides in from the left */}
                    <Reveal delay={0.08} direction="left">
                        <PlatformCard
                            data={t('harees', { returnObjects: true })}
                            imgSrc={"https://res.cloudinary.com/dj0kywi0q/image/upload/q_auto/f_auto/v1780735836/harees_hpofio.webp"}
                            accentColor="#7C3AED"
                            loginUrl="/harees/login"
                            ff={ff}
                            bodyFont={bodyFont}
       
                        />
                    </Reveal>

                    {/* Mustashar platform card — slides in from the right */}
                    <Reveal delay={0.18} direction="right">
                        <PlatformCard
                            data={t('mustashar', { returnObjects: true })}
                            imgSrc={"https://res.cloudinary.com/dj0kywi0q/image/upload/q_auto/f_auto/v1780735847/mustashar_rnzybq.webp"}
                            accentColor="#7C3AED"
                            loginUrl="/mustashar/login"
                            ff={ff}
                            bodyFont={bodyFont}
    
                        />
                    </Reveal>
                </div>
            </div>
        </section>
    );
}