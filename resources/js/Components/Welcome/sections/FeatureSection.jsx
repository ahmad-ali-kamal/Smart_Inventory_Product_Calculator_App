import { motion } from 'framer-motion';
import { Settings2, Clock, TrendingUp } from 'lucide-react';
import Reveal from '@/Components/ui/Reveal';

const FEATURE_ICONS = [
    { Icon: Settings2,  iconBg: '#EDE9FE', iconColor: '#7C3AED' },
    { Icon: Clock,      iconBg: '#CCFBF1', iconColor: '#0D9488' },
    { Icon: TrendingUp, iconBg: '#DCFCE7', iconColor: '#15803D' },
];

/**
 * Scroll-reveal three-column features grid.
 *
 * @param {object} t        - Current language translations
 * @param {string} ff       - Heading font family string
 * @param {string} bodyFont - Body font family string
 */
export default function FeaturesSection({ t, ff, bodyFont }) {
    return (
        <section id="features" style={{ background: '#FFFFFF', padding: '4rem 1.5rem' }}>
            <div style={{ maxWidth: 960, margin: '0 auto' }}>

                {/* Section label */}
                <Reveal>
                    <div style={{ textAlign: 'center', marginBottom: '2.75rem' }}>
                        <p style={{
                            fontFamily: ff,
                            fontSize: '0.78rem', fontWeight: 800,
                            letterSpacing: '0.18em', color: '#6B7280',
                            marginBottom: '0.5rem',
                        }}>
                            {t.featuresLabel}
                        </p>
                        <div style={{
                            width: 50, height: 3,
                            background: 'linear-gradient(90deg, #7C3AED, #A855F7)',
                            borderRadius: 2, margin: '0 auto',
                        }} />
                    </div>
                </Reveal>

                {/* Cards grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '1.5rem',
                }}>
                    {t.features.map((feat, i) => {
                        const { Icon, iconBg, iconColor } = FEATURE_ICONS[i];
                        return (
                            <Reveal key={i} delay={i * 0.12} direction="up">
                                <motion.div
                                    whileHover={{ y: -6, boxShadow: '0 12px 32px rgba(124,58,237,0.12)' }}
                                    transition={{ duration: 0.28, ease: 'easeOut' }}
                                    style={{
                                        border: '1px solid #F3F4F6', borderRadius: 18,
                                        padding: '1.75rem 1.5rem',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                                        background: 'white',
                                        cursor: 'default',
                                        height: '100%',
                                    }}
                                >
                                    {/* Icon */}
                                    <div style={{
                                        width: 46, height: 46, borderRadius: 12,
                                        background: iconBg,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        marginBottom: '1rem',
                                    }}>
                                        <Icon size={22} color={iconColor} />
                                    </div>

                                    <h3 style={{
                                        fontFamily: ff,
                                        fontSize: '1rem', fontWeight: 800, color: '#111827',
                                        marginBottom: '0.5rem',
                                    }}>
                                        {feat.title}
                                    </h3>

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