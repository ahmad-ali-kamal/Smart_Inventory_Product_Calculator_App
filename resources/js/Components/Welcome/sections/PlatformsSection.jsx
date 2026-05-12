import { motion } from 'framer-motion';
import { Link } from '@inertiajs/react';
import { ShoppingBag, CheckCircle2 } from 'lucide-react';
import Reveal from '@/Components/ui/Reveal';

/* ─────────────────────────────────────────────
   PlatformCard
   Individual platform card with image, feature list, and CTA link.
───────────────────────────────────────────── */
function PlatformCard({ data, imgSrc, accentColor, loginUrl, ff, bodyFont }) {
    return (
        <motion.div
            whileHover={{ y: -5, boxShadow: '0 20px 48px rgba(124,58,237,0.13)' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
                border: '1px solid #E5E7EB', borderRadius: 18,
                background: 'white', padding: '1.5rem', cursor: 'default',
            }}
        >
            {/* Header */}
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

            {/* Description */}
            <p style={{
                fontFamily: bodyFont,
                fontSize: '0.84rem', color: '#6B7280', lineHeight: 1.7,
                marginBottom: '1rem',
            }}>
                {data.desc}
            </p>

            {/* Screenshot */}
            <div style={{
                borderRadius: 10, overflow: 'hidden',
                marginBottom: '1.25rem',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            }}>
                <img src={imgSrc} alt={data.name} style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
            </div>

            {/* Feature list */}
            <ul style={{
                listStyle: 'none', padding: 0,
                margin: '0 0 1.25rem',
                display: 'flex', flexDirection: 'column', gap: 8,
            }}>
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

            {/* CTA */}
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
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
                {data.cta} →
            </Link>
        </motion.div>
    );
}

/* ─────────────────────────────────────────────
   PlatformsSection
   Section wrapper with header and two PlatformCards.
───────────────────────────────────────────── */
export default function PlatformsSection({ t, ff, bodyFont }) {
    return (
        <section id="platforms" style={{ background: '#F9FAFB', padding: '4rem 1.5rem' }}>
            <div style={{ maxWidth: 960, margin: '0 auto' }}>

                {/* Section header */}
                <Reveal>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '1.25rem',
                        justifyContent: 'center', marginBottom: '1.25rem',
                    }}>
                        <div style={{ flex: 1, height: 1, background: '#D1D5DB', maxWidth: 160 }} />
                        <span style={{
                            fontFamily: ff,
                            fontSize: '0.7rem', fontWeight: 800,
                            letterSpacing: '0.2em', color: '#7C3AED', whiteSpace: 'nowrap',
                        }}>
                            — {t.pillarsLabel} —
                        </span>
                        <div style={{ flex: 1, height: 1, background: '#D1D5DB', maxWidth: 160 }} />
                    </div>

                    <h2 style={{
                        textAlign: 'center', fontFamily: ff,
                        fontSize: 'clamp(1.6rem, 3vw, 2.25rem)',
                        fontWeight: 800, color: '#111827', marginBottom: '0.75rem',
                    }}>
                        {t.pillarsTitle}
                    </h2>

                    <p style={{
                        textAlign: 'center', fontFamily: bodyFont,
                        fontSize: '0.9rem', color: '#6B7280',
                        maxWidth: 500, margin: '0 auto 2.75rem',
                    }}>
                        {t.pillarsDesc}
                    </p>
                </Reveal>

                {/* Platform cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1.5rem',
                }}>
                    <Reveal delay={0.08} direction="left">
                        <PlatformCard
                            data={t.harees}
                            imgSrc="/images/hareesDashboard.png"
                            accentColor="#7C3AED"
                            loginUrl="/harees/login"
                            ff={ff}
                            bodyFont={bodyFont}
                        />
                    </Reveal>

                    <Reveal delay={0.18} direction="right">
                        <PlatformCard
                            data={t.mustashar}
                            imgSrc="/images/mustasharSettings.png"
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