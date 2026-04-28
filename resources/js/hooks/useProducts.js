import { useQuery } from "@tanstack/react-query";
import { getProducts, getProduct } from "../services/productService";

export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });
};

export const useProduct = (productId) => {
  return useQuery({
    queryKey: ["products", productId],
    queryFn: () => getProduct(productId),
    enabled: Boolean(productId),
  });
};