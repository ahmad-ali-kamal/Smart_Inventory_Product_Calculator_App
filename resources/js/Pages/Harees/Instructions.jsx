/**
 * @file Instructions.jsx
 * @module Pages/Harees
 *
 * @description
 * Onboarding / instructions page for first-time Harees users.
 *
 * Responsibilities:
 *  - Render a three-step visual walkthrough that explains the Harees workflow
 *    (classify products → set alert period → auto-hide & discount).
 *  - Immediately write the `harees_seen_instructions` flag to `localStorage`
 *    on mount so the guard hook (`useHareesGuard`) won't redirect the user
 *    here again on subsequent visits — no button click required.
 *
 * The page delegates layout and styling to `InstructionsLayout`, keeping this
 * file focused on data (step definitions) and the side-effect (flag write).
 */

import { useEffect } from "react";
import InstructionsLayout from "../../Layouts/InstructionsLayout";

// ─── Icon components ──────────────────────────────────────────────────────────
// Inline SVG icons defined as micro-components to avoid an icon-library import
// while keeping the JSX readable.  Each icon corresponds to one onboarding step.

/**
 * CheckIcon — used for the "Classify Products" step badge.
 * @returns {JSX.Element}
 */
const CheckIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

/**
 * BellIcon — used for the "Set Alert Period" step badge.
 * @returns {JSX.Element}
 */
const BellIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
  </svg>
);

/**
 * StarIcon — used for the "Auto-Hide & Discount" step badge.
 * @returns {JSX.Element}
 */
const StarIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

// ─── Steps data ───────────────────────────────────────────────────────────────
/**
 * Ordered array of onboarding step definitions consumed by `InstructionsLayout`.
 * Each entry maps to one visual card in the three-step walkthrough.
 *
 * Fields:
 *  - `number`        — display numeral rendered inside the step circle.
 *  - `title`         — step heading shown in the card.
 *  - `desc`          — one-sentence explanation of the step's purpose.
 *  - `badge`         — short label shown on the floating pill badge.
 *  - `badgeIcon`     — JSX icon rendered inside the badge.
 *  - `rotate`        — Tailwind rotation class applied to the card container.
 *  - `counterRotate` — Tailwind rotation class applied to the inner content
 *                      (cancels the card rotation to keep text legible).
 *  - `offset`        — optional horizontal offset class for visual staggering.
 *
 * @type {Array<Object>}
 */
const STEPS = [
  {
    number:        "1",
    title:         "Classify Products",
    desc:          "Categorize your products: long-term, medium-term, or short-term",
    badge:         "Organize products",
    badgeIcon:     <CheckIcon />,
    rotate:        "rotate-12",
    counterRotate: "-rotate-12",
    offset:        "",
  },
  {
    number:        "2",
    title:         "Set Alert Period",
    desc:          "Define when you want to be notified before expiration",
    badge:         "Notifications",
    badgeIcon:     <BellIcon />,
    rotate:        "-rotate-12",
    counterRotate: "rotate-12",
    offset:        "md:ml-20",
  },
  {
    number:        "3",
    title:         "Auto-Hide & Discount",
    desc:          "Set custom discounts for products nearing expiry, The product will be hidden automatically only when all its batches have fully expired.",
    badge:         "Manage product expiry",
    badgeIcon:     <StarIcon />,
    rotate:        "rotate-12",
    counterRotate: "-rotate-12",
    offset:        "",
  },
];

// ─── Page component ───────────────────────────────────────────────────────────

/**
 * Instructions
 *
 * First-visit onboarding page for Harees.  Renders the three-step walkthrough
 * and immediately marks the page as "seen" in localStorage on mount so the
 * guard hook won't redirect here again.
 *
 * @component
 * @returns {JSX.Element}
 */
export default function Instructions() {
    /**
     * Write the flag as soon as the component mounts — the user doesn't need
     * to click a "Got it" button; viewing the page is sufficient.
     * `useHareesGuard` reads this key to determine whether to skip the redirect.
     */
    useEffect(() => {
        localStorage.setItem("harees_seen_instructions", "true");
    }, []);

    return (
        <InstructionsLayout
            appName="Harees"
            subtitle="Three simple steps to get started"
            description="Track product expiry dates intelligently. Set up categories once and let the system monitor everything and set your own discounts with one click, while the system auto-hides products when all its batches have fully expired."
            steps={STEPS}
            footerNote="Harees · All Channels · All Products"
        />
    );
}