// resources/js/Components/Harees/BatchRow.jsx
import React, { useState } from 'react';
import { Tag, Calendar, Percent, BadgeCheck, Loader2 } from 'lucide-react'; // أضفنا Loader2
import DiscountModal from '../DiscountModal';
import StatusBadge from '../StatusBadge';
import ProductAvatar from '../../Common/ProductAvatar';
import { useApplyDiscount } from '../../../Hooks/useApplyDiscount';
import toast from 'react-hot-toast';

const toastStyle = {
    borderRadius: '12px',
    background:   'var(--card)',
    color:        'var(--foreground)',
    border:       '1px solid var(--border)',
    fontSize:     '12px',
    fontWeight:   'bold',
};

export default function BatchRow({ product, autoDiscount }) {
    const [selectedBatch, setSelectedBatch] = useState(null);

    // استخراج isPending لمراقبة حالة التحميل
    const { mutateAsync, isPending } = useApplyDiscount(product.id);

    const handleApplyDiscount = async ({ batchId, discountPct, endDate }) => {
        try {
            await mutateAsync({ batchId, discountPct, endDate });
            toast.success('تم تطبيق الخصم بنجاح', { duration: 3000, style: toastStyle });
            
            // إغلاق المودال فقط في حالة النجاح
            setSelectedBatch(null); 
        } catch (error) {
            // إظهار الخطأ القادم من السيرفر
            toast.error(error.message || 'حدث خطأ أثناء تطبيق الخصم', { 
                duration: 4000, 
                style: toastStyle 
            });
        }
    };

    const productBatches = product.batches || [];

    if (productBatches.length === 0) {
        return (
            <div className="py-4 px-6 text-[11px] text-[var(--muted-foreground)] text-center">
                No batches available.
            </div>
        );
    }

    return (
        <>
            {productBatches.map(batch => {
                const batchCode  = batch.batch_code  || batch.batchNo    || '—';
                const expiryDate = batch.expiry_date  || batch.expiryDate || '—';
                
                // التأكد من أن هذا الـ batch هو الذي يتم معالجته حالياً
                const isThisBatchLoading = isPending && selectedBatch?.id === batch.id;

                return (
                    <div
                        key={batch.id}
                        className="flex items-center border-b border-[var(--border)] last:border-0 hover:bg-[var(--accent)]/5 transition-all"
                    >
                        {/* Product Info - 25% */}
                        <div className="w-[25%] py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                                <ProductAvatar
                                    src={product.image_url || product.image}
                                    name={product.name}
                                    size={40}
                                />
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[12px] font-bold text-[var(--foreground)] truncate">
                                        {product.name}
                                    </span>
                                    <span className="text-[11px] font-bold flex items-center gap-1 text-[var(--muted-foreground)]">
                                        <Tag size={10} className="text-[var(--primary)] opacity-50" />
                                        {batchCode}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Status - 20% */}
                        <div className="w-[20%] py-3.5 px-4 flex justify-center">
                            <StatusBadge status={batch.status} size="md" />
                        </div>

                        {/* Expiry Date - 30% */}
                        <div className="w-[30%] py-3.5 px-4 flex justify-center">
                            <span className="text-[12px] font-bold flex items-center gap-1.5 text-[var(--foreground)]">
                                <Calendar size={11} className="opacity-50" />
                                {expiryDate}
                            </span>
                        </div>

                        {/* Discount Action - 25% */}
                        <div className="w-[25%] py-3.5 px-4 flex justify-center">
                            {batch.status?.toLowerCase() === 'yellow' || batch.status?.toLowerCase() === 'approaching' ? (
                                autoDiscount ? (
                                    <div
                                        className="inline-flex items-center justify-center gap-1.5 px-3 h-[28px] rounded-full border text-[9px] font-black uppercase tracking-wide"
                                        style={{
                                            color:       'var(--status-approaching-text)',
                                            background:  'var(--status-approaching-bg)',
                                            borderColor: 'var(--status-approaching-border)',
                                        }}
                                    >
                                        <BadgeCheck size={10} />
                                        Auto-Discount Enabled
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setSelectedBatch(batch)}
                                        disabled={isPending} // منع النقر أثناء التحميل
                                        className="w-[120px] h-[32px] flex items-center justify-center gap-1.5 rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/5 text-[var(--primary)] text-[10px] font-black uppercase hover:bg-[var(--primary)] hover:text-white transition-all disabled:opacity-50"
                                    >
                                        {isThisBatchLoading ? (
                                            <Loader2 size={11} className="animate-spin" />
                                        ) : (
                                            <Percent size={11} />
                                        )}
                                        {isThisBatchLoading ? 'Applying...' : 'Discount'}
                                    </button>
                                )
                            ) : null}
                        </div>
                    </div>
                );
            })}

            {selectedBatch && (
                <DiscountModal
                    batch={selectedBatch}
                    product={product}
                    onClose={() => setSelectedBatch(null)}
                    onApply={handleApplyDiscount}
                    isLoading={isPending}
                />
            )}
        </>
    );
}