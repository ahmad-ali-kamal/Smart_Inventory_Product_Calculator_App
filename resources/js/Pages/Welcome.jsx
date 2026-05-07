import { Head } from '@inertiajs/react';
import { useLang } from '@/Hooks/useLang';
import GuestLayout from '@/Layouts/GuestLayout';

import T            from '@/constants/translations';
import globalStyles from '@/styles/globalStyles';
import { useFonts } from '@/hooks/useFonts';

import Navbar           from '@/Components/layout/Navbar';
import Footer           from '@/Components/layout/Footer';
import HeroSection      from '@/Components/hero/HeroSection';
import FeaturesSection  from '@/Components/sections/FeatureSection';
import PlatformsSection from '@/Components/sections/PlatformsSection';

const NAV_H = 58;

/**
 * Welcome — Landing page entry point.
 *
 * This file is intentionally kept thin: it wires up language/font context,
 * injects global styles once, and delegates all visual work to focused
 * section components. New sections can be added in <main> without touching
 * anything else.
 */
export default function Welcome() {
    const { lang, isAr, dir } = useLang();
    const t = T[lang];
    const { ff, bodyFont } = useFonts();

    return (
        <>
            <Head title="QUANTIX — منصة إدارة المتاجر الذكية" />

            {/* Global styles (fonts, resets, responsive breakpoints) */}
            <style>{globalStyles}</style>

            <Navbar t={t} ff={ff} dir={dir} NAV_H={NAV_H} />

            <main dir={dir}>
                <HeroSection      t={t} ff={ff} bodyFont={bodyFont} dir={dir} NAV_H={NAV_H} />
                <FeaturesSection  t={t} ff={ff} bodyFont={bodyFont} />
                <PlatformsSection t={t} ff={ff} bodyFont={bodyFont} />
                <Footer           t={t} ff={ff} bodyFont={bodyFont} />
            </main>
        </>
    );
}

Welcome.layout = page => <GuestLayout>{page}</GuestLayout>;