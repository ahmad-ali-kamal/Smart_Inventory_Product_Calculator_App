import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDashboard,
  getProducts,
  getSettings,
  updateSettings,
  storeExpiry,
} from "../services/inventoryService";

export const useInventoryDashboard = () => {
  return useQuery({
    queryKey: ["inventory", "dashboard"],
    queryFn: getDashboard,
  });
};

export const useInventoryProducts = () => {
  return useQuery({
    queryKey: ["inventory", "products"],
    queryFn: getProducts,
  });
};

export const useInventorySettings = () => {
  return useQuery({
    queryKey: ["inventory", "settings"],
    queryFn: getSettings,
  });
};

export const useUpdateInventorySettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "settings"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "dashboard"] });
    },
  });
};

export const useStoreExpiry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: storeExpiry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "dashboard"] });
    },
  });
};