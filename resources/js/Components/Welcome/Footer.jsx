/**
 * @file Footer.jsx
 * @project Quantix — Intelligent Salla Store Management Platform
 *
 * Site-wide footer rendered at the bottom of the public landing page.
 * Composed of a brand column (logo + short description) and three
 * navigation link columns (Product, Company, Support).
 *
 * All copy is supplied via the `t` translation object, making it trivial
 * to switch between Arabic and English without touching this file.
 *
 * Scroll-reveal animation is handled by the shared <Reveal> utility.
 */

import Reveal from '@/Components/ui/Reveal';
import { Link } from '@inertiajs/react';

/**
 * Footer
 *
 * Site footer with a brand column and three link columns.
 * Renders inside a centred max-width container with a top border divider.
 *
 * @param {object} props
 * @param {Function} props.t - i18next translation function scoped to 'welcome'.
 * @param {string} props.ff         - CSS font-family string for headings and labels.
 * @param {string} props.bodyFont   - CSS font-family string for body / paragraph copy.
 * @returns {JSX.Element}
 */
export default function Footer({ t, ff, bodyFont, dir }) {

    return (
        <footer
            id="stats"
            style={{
                background: '#ffffff',
                borderTop: '1px solid #E5E7EB',
                padding: '3rem 1.5rem 1.75rem',
                color: '#1A1A1A',
            }}
        >
            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(0.75rem, 2vw, 1.5rem)' }}>

                {/* ── Main grid: brand column + three link columns ── */}
                <Reveal>
                    <div
                        className="q-footer-grid"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(200px, 280px) 1fr 1fr',
                            gap: 'clamp(1.5rem, 3vw, 3rem)',
                            marginBottom: '2.5rem',
                            flexWrap: 'wrap',
                        }}
                    >
                        {/* ── Brand column: logo + tagline ── */}
                        <div className="q-footer-brand">
                            <div style={{
                                display: 'flex', alignItems: 'center',
                                gap: 9, marginBottom: '0.75rem',
                                direction: 'ltr', // Logo lockup always LTR
                                justifyContent: dir === 'rtl' ? 'flex-end' : 'flex-start',
                            }}>
                                <img src={"/logos/Quantix_logo.png"} alt="Quantix" style={{ height: 36 }} />
                                <span style={{
                                    fontFamily: "'Changa', sans-serif",
                                    fontSize: '1.15rem', fontWeight: 800,
                                    letterSpacing: '0.08em', color: '#1A1A1A',
                                }}>
                                    QUANTIX
                                </span>
                            </div>

                            {/* Short brand description from translations */}
                            <p style={{
                                fontFamily: bodyFont,
                                fontSize: 'clamp(0.75rem, 0.9vw, 0.85rem)', color: '#6B7280', lineHeight: 1.7,
                            }}>
                                {t('footer.desc')}
                            </p>
                        </div>

                        {/* ── Link columns ── */}
                        <nav aria-label={dir === 'rtl' ? 'روابط المنصات' : 'Platform links'}>
                            <h4 style={{
                                fontFamily: ff,
                                fontSize: 'clamp(0.65rem, 0.8vw, 0.75rem)', fontWeight: 800,
                                letterSpacing: '0.14em', color: '#9CA3AF',
                                marginBottom: '1rem',
                            }}>
                                {t('footer.platformsLabel')}
                            </h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                <li>
                                    <Link
                                        href="/harees/login"
                                        style={{
                                            fontFamily: bodyFont,
                                            fontSize: 'clamp(0.8rem, 1vw, 0.9rem)', color: '#4B5563',
                                            textDecoration: 'none', transition: 'color 0.2s',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.color = '#7C3AED')}
                                        onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}
                                    >
                                        {t('footer.hareesLink')}
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/mustashar/login"
                                        style={{
                                            fontFamily: bodyFont,
                                            fontSize: 'clamp(0.8rem, 1vw, 0.9rem)', color: '#4B5563',
                                            textDecoration: 'none', transition: 'color 0.2s',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.color = '#7C3AED')}
                                        onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}
                                    >
                                        {t('footer.mustasharLink')}
                                    </Link>
                                </li>
                            </ul>
                        </nav>
                        <nav aria-label={dir === 'rtl' ? 'روابط سريعة' : 'Quick links'}>
                            <h4 style={{
                                fontFamily: ff,
                                fontSize: 'clamp(0.65rem, 0.8vw, 0.75rem)', fontWeight: 800,
                                letterSpacing: '0.14em', color: '#9CA3AF',
                                marginBottom: '1rem',
                            }}>
                                {t('footer.quickLinksLabel')}
                            </h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                <li>
                                    <a
                                        href="#features"
                                        style={{
                                            fontFamily: bodyFont,
                                            fontSize: 'clamp(0.8rem, 1vw, 0.9rem)', color: '#4B5563',
                                            textDecoration: 'none', transition: 'color 0.2s',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.color = '#7C3AED')}
                                        onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}
                                    >
                                        {t('footer.featuresLink')}
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#platforms"
                                        style={{
                                            fontFamily: bodyFont,
                                            fontSize: 'clamp(0.8rem, 1vw, 0.9rem)', color: '#4B5563',
                                            textDecoration: 'none', transition: 'color 0.2s',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.color = '#7C3AED')}
                                        onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}
                                    >
                                        {t('footer.platformsLink')}
                                    </a>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </Reveal>

                {/* ── Divider ── */}
                <div style={{ height: 1, background: '#E5E7EB', marginBottom: '1.25rem' }} />

                {/* ── Copyright notice ── */}
                <p style={{
                    textAlign: 'center',
                    fontFamily: bodyFont,
                    fontSize: 'clamp(0.72rem, 0.85vw, 0.82rem)', color: '#9CA3AF',
                }}>
                    {t('footer.copyright')}
                </p>
            </div>
        </footer>
    );
}