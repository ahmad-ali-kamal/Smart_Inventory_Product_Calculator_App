export default function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-[var(--card)] border border-[var(--border)] rounded-xl ${className}`}
    >
      {children}
    </div>
  );
}
