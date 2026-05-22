import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMustasharSettings,
  updateMustasharSettings,
} from "../services/mustasharService";

export const useMustasharSettings = (productId) => {
  return useQuery({
    queryKey: ["mustashar", "settings", productId],
    queryFn: () => getMustasharSettings(productId),
    enabled: Boolean(productId),
  });
};

export const useUpdateMustasharSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMustasharSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mustashar"] });
    },
  });
};