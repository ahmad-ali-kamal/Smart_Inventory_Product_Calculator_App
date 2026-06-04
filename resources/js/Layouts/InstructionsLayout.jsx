/**
 * @file InstructionsLayout.jsx
 * @module Layouts
 *
 * @description
 * Reusable full-page layout component for onboarding / instruction screens
 * used across all Quantix sub-applications (Mustashar, Harees).
 *
 * Renders:
 *  - A shared `<Header />` at the top of the page.
 *  - An atmospheric fixed background composed of radial gradients, concentric
 *    rings, scattered decorative dots, and a horizontal accent line.
 *  - A centered content column (max-width 4xl) containing:
 *      – A hero card with the app name and subtitle.
 *      – An optional description paragraph.
 *      – A vertically stacked list of `<StepRow>` cards.
 *      – An optional CTA button.
 *      – An optional footer note.
 *  - Supports a fully custom content slot (`customContent`) that bypasses
 *    the default hero + steps layout for one-off pages.
 *
 * Also exports `StepRow` as a named export for use in custom layouts.
 *
 * All user-facing strings are defined in the `t` object for easy i18n extraction.
 */

import { ArrowRight } from "lucide-react";
import Header from "../Components/UI/Header";

// ---------------------------------------------------------------------------
// i18n placeholder — move these strings to your translation JSON when ready
// ---------------------------------------------------------------------------

/**
 * @type {Object.<string, string>}
 * Static UI strings used in this layout, ready for i18n extraction.
 * Currently unused at the layout level (all strings come via props),
 * but kept here to establish the pattern for future additions.
 */
const t = {
    // No hardcoded strings in the layout itself — all text is passed via props.
    // This object is intentionally empty and serves as an extension point.
};

// ---------------------------------------------------------------------------
// DOTS — decorative background scatter pattern
// ---------------------------------------------------------------------------

/**
 * Positional and visual descriptors for the decorative dot elements
 * rendered in the fixed atmospheric background layer.
 *
 * @type {Array<{
 *   top:     string,
 *   left?:   string,
 *   right?:  string,
 *   size:    number,
 *   opacity: number
 * }>}
 */
const DOTS = [
  { top: "15%", left: "8%",   size: 6, opacity: 0.35 },
  { top: "25%", left: "20%",  size: 4, opacity: 0.20 },
  { top: "60%", left: "5%",   size: 5, opacity: 0.25 },
  { top: "80%", left: "15%",  size: 4, opacity: 0.15 },
  { top: "10%", right: "12%", size: 6, opacity: 0.35 },
  { top: "40%", right: "6%",  size: 4, opacity: 0.20 },
  { top: "70%", right: "18%", size: 5, opacity: 0.25 },
  { top: "90%", right: "8%",  size: 3, opacity: 0.15 },
];

// ---------------------------------------------------------------------------
// InstructionsLayout — default export
// ---------------------------------------------------------------------------

/**
 * InstructionsLayout
 *
 * General-purpose layout for first-visit onboarding and instruction pages.
 * Accepts all content via props; logic-free beyond cosmetic rendering.
 *
 * @param {Object}        props
 * @param {string}        [props.appName="MerchantTools"]
 *   The application name rendered in the hero card (e.g. "AL Mustashar").
 * @param {string}        [props.subtitle="Three simple steps to get started"]
 *   A short tagline rendered below the app name in the hero card.
 * @param {string}        [props.description=""]
 *   An optional paragraph rendered below the hero card.
 *   Hidden when empty.
 * @param {Array<Object>} [props.steps=[]]
 *   Ordered array of step definition objects passed to `<StepRow>`.
 *   See `StepRow` prop documentation for the shape of each entry.
 * @param {string}        [props.ctaLabel=""]
 *   Label for the primary CTA button. When empty, the button is not rendered.
 * @param {Function}      [props.onCta]
 *   Click handler for the CTA button.
 * @param {string}        [props.footerNote=""]
 *   An optional small-print string rendered at the bottom of the content column.
 *   Hidden when empty.
 * @param {JSX.Element|null} [props.customContent=null]
 *   When provided, replaces the entire default hero + steps + CTA layout with
 *   arbitrary custom content. Useful for one-off or experimental pages.
 *
 * @returns {JSX.Element}
 */
