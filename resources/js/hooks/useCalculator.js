import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCalculatorSettings,
  updateCalculatorSettings,
} from "../services/calculatorService";

export const useCalculatorSettings = (productId) => {
  return useQuery({
    queryKey: ["calculator", "settings", productId],
    queryFn: () => getCalculatorSettings(productId),
    enabled: Boolean(productId),
  });
};

export const useUpdateCalculatorSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCalculatorSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calculator"] });
    },
  });
};