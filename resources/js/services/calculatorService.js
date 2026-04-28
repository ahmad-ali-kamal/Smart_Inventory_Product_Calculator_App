import apiClient from "./apiClient";

export const getCalculatorSettings = async (productId) => {
  const res = await apiClient.get(`/calculator/settings/${productId}`);
  return res.data;
};

export const updateCalculatorSettings = async (data) => {
  const res = await apiClient.post("/calculator/settings/update", data);
  return res.data;
};