export default function InstructionsLayout({
  appName       = "MerchantTools",
  subtitle      = "Three simple steps to get started",
  description   = "",
  steps         = [],
  ctaLabel      = "",
  onCta,
  footerNote    = "",
  customContent = null,
}) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">

      {/* Shared top navigation — rendered outside of any container so it spans the full viewport */}
      <Header />

      {/* Full-width page wrapper — horizontal padding is delegated to the inner content column */}
      <div className="relative overflow-hidden bg-[var(--background)]">

        {/* ── Atmospheric Background ────────────────────────────────────────── */}
        {/* Fixed layer of radial gradients, concentric rings, dots, and a
            horizontal accent line. `pointer-events-none` ensures it never
            intercepts user interaction. `-z-10` keeps it behind all content. */}
        <div className="fixed inset-0 pointer-events-none select-none -z-10">

          {/* Radial glow blobs — create a soft depth illusion */}
          <div className="absolute -top-32 -right-32 w-64 md:w-[500px] h-64 md:h-[500px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(148,144,200,0.18) 0%, transparent 70%)" }} />
          <div className="absolute -bottom-40 -left-40 w-52 md:w-[400px] h-52 md:h-[400px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(148,144,200,0.12) 0%, transparent 70%)" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 md:w-[700px] h-72 md:h-[700px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(148,144,200,0.07) 0%, transparent 60%)" }} />

          {/* Concentric ring pairs — top-left cluster */}
          <div className="absolute top-20 left-10 w-40 h-40 rounded-full border border-[var(--primary)] opacity-10" />
          <div className="absolute top-24 left-14 w-32 h-32 rounded-full border border-[var(--primary)] opacity-[0.06]" />

          {/* Concentric ring pairs — bottom-right cluster */}
          <div className="absolute bottom-20 right-10 w-56 h-56 rounded-full border border-[var(--primary)] opacity-[0.08]" />
          <div className="absolute bottom-28 right-16 w-40 h-40 rounded-full border border-[var(--primary)] opacity-[0.05]" />

          {/* Scattered decorative dots — generated from the DOTS config array */}
          {DOTS.map((d, i) => (
            <div key={i} className="absolute rounded-full bg-[var(--primary)]"
              style={{ top: d.top, left: d.left, right: d.right, width: d.size, height: d.size, opacity: d.opacity }} />
          ))}

          {/* Horizontal gradient accent line at 30% from the top */}
          <div className="absolute w-full h-px opacity-[0.08]"
            style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)", top: "30%" }} />
        </div>

        {/* ── Content Column ────────────────────────────────────────────────── */}
        {/* Centered, max-width-bounded column that holds all visible page content. */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">

          {/* Render custom content when provided; otherwise render the default layout */}
          {customContent ? customContent : (<>

            {/* ── Hero Card ── */}
            {/* A tilted, glowing card that displays the app name and subtitle. */}
            <div className="flex justify-center mb-16">
              <div className="relative">
                {/* Soft glow halo behind the card */}
                <div className="absolute -inset-6 rounded-[2.5rem] opacity-40 blur-2xl"
                  style={{ background: "linear-gradient(135deg, var(--primary), var(--muted-foreground))" }} />

                {/* Card surface */}
                <div className="relative px-14 py-9 rounded-[2rem] shadow-2xl -rotate-1"
                  style={{
                    background: "linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 65%, #000) 100%)",
                    boxShadow: "0 0 60px rgba(148,144,200,0.35), 0 30px 60px rgba(0,0,0,0.15)",
                  }}>

                  {/* Subtle inner highlight overlay */}
                  <div className="absolute inset-0 rounded-[2rem] opacity-20"
                    style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 60%)" }} />

                  {/* Decorative traffic-light dots (top-left of card) */}
                  <div className="absolute top-4 left-6 flex gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-white/30" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  </div>

                  {/* App name and subtitle */}
                  <div className="relative text-center">
                    <div className="flex items-center justify-center gap-4 mb-2">
                      <div className="w-8 h-px bg-white/40" />
                      <h1 className="text-4xl md:text-5xl text-white font-extrabold tracking-tight">{appName}</h1>
                      <div className="w-8 h-px bg-white/40" />
                    </div>
                    <p className="text-white/70 tracking-[0.22em] uppercase text-xs mt-1">{subtitle}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Description ── */}
            {/* Rendered only when the `description` prop is non-empty */}
            {description && (
              <p className="text-center max-w-xl mx-auto mb-16 leading-relaxed text-[var(--muted-foreground)] opacity-75 text-[0.95rem] whitespace-pre-line text-gray-600">
                {description}
              </p>
            )}

            {/* ── Step Cards ── */}
            {/* Vertically stacked, optionally offset step rows */}
            <div className="space-y-7">
              {steps.map((step) => (
                <StepRow key={step.number} step={step} />
              ))}
            </div>

            {/* ── CTA Button ── */}
            {/* Rendered only when the `ctaLabel` prop is non-empty */}
            {ctaLabel && (
              <div className="mt-16 flex justify-center">
                <div className="relative group">
                  {/* Hover glow halo */}
                  <div className="absolute -inset-1 rounded-2xl blur-lg opacity-0 group-hover:opacity-60 transition-opacity duration-300"
                    style={{ background: "linear-gradient(135deg, var(--primary), var(--muted-foreground))" }} />
                  <button
                    onClick={onCta}
                    className="relative px-10 py-4 rounded-2xl text-white flex items-center gap-3 font-bold text-base transition-all duration-300 group-hover:scale-[1.03]"
                    style={{
                      background: "linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 60%, #000))",
                      boxShadow: "0 8px 32px rgba(148,144,200,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
                      border: "1px solid rgba(148,144,200,0.35)",
                    }}
                  >
                    {ctaLabel}
                    <ArrowRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform duration-200" />
                  </button>
                </div>
              </div>
            )}

            {/* ── Footer Note ── */}
            {/* Rendered only when the `footerNote` prop is non-empty */}
            {footerNote && (
              <p className="text-center text-[var(--muted-foreground)] opacity-30 text-xs mt-10 tracking-widest uppercase">
                {footerNote}
              </p>
            )}

          </>)}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StepRow — named export
