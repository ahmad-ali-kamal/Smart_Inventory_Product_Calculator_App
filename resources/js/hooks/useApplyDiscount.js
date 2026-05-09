// resources/js/Hooks/useApplyDiscount.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

/**
 * دالة الـ API باستخدام Axios
 */
async function applyDiscountApi({ productId, batchId, discountPct, endDate }) {
    // Axios سيرمي خطأ تلقائياً في حال كانت الحالة 4xx أو 5xx
    const { data } = await axios.post(`/harees/api/products/${productId}/discounts/apply`, {
        batch_id:            batchId,
        discount_percentage: discountPct,
        ends_at:             endDate,
        is_ai_suggested:     false,
    });

    // نتحقق من نجاح العملية بناءً على رد السيرفر الخاص ببرمجتك
    if (!data.success) {
        throw new Error(data.message || 'Failed to apply discount');
    }

    return data;
}

export function useApplyDiscount(productId) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variables) => applyDiscountApi({ productId, ...variables }),

        onSuccess: () => {
            // تحديث كاش البيانات لضمان ظهور التغييرات فوراً في الـ Dashboard
            queryClient.invalidateQueries({ queryKey: ["inventory", "dashboard"] });
            queryClient.invalidateQueries({ queryKey: ["inventory", "products"] });
        },
    });
}