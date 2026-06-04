/**
 * @file PageBanner.jsx
 * @module Components/Common
 *
 * @description
 * Collapsible info banner shown in the top bar of admin pages.
 * Renders an expandable pill with contextual help text, or a compact icon
 * button when collapsed. Animated via Framer Motion (AnimatePresence).
 *
 * Used to surface per-page guidance without cluttering the header.
 *
 * @example
 * <PageBanner visible={bannerVisible} onToggle={() => setBannerVisible(v => !v)}>
 *   Products marked as inactive will not appear in the calculator.
 * </PageBanner>
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

/**
 * PageBanner
 *
 * @param {Object}   props
 * @param {React.ReactNode} props.children  - Help text displayed inside the expanded banner.
 * @param {boolean}  props.visible          - Whether the banner is in its expanded (open) state.
 * @param {Function} props.onToggle         - Callback fired when the user clicks the info button
 *                                            to expand or collapse the banner.
 * @returns {JSX.Element}
 */
export default function PageBanner({ children, visible, onToggle }) {
    const { t } = useTranslation('shared');

    return (
        <div className="flex items-center flex-1 min-w-0">
            {/*
             * AnimatePresence lets Framer Motion animate the exit of the outgoing
             * child before mounting the incoming one (mode="wait").
             * initial={false} suppresses the mount animation on first render.
             */}
            <AnimatePresence mode="wait" initial={false}>
                {visible ? (

                    /* ── Expanded state: pill with icon + help text ── */
                    <motion.div
                        key="open"
                        className="flex items-center gap-2 h-9 px-2 rounded-xl
                            bg-[var(--accent)] border border-[var(--primary)]/10
                            text-[var(--primary)] text-xs font-medium overflow-hidden whitespace-nowrap"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.35, ease: 'easeInOut' }}
                    >
                        {/* Collapse button — clicking it hides the banner */}
                        <button
                            onClick={onToggle}
                            aria-label={t('page_banner.banner_toggle_label')}
                            className="w-5 h-5 flex items-center justify-center bg-white
                                rounded-full shadow-sm flex-shrink-0 text-[10px] font-black
                                text-[var(--primary)] hover:opacity-70 transition-opacity"
                        >
                            {t('page_banner.banner_icon')}
                        </button>

                        {/* Contextual help text passed as children */}
                        <span className="pe-1">{children}</span>
                    </motion.div>

                ) : (

                    /* ── Collapsed state: icon-only square button ── */
                    <motion.button
                        key="closed"
                        onClick={onToggle}
                        aria-label={t('page_banner.banner_toggle_label')}
                        className="w-9 h-9 flex items-center justify-center flex-shrink-0
                            bg-[var(--accent)] border border-[var(--primary)]/10 rounded-xl
                            text-[var(--primary)] hover:opacity-70 transition-opacity"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                        <span className="w-5 h-5 flex items-center justify-center bg-white
                            rounded-full shadow-sm text-[10px] font-black text-[var(--primary)]">
                            {t('page_banner.banner_icon')}
                        </span>
                    </motion.button>

                )}
            </AnimatePresence>
        </div>
    );
}