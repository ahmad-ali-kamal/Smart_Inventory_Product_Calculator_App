/**
 * @file LoginLayout.jsx
 * @description Shared login page layout used across all Salla-integrated apps
 *              (Mustashar, Harees, and any future apps).
 *
 *              Responsibilities:
 *              - Renders a two-panel (left coloured / right white) login card.
 *              - Accepts all brand-specific tokens (colours, image, copy) via props,
 *                keeping individual app Login pages thin and config-only.
 *              - Owns all entrance animations (Framer Motion variants).
 *              - Resolves font families through `useFonts` to avoid @import duplication.
 *              - Adapts layout direction (RTL / LTR) through `useLang`.
 *
 * @module Layouts/LoginLayout
 */

import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLang } from '@/Hooks/useLang';
import LanguageSwitcher from '@/Components/UI/LanguageSwitcher';
import { useFonts }  from '@/Hooks/useFonts';

/**
 * LoginLayout — shared two-panel login layout for Salla-integrated apps.
 *
 * @component
 *
 * @param {Function} props.t                - i18next translation function scoped to the
 *                                              app-specific login namespace (e.g.
 *                                              'mustashar-login' or 'harees-login').
 * @param {string}   props.imageSrc         - URL / import of the hero image shown in the
 *                                              left panel.
 * @param {string}   props.imageAlt         - Accessible alt text for the hero image.
 * @param {string}   props.gradientFrom     - CSS colour for the start of the left-panel
 *                                              gradient (e.g. `"#8D82FF"`).
 * @param {string}   props.gradientTo       - CSS colour for the end of the gradient.
 * @param {string}   props.accentColor      - Primary brand accent colour used for
 *                                              interactive elements on the right panel.
 * @param {string}   props.accentLight      - Light tint of the accent colour used for
 *                                              step-number circle backgrounds.
 * @param {string}   props.shadowColor      - RGB triplet string (no alpha) used to build
 *                                              `rgba()` shadows (e.g. `"141,130,255"`).
 * @param {string}   props.authHref         - OAuth redirect URL for the Salla CTA button.
 * @param {boolean}  [props.showBackHome]   - When `true`, renders a "Back to Home" pill
 *                                              in the left-panel header; when `false` the
 *                                              link appears below the form instead.
 *                                              Default: `false`.
 * @param {string}   [props.status]         - Optional Inertia flash / status message
 *                                              rendered above the CTA in accent colour.
 * @param {string}   [props.bgColor]        - Page background colour outside the card.
 *                                              Default: `"#F5F2FA"`.
 *
 * @returns {JSX.Element}
 */
