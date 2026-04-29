// resources/js/Pages/Calculator/Instructions.jsx
import { router } from '@inertiajs/react';
import InstructionsLayout from '../../Components/UI/InstructionsLayout';
import { SlidersHorizontal, ToggleRight, BarChart2 } from 'lucide-react';

/* ── Icons ── */
const SliderIcon = () => (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
    </svg>
);

const ToggleIcon = () => (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M5 9A4 4 0 1 0 5 17 4 4 0 0 0 5 9zM5 7a6 6 0 1 1 0 12A6 6 0 0 1 5 7zm10 0a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm-4.5 6a4.5 4.5 0 1 0 9 0 4.5 4.5 0 0 0-9 0z" />
    </svg>
);

const ChartIcon = () => (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
    </svg>
);

/* ── Steps data ── */
const STEPS = [
    {
        number:        '1',
        title:         'General Settings',
        desc:          'Define your coverage per unit and waste percentage to power the calculation engine.',
        badge:         'Coverage per unit (m²) · Waste percentage (%)',
        badgeIcon:     <SliderIcon />,
        rotate:        'rotate-12',
        counterRotate: '-rotate-12',
        offset:        '',
    },
    {
        number:        '2',
        title:         'Activate Products',
        desc:          'Select which products use the smart calculator from your product catalogue. Toggle products on or off and filter by category.',
        badge:         'Toggle products on or off',
        badgeIcon:     <ToggleIcon />,
        rotate:        '-rotate-12',
        counterRotate: 'rotate-12',
        offset:        'md:ml-20',
    },
    {
        number:        '3',
        title:         'Daily Management',
        desc:          'Manage active products and edit calculation settings anytime from the dashboard. Live overview always available.',
        badge:         'Live overview from Dashboard',
        badgeIcon:     <ChartIcon />,
        rotate:        'rotate-12',
        counterRotate: '-rotate-12',
        offset:        '',
    },
];

export default function Instructions() {
    return (
        <InstructionsLayout
            appName="Calculator Tool"
            subtitle="Smart calculator for e-commerce"
            description="Turn measurements into instant orders. Set up once and let the smart engine handle all the complex calculations for you — precision built right in."
            steps={STEPS}
            ctaLabel="Go to Dashboard"
            onCta={() => router.visit('/dashboard')}
            footerNote="Quantix Smart Calculator · Set up your rules once and automate product calculations across your store"
        />
    );
}