import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/apiClient';

async function applyDiscountApi({ productId, batchId, discountPct, endDate }) {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;

    const { data } = await apiClient.post(
        `/harees/api/products/${productId}/discounts/apply`,
        {
            batch_id:            batchId,
            discount_percentage: discountPct,
            ends_at:             endDate,
            is_ai_suggested:     false,
        },
        csrfToken ? { headers: { 'X-CSRF-TOKEN': csrfToken } } : undefined,
    );

    if (!data?.success) {
        throw new Error(data?.message || 'Failed to apply discount');
    }

    return data;
}

export function useApplyDiscount(productId) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (variables) => applyDiscountApi({ productId, ...variables }),

        onSuccess: () => {
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['harees', 'dashboard'] });
                queryClient.invalidateQueries({ queryKey: ['harees', 'products'] });
            }, 300);
        },
    });
}
