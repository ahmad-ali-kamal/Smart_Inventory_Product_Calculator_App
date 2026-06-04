import { useTranslation } from 'react-i18next';
import { useEffect } from "react";
import InstructionsLayout from "../../Layouts/InstructionsLayout";

// ---------------------------------------------------------------------------
// Step Icons — each follows the same minimal SVG pattern:
// className="w-3 h-3", fill="currentColor", viewBox="0 0 20 20"
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// buildSteps — constructs the ordered step config array.
//
// Offset values use logical `md:ms-20` (margin-inline-start) instead of
// `md:ml-20` so the stagger mirrors correctly in RTL without extra overrides.
// ---------------------------------------------------------------------------

// STEPS يعتمد على t — لذلك يُبنى داخل function تستقبل t
function buildSteps(t) {
    return [
        {
            number:        "1",
            title:         t('instructions.step1_title'),
            desc:          t('instructions.step1_desc'),
            badge:         t('instructions.step1_badge'),
            badgeIcon:     <SliderIcon />,
            rotate:        "rotate-12",
            counterRotate: "-rotate-12",
            offset:        "",
        },
        {
            number:        "2",
            title:         t('instructions.step2_title'),
            desc:          t('instructions.step2_desc'),
            badge:         t('instructions.step2_badge'),
            badgeIcon:     <ToggleIcon />,
            rotate:        "-rotate-12",
            counterRotate: "rotate-12",
            offset:        "md:ms-20",
        },
        {
            number:        "3",
            title:         t('instructions.step3_title'),
            desc:          t('instructions.step3_desc'),
            badge:         t('instructions.step3_badge'),
            badgeIcon:     <ChartIcon />,
            rotate:        "rotate-12",
            counterRotate: "-rotate-12",
            offset:        "",
        },
    ];
}

// ---------------------------------------------------------------------------
// Instructions — Mustashar page component
// ---------------------------------------------------------------------------

export default function Instructions() {
    const { t } = useTranslation('mustashar');
    const steps = buildSteps(t);

    useEffect(() => {
        localStorage.setItem("mustashar_seen_instructions", "true");
    }, []);

    return (
        <InstructionsLayout
            appName={t('instructions.app_name')}
            subtitle={t('instructions.subtitle')}
            description={t('instructions.description')}
            steps={steps}
            footerNote={t('instructions.footer_note')}
        />
    );
}