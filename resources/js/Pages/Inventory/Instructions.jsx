import { ArrowRight, Tag, Bell, Percent } from "lucide-react";

// استدعاء من مجلد ui
import Card from '../../Components/UI/Card';

// ... بقية الكود كما هو
const steps = [
  {
    number: "STEP 1",
    title: "CLASSIFY PRODUCTS",
    desc: "Categorize your products: long-term, medium-term, or short-term",
    icon: <Tag size={18} />,
  },
  {
    number: "STEP 2",
    title: "SET ALERT PERIODS",
    desc: "Define when you want to be notified before expiration",
    icon: <Bell size={18} />,
  },
  {
    number: "STEP 3",
    title: "DISCOUNT SUGGESTIONS",
    desc: "Get automatic recommendations for appropriate discounts",
    icon: <Percent size={18} />,
  },
];

export default function InventoryInstructions({ onStart }) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] px-4">
      <Card className="w-full max-w-sm p-8 space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-[var(--primary)] flex items-center justify-center text-white text-2xl shadow-lg">
            📦
          </div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">MerchantTools</h1>
          <p className="text-xs tracking-widest text-[var(--muted-foreground)] uppercase">Expiry Tracker</p>
        </div>

        {/* Intro card */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 p-4">
          <p className="text-sm font-semibold text-[var(--foreground)] mb-1">Three simple steps</p>
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
            Track product expiry dates intelligently. Set up categories once and let the system monitor everything and suggest optimal discounts automatically.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((s) => (
            <div key={s.number} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--secondary)] flex items-center justify-center text-[var(--primary)] flex-shrink-0 mt-0.5">
                {s.icon}
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--primary)] mb-0.5">{s.number} — {s.title}</p>
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <hr className="border-[var(--border)]" />

        {/* CTA */}
        <button
          onClick={onStart}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--foreground)] text-[var(--background)] text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          ⚙ Start Setup <ArrowRight size={15} />
        </button>

        <p className="text-center text-xs text-[var(--muted-foreground)]">
          🛡 Smart tracking for all products with expiration dates
        </p>
      </Card>
    </div>
  );
}