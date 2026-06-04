/**
 * @file FeaturesSection.jsx
 * @description Renders the "Features" marketing section for the Mustashar & Harees
 *   landing page. Displays up to three feature cards in a responsive grid, each
 *   paired with a colour-coded icon, a heading, and a short description.
 *
 *   Card content is driven entirely by `t.features` (an array), making the
 *   component fully locale-agnostic. Icon styles are hard-wired in FEATURE_ICONS
 *   and matched to cards by array index.
 *
 * @module FeaturesSection
 */

import { motion } from 'framer-motion';
import { Settings2, Clock, TrendingUp } from 'lucide-react';
import Reveal from '@/Components/ui/Reveal';

// ---------------------------------------------------------------------------
// Icon + colour palette for each feature card.
// Indices must align with the `t.features` array supplied by the parent.
// To add a fourth card, append a new entry here AND add a matching item in
// the translations JSON.
// ---------------------------------------------------------------------------
/**
 * @typedef {object} FeatureIconConfig
 * @property {React.ElementType} Icon      - Lucide icon component to render.
 * @property {string}            iconBg    - Background hex colour for the icon badge.
 * @property {string}            iconColor - Foreground hex colour for the icon itself.
 */

/** @type {FeatureIconConfig[]} */
const FEATURE_ICONS = [
    { Icon: Settings2,  iconBg: '#EDE9FE', iconColor: '#7C3AED' }, // card 0 — violet (settings/config)
    { Icon: Clock,      iconBg: '#CCFBF1', iconColor: '#0D9488' }, // card 1 — teal   (time/scheduling)
    { Icon: TrendingUp, iconBg: '#DCFCE7', iconColor: '#15803D' }, // card 2 — green  (growth/analytics)
];

/**
 * FeaturesSection
 *
 * Scroll-reveal three-column features grid. Each column lifts on hover and
 * enters the viewport with a staggered upward animation (via `Reveal`).
 *
 * The section expects exactly three items in `t.features`; if more are
 * provided, they will render without a paired icon and throw an array
 * out-of-bounds warning in development.
 *
 * @param {object}   props
 * @param {Function} props.t - i18next translation function scoped to 'welcome'.
 * @param {string}   props.ff         - CSS font-family string applied to headings and the eyebrow label.
 * @param {string}   props.bodyFont   - CSS font-family string applied to feature descriptions.
 * @returns {JSX.Element}
 */
export default function FeaturesSection({ t, ff, bodyFont }) {
    return (
        <section id="features" style={{ background: '#FFFFFF', padding: '4rem 1.5rem' }}>
            <div style={{ maxWidth: 960, margin: '0 auto' }}>

                {/* ── Section label: uppercase eyebrow + accent underline bar ── */}
                <Reveal>
                    <div style={{ textAlign: 'center', marginBottom: '2.75rem' }}>
                        {/* Eyebrow label — sourced from translations */}
                        <p style={{
                            fontFamily: ff,
                            fontSize: '0.78rem', fontWeight: 800,
                            letterSpacing: '0.18em', color: '#6B7280',
                            marginBottom: '0.5rem',
                        }}>
                            {t('featuresLabel')}
                        </p>

                        {/* Decorative gradient underline beneath the label */}
                        <div style={{
                            width: 50, height: 3,
                            background: 'linear-gradient(90deg, #7C3AED, #A855F7)',
                            borderRadius: 2, margin: '0 auto',
                        }} />
                    </div>
                </Reveal>

                {/* ── Feature cards grid: auto-fills to 1–3 columns depending on viewport ── */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '1.5rem',
                }}>
                    {/*
                     * Map over translation feature items.
                     * Each card is staggered by 120 ms (i * 0.12) and animates upward.
                     * Icon config is retrieved from FEATURE_ICONS by matching index.
                     */}
                    {t('features', { returnObjects: true }).map((feat, i) => {
                        /* Destructure icon component and its colour tokens for this card */
                        const { Icon, iconBg, iconColor } = FEATURE_ICONS[i];

                        return (
                            <Reveal key={i} delay={i * 0.12} direction="up">
                                {/* Card lifts 6 px and gains a coloured shadow on hover */}
                                <motion.div
                                    whileHover={{ y: -6, boxShadow: '0 12px 32px rgba(124,58,237,0.12)' }}
                                    transition={{ duration: 0.28, ease: 'easeOut' }}
                                    style={{
                                        border: '1px solid #F3F4F6', borderRadius: 18,
                                        padding: '1.75rem 1.5rem',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                                        background: 'white',
                                        cursor: 'default',
                                        height: '100%', // ensures equal-height cards in the grid row
                                    }}
                                >
                                    {/* ── Coloured icon badge ── */}
                                    <div style={{
                                        width: 46, height: 46, borderRadius: 12,
                                        background: iconBg,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: '1rem',
                                    }}>
                                        <Icon size={22} color={iconColor} />
                                    </div>

                                    {/* ── Feature heading — sourced from translations ── */}
                                    <h3 style={{
                                        fontFamily: ff,
                                        fontSize: '1rem', fontWeight: 800, color: '#111827',
                                        marginBottom: '0.5rem',
                                    }}>
                                        {feat.title}
                                    </h3>

                                    {/* ── Feature description — sourced from translations ── */}
                                    <p style={{
                                        fontFamily: bodyFont,
                                        fontSize: '0.84rem', color: '#6B7280', lineHeight: 1.7,
                                    }}>
                                        {feat.desc}
                                    </p>
                                </motion.div>
                            </Reveal>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}