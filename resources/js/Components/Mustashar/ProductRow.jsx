// resources/js/Components/Calculator/ProductRow.jsx
import Toggle from "../UI/Toggle";

export default function ProductRow({ product, onToggle, fading = false }) {
    return (
        <div
            className={`
                grid grid-cols-[1.5fr_1fr_1fr_120px] gap-4 px-8 py-4 items-center
                ${fading ? "opacity-0 -translate-y-1 pointer-events-none" : "opacity-100 translate-y-0"}
            `}
        >
            <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--muted)] border border-[var(--border)] flex-shrink-0">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                </div>

                <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[var(--foreground)] truncate uppercase tracking-tight">
                        {product.name}
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)] font-mono uppercase">
                       #{product.id}
                    </p>
                </div>
            </div>

            <div className="flex justify-center">
                <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest">
                    {product.category}
                </span>
            </div>

            <div className="flex justify-center items-center gap-2">
                <span
                    className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${
                        product.active
                            ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                            : "bg-gray-300"
                    }`}
                />

                <span
                    className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-500 ${
                        product.active ? "text-emerald-600" : "text-[var(--muted-foreground)]"
                    }`}
                >
                    {product.active ? "active" : "inactive"}
                </span>
            </div>

            <div className="flex justify-end">
                <Toggle
    checked={product.active}
    onChange={() => onToggle(product.id)}
/>         </div>
        </div>
    );
}