export default function LoginLayout({
    t,
    imageSrc,
    imageAlt,
    gradientFrom,
    gradientTo,
    accentColor,
    accentLight,
    shadowColor,
    authHref,
    showBackHome = false,
    status,
    bgColor = '#F5F2FA',
}) {
    // `isAr`  — boolean shorthand for RTL-aware conditionals
    // `dir`   — "rtl" | "ltr" applied to the root container
    const { isAr, dir } = useLang();

    // `ff`       — heading / display font-family string
    // `bodyFont` — body / secondary font-family string
    const { ff, bodyFont } = useFonts();

    // Shared namespace for fallback UI strings not specific to any app
    const { t: tShared } = useTranslation('shared');

    // ── Animation variants ────────────────────────────────────────────────────

    /**
     * Outer card: fades in, rises slightly, and scales up from 97 % to 100 %.
     * Acts as the "stage entrance" for the entire login surface.
     */
    const cardVariants = {
        hidden:  { opacity: 0, y: 48, scale: 0.97 },
        visible: { opacity: 1, y: 0,  scale: 1,
            transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
    };

    /**
     * Left-panel text elements: simple upward fade, runs after the card settles.
     */
    const leftVariants = {
        hidden:  { opacity: 0, y: 32 },
        visible: { opacity: 1, y: 0,
            transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.18 } },
    };

    /**
     * Right panel: slides in from the viewport edge that matches the reading
     * direction so the motion feels natural in both RTL and LTR contexts.
     *   • Arabic (RTL) — panel slides in from the left  (x: -36 → 0)
     *   • English (LTR) — panel slides in from the right (x: +36 → 0)
     */
    const rightVariants = {
        hidden:  { opacity: 0, x: isAr ? -36 : 36 },
        visible: { opacity: 1, x: 0,
            transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.42 } },
    };

    // ── Shared inline style for frosted-glass pill buttons (header row) ───────
    /**
     * Reusable frosted-glass pill style applied to both the LanguageSwitcher
     * and the optional "Back to Home" link in the left-panel header.
     * Defined inline so colour tokens remain co-located with the template.
     */
    const glassStyle = {
        background: 'rgba(255,255,255,0.18)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.32)',
        borderRadius: '999px',
        padding: '4px 14px',
        display: 'inline-flex',
        alignItems: 'center',
        color: '#fff',
        fontSize: '12px',
        fontWeight: 600,
        transition: 'background 0.2s',
        textDecoration: 'none',
        cursor: 'pointer',
        lineHeight: 1.6,
    };

    return (
        <div
            className="min-h-screen w-full flex items-center justify-center overflow-hidden px-4 py-6"
            dir={dir}
                style={{ background: bgColor, fontFamily: ff }}
        >
            {/* Sets the document <title> via Inertia's Head component */}
            <Head title={t('pageTitle')} />

            {/*
              Global style overrides scoped to this page.
              - Fonts are NOT loaded here; they come from the single <link> in
                resources/views/app.blade.php (loaded once for the whole app).
              - `.glass-btn:hover` brightens the frosted pill on pointer entry.
              - The media query collapses the card to full-width on small screens.
            */}
            <style>{`
                body, html { margin: 0; padding: 0; background-color: ${bgColor} !important; }
                .glass-btn:hover { background: rgba(255,255,255,0.28) !important; }
            `}</style>

            {/* ── Outer card ─────────────────────────────────────────────────── */}
            {/*
              The card itself is a Motion wrapper so the entrance animation
              covers the full surface. `shadowColor` is passed as an RGB triplet
              so we can control opacity here without needing a separate prop.
            */}
            <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="login-card w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl h-auto lg:h-[700px] xl:h-[720px] rounded-[34px] bg-white/50 border border-white overflow-hidden p-3"
                style={{ boxShadow: `0 25px 80px rgba(${shadowColor}, 0.22)` }}
            >
                {/*
                  Inner flex container — direct flex parent of both panels.
                  IMPORTANT: Do NOT wrap either panel in an extra element (e.g. a
                  Reveal component) at this level — it would break the 50/50 split.
                */}
                <div className="w-full h-full rounded-[28px] overflow-hidden flex flex-col md:flex-row bg-white">

                    {/* ── LEFT panel (coloured brand panel) ─────────────────── */}
                    <div
                        className="w-full md:w-1/2 relative overflow-hidden p-8 md:p-10 flex flex-col justify-between h-auto md:h-full"
                        style={{ background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)` }}
                    >
                        {/* Decorative radial light bursts — pure visual depth, no semantic content */}
                        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,white_0,transparent_28%),radial-gradient(circle_at_80%_75%,white_0,transparent_24%)]" />

                        {/* Header row: language switcher + optional back-home link */}
                        <motion.div
                            variants={leftVariants}
                            initial="hidden"
                            animate="visible"
                            className="relative z-10 flex items-center justify-between mb-6"
                        >
                            {/* Frosted-glass pill wrapping the LanguageSwitcher toggle */}
                            <div style={glassStyle} className="glass-btn">
                                <LanguageSwitcher />
                            </div>

                            {/*
                              "Back to Home" pill — conditionally rendered.
                              When `showBackHome` is false, an equivalent link is
                              rendered below the form on the right panel instead.
                            */}
                            {showBackHome && (
                                <Link href="/" className="glass-btn" style={glassStyle}>
                                    {t('backHome')} {isAr ? '←' : '→'}
                                </Link>
                            )}
                        </motion.div>

                        {/* App name, subtitle, description, and feature list */}
                        <motion.div
                            variants={leftVariants}
                            initial="hidden"
                            animate="visible"
                            className="relative z-10 flex-1"
                        >
                            {/*
                              SplitText animates each character/word of the app name
                              with a staggered reveal; `wordDelay` controls the stagger
                              interval in seconds.
                            */}
                            <h1
                            className="text-white text-4xl md:text-5xl leading-normal mb-3 drop-shadow-sm"
                            style={{ fontFamily: ff, fontWeight: 700 }}
                            >
                            <span className="inline-block pb-4">
                            {t('appName')}
                           </span>
                           </h1>

                            {/* One-line value proposition */}
                            <p className="text-white/95 text-base md:text-lg mb-4" style={{ fontFamily: ff }}>
                                {t('appSub')}
                            </p>

                            {/* Multi-sentence app description */}
                            <p className="text-white/90 text-sm leading-relaxed max-w-xs md:max-w-sm mb-5" style={{ fontFamily: ff }}>
                                {t('appDesc')}
                            </p>
                        </motion.div>

                        {/* Hero / product illustration */}
                       <div className="flex justify-center items-center flex-1 overflow-visible my-auto">
                       <img
                       src={imageSrc}
                       alt={imageAlt ?? tShared('login_layout.image_alt_fallback')}
                       loading="eager"
                       fetchPriority="high"
                       decoding="async"
                       width="600"
                       height="420"
                       className="login-visual w-full max-w-xs sm:max-w-sm md:max-w-md object-contain drop-shadow-2xl"
                       style={{ transform: 'none', animation: 'none', transition: 'none' }}
                       />
                      </div>

                        {/* Support / footer label at the bottom of the coloured panel */}
                        <div className="relative z-10 text-white/80 text-sm" style={{ fontFamily: ff }}>
                            {t('support')}
                        </div>
                    </div>

                    {/* ── RIGHT panel (white form area) ─────────────────────── */}
                    {/*
                      Slides in from the correct edge (see `rightVariants` above).
                      Corner radius is applied only to the outer edge so it blends
                      seamlessly with the card's rounded corners.
                    */}
                    <motion.div
                        variants={rightVariants}
                        initial="hidden"
                        animate="visible"
                        className={`
                            w-full md:w-1/2 h-full bg-white
                            flex items-center justify-center
                            p-8 md:p-14
                            overflow-y-auto
                            ${isAr
                                ? 'rounded-t-[56px] md:rounded-t-none md:rounded-r-[120px]'
                                : 'rounded-t-[56px] md:rounded-t-none md:rounded-l-[120px]'
                            }
                        `}
                    >
                        <div className="w-full max-w-sm md:max-w-md">

                            {/* Section heading + sub-label */}
                            <div className="mb-8">
                                <h2
                                    className="text-[#171321] text-3xl md:text-4xl mb-2"
                                    style={{ fontFamily: ff, fontWeight: 700 }}
                                >
                                    {t('loginNow')}
                                </h2>
                                <p className="text-[#777288] text-sm" style={{ fontFamily: bodyFont }}>
                                    {t('loginSub')}
                                </p>
                            </div>

                            {/*
                              "Already have an account?" line.
                              Rendered only when the translation key is present,
                              allowing apps to opt-out by omitting the key.
                            */}
                            {t('already') && (
                                <div className="mb-6 text-sm text-[#2A2533]" style={{ fontFamily: bodyFont }}>
                                    {t('already')}{' '}
                                    <span className="cursor-pointer" style={{ color: accentColor }}>
                                        {t('loginLink')}
                                    </span>
                                </div>
                            )}

                            {/*
                              Inertia flash / status message (e.g. "Session expired").
                              Only rendered when the `status` prop is non-empty.
                            */}
                            {status && (
                                <div className="mb-4 text-sm" style={{ color: accentColor, fontFamily: bodyFont }}>
                                    {status}
                                </div>
                            )}

                            {/* Numbered onboarding steps guiding new users */}
                            <div className="space-y-4 mb-8">
                                {t('steps', { returnObjects: true }).map((step, i) => (
                                    <div key={i} className="flex gap-4 items-start">
                                        {/*
                                          Step-number circle — uses `accentLight` background
                                          and `accentColor` text for brand consistency.
                                        */}
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 text-sm shadow-inner"
                                            style={{ background: accentLight, color: accentColor, fontFamily: ff }}
                                        >
                                            {i + 1}
                                        </div>
                                        <div>
                                            <h3
                                                className="text-[#171321] text-sm mb-1"
                                                style={{ fontFamily: ff, fontWeight: 700 }}
                                            >
                                                {step.title}
                                            </h3>
                                            <p
                                                className="text-[#8F8A9F] text-[12px] leading-relaxed"
                                                style={{ fontFamily: bodyFont }}
                                            >
                                                {step.sub}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/*
                              Primary CTA — redirects to the Salla OAuth endpoint.
                              `authHref` is app-specific and passed via props.
                            */}
                            <a
                                href={authHref}
                                className="w-full h-12 md:h-[52px] rounded-xl text-white font-bold text-base flex items-center justify-center hover:scale-[1.01] active:scale-[0.98] transition"
                                style={{
                                    background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
                                    boxShadow: `0 12px 26px rgba(${shadowColor}, 0.28)`,
                                    fontFamily: ff,
                                    fontWeight: 700,
                                }}
                            >
                                {t('sallaBtn')}
                            </a>

                            {/* Contextual note explaining Salla-exclusive access requirement */}
                            <div
                                className="text-[#9B96AA] text-[12px] leading-relaxed bg-[#FCFBFF] border border-[#EFEAFB] p-4 rounded-2xl mt-6"
                                style={{ fontFamily: bodyFont }}
                            >
                                {t('note')}
                            </div>

                            {/*
                              Fallback "Back to Home" link at the bottom of the form.
                              Only shown when `showBackHome` is false (i.e. the header
                              pill is hidden), so the user always has a way to escape.
                            */}
                            {!showBackHome && (
                                <Link
                                    href="/"
                                    className="text-xs text-[#B0A9C5] mt-3 inline-block"
                                    style={{ fontFamily: bodyFont }}
                                >
                                    {t('backHome')} {isAr ? '←' : '→'}
                                </Link>
                            )}
                        </div>
                    </motion.div>

                </div>
            </motion.div>
        </div>
    );
}

/**
 * Opt out of the default Inertia layout so this page owns its own full-screen
 * layout without being wrapped by the application shell.
 */
LoginLayout.layout = page => page;