/**
 * @file Instructions.jsx
 * @module Pages/Mustashar
 *
 * @description
 * Onboarding / instructions page for first-time Mustashar users.
 *
 * Responsibilities:
 *  - Render a three-step visual walkthrough explaining the Mustashar workflow
 *    (configure general settings → activate products → daily management).
 *  - Immediately write the `mustashar_seen_instructions` flag to `localStorage`
 *    on mount so the guard hook (`useMustasharGuard`) won't redirect the user
 *    here again on subsequent visits — no button click required.
 *
 * The page delegates all layout and visual styling to `InstructionsLayout`,
 * keeping this file focused purely on page-specific data (step definitions,
 * i18n strings) and the one mount side-effect (localStorage flag write).
 *
 * All user-facing strings are defined in the `t` object for easy i18n extraction.
 */


import { useEffect } from "react";
import InstructionsLayout from "../../Layouts/InstructionsLayout";

// ---------------------------------------------------------------------------
// i18n placeholder — move these strings to your translation JSON when ready
// ---------------------------------------------------------------------------

/**
 * @type {Object.<string, string>}
 * All user-facing strings for this page, keyed for easy i18n migration.
 */
const t = {
    app_name:          "AL Mustashar",
    subtitle:          "Smart calculator for e-commerce",
    description:       "Turn measurements into instant orders. Set up once and let the smart engine handle all the complex calculations for you — precision built right in.",
    footer_note:       "Quantix Smart Calculator · Set up your rules once and automate product calculations across your store",

    // Step 1
    step1_title:       "General Settings",
    step1_desc:        "Define your coverage per unit and waste percentage to power the calculation engine.",
    step1_badge:       "Coverage per unit (m²) · Waste percentage (%)",

    // Step 2
    step2_title:       "Activate Products",
    step2_desc:        "Select which products use the smart calculator from your product catalogue. Toggle products on or off and filter by category.",
    step2_badge:       "Toggle products on or off",

    // Step 3
    step3_title:       "Daily Management",
    step3_desc:        "Manage active products and edit calculation settings anytime from the dashboard. Live overview always available.",
    step3_badge:       "Live overview from Dashboard",
};

// ---------------------------------------------------------------------------
// Icon components — inline SVG micro-components
// ---------------------------------------------------------------------------

/**
 * SliderIcon — decorative icon for the "General Settings" step badge.
 * Represents sliders / range inputs, matching the settings theme.
 * @returns {JSX.Element}
 */
const SliderIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
    <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
  </svg>
);

/**
 * ToggleIcon — decorative icon for the "Activate Products" step badge.
 * Represents a toggle switch, matching the enable/disable theme.
 * @returns {JSX.Element}
 */
const ToggleIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
    <path d="M5 9A4 4 0 1 0 5 17 4 4 0 0 0 5 9zM5 7a6 6 0 1 1 0 12A6 6 0 0 1 5 7zm10 0a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm-4.5 6a4.5 4.5 0 1 0 9 0 4.5 4.5 0 0 0-9 0z" />
  </svg>
);

/**
 * ChartIcon — decorative icon for the "Daily Management" step badge.
 * Represents a bar chart, matching the live-dashboard theme.
 * @returns {JSX.Element}
 */
const ChartIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
  </svg>
);

// ---------------------------------------------------------------------------
// Steps data
// ---------------------------------------------------------------------------

/**
 * Ordered array of onboarding step definitions consumed by `InstructionsLayout`.
 * Each entry maps to one `<StepRow>` card in the three-step walkthrough.
 *
 * Fields:
 *  - `number`        — display numeral rendered inside the step badge circle.
 *  - `title`         — step heading shown inside the content card.
 *  - `desc`          — one-sentence explanation of the step's purpose.
 *  - `badge`         — short label shown on the pill badge inside the card.
 *  - `badgeIcon`     — JSX icon rendered inside the badge pill.
 *  - `rotate`        — Tailwind rotation class applied to the badge square.
 *  - `counterRotate` — Tailwind rotation that cancels the badge rotation on the numeral.
 *  - `offset`        — optional Tailwind class for horizontal staggering of the row.
 *
 * @type {Array<Object>}
 */
const STEPS = [
  {
    number:        "1",
    title:         t.step1_title,
    desc:          t.step1_desc,
    badge:         t.step1_badge,
    badgeIcon:     <SliderIcon />,
    rotate:        "rotate-12",
    counterRotate: "-rotate-12",
    offset:        "",
  },
  {
    number:        "2",
    title:         t.step2_title,
    desc:          t.step2_desc,
    badge:         t.step2_badge,
    badgeIcon:     <ToggleIcon />,
    rotate:        "-rotate-12",
    counterRotate: "rotate-12",
    offset:        "md:ml-20",
  },
  {
    number:        "3",
    title:         t.step3_title,
    desc:          t.step3_desc,
    badge:         t.step3_badge,
    badgeIcon:     <ChartIcon />,
    rotate:        "rotate-12",
    counterRotate: "-rotate-12",
    offset:        "",
  },
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

/**
 * Instructions
 *
 * First-visit onboarding page for Mustashar.
 * Renders the three-step walkthrough via `InstructionsLayout` and immediately
 * marks the page as "seen" in localStorage on mount.
 *
 * @component
 * @returns {JSX.Element}
 */
export default function Instructions() {
  /**
   * Write the "seen" flag as soon as the component mounts — the user doesn't
   * need to click a "Got it" button; viewing the page is sufficient.
   * `useMustasharGuard` reads this key to determine whether to skip the redirect.
   */
  useEffect(() => {
    localStorage.setItem("mustashar_seen_instructions", "true");
  }, []);

  return (
    <InstructionsLayout
      appName={t.app_name}
      subtitle={t.subtitle}
      description={t.description}
      steps={STEPS}
      footerNote={t.footer_note}
    />
  );
}