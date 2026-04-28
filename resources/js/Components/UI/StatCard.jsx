import Card from "./Card";

export default function StatCard({ icon, label, value, sub, subHighlight, action, onAction }) {
  return (
    <Card className="p-6 flex flex-col gap-4">
      {action && (
        <div className="flex justify-end">
          <button
            onClick={onAction}
            className="text-xs text-[var(--muted-foreground)] flex items-center gap-1 hover:text-[var(--foreground)] transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit
          </button>
        </div>
      )}
      <div className="w-10 h-10 rounded-xl bg-[var(--secondary)] flex items-center justify-center text-[var(--primary)]">
        {icon}
      </div>
      <div>
        <p className="text-sm text-[var(--muted-foreground)] mb-1">{label}</p>
        <p className="text-3xl font-semibold text-[var(--foreground)]">{value}</p>
        {sub && (
          <p className="text-sm text-[var(--muted-foreground)] mt-1">{sub}</p>
        )}
        {subHighlight && (
          <p className="text-sm text-emerald-500 mt-1 font-medium">{subHighlight}</p>
        )}
      </div>
    </Card>
  );
}
