import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useLang } from '@/hooks/useLang';
import { useFonts } from '@/hooks/useFonts';
import GuestLayout from '@/Layouts/GuestLayout';
import Navbar from '@/Components/Welcome/Navbar';
import Footer from '@/Components/Welcome/Footer';
import Reveal from '@/Components/UI/Reveal';
import globalStyles from '@/styles/globalStyles';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, MessageCircle } from 'lucide-react';

const NAV_H = 58;

function AccordionItem({ question, answer, ff, bodyFont, isOpen, onToggle, index }) {
    return (
        <motion.div
            initial={false}
            style={{
                border: '1px solid #F3F4F6',
                borderRadius: 14,
                marginBottom: '0.6rem',
                overflow: 'hidden',
                background: isOpen ? '#FAFAFA' : 'white',
                boxShadow: isOpen ? '0 4px 12px rgba(124,58,237,0.06)' : '0 1px 3px rgba(0,0,0,0.03)',
                transition: 'box-shadow 0.2s, background 0.2s',
            }}
            onMouseEnter={e => { if (!isOpen) e.currentTarget.style.boxShadow = '0 2px 8px rgba(124,58,237,0.08)'; }}
            onMouseLeave={e => { if (!isOpen) e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)'; }}
        >
            <button
                onClick={onToggle}
                aria-expanded={isOpen}
                style={{
                    width: '100%', border: 'none', background: 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: 12,
                    padding: '1.1rem 1.5rem',
                    fontFamily: ff, fontSize: 'clamp(0.85rem, 1vw, 0.92rem)', fontWeight: 600,
                    color: '#1F2937', textAlign: 'left',
                }}
            >
                <span>{question}</span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 6, background: isOpen ? '#EDE9FE' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <ChevronDown size={16} color={isOpen ? '#7C3AED' : '#9CA3AF'} />
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key={`content-${index}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{
                            padding: '0 1.5rem 1.1rem',
                            fontFamily: bodyFont,
                            fontSize: 'clamp(0.82rem, 0.95vw, 0.88rem)',
                            color: '#4B5563',
                            lineHeight: 1.8,
                            borderTop: '1px solid #F3F4F6',
                            paddingTop: '0.8rem',
                        }}>
                            {answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function FAQ() {
    const { dir } = useLang();
    const { t } = useTranslation('faq');
    const { t: tw } = useTranslation('welcome');
    const { ff, bodyFont } = useFonts();

    const categories = t('categories', { returnObjects: true });
    const [openIndex, setOpenIndex] = useState(null);
    const isAr = dir === 'rtl';

    const toggleAccordion = (catIdx, qIdx) => {
        const key = `${catIdx}-${qIdx}`;
        setOpenIndex(prev => prev === key ? null : key);
    };

    const categoryIcons = [
        { icon: '⭐', bg: '#FFF7ED' },
        { icon: '📦', bg: '#EDE9FE' },
        { icon: '📐', bg: '#CCFBF1' },
        { icon: '💳', bg: '#DCFCE7' },
        { icon: '🔒', bg: '#FCE7F3' },
    ];

    return (
        <>
            <Head title={t('metaTitle')}>
                <meta name="description" content={t('metaDescription')} />
                <meta property="og:title" content={t('metaTitle')} />
                <meta property="og:description" content={t('metaDescription')} />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://quantixapp.dev/faq" />
                <link rel="canonical" href="https://quantixapp.dev/faq" />
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
                        radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 28%),
                        radial-gradient(circle at 70% 80%, rgba(255,255,255,0.10) 0%, transparent 24%),
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
                                    <HelpCircle size={20} color="white" />
                                </div>
                                <span style={{
                                    fontFamily: ff, fontSize: 'clamp(0.7rem, 0.9vw, 0.8rem)',
                                    fontWeight: 700, letterSpacing: '0.18em',
                                    color: 'rgba(255,255,255,0.7)',
                                }}>
                                    {isAr ? 'المساعدة والدعم' : 'Help & Support'}
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
                                {t('subtitle')}
                            </p>
                        </Reveal>
                    </div>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: 0, zIndex: 3, pointerEvents: 'none' }}>
                        <svg viewBox="0 0 1440 56" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 56 }} xmlns="http://www.w3.org/2000/svg">
                            <path d="M0,56 Q720,0 1440,56 L1440,56 L0,56 Z" fill="#ffffff" />
                        </svg>
                    </div>
                </section>

                {/* ── FAQ Content ── */}
                <section style={{
                    background: '#FFFFFF',
                    padding: 'clamp(2.5rem, 5vw, 4rem) clamp(1rem, 3vw, 2rem)',
                }}>
                    <div style={{ maxWidth: 860, margin: '0 auto' }}>
                        {categories.map((cat, catIdx) => {
                            const iconData = categoryIcons[catIdx] || { icon: '❓', bg: '#F3F4F6' };
                            return (
                                <div key={catIdx} style={{ marginBottom: '2.5rem' }}>
                                    <Reveal delay={catIdx * 0.05} direction="up">
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            marginBottom: '1.25rem',
                                            paddingBottom: '0.75rem',
                                            borderBottom: '2px solid #EDE9FE',
                                        }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: 10,
                                                background: iconData.bg,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '1.1rem',
                                            }}>
                                                {iconData.icon}
                                            </div>
                                            <h2 style={{
                                                fontFamily: ff,
                                                fontSize: 'clamp(1.05rem, 1.4vw, 1.2rem)',
                                                fontWeight: 700, color: '#111827',
                                            }}>
                                                {cat.category}
                                            </h2>
                                        </div>
                                    </Reveal>

                                    {cat.questions.map((item, qIdx) => {
                                        const key = `${catIdx}-${qIdx}`;
                                        return (
                                            <Reveal key={qIdx} delay={qIdx * 0.02} direction="up">
                                                <AccordionItem
                                                    index={key}
                                                    question={item.q}
                                                    answer={item.a}
                                                    ff={ff}
                                                    bodyFont={bodyFont}
                                                    isOpen={openIndex === key}
                                                    onToggle={() => toggleAccordion(catIdx, qIdx)}
                                                />
                                            </Reveal>
                                        );
                                    })}
                                </div>
                            );
                        })}

                        {/* ── Still have questions CTA ── */}
                        <Reveal>
                            <div style={{
                                textAlign: 'center',
                                padding: '2.5rem 2rem',
                                background: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)',
                                borderRadius: 20,
                                border: '1px solid #DDD6FE',
                            }}>
                                <div style={{
                                    width: 56, height: 56, borderRadius: 14,
                                    background: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 1rem',
                                    boxShadow: '0 4px 12px rgba(124,58,237,0.1)',
                                }}>
                                    <MessageCircle size={24} color="#7C3AED" />
                                </div>
                                <p style={{
                                    fontFamily: ff,
                                    fontSize: '1.1rem', fontWeight: 700,
                                    color: '#1F2937', marginBottom: '0.5rem',
                                }}>
                                    {t('stillHaveQuestions')}
                                </p>
                                <p style={{
                                    fontFamily: bodyFont,
                                    fontSize: '0.9rem', color: '#6B7280',
                                    marginBottom: '1.25rem',
                                }}>
                                    {t('contactPrompt')}
                                </p>
                                <a
                                    href="mailto:support@quantixapp.dev"
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        padding: '0.7rem 1.5rem',
                                        background: '#7C3AED', color: 'white',
                                        borderRadius: 10,
                                        fontFamily: ff, fontSize: '0.88rem', fontWeight: 700,
                                        textDecoration: 'none',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(124,58,237,0.3)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = '';
                                        e.currentTarget.style.boxShadow = '';
                                    }}
                                >
                                    <MessageCircle size={16} />
                                    {isAr ? 'تواصل مع الدعم' : 'Contact Support'}
                                </a>
                            </div>
                        </Reveal>
                    </div>
                </section>

                <Footer t={tw} ff={ff} bodyFont={bodyFont} dir={dir} />
            </main>
        </>
    );
}

FAQ.layout = page => <GuestLayout>{page}</GuestLayout>;