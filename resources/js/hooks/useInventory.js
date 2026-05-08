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

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["inventory", "products"],
      });

      queryClient.invalidateQueries({
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

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["inventory", "products"],
      });

      queryClient.invalidateQueries({
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

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["inventory", "products"],
      });

      queryClient.invalidateQueries({
        queryKey: ["inventory", "dashboard"],
      });
    },
  });
};