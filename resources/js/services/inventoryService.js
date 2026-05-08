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

// Store Batch
export const storeBatch = async ({ productId, data }) => {
  const res = await apiClient.post(
    `/inventory/products/${productId}/store-batch`,
    data
  );
  return res.data;
};

// Update Batch
export const updateBatch = async ({ batchId, data }) => {
  const res = await apiClient.put(`/inventory/batch/${batchId}`, data);
  return res.data;
};