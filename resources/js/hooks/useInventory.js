import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getDashboard,
  getProducts,
  getSettings,
  updateSettings,
  storeExpiry,
  storeBatch,
  updateBatch,
} from "../services/inventoryService";

// Dashboard
export const useInventoryDashboard = () => {
  return useQuery({
    queryKey: ["inventory", "dashboard"],
    queryFn: getDashboard,
  });
};

// Products
export const useInventoryProducts = () => {
  return useQuery({
    queryKey: ["inventory", "products"],
    queryFn: getProducts,
  });
};

// Settings
export const useInventorySettings = () => {
  return useQuery({
    queryKey: ["inventory", "settings"],
    queryFn: getSettings,
  });
};

// Update Settings
export const useUpdateInventorySettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSettings,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["inventory", "settings"],
      });

      queryClient.invalidateQueries({
        queryKey: ["inventory", "dashboard"],
      });
    },
  });
};

// Store Expiry
export const useStoreExpiry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: storeExpiry,

    // Await ensures refetch completes before closing the modal
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["inventory", "products"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["inventory", "dashboard"],
      });
    },
  });
};

// ── API function (Decoupled for independent testability) ──
async function deleteExpiryApi(productId) {
  const token = document.querySelector('meta[name="csrf-token"]')?.content;
  const res = await fetch(`/harees/api/expiry/${productId}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      'X-CSRF-TOKEN': token,
      'X-Requested-With': 'XMLHttpRequest',
    },
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to delete batches');
  }
  return data;
}

// Delete Expiry — New hook for deletion instead of using direct fetch in ExpiryModal
export const useDeleteExpiry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteExpiryApi,

    // Use await to ensure data is refreshed before closing the modal
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["inventory", "products"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["inventory", "dashboard"],
      });
    },
  });
};

// Store Batch
export const useStoreBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: storeBatch,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["inventory", "products"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["inventory", "dashboard"],
      });
    },
  });
};

// Update Batch
export const useUpdateBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBatch,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["inventory", "products"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["inventory", "dashboard"],
      });
    },
  });
};