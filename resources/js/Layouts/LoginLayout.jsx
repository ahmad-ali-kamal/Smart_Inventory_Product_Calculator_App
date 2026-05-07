import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useLang } from '@/Hooks/useLang';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { useFonts }  from '@/hooks/useFonts';
import SplitText     from '@/Components/ui/SplitText';

/**
 * LoginLayout — shared layout for all login pages.
 *
 * NOTE on Reveal: We intentionally do NOT use <Reveal> here.
 * Reveal adds a plain <motion.div> wrapper with no layout styles,
 * which breaks the flex sizing (md:w-[50%] h-full) of the right panel.
 * The login card is above-the-fold anyway — scroll-reveal makes no sense.
 * The right panel uses its own motion.div with correct layout classes instead.
 *
 * Props:
 * @param {object}  translations
 * @param {string}  imageSrc
 * @param {string}  imageAlt
 * @param {string}  gradientFrom
 * @param {string}  gradientTo
 * @param {string}  accentColor
 * @param {string}  accentLight
 * @param {string}  shadowColor
 * @param {string}  authHref
 * @param {string}  [imageScale]   - default "scale-[1.25]"
 * @param {boolean} [showBackHome] - default false
 * @param {string}  [status]
 * @param {string}  [bgColor]      - default "#F5F2FA"
 */
