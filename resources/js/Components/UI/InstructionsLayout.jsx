/**
 * InstructionsLayout — A general component for instruction pages.
 */

import { ArrowRight } from "lucide-react";
import Header from "../Header";

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

      {/* Header directly — no Layout */}
      <Header />

      {/* Full-width page — no max-width or horizontal padding at this level*/}
      <div className="relative overflow-hidden bg-[var(--background)]">

        {/* ── Atmospheric BG ── */}
        <div className="fixed inset-0 pointer-events-none select-none -z-10">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(148,144,200,0.18) 0%, transparent 70%)" }} />
          <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(148,144,200,0.12) 0%, transparent 70%)" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(148,144,200,0.07) 0%, transparent 60%)" }} />

          <div className="absolute top-20 left-10 w-40 h-40 rounded-full border border-[var(--primary)] opacity-10" />
          <div className="absolute top-24 left-14 w-32 h-32 rounded-full border border-[var(--primary)] opacity-[0.06]" />
          <div className="absolute bottom-20 right-10 w-56 h-56 rounded-full border border-[var(--primary)] opacity-[0.08]" />
          <div className="absolute bottom-28 right-16 w-40 h-40 rounded-full border border-[var(--primary)] opacity-[0.05]" />

          {DOTS.map((d, i) => (
            <div key={i} className="absolute rounded-full bg-[var(--primary)]"
              style={{ top: d.top, left: d.left, right: d.right, width: d.size, height: d.size, opacity: d.opacity }} />
          ))}

          <div className="absolute w-full h-px opacity-[0.08]"
            style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)", top: "30%" }} />
        </div>

        {/* ── Content — centered column ── */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">

          {customContent ? customContent : (<>

            {/* Hero */}
            <div className="flex justify-center mb-16">
              <div className="relative">
                <div className="absolute -inset-6 rounded-[2.5rem] opacity-40 blur-2xl"
                  style={{ background: "linear-gradient(135deg, var(--primary), var(--muted-foreground))" }} />
                <div className="relative px-14 py-9 rounded-[2rem] shadow-2xl -rotate-1"
                  style={{
                    background: "linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 65%, #000) 100%)",
                    boxShadow: "0 0 60px rgba(148,144,200,0.35), 0 30px 60px rgba(0,0,0,0.15)",
                  }}>
                  <div className="absolute inset-0 rounded-[2rem] opacity-20"
                    style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 60%)" }} />
                  <div className="absolute top-4 left-6 flex gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-white/30" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  </div>
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

            {/* Description */}
            {description && (
              <p className="text-center max-w-xl mx-auto mb-16 leading-relaxed text-[var(--muted-foreground)] opacity-75 text-[0.95rem]">
                {description}
              </p>
            )}

            {/* Steps */}
            <div className="space-y-7">
              {steps.map((step) => (
                <StepRow key={step.number} step={step} />
              ))}
            </div>

            {/*CTA — only rendered if ctaLabel is provided*/}
            {ctaLabel && (
              <div className="mt-16 flex justify-center">
                <div className="relative group">
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

            {/* Footer */}
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

/* ── StepRow ── */
export function StepRow({ step }) {
  const rotate        = step.rotate        ?? "rotate-12";
  const counterRotate = step.counterRotate ?? "-rotate-12";
  const offset        = step.offset        ?? "";

  return (
    <div className={`flex items-start gap-5 group ${offset}`}>
      <div className="flex-shrink-0 relative mt-2">
        <div className="absolute inset-0 rounded-2xl blur-md opacity-60"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--muted-foreground))" }} />
        <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl ${rotate}`}
          style={{ background: "linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 70%, #5A57A0))" }}>
          <span className={`text-white font-black text-2xl ${counterRotate}`}>{step.number}</span>
        </div>
      </div>

      <div className="flex-1 relative rounded-2xl p-6 group-hover:-translate-y-1 transition-all duration-300"
        style={{
          background: "rgba(148,144,200,0.05)",
          border: "1px solid rgba(148,144,200,0.18)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 4px 40px rgba(148,144,200,0.07)",
        }}>
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ boxShadow: "0 0 40px rgba(148,144,200,0.14)" }} />
        <div className="absolute left-0 top-5 bottom-5 w-1 rounded-full"
          style={{ background: "linear-gradient(180deg, var(--primary), color-mix(in srgb, var(--primary) 50%, #fff))" }} />
        <div className="pl-4">
          <span className="text-[var(--primary)] uppercase tracking-[0.2em] text-xs mb-1 block font-semibold opacity-80">
            {step.label}
          </span>
          <h3 className="text-[var(--foreground)] font-bold text-lg mb-2">{step.title}</h3>
          <p className="text-[var(--muted-foreground)] leading-relaxed text-sm opacity-80">{step.desc}</p>
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