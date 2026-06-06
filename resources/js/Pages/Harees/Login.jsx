/**
 * @file Pages/Harees/Login.jsx
 * @description Entry-point login page for the **Harees** app
 *              (حريص — batch-by-batch expiry tracking for Salla merchants).
 *
 *              This file is intentionally config-only.  All visual structure,
 *              animations, and shared UI logic live in `LoginLayout`.
 *              The sole responsibility here is to supply Harees-specific tokens:
 *
 *              • i18n translation function (`t`)
 *              • Hero image (`imageSrc`)
 *              • Brand colour palette (`gradientFrom/To`, `accentColor`, etc.)
 *              • OAuth endpoint (`authHref`)
 *
 *              What this file inherits automatically from LoginLayout:
 *                ✓ SplitText animation on the "حريص / Harees" headline
 *                ✓ Reveal animation on the right (white) panel
 *                ✓ `useFonts` hook — consistent font resolution across the app
 *                ✓ Translation strings loaded from JSON via i18next
 *
 * @module Pages/Harees/Login
 */

import { useTranslation } from 'react-i18next';
import LoginLayout from '@/Layouts/LoginLayout';


/**
 * HareesLogin — login page component for the Harees app.
 *
 * Passes all Harees-specific configuration to the shared `LoginLayout`.
 * Translation strings are loaded from `harees-login` namespace JSON files
 * via i18next. No visual logic lives here.
 *
 * @component
 *
 * @param {object} props
 * @param {string} [props.status] - Optional Inertia session / flash status
 *                                  message (e.g. "Session expired, please
 *                                  sign in again"). Forwarded to LoginLayout
 *                                  and displayed above the CTA button.
 *
 * @returns {JSX.Element}
 */
export default function HareesLogin({ status }) {
    const { t } = useTranslation('harees-login');

    return (
        <LoginLayout
            // ── i18n ─────────────────────────────────────────────────────────
            t={t}

            // ── Hero image ───────────────────────────────────────────────────
            imageSrc={"https://res.cloudinary.com/dj0kywi0q/image/upload/v1780725450/hareesLogin_gj6xgo.webp"}
            imageAlt="Harees"

            // ── Brand colours ────────────────────────────────────────────────
            gradientFrom="#8D82FF"
            gradientTo="#B7AEFF"
            accentColor="#8D82FF"
            accentLight="#F4F1FF"
            shadowColor="141,130,255"

            // ── OAuth ────────────────────────────────────────────────────────
            authHref="/auth/salla?app=harees"

            // ── Layout tweaks ────────────────────────────────────────────────
            imageScale="scale-[1.15]"
            showBackHome={true}
            bgColor="#F5F2FA"

            // ── Inertia status ───────────────────────────────────────────────
            status={status}
        />
    );
}

/**
 * Opt out of the default Inertia layout wrapper so this page renders
 * full-screen without the application shell.
 */
HareesLogin.layout = page => page;