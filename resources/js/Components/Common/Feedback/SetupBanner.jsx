/**
 * @file SetupBanner.jsx
 * @module Components/Common/Feedback
 *
 * @description
 * Contextual onboarding banner displayed when a required
 * configuration step has not yet been completed (e.g. expiry thresholds,
 * calculator settings).
 *
 * Renders a card-style strip with:
 *   - A settings icon badge on the left.
 *   - A fixed title ("Settings not configured") and a customizable description.
 *   - A CTA link button on the right that navigates to the relevant settings page.
 *
 * Typically placed at the top of a feature page that depends on configuration
 * data being present, replacing or preceding the main content.
 *
 * @example
 * // Default — links to /harees/settings with the default description
 * <SetupBanner />
 *
 * @example
 * // Custom destination + description
 * <SetupBanner
 *   href="/quantix/settings"
 *   description="Configure your calculator rules before adding products."
 * />
 */

// ─── i18n strings ────────────────────────────────────────────────────────────
// Move to your JSON locale file when ready (e.g. en.json → "setup_banner": { … })
const t = {
    /** Main heading shown inside the banner */
    title: 'Settings not configured',
    /** Default description when none is supplied via props */
    default_description: 'Set up your expiry thresholds first so products and batches can be tracked.',
    /** Label for the CTA navigation button */
    cta_label: 'Settings',
};
// ─────────────────────────────────────────────────────────────────────────────

import { Settings2, ArrowRight } from 'lucide-react';

/**
 * SetupBanner
 *
 * @param {Object} props
 * @param {string} [props.href='/harees/settings']  - URL the CTA button navigates to.
 *                                                    Should point to the settings page
 *                                                    relevant to the current feature.
 * @param {string} [props.description]              - Explanatory text shown below the title.
 *                                                    Customize per feature context.
 * @returns {JSX.Element}
 */
export default function SetupBanner({
    href        = '/harees/settings',
    description = t.default_description,
}) {
    return (
        <div
            className="rounded-2xl p-5 flex items-center justify-between gap-4"
            style={{ background: 'var(--accent)', border: '1px solid var(--border)' }}
        >
            {/* ── Left section: icon badge + text ── */}
            <div className="flex items-center gap-3">

                {/* Settings icon badge */}
                <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                    <Settings2 size={15} style={{ color: 'var(--primary)' }} />
                </div>

                {/* Title + description copy */}
                <div>
                    <p className="text-[12px] font-black" style={{ color: 'var(--foreground)' }}>
                        {t.title}
                    </p>
                    <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                        {description}
                    </p>
                </div>
            </div>

            {/* ── Right section: CTA link button ── */}
            <a
                href={href}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wide shrink-0 transition-opacity hover:opacity-80"
                style={{ background: 'var(--primary)', color: 'white' }}
            >
                {t.cta_label}
                <ArrowRight size={11} />
            </a>
        </div>
    );
}