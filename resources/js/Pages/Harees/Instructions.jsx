import { router } from "@inertiajs/react";
import InstructionsLayout from "../../Components/UI/InstructionsLayout";

/* ── Icons ── */
const CheckIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

/* ── Steps data ── */
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

/* ── Page ── */
export default function Instructions() {
    const handleProceed = () => {
        localStorage.setItem('harees_seen_instructions', 'true');
        router.visit('/harees/dashboard');
    };

  return (
    <InstructionsLayout
      appName="MerchantTools"
      subtitle="Three simple steps to get started"
      description="Track product expiry dates intelligently. Set up categories once and let the system monitor everything and set your own discounts with one click, while the system auto-hides products when all its batches have fully expired."
      steps={STEPS}
      ctaLabel="Go to Settings"
        onCta={handleProceed}
      footerNote="MerchantTools · All Channels · All Products"
    />
  );
}