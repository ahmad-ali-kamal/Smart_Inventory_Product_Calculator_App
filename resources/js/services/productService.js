import apiClient from "./apiClient";

export const getProducts = async () => {
  const res = await apiClient.get("/products");
  return res.data;
};

export const getProduct = async (productId) => {
  const res = await apiClient.get(`/products/${productId}`);
  return res.data;
};