// ---------------------------------------------------------------------------

/**
 * StepRow
 *
 * Renders a single onboarding step as a visually distinct card row.
 * Includes a numbered badge on the left and a glassmorphic content card on the right.
 *
 * @param {Object} props
 * @param {Object} props.step                   — Step definition object.
 * @param {string} props.step.number            — Display numeral (e.g. "1", "2", "3").
 * @param {string} props.step.title             — Step heading shown inside the card.
 * @param {string} props.step.desc              — One-sentence description of the step.
 * @param {string} props.step.badge             — Short label on the floating pill badge.
 * @param {JSX.Element} props.step.badgeIcon    — Icon rendered inside the badge pill.
 * @param {string} [props.step.rotate="rotate-12"]
 *   Tailwind rotation class applied to the numbered badge square.
 * @param {string} [props.step.counterRotate="-rotate-12"]
 *   Tailwind rotation class applied to the numeral inside the badge,
 *   counter-rotating it so the text stays upright.
 * @param {string} [props.step.offset=""]
 *   Optional horizontal offset class (e.g. `"md:ml-20"`) for visual staggering.
 *
 * @returns {JSX.Element}
 */
export function StepRow({ step }) {
  // Apply per-step rotation and offset overrides, falling back to defaults
  const rotate        = step.rotate        ?? "rotate-12";
  const counterRotate = step.counterRotate ?? "-rotate-12";
  const offset        = step.offset        ?? "";

  return (
    <div className={`flex items-start gap-5 group rtl:flex-row-reverse ${offset}`}>

      {/* ── Numbered Badge ── */}
      <div className="flex-shrink-0 relative mt-2">
        {/* Glow halo behind the badge */}
        <div className="absolute inset-0 rounded-2xl blur-md opacity-60"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--muted-foreground))" }} />

        {/* Rotated badge square with the step number */}
        <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl ${rotate}`}
          style={{ background: "linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 70%, #5A57A0))" }}>
          {/* Counter-rotate the numeral so it reads correctly */}
          <span className={`text-white font-black text-2xl ${counterRotate}`}>{step.number}</span>
        </div>
      </div>

      {/* ── Content Card ── */}
      {/* Glassmorphic card that lifts slightly on hover */}
      <div className="flex-1 relative rounded-2xl p-6 group-hover:-translate-y-1 transition-all duration-300"
        style={{
          background: "rgba(148,144,200,0.05)",
          border: "1px solid rgba(148,144,200,0.18)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 4px 40px rgba(148,144,200,0.07)",
        }}>

        {/* Hover glow outline — fades in on group-hover */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ boxShadow: "0 0 40px rgba(148,144,200,0.14)" }} />

        {/* Vertical edge accent line — left in LTR, right in RTL */}
        <div className="absolute left-0 rtl:left-auto rtl:right-0 top-5 bottom-5 w-1 rounded-full"
          style={{ background: "linear-gradient(180deg, var(--primary), color-mix(in srgb, var(--primary) 50%, #fff))" }} />

        {/* Card body text */}
        <div className="pl-4 rtl:pr-4 rtl:pl-0">
          {/* Step label — uppercase tracking pill */}
          <span className="text-[var(--primary)] uppercase tracking-[0.2em] text-xs mb-1 block font-semibold opacity-80">
            {step.label}
          </span>
          <h3 className="text-[var(--foreground)] font-bold text-lg mb-2">{step.title}</h3>
          <p className="text-[var(--muted-foreground)] leading-relaxed text-sm opacity-80">{step.desc}</p>

          {/* Badge pill — icon + short label */}
          <div className="mt-4 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[var(--primary)]"
              style={{ background: "rgba(148,144,200,0.18)" }}>
              {step.badgeIcon}
            </div>
            <span className="text-[var(--primary)] text-xs font-semibold">{step.badge}</span>
          </div>
        </div>
      </div>
    </div>
  );
}