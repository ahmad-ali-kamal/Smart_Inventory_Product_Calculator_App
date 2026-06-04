/**
 * @file Pages/Mustashar/Login.jsx
 * @description Entry-point login page for the **Mustashar** app
 *              (المستشار — smart quantity-calculation widget for Salla stores).
 *
 *              This file is intentionally config-only.  All visual structure,
 *              animations, and shared UI logic live in `LoginLayout`.
 *              The sole responsibility here is to supply Mustashar-specific tokens:
 *
 *              • i18n translation function (`t`)
 *              • Hero image (`imageSrc`)
 *              • Brand colour palette (`gradientFrom/To`, `accentColor`, etc.)
 *              • OAuth endpoint (`authHref`)
 *
 *              What this file inherits automatically from LoginLayout:
 *                ✓ SplitText animation on the "المستشار / Mustashar" headline
 *                ✓ Reveal animation on the right (white) panel
 *                ✓ `useFonts` hook — consistent font resolution across the app
 *                ✓ Translation strings loaded from JSON via i18next
 *
 * @module Pages/Mustashar/Login
 */

import { useTranslation } from 'react-i18next';
import LoginLayout from '@/Layouts/LoginLayout';
import heroImage from '@/assets/mustasharLogin.webp';

/**
 * MustasharLogin — login page component for the Mustashar app.
 *
 * Passes all Mustashar-specific configuration to the shared `LoginLayout`.
 * Translation strings are loaded from `mustashar-login` namespace JSON files
 * via i18next. No visual logic lives here.
 *
 * @component
 * @returns {JSX.Element}
 */
export default function MustasharLogin() {
    const { t } = useTranslation('mustashar-login');

    return (
        <LoginLayout
            // ── i18n ─────────────────────────────────────────────────────────
            t={t}

            // ── Hero image ───────────────────────────────────────────────────
            imageSrc={heroImage}
            imageAlt="Mustashar"

            // ── Brand colours ────────────────────────────────────────────────
            gradientFrom="#8B7CFF"
            gradientTo="#B6A9FF"
            accentColor="#8B7CFF"
            accentLight="#EEEDFB"
            shadowColor="104,96,212"

            // ── OAuth ────────────────────────────────────────────────────────
            authHref="/auth/salla?app=mustashar"

            // ── Layout tweaks ────────────────────────────────────────────────
            imageScale="scale-[1.25]"
            showBackHome={true}
            bgColor="#F1EDFF"
        />
    );
}

/**
 * Opt out of the default Inertia layout wrapper so this page renders
 * full-screen without the application shell.
 */
MustasharLogin.layout = page => page;