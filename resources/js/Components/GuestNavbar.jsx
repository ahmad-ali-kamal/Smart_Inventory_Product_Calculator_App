import { Link } from '@inertiajs/react';
import { useLang } from '@/Hooks/useLang';
import LanguageSwitcher from '@/Components/LanguageSwitcher';

const NAV_H = 72;

/**
 * GuestNavbar — الهيدر المشترك بين Welcome وصفحات Login
 *
 * Props:
 *  - variant: 'welcome' | 'login'
 *      'welcome' → يُظهر روابط التنقل (Features / Platforms / Stats)
 *      'login'   → يُظهر زر "العودة للرئيسية" بجانب زر اللغة (يمين)
 *  - backLabel: نص زر الرجوع (فقط في variant='login')
 *  - backHref:  وجهة زر الرجوع (افتراضي: '/')
 */
export default function GuestNavbar({ variant = 'welcome', backLabel, backHref = '/' }) {
    const { lang, isAr, dir, ff } = useLang();

    const NAV_LINKS = {
        en: ['Features', 'Platforms', 'Stats'],
        ar: ['المميزات', 'المنصات', 'الإحصاء'],
    };

    const navLinks = NAV_LINKS[lang];
    const bodyFont = lang === 'ar' ? "'IBM Plex Sans Arabic', sans-serif" : "'Inter', sans-serif";

    return (
        <header style={{
            position: variant === 'welcome' ? 'fixed' : 'sticky',
            top: 0, left: 0, right: 0, zIndex: 100,
            height: NAV_H,
            background: 'linear-gradient(90deg, rgba(17,3,48,0.82) 0%, rgba(42,8,104,0.82) 50%, rgba(59,15,144,0.82) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(168,139,250,0.12)',
            display: 'flex', alignItems: 'center',
        }}>
            <div style={{
                maxWidth: 1100, margin: '0 auto', width: '100%', padding: '0 1.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                direction: 'ltr',
            }}>

                {/* ── Logo ── */}
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
                    <img src="/images/Quantix_logo.png" alt="Quantix" style={{ height: 28 }} />
                    <span style={{
                        fontFamily: "'Changa', sans-serif",
                        fontSize: '1.05rem', fontWeight: 800, letterSpacing: '0.08em',
                        background: 'linear-gradient(120deg, #fff 0%, #ddd6fe 40%, #a5f3fc 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}>
                        QUANTIX
                    </span>
                </Link>

                {/* ── Center: nav links (welcome only) ── */}
                {variant === 'welcome' && (
                    <nav style={{
                        display: 'flex', alignItems: 'center',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(168,139,250,0.18)',
                        borderRadius: 999, padding: '3px',
                        direction: dir,
                    }}>
                        {navLinks.map((item, i) => (
                            <a key={i}
                                href={['#features', '#platforms', '#stats'][i]}
                                style={{
                                    padding: '6px 16px',
                                    color: i === 0 ? 'white' : 'rgba(255,255,255,0.5)',
                                    textDecoration: 'none',
                                    fontFamily: bodyFont,
                                    fontSize: '0.82rem', fontWeight: 600,
                                    borderRadius: 999,
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    background: i === 0 ? 'rgba(168,139,250,0.15)' : 'transparent',
                                    transition: 'all 0.2s',
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
                    </nav>
                )}

                {/* ── Right side: back link (login) + Language Switcher ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {variant === 'login' && backLabel && (
                        <Link href={backHref} style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '7px 14px',
                            color: 'rgba(255,255,255,0.85)',
                            textDecoration: 'none',
                            fontSize: '0.82rem',
                            fontFamily: bodyFont,
                            fontWeight: 600,
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(168,139,250,0.25)',
                            borderRadius: 999,
                            transition: 'all 0.2s',
                            direction: dir,
                            whiteSpace: 'nowrap',
                        }}>
                            {isAr ? `← ${backLabel}` : `${backLabel} →`}
                        </Link>
                    )}

                    {/* Language Switcher — نفس حجم ولون زر العودة */}
                    <div style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(168,139,250,0.25)',
                        borderRadius: 999,
                        padding: '7px 14px',
                        display: 'flex', alignItems: 'center',
                        color: 'rgba(255,255,255,0.85)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                    }}>
                        <LanguageSwitcher />
                    </div>
                </div>

            </div>
        </header>
    );
}