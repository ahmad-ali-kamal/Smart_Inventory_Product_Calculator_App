import apiClient from "./apiClient";

// Dashboard
export const getDashboard = async () => {
  const res = await apiClient.get("/inventory/dashboard");
  return res.data;
};

// Products
export const getProducts = async () => {
  const res = await apiClient.get("/inventory/products");
  return res.data;
};

// Settings
export const getSettings = async () => {
  const res = await apiClient.get("/inventory/settings");
  return res.data;
};

// Update Settings
export const updateSettings = async (data) => {
  const res = await apiClient.put("/inventory/settings/batch", data);
  return res.data;
};

// Store Expiry
export const storeExpiry = async (data) => {
  const res = await apiClient.post("/inventory/expiry/batch", data);
  return res.data;
};