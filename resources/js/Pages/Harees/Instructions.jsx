import { useTranslation } from 'react-i18next';
import { useEffect } from "react";
import InstructionsLayout from "../../Layouts/InstructionsLayout";

const CheckIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const PenIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

function buildSteps(t) {
    return [
        {
            number:        "1",
            title:         t('instructions.step1_title'),
            desc:          t('instructions.step1_desc'),
            badge:         t('instructions.step1_badge'),
            badgeIcon:     <CheckIcon />,
            rotate:        "rotate-12",
            counterRotate: "-rotate-12",
            offset:        "",
        },
        {
            number:        "2",
            title:         t('instructions.step2_title'),
            desc:          t('instructions.step2_desc'),
            badge:         t('instructions.step2_badge'),
            badgeIcon:     <PenIcon />,
            rotate:        "-rotate-12",
            counterRotate: "rotate-12",
            offset:        "md:ml-20",
        },
        {
            number:        "3",
            title:         t('instructions.step3_title'),
            desc:          t('instructions.step3_desc'),
            badge:         t('instructions.step3_badge'),
            badgeIcon:     <StarIcon />,
            rotate:        "rotate-12",
            counterRotate: "-rotate-12",
            offset:        "",
        },
    ];
}

export default function Instructions() {
    const { t } = useTranslation('harees');
    const steps = buildSteps(t);

    useEffect(() => {
        localStorage.setItem("harees_seen_instructions", "true");
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