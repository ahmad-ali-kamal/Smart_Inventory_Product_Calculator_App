export default function EmptyState({ onAddProduct }) {
    return (
        <section className="bg-white rounded-2xl shadow-sm border border-neutral-100 px-8 py-14 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-violet-100 text-violet-500 flex items-center justify-center mb-5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                    <path d="M3 7l9-4 9 4v10l-9 4-9-4V7Z" strokeLinejoin="round" />
                    <path d="M3 7l9 4 9-4M12 11v10" strokeLinejoin="round" />
                </svg>
            </div>

            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                No Activated Products Yet
            </h2>
            <p className="text-sm text-neutral-500 max-w-sm mx-auto leading-relaxed mb-7">
                You haven't activated any products yet. Add your first product and let the smart calculator handle the math.
            </p>

            <button
                onClick={onAddProduct}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-medium shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v8M8 12h8" strokeLinecap="round" />
                </svg>
                <span>Add Product</span>
                <span aria-hidden>→</span>
            </button>
        </section>
    );
}
