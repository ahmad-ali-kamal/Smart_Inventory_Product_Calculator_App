import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useLang } from '@/hooks/useLang';
import { useFonts } from '@/hooks/useFonts';
import GuestLayout from '@/Layouts/GuestLayout';
import Navbar from '@/Components/Welcome/Navbar';
import Footer from '@/Components/Welcome/Footer';
import Reveal from '@/Components/UI/Reveal';
import globalStyles from '@/styles/globalStyles';
import { Shield, ChevronRight, Mail } from 'lucide-react';

const NAV_H = 58;

export default function PrivacyPolicy() {
    const { dir } = useLang();
    const { t } = useTranslation('privacy');
    const { t: tw } = useTranslation('welcome');
    const { ff, bodyFont } = useFonts();

    const sections = t('sections', { returnObjects: true });
    const emails = t('contactEmails', { returnObjects: true });

    return (
        <>
            <Head title={t('metaTitle')}>
                <meta name="description" content={t('metaDescription')} />
                <meta property="og:title" content={t('metaTitle')} />
                <meta property="og:description" content={t('metaDescription')} />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://quantixapp.dev/privacy-policy" />
                <link rel="canonical" href="https://quantixapp.dev/privacy-policy" />
            </Head>
            <style>{globalStyles}</style>

            <Navbar t={tw} ff={ff} dir={dir} NAV_H={NAV_H} />

            <main dir={dir}>
                {/* ── Page Hero ── */}
                <section style={{
                    paddingTop: NAV_H,
                    position: 'relative',
                    overflow: 'hidden',
                    background: `
                        radial-gradient(circle at 20% 30%, rgba(255,255,255,0.15) 0%, transparent 28%),
                        radial-gradient(circle at 80% 70%, rgba(255,255,255,0.10) 0%, transparent 24%),
                        linear-gradient(135deg, #8D82FF 0%, #978DFF 22%, #A39AFF 45%, #9387FF 68%, #B4ABFF 100%)
                    `,
                }}>
                    <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`, opacity: 0.4 }} />
                    <div style={{ position: 'relative', zIndex: 2, maxWidth: 860, margin: '0 auto', padding: 'clamp(3.5rem, 6vw, 5.5rem) clamp(1rem, 3vw, 2rem)' }}>
                        <Reveal>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10,
                                    background: 'rgba(255,255,255,0.18)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Shield size={20} color="white" />
                                </div>
                                <span style={{
                                    fontFamily: ff, fontSize: 'clamp(0.7rem, 0.9vw, 0.8rem)',
                                    fontWeight: 700, letterSpacing: '0.18em',
                                    color: 'rgba(255,255,255,0.7)',
                                }}>
                                    {t('lastUpdated')}
                                </span>
                            </div>
                            <h1 style={{
                                fontFamily: "'Changa', sans-serif",
                                fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
                                fontWeight: 800, color: 'white',
                                letterSpacing: '0.04em',
                                marginBottom: '1rem',
                            }}>
                                {t('title')}
                            </h1>
                            <p style={{
                                fontFamily: bodyFont,
                                fontSize: 'clamp(0.9rem, 1.2vw, 1.05rem)',
                                color: 'rgba(255,255,255,0.7)',
                                lineHeight: 1.7,
                                maxWidth: 600,
                            }}>
                                {t('metaDescription')}
                            </p>
                        </Reveal>
                    </div>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0, zIndex: 3, pointerEvents: 'none' }}>
                        <svg viewBox="0 0 1440 56" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 56 }} xmlns="http://www.w3.org/2000/svg">
                            <path d="M0,56 Q720,0 1440,56 L1440,56 L0,56 Z" fill="var(--q-bg)" />
                        </svg>
                    </div>
                </section>

                {/* ── Content Sections ── */}
                <section style={{
                    background: 'var(--q-bg)',
                    padding: 'clamp(2.5rem, 5vw, 4rem) clamp(1rem, 3vw, 2rem)',
                }}>
                    <div style={{ maxWidth: 860, margin: '0 auto' }}>
                        {sections.map((section, i) => (
                            <Reveal key={i} delay={i * 0.03} direction="up">
                                <div style={{
                                    background: 'var(--q-card)',
                                    border: '1px solid var(--q-card-border)',
                                    borderRadius: 16,
                                    padding: '1.75rem 2rem',
                                    marginBottom: '1rem',
                                    boxShadow: 'var(--q-card-shadow)',
                                    transition: 'box-shadow 0.2s',
                                }}
                                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(124,58,237,0.12)')}
                                    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--q-card-shadow)')}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: 8,
                                            background: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0, marginTop: 2,
                                        }}>
                                            <ChevronRight size={16} color="#7C3AED" style={{
                                                transform: dir === 'rtl' ? 'rotate(180deg)' : 'rotate(0deg)',
                                            }} />
                                        </div>
                                        <div>
                                            <h2 style={{
                                                fontFamily: ff,
                                                fontSize: 'clamp(1rem, 1.3vw, 1.1rem)',
                                                fontWeight: 700, color: '#1F2937',
                                                marginBottom: '0.5rem',
                                            }}>
                                                {section.title}
                                            </h2>
                                            <p style={{
                                                fontFamily: bodyFont,
                                                fontSize: 'clamp(0.82rem, 0.95vw, 0.88rem)',
                                                color: '#4B5563',
                                                lineHeight: 1.8,
                                            }}>
                                                {section.body}
                                            </p>

                                            {i === sections.length - 1 && (
                                                <div style={{
                                                    marginTop: '1rem',
                                                    display: 'flex', flexDirection: 'column', gap: '0.6rem',
                                                }}>
                                                    {emails.map((item, j) => (
                                                        <div key={j} style={{
                                                            display: 'flex', alignItems: 'center', gap: 10,
                                                            padding: '0.6rem 1rem',
                                                            background: 'var(--q-bg)',
                                                            borderRadius: 10,
                                                            border: '1px solid var(--q-card-border)',
                                                        }}>
                                                            <div style={{
                                                                width: 32, height: 32, borderRadius: 8,
                                                                background: '#EDE9FE',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                flexShrink: 0,
                                                            }}>
                                                                <Mail size={15} color="#7C3AED" />
                                                            </div>
                                                            <div>
                                                                <p style={{
                                                                    fontFamily: bodyFont,
                                                                    fontSize: '0.78rem', color: '#6B7280',
                                                                    marginBottom: '0.1rem',
                                                                }}>
                                                                    {item.label}
                                                                </p>
                                                                <a href={`mailto:${item.email}`} style={{
                                                                    fontFamily: ff,
                                                                    fontSize: '0.85rem', fontWeight: 600,
                                                                    color: '#7C3AED', textDecoration: 'none',
                                                                }}>
                                                                    {item.email}
                                                                </a>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </section>

                <Footer t={tw} ff={ff} bodyFont={bodyFont} dir={dir} />
            </main>
        </>
    );
}

PrivacyPolicy.layout = page => <GuestLayout>{page}</GuestLayout>;