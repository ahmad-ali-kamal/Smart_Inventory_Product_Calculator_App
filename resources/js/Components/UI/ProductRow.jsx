import Badge from "./Badge";

export default function ProductRow({ product, showToggle, onToggle, onManage, faded }) {
  return (
    <div
      className={`flex items-center gap-4 py-4 px-2 border-b border-[var(--border)] last:border-0 transition-opacity ${
        faded ? "opacity-40" : "opacity-100"
      }`}
    >
      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--muted)] flex-shrink-0">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      </div>

      {/* Name & SKU */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--foreground)] truncate">{product.name}</p>
        <p className="text-xs text-[var(--muted-foreground)]">{product.sku}</p>
      </div>

      {/* Category */}
      <div className="hidden sm:block w-32 flex-shrink-0">
        <Badge>{product.category}</Badge>
      </div>

      {/* Status */}
      <div className="hidden md:flex items-center gap-1.5 w-24 flex-shrink-0">
        <span
          className={`w-1.5 h-1.5 rounded-full ${product.active ? "bg-emerald-500" : "bg-[var(--muted-foreground)]"}`}
        />
        <span className={`text-xs font-medium ${product.active ? "text-emerald-600" : "text-[var(--muted-foreground)]"}`}>
          {product.active ? "ACTIVE" : "INACTIVE"}
        </span>
      </div>

      {/* Toggle or Manage */}
      {showToggle ? (
        <div className="flex-shrink-0">
          <button
            onClick={() => onToggle(product.id)}
            role="switch"
            aria-checked={product.active}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
              product.active ? "bg-[var(--primary)]" : "bg-[var(--switch-background)]"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                product.active ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      ) : (
        <div className="flex-shrink-0">
          <button
            onClick={() => onManage && onManage(product.id)}
            className="text-sm text-[var(--primary)] hover:underline"
          >
            Manage
          </button>
        </div>
      )}
    </div>
  );
}
