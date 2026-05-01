import React, { useState } from 'react';
import { Eye, EyeOff, Pencil, PlusCircle } from 'lucide-react';

// ── شكل البادج ──
const PILL =
  'inline-flex items-center justify-center w-[110px] h-[26px] rounded-full text-[9px] font-black uppercase border transition-all duration-200';

// ── ألوان الحالات ──
const getStatusConfig = (status) => {
  const config = {
    Expired: {
      style: {
        color: 'var(--status-expired-text)',
        backgroundColor: 'var(--status-expired-bg)',
        borderColor: 'var(--status-expired-border)',
      },
      label: 'Expired',
    },
    Approaching: {
      style: {
        color: 'var(--status-approaching-text)',
        backgroundColor: 'var(--status-approaching-bg)',
        borderColor: 'var(--status-approaching-border)',
      },
      label: 'Approaching',
    },
    Valid: {
      style: {
        color: 'var(--status-safe-text)',
        backgroundColor: 'var(--status-safe-bg)',
        borderColor: 'var(--status-safe-border)',
      },
      label: 'Safe',
    },
  };

  return config[status] || config.Valid;
};

export default function InventoryProductRow({ product, onExpiry }) {
  const [showBatches, setShowBatches] = useState(false);

  // ✅ نحول حالة الباك (red/yellow/green)
  const normalizeStatus = (status) => {
    const map = {
      red: 'Expired',
      yellow: 'Approaching',
      green: 'Valid',
      expired: 'Expired',
      approaching: 'Approaching',
      valid: 'Valid',
    };

    return map[status?.toLowerCase()] || 'Valid';
  };

  // ✅ نستخدم الباتشات الحقيقية فقط
  const batches = product.batches || [];
  const hasBatches = batches.length > 0;

  return (
    <>
      <tr className="border-b border-[var(--border)] hover:bg-[var(--accent)]/5 transition-colors group">

        {/* Product */}
        <td className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--muted)] flex items-center justify-center">

              {(product.image_url || product.image) ? (
                <img
                  src={product.image_url || product.image}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}

              <span
                className="w-full h-full flex items-center justify-center text-[10px] font-black text-[var(--muted-foreground)] uppercase"
                style={{ display: (product.image_url || product.image) ? 'none' : 'flex' }}
              >
                {product.name?.charAt(0) ?? '?'}
              </span>
            </div>

            <div>
  <div className="text-sm font-bold">{product.name}</div>
  <div className="text-[10px] text-[var(--muted-foreground)]">{product.sku}</div>
  <div className="text-[10px] text-[var(--muted-foreground)]/70">#{product.id}</div>
</div>
          </div>
        </td>

        {/* Category */}
        <td className="p-4 text-center text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest">
  {product.category}
</td>

        {/* Status */}
        <td className="p-4 text-center">
          {(() => {
            const status = normalizeStatus(batches[0]?.status);
            const config = getStatusConfig(status);

            return (
              <span className={PILL} style={config.style}>
                {config.label}
              </span>
            );
          })()}
        </td>

        {/* Qty */}
        <td className="p-4 text-center">
          <span className="px-4 py-1 rounded-full bg-[var(--accent)] text-[var(--primary)] text-[11px] font-bold border">
            {product.quantity ?? product.dbQty ?? 0}
          </span>
        </td>

        {/* Expiry Info */}
        <td className="p-4 text-center">
          {hasBatches ? (
            <button
              onClick={() => setShowBatches(!showBatches)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent)] text-[var(--primary)] text-[10px] font-bold border border-[var(--primary)]/20 hover:opacity-80 transition-opacity"
            >
              {showBatches ? <EyeOff size={12} /> : <Eye size={12} />}
              {batches.length} {batches.length === 1 ? 'Batch' : 'Batch'}
            </button>
          ) : (
            <span className="text-[11px] text-[var(--muted-foreground)]">-</span>
          )}
        </td>

        {/* Action */}
        <td className="p-4 text-center">
          {hasBatches ? (
            <button
              onClick={() => onExpiry(product)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent)] text-[var(--primary)] text-[10px] font-black uppercase tracking-wide hover:opacity-80 transition-opacity border border-[var(--primary)]/20"
            >
              <Pencil size={11} />
              Edit Expiry Date
            </button>
          ) : (
            <button
              onClick={() => onExpiry(product)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent)] text-[var(--primary)] text-[10px] font-black uppercase tracking-wide hover:opacity-80 transition-opacity border border-[var(--primary)]/20"
            >
              <PlusCircle size={11} />
              Add Expiry Date
            </button>
          )}
        </td>
      </tr>

      {/* Batches — تظهر فقط عند الضغط على زر الـ Expiry Info */}
      {showBatches &&
        batches.map((batch) => {
          const status = normalizeStatus(batch.status);
          const config = getStatusConfig(status);

          return (
            <tr key={batch.id} className="bg-[var(--accent)]/5 border-b border-[var(--border)]">
              <td className="pl-10 py-3 text-[11px] text-[var(--muted-foreground)]">
                <span className="font-bold text-[var(--foreground)]">Batch:</span> {batch.code}
              </td>
              <td className="text-center text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest">{product.category}</td>
              <td className="text-center">
                <span className={PILL} style={config.style}>
                  {config.label}
                </span>
              </td>
              <td className="text-center text-[11px]">{batch.qty}</td>
              <td className="text-center text-[11px] text-[var(--muted-foreground)]">{batch.expiryDate}</td>
              <td />
            </tr>
          );
        })}
    </>
  );
}