export default function LoginLayout({
    translations,
    imageSrc,
    imageAlt,
    gradientFrom,
    gradientTo,
    accentColor,
    accentLight,
    shadowColor,
    authHref,
    imageScale = 'scale-[1.25]',
    showBackHome = false,
    status,
    bgColor = '#F5F2FA',
}) {
    const { lang, isAr, dir } = useLang();
    const { ff, bodyFont }    = useFonts();
    const t = translations[lang];

    // ── Animation variants ────────────────────────────────────────────────────
    const cardVariants = {
        hidden:  { opacity: 0, y: 48, scale: 0.97 },
        visible: { opacity: 1, y: 0,  scale: 1,
            transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
    };

    const leftVariants = {
        hidden:  { opacity: 0, y: 32 },
        visible: { opacity: 1, y: 0,
            transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.18 } },
    };

    const heroVariants = {
        hidden:  { opacity: 0, y: 40, scale: 0.96 },
        visible: { opacity: 1, y: 0,  scale: 1,
            transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.3 } },
    };

    // Right panel slides in from the correct side based on language direction
    const rightVariants = {
        hidden:  { opacity: 0, x: isAr ? -36 : 36 },
        visible: { opacity: 1, x: 0,
            transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.42 } },
    };
    // ─────────────────────────────────────────────────────────────────────────

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
            <Head title={t.pageTitle} />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&family=Changa:wght@300;400;500;600;700;800&display=swap');
                * { font-family: ${ff}; }
                body, html { margin: 0; padding: 0; background-color: ${bgColor} !important; }
                .glass-btn:hover { background: rgba(255,255,255,0.28) !important; }
                @media (max-width: 768px) {
                    .login-card { width: 95vw !important; min-width: unset !important; height: auto !important; }
                }
            `}</style>

            {/* ── Outer card ─────────────────────────────────────────────────── */}
            <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="login-card w-[75vw] min-w-[1100px] max-w-[1280px] h-[720px] rounded-[34px] bg-white/50 border border-white overflow-hidden p-3"
                style={{ boxShadow: `0 25px 80px rgba(${shadowColor}, 0.22)` }}
            >
                {/*
                  This inner div is a flex row container.
                  Both children MUST be direct flex children with correct widths —
                  any extra wrapper div (like Reveal) breaks this.
                */}
                <div className="w-full h-full rounded-[28px] overflow-hidden flex flex-col md:flex-row bg-white">

                    {/* ── LEFT panel (coloured) ─────────────────────────────── */}
                    <div
                        className="w-full md:w-[50%] relative overflow-hidden p-8 md:p-10 flex flex-col justify-between h-[320px] md:h-full"
                        style={{ background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)` }}
                    >
                        {/* Radial highlights */}
                        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,white_0,transparent_28%),radial-gradient(circle_at_80%_75%,white_0,transparent_24%)]" />

                        {/* Header row */}
                        <motion.div
                            variants={leftVariants}
                            initial="hidden"
                            animate="visible"
                            className="relative z-10 flex items-center justify-between mb-6"
                        >
                            <div style={glassStyle} className="glass-btn">
                                <LanguageSwitcher />
                            </div>

                            {showBackHome && (
                                <Link href="/" className="glass-btn" style={glassStyle}>
                                    {t.backHome} {isAr ? '←' : '→'}
                                </Link>
                            )}
                        </motion.div>

                        {/* Text block */}
                        <motion.div
                            variants={leftVariants}
                            initial="hidden"
                            animate="visible"
                            className="relative z-10 flex-1"
                        >
                            <h1
                                className="text-white text-4xl md:text-5xl leading-tight mb-3 drop-shadow-sm"
                                style={{ fontFamily: ff, fontWeight: 700 }}
                            >
                                <SplitText text={t.appName} wordDelay={0.06} />
                            </h1>

                            <p className="text-white/95 text-base md:text-lg mb-4" style={{ fontFamily: ff }}>
                                {t.appSub}
                            </p>

                            <p className="text-white/90 text-sm leading-relaxed max-w-[410px] mb-5" style={{ fontFamily: ff }}>
                                {t.appDesc}
                            </p>

                            <div className="space-y-3">
                                {t.features.map((feature, i) => (
                                    <div key={i} className="flex items-center gap-3 text-white text-sm">
                                        <div className="w-2 h-2 rounded-full bg-white/80 shrink-0" />
                                        <span style={{ fontFamily: ff }}>{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Hero image */}
<motion.div
    variants={heroVariants}
    initial="hidden"
    animate="visible"
    className="relative z-10 flex justify-center items-center flex-1 overflow-visible" // ← add overflow-visible
>
    <img
        src={imageSrc}
        alt={imageAlt}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        width="600"
        height="420"
        className={`login-visual w-full max-w-[480px] ${imageScale} object-contain drop-shadow-2xl`}
        //                              ↑ reduced from 600px to 480px for safer fit
    />
</motion.div>

                        {/* Support footer */}
                        <div className="relative z-10 text-white/80 text-sm" style={{ fontFamily: ff }}>
                            {t.support}
                        </div>
                    </div>

                    {/* ── RIGHT panel (white form) ──────────────────────────────
                        IMPORTANT: this motion.div must be a DIRECT child of the
                        flex row above. It carries md:w-[50%] and h-full itself —
                        never wrap it in Reveal or any other unstyled div.
                    ── */}
                    <motion.div
                        variants={rightVariants}
                        initial="hidden"
                        animate="visible"
                        className={`
                            w-full md:w-[50%] h-full bg-white
                            flex items-center justify-center
                            p-8 md:p-14
                            overflow-y-auto
                            ${isAr
                                ? 'rounded-t-[56px] md:rounded-t-none md:rounded-r-[120px]'
                                : 'rounded-t-[56px] md:rounded-t-none md:rounded-l-[120px]'
                            }
                        `}
                    >
                        <div className="w-full max-w-[430px]">

                            {/* Heading */}
                            <div className="mb-8">
                                <h2
                                    className="text-[#171321] text-3xl md:text-4xl mb-2"
                                    style={{ fontFamily: ff, fontWeight: 700 }}
                                >
                                    {t.loginNow}
                                </h2>
                                <p className="text-[#777288] text-sm" style={{ fontFamily: bodyFont }}>
                                    {t.loginSub}
                                </p>
                            </div>

                            {/* Already have account — only renders if translation key exists */}
                            {t.already && (
                                <div className="mb-6 text-sm text-[#2A2533]" style={{ fontFamily: bodyFont }}>
                                    {t.already}{' '}
                                    <span className="cursor-pointer" style={{ color: accentColor }}>
                                        {t.loginLink}
                                    </span>
                                </div>
                            )}

                            {/* Inertia status message */}
                            {status && (
                                <div className="mb-4 text-sm" style={{ color: accentColor, fontFamily: bodyFont }}>
                                    {status}
                                </div>
                            )}

                            {/* Steps */}
                            <div className="space-y-4 mb-8">
                                {t.steps.map((step, i) => (
                                    <div key={i} className="flex gap-4 items-start">
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

                            {/* CTA button */}
                            <a
                                href={authHref}
                                className="w-full h-[52px] rounded-xl text-white font-bold text-base flex items-center justify-center hover:scale-[1.01] active:scale-[0.98] transition"
                                style={{
                                    background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
                                    boxShadow: `0 12px 26px rgba(${shadowColor}, 0.28)`,
                                    fontFamily: ff,
                                    fontWeight: 700,
                                }}
                            >
                                {t.sallaBtn}
                            </a>

                            {/* Note */}
                            <div
                                className="text-[#9B96AA] text-[12px] leading-relaxed bg-[#FCFBFF] border border-[#EFEAFB] p-4 rounded-2xl mt-6"
                                style={{ fontFamily: bodyFont }}
                            >
                                {t.note}
                            </div>

                            {/* Back home — bottom fallback when header button is hidden */}
                            {!showBackHome && (
                                <Link
                                    href="/"
                                    className="text-xs text-[#B0A9C5] mt-3 inline-block"
                                    style={{ fontFamily: bodyFont }}
                                >
                                    {t.backHome} {isAr ? '←' : '→'}
                                </Link>
                            )}
                        </div>
                    </motion.div>

                </div>
            </motion.div>
        </div>
    );
}

LoginLayout.layout = page => page;