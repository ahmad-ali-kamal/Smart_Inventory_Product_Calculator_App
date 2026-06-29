/**
 * @file Welcome.jsx
 * @project Quantix — Intelligent Salla Store Management Platform (Harees & Mustashar)
 *
 * @description
 * Landing page entry point and top-level page component.
 *
 * This file is intentionally kept thin — it acts as a composition root:
 *  - Resolves language, direction, and font context from shared hooks.
 *  - Injects global CSS (fonts, resets, responsive breakpoints) once at the top level.
 *  - Renders the fixed Navbar outside `<main>` so it overlays all sections.
 *  - Delegates all visual and interactive work to focused section components
 *    (HeroSection, FeaturesSection, PlatformsSection, Footer).
 *
 * Adding a new section requires only a new import and a single JSX line inside
 * `<main>` — nothing else in this file needs to change.
 *
 * Inertia persistent layout is applied via `Welcome.layout` so the GuestLayout
 * wrapper survives client-side navigation without remounting.
 *
 * @module Pages/Welcome
 */

import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useLang } from '@/hooks/useLang';
import GuestLayout from '@/Layouts/GuestLayout';

import globalStyles from '@/styles/globalStyles';
import { useFonts } from '@/hooks/useFonts';

import Navbar           from '@/Components/Welcome/Navbar';
import Footer           from '@/Components/Welcome/Footer';
import HeroSection      from '@/Components/Welcome/hero/HeroSection';
import FeaturesSection  from '@/Components/Welcome/sections/FeatureSection';
import PlatformsSection from '@/Components/Welcome/sections/PlatformsSection';

/**
 * Fixed height (in px) of the top navigation bar.
 * Passed down to components that need to offset their layout or
 * detect scroll thresholds relative to the navbar height.
 *
 * @constant {number}
 */
const NAV_H = 58;

/**
 * Welcome
 *
 * Public landing page for the Quantix platform.
 * Composes Navbar + four content sections in a single full-viewport layout.
 *
 * Language and font values are resolved from shared hooks and threaded down
 * to every section as props, keeping each section stateless and reusable.
 *
 * @returns {JSX.Element}
 */
export default function Welcome() {
    /*
     * useLang — resolves the active locale ('ar' | 'en'), a boolean flag for
     * Arabic (`isAr`), and the text-direction string ('rtl' | 'ltr').
     */
    const { dir } = useLang();

    /** i18next translation function — scoped to the 'welcome' namespace. */
    const { t } = useTranslation('welcome');

    /*
     * useFonts — returns:
     *   ff       : heading / UI font-family string
     *   bodyFont : body / paragraph font-family string
     * Both are locale-aware (Arabic vs Latin typefaces).
     */
    const { ff, bodyFont } = useFonts();

    return (
        <>
            {/* Browser tab title — shown in page title and social meta tags */}
            <Head title="QUANTIX — منصة إدارة المتاجر الذكية" />

            {/* Inject global styles once at the page root (fonts, resets, breakpoints) */}
            <style>{globalStyles}</style>

            {/*
             * Navbar is rendered outside <main> so its fixed positioning overlays
             * all sections without affecting the document flow.
             */}
            <Navbar t={t} ff={ff} dir={dir} NAV_H={NAV_H} />

            {/*
             * Main content column.
             * `dir` applies the correct text direction for the active locale.
             * Section order matches the intended reading/scroll flow:
             *   Hero → Features → Platforms → Footer
             */}
            <main dir={dir}>
                <HeroSection      t={t} ff={ff} bodyFont={bodyFont} dir={dir} NAV_H={NAV_H} />
                <FeaturesSection  t={t} ff={ff} bodyFont={bodyFont} />
                <PlatformsSection t={t} ff={ff} bodyFont={bodyFont} />
                <Footer           t={t} ff={ff} bodyFont={bodyFont} dir={dir} />
            </main>
        </>
    );
}

/**
 * Persistent Inertia layout — wraps the page in GuestLayout on every visit.
 * Defined outside the component so Inertia can apply it without re-rendering
 * the layout on client-side navigations.
 *
 * @param {React.ReactNode} page - The rendered page component.
 * @returns {JSX.Element}
 */
Welcome.layout = page => <GuestLayout>{page}</GuestLayout>;