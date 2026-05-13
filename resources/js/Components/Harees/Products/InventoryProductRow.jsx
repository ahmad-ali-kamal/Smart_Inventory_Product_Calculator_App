// resources/js/Components/Harees/Products/InventoryProductRow.jsx
import React, { useState } from 'react';
import { Eye, EyeOff, Pencil, PlusCircle } from 'lucide-react';
import RowActionButton from '../../Common/RowActionButton';
import ProductAvatar from '../../Common/UI/ProductAvatar';
import { normalizeStatus, getStatusStyle } from '../StatusBadge';

const PILL =
  'inline-flex items-center justify-center w-[110px] h-[26px] rounded-full text-[9px] font-black uppercase border transition-all duration-200';

const getStatusConfig = (normalizedStatus) => {
  const config = {
    Expired:     { style: getStatusStyle('Expired'),     label: 'Expired'     },
    Approaching: { style: getStatusStyle('Approaching'), label: 'Approaching' },
    Safe:        { style: getStatusStyle('Safe'),        label: 'Safe'        },
  };
  return config[normalizedStatus] || config.Safe;
};

export default function InventoryProductRow({ product, onExpiry }) {
  const [showBatches, setShowBatches] = useState(false);

  const batches = (product.batches || []).map(b => ({
    id:         b.id,
    code:       b.batch_code || b.code || '-',
    qty:        b.quantity ?? b.qty ?? 0,
    expiryDate: b.expiry_date || b.expiryDate || '-',
    status:     b.status || 'green',
  }));

  const hasBatches  = batches.length > 0;
  const totalQty    = product.quantity ?? product.dbQty ?? 0;
  const assignedQty = batches.reduce((sum, b) => sum + (parseInt(b.qty) || 0), 0);

  const worstStatus = (() => {
    if (!hasBatches) return 'Safe';
    const priorities = { red: 3, yellow: 2, green: 1 };
    const worst = batches.reduce((acc, b) => {
      const p = priorities[b.status?.toLowerCase()] || 1;
      return p > (priorities[acc] || 1) ? b.status : acc;
    }, 'green');
    return normalizeStatus(worst);
  })();

  return (
    <>
      <tr className="border-b border-[var(--border)] hover:bg-[var(--accent)]/5 transition-colors group">

        {/* Product */}
        <td className="p-4">
          <div className="flex items-center gap-3">
            <ProductAvatar
              src={product.image_url || product.image}
              name={product.name}
              size={40}
              radius="rounded-lg"
            />
            <div>
              <div className="text-sm font-bold">{product.name}</div>
              <div className="text-[10px] text-[var(--muted-foreground)]/70">{product.salla_product_id}</div>
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
            const config = getStatusConfig(worstStatus);
            return <span className={PILL} style={config.style}>{config.label}</span>;
          })()}
        </td>

        {/* Qty */}
        <td className="p-4 text-center">
          <span className="px-3 py-0.5 rounded-full bg-[var(--accent)] text-[var(--primary)] text-[11px] font-bold border tabular-nums">
            {totalQty}
            {hasBatches && (
              <><span className="text-[var(--primary)]/50 mx-0.5">/</span>{assignedQty}</>
            )}
          </span>
        </td>

        {/* Expiry Info — toggle batch rows */}
        <td className="p-4 text-center">
          {hasBatches ? (
            <RowActionButton
              onClick={() => setShowBatches(v => !v)}
              icon={showBatches ? <EyeOff size={12} /> : <Eye size={12} />}
            >
              {batches.length} {batches.length === 1 ? 'Batch' : 'Batches'}
            </RowActionButton>
          ) : (
            <span className="text-[11px] text-[var(--muted-foreground)]">-</span>
          )}
        </td>

        {/* Action — add / edit expiry */}
        <td className="p-4 text-center">
          <RowActionButton
            onClick={() => onExpiry(product)}
            icon={hasBatches ? <Pencil size={11} /> : <PlusCircle size={11} />}
          >
            {hasBatches ? 'Edit Expiry Date' : 'Add Expiry Date'}
          </RowActionButton>
        </td>
      </tr>

      {/* ── Animated batch rows ── */}
      <tr>
        <td colSpan={6} className="p-0 border-none">
          <div className={`grid transition-all duration-500 ease-in-out ${
            showBatches ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}>
            <div className="overflow-hidden">
              {batches.map((batch) => {
                const status = normalizeStatus(batch.status);
                const config = getStatusConfig(status);
                return (
                  <div
                    key={batch.id}
                    className="grid bg-[var(--accent)]/5 border-b border-[var(--border)]"
                    style={{ gridTemplateColumns: '16% 16% 16% 16% 16% 20%' }}
                  >
                    <div className="pl-10 py-3.5 text-[12px] text-[var(--muted-foreground)]">
                      <span className="font-bold text-[var(--foreground)]">Batch:</span> {batch.code}
                    </div>
                    <div className="flex items-center justify-center text-[11px] font-black text-[var(--muted-foreground)] uppercase tracking-widest">
                      {product.category}
                    </div>
                    <div className="flex items-center justify-center">
                      <span className={PILL} style={config.style}>{config.label}</span>
                    </div>
                    <div className="flex items-center justify-center text-[12px]">{batch.qty}</div>
                    <div className="flex items-center justify-center text-[12px] text-[var(--muted-foreground)]">{batch.expiryDate}</div>
                    <div />
                  </div>
                );
              })}
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}