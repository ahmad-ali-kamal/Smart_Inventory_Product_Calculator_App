import ToggleSwitch from './ToggleSwitch';

const TshirtIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.7">
        <path
            d="M4 7l4-3 2 2c.6.6 2.4.6 4 0l2-2 4 3-2 4-2-1v8H8v-8l-2 1-2-4Z"
            strokeLinejoin="round"
        />
    </svg>
);

export default function ProductTable({ products = [], onToggle }) {
    return (
        <section className="bg-white rounded-2xl shadow-sm border border-neutral-100">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
                <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-neutral-500 uppercase">
                    Activated Products
                </p>
                <button className="text-sm font-medium text-violet-600 hover:text-violet-800 transition-colors">
                    View all <span aria-hidden>→</span>
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-[0.65rem] tracking-[0.18em] uppercase text-neutral-400">
                            <th className="text-left font-semibold px-6 py-3">Product</th>
                            <th className="text-left font-semibold px-6 py-3">Category</th>
                            <th className="text-left font-semibold px-6 py-3">SKU</th>
                            <th className="text-left font-semibold px-6 py-3">Status</th>
                            <th className="text-right font-semibold px-6 py-3">Toggle</th>
                        </tr>
                    </thead>

                    <tbody>
                        {products.map((p) => (
                            <tr
                                key={p.id}
                                className="border-t border-neutral-100 hover:bg-violet-50/30 transition-colors"
                            >
                                {/* Product */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 border border-dashed border-violet-200 flex items-center justify-center shrink-0">
                                            {p.image_url
                                                ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover rounded-xl" />
                                                : <TshirtIcon />}
                                        </div>
                                        <div className="leading-tight">
                                            <p className="text-[0.95rem] font-semibold text-neutral-900">{p.name}</p>
                                            {p.subtitle && (
                                                <p className="text-xs text-neutral-500 mt-0.5">{p.subtitle}</p>
                                            )}
                                        </div>
                                    </div>
                                </td>

                                {/* Category */}
                                <td className="px-6 py-4">
                                    <span className="inline-block px-3.5 py-1.5 rounded-full bg-violet-50 text-violet-700 text-xs font-medium border border-violet-100">
                                        {p.category ?? 'General'}
                                    </span>
                                </td>

                                {/* SKU */}
                                <td className="px-6 py-4">
                                    <span className="text-sm font-medium text-neutral-500">
                                        #{String(p.sku ?? p.id).padStart(4, '0')}
                                    </span>
                                </td>

                                {/* Status */}
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-medium">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Active
                                    </span>
                                </td>

                                {/* Toggle */}
                                <td className="px-6 py-4 text-right">
                                    <div className="inline-flex justify-end">
                                        <ToggleSwitch
                                            defaultChecked={p.enabled !== false}
                                            onChange={(v) => onToggle?.(p.id, v)}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
