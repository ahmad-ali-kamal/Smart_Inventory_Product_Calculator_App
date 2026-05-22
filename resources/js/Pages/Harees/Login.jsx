/**
 * @file Pages/Harees/Login.jsx
 * @description Entry-point login page for the **Harees** app
 *              (حريص — batch-by-batch expiry tracking for Salla merchants).
 *
 *              This file is intentionally config-only.  All visual structure,
 *              animations, and shared UI logic live in `LoginLayout`.
 *              The sole responsibility here is to supply Harees-specific tokens:
 *
 *              • Bilingual copy (`translations`)
 *              • Hero image (`imageSrc`)
 *              • Brand colour palette (`gradientFrom/To`, `accentColor`, etc.)
 *              • OAuth endpoint (`authHref`)
 *
 *              What this file inherits automatically from LoginLayout:
 *                ✓ SplitText animation on the "حريص / Harees" headline
 *                ✓ Reveal animation on the right (white) panel
 *                ✓ `useFonts` hook — consistent font resolution across the app
 *                ✓ No @import duplication — fonts are loaded once via globalStyles.js
 *
 * @module Pages/Harees/Login
 */

import LoginLayout from '@/Layouts/LoginLayout';
import heroImage from '@/assets/hareesLogin.webp';

// ---------------------------------------------------------------------------
// Bilingual translations for every string rendered inside LoginLayout.
// Structured as `{ ar: {...}, en: {...} }` so the layout can resolve the
// correct locale via the `useLang` hook without any coupling to i18n libraries.
//
// To migrate to a JSON i18n file (e.g. with i18next):
//   1. Copy each locale block to `public/locales/{lang}/harees-login.json`
//   2. Replace this constant with `const t = useTranslation('harees-login')`
// ---------------------------------------------------------------------------
const T = {
    /** Arabic (RTL) copy */
    ar: {
        /** HTML <title> for the login page */
        pageTitle:  'حريص — تسجيل الدخول',
        /** Label for the "Back to Home" navigation pill */
        backHome:   'العودة للرئيسية',
        /** Primary app name — animated character-by-character via SplitText */
        appName:    'حريص',
        /** One-line value proposition shown beneath the app name */
        appSub:     'إدارة المخزون الذكية',
        /** Longer descriptive paragraph about the app */
        appDesc:    'نظام متكامل لمتابعة تواريخ الصلاحية، يُنظّم مخزونك دفعةً بدفعة ويحمي أرباحك من الهدر.',
        /** Bullet-point feature list displayed on the left panel */
        features: [
            'تتبع تواريخ الصلاحية دفعةً بدفعة',
            'تنبيهات المنتجات قريبة الانتهاء',
            ' تطبيق خصومات لتجنب الهدر',
            'تكامل مباشر مع منصة سلة',
        ],
        /** Numbered onboarding steps guiding new users through setup */
        steps: [
            { title: 'افتح متجرك في سلة',    sub: 'أنشئ حساب تاجر مجاني في منصة سلة' },
            { title: 'ثبّت تطبيق حريص',      sub: 'ابحث عن "حريص" في سوق تطبيقات سلة' },
            { title: 'سجّل دخولك هنا',        sub: 'استخدم بريد حساب سلة للدخول' },
        ],
        /** Right-panel heading */
        loginNow:  'سجّل دخولك الآن',
        /** Right-panel sub-heading */
        loginSub:  'ادخل مباشرةً عبر حساب سلة',
        /** Label for the Salla OAuth CTA button */
        sallaBtn:  'دخول عبر سلة ←',
        /** Disclaimer note explaining Salla-only access */
        note:      'حريص متاح حصرياً لتجار سلة — ثبّت التطبيق من متجر سلة للحصول على حسابك',
        /** Support contact label in the left-panel footer */
        support:   'حريص / الدعم الفني',
        /** "Already have an account?" prompt */
        already:   'لديك حساب بالفعل؟',
        /** Inline login link label following the `already` prompt */
        loginLink: 'تسجيل الدخول',
    },

    /** English (LTR) copy */
    en: {
        pageTitle:  'Harees — Login',
        backHome:   'Back to Home',
        appName:    'Harees',
        appSub:     'Smart Inventory Management',
        appDesc:    'A complete expiry monitoring system that organizes your inventory batch by batch and protects your profits from waste.',
        features: [
            'Batch-by-batch expiry date tracking',
            'Near-expiry product alerts',
            'Discount application to minimize waste',
            'Direct Salla platform integration',
        ],
        steps: [
            { title: 'Open your Salla store',  sub: 'Create a free merchant account on Salla' },
            { title: 'Install Harees app',     sub: 'Search for "Harees" in the Salla App Market' },
            { title: 'Sign in here',           sub: 'Use your Salla account email to log in' },
        ],
        loginNow:  'Sign in now',
        loginSub:  'Access directly via your Salla account',
        sallaBtn:  'Continue with Salla →',
        note:      'Harees is exclusively available to Salla merchants — install from the Salla App Market to get your account',
        support:   'Harees / Support',
        already:   'Already have an account?',
        loginLink: 'Log in',
    },
};

/**
 * HareesLogin — login page component for the Harees app.
 *
 * Passes all Harees-specific configuration to the shared `LoginLayout`.
 * No visual logic lives here; add new UI features to `LoginLayout` instead
 * and expose them via props if they need per-app customisation.
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
    return (
        <LoginLayout
            // ── Copy ──────────────────────────────────────────────────────────
            translations={T}

            // ── Hero image ───────────────────────────────────────────────────
            imageSrc={heroImage}
            imageAlt="Harees"

            // ── Brand colours ────────────────────────────────────────────────
            /** Left-panel gradient: soft lavender → light purple */
            gradientFrom="#8D82FF"
            gradientTo="#B7AEFF"
            /** Accent colour for buttons, links, and step numbers on the right panel */
            accentColor="#8D82FF"
            /** Light tint for step-number circle backgrounds */
            accentLight="#F4F1FF"
            /**
             * RGB triplet (no `rgba` wrapper) used to construct box-shadow colours.
             * Keeping it as a raw triplet allows LoginLayout to control the alpha.
             */
            shadowColor="141,130,255"

            // ── OAuth ────────────────────────────────────────────────────────
            /** Redirect target for the "Continue with Salla" button */
            authHref="/auth/salla?app=harees"

            // ── Layout tweaks ────────────────────────────────────────────────
            /**
             * Scales the hero image slightly larger than the default (scale-[1.25])
             * to better fill the left panel given Harees's hero image composition.
             */
            imageScale="scale-[1.15]"
            /** Show the "Back to Home" pill in the left-panel header */
            showBackHome={true}
            /** Page background outside the card */
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