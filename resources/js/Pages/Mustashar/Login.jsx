/**
 * @file Pages/Mustashar/Login.jsx
 * @description Entry-point login page for the **Mustashar** app
 *              (المستشار — smart quantity-calculation widget for Salla stores).
 *
 *              This file is intentionally config-only.  All visual structure,
 *              animations, and shared UI logic live in `LoginLayout`.
 *              The sole responsibility here is to supply Mustashar-specific tokens:
 *
 *              • Bilingual copy (`translations`)
 *              • Hero image (`imageSrc`)
 *              • Brand colour palette (`gradientFrom/To`, `accentColor`, etc.)
 *              • OAuth endpoint (`authHref`)
 *
 *              What this file inherits automatically from LoginLayout:
 *                ✓ SplitText animation on the "المستشار / Mustashar" headline
 *                ✓ Reveal animation on the right (white) panel
 *                ✓ `useFonts` hook — consistent font resolution across the app
 *                ✓ No @import duplication — fonts are loaded once via globalStyles.js
 *
 * @module Pages/Mustashar/Login
 */

import LoginLayout from '@/Layouts/LoginLayout';
import heroImage from '@/assets/mustasharLogin.webp';

// ---------------------------------------------------------------------------
// Bilingual translations for every string rendered inside LoginLayout.
// Structured as `{ ar: {...}, en: {...} }` so the layout can resolve the
// correct locale via the `useLang` hook without any coupling to i18n libraries.
//
// To migrate to a JSON i18n file (e.g. with i18next):
//   1. Copy each locale block to `public/locales/{lang}/mustashar-login.json`
//   2. Replace this constant with `const t = useTranslation('mustashar-login')`
// ---------------------------------------------------------------------------
const T = {
    /** Arabic (RTL) copy */
    ar: {
        /** HTML <title> for the login page */
        pageTitle:  'المستشار — تسجيل الدخول',
        /** Label for the "Back to Home" navigation pill */
        backHome:   'العودة للرئيسية',
        /** Primary app name — animated character-by-character via SplitText */
        appName:    'المستشار',
        /** One-line value proposition shown beneath the app name */
        appSub:     'دليلك الذكي لحساب الكميات بدقة',
        /** Longer descriptive paragraph about the app */
        appDesc:    'ودّع أخطاء القياس وهدر المخزون. المستشار يساعد عملائك على حساب احتياجهم الدقيق من (الأمتار، المساحات، أو القطع) بذكاء وسهولة، مباشرة من صفحة المنتج.',
        /** Numbered onboarding steps guiding new users through setup */
        steps: [
            { title: 'امتلك متجراً في سلة',     sub: 'تأكد من تفعيل متجرك على منصة سلة' },
            { title: 'ثبّت تطبيق المستشار',     sub: 'ستجده في متجر تطبيقات سلة بكل سهولة' },
            { title: 'ابدأ الإعداد بضغطة زر',   sub: 'سجّل دخولك واربط منتجاتك في ثوانٍ' },
        ],
        /** Right-panel heading */
        loginNow:  'تسجيل الدخول',
        /** Right-panel sub-heading */
        loginSub:  'وصول سريع وآمن عبر حسابك في سلة',
        /** Label for the Salla OAuth CTA button */
        sallaBtn:  'الدخول عبر سلة ←',
        /** Disclaimer note explaining Salla-only access */
        note:      'تطبيق المستشار مصمم خصيصاً لخدمة تجار سلة. تأكد من تثبيت التطبيق أولاً لتتمكن من الدخول.',
        /** "Already have an account?" prompt */
        already:   '',
        /** Inline login link label following the `already` prompt */
        loginLink: '',
    },

    /** English (LTR) copy */
    en: {
        pageTitle:  'Mustashar — Login',
        backHome:   'Back Home',
        appName:    'Mustashar',
        appSub:     'The Smart Quantity Guide for Your Store',
        appDesc:    'Say goodbye to measurement errors and stock waste. Mustashar helps your customers calculate exactly what they need (Meters, Areas, or Units) directly from the product page.',
        steps: [
            { title: 'Have a Salla Store',  sub: 'Ensure your merchant account is active on Salla' },
            { title: 'Install Mustashar',   sub: 'Find us easily in the Salla App Store' },
            { title: 'Start Setting Up',    sub: 'Log in and sync your products in seconds' },
        ],
        loginNow:  'Sign In',
        loginSub:  'Fast and secure access via your Salla account',
        sallaBtn:  'Continue with Salla →',
        note:      'Mustashar is exclusively built for Salla merchants. Please install the app first to gain access.',
        already:   '',
        loginLink: '',
    },
};

/**
 * MustasharLogin — login page component for the Mustashar app.
 *
 * Passes all Mustashar-specific configuration to the shared `LoginLayout`.
 * No visual logic lives here; add new UI features to `LoginLayout` instead
 * and expose them via props if they need per-app customisation.
 *
 * Note: This component accepts no props (unlike HareesLogin which forwards
 * a `status` flash message). Add a `status` prop here if Inertia session
 * feedback is needed for this app in the future.
 *
 * @component
 * @returns {JSX.Element}
 */
export default function MustasharLogin() {
    return (
        <LoginLayout
            // ── Copy ──────────────────────────────────────────────────────────
            translations={T}

            // ── Hero image ───────────────────────────────────────────────────
            imageSrc={heroImage}
            imageAlt="Mustashar"

            // ── Brand colours ────────────────────────────────────────────────
            /** Left-panel gradient: medium violet → soft periwinkle */
            gradientFrom="#8B7CFF"
            gradientTo="#B6A9FF"
            /** Accent colour for buttons, links, and step numbers on the right panel */
            accentColor="#8B7CFF"
            /** Light tint for step-number circle backgrounds */
            accentLight="#EEEDFB"
            /**
             * RGB triplet (no `rgba` wrapper) used to construct box-shadow colours.
             * Slightly deeper than the gradient colours for a grounded shadow effect.
             */
            shadowColor="104,96,212"

            // ── OAuth ────────────────────────────────────────────────────────
            /** Redirect target for the "Continue with Salla" button */
            authHref="/auth/salla?app=mustashar"

            // ── Layout tweaks ────────────────────────────────────────────────
            /**
             * Scales the hero image slightly larger than the default (scale-[1.25])
             * is actually the same as default here — kept explicit for clarity and
             * easy future adjustments without touching LoginLayout.
             */
            imageScale="scale-[1.25]"
            /** Show the "Back to Home" pill in the left-panel header */
            showBackHome={true}
            /** Page background outside the card — a light violet tint */
            bgColor="#F1EDFF"
        />
    );
}

/**
 * Opt out of the default Inertia layout wrapper so this page renders
 * full-screen without the application shell.
 */
MustasharLogin.layout = page => page;