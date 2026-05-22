import apiClient from "./apiClient";

// Dashboard
export const getDashboard = async () => {
  const res = await apiClient.get("/harees/api/dashboard");
  return res.data;
};

// Products
export const getProducts = async () => {
  const res = await apiClient.get("/harees/api/products");
  return res.data;
};

// Settings
export const getSettings = async () => {
  const res = await apiClient.get("/harees/api/settings");
  return res.data;
};

// Update Settings
export const updateSettings = async (data) => {
  const res = await apiClient.put("/harees/api/settings", data);
  return res.data;
};

// Store Expiry
export const storeExpiry = async (data) => {
  const res = await apiClient.post("/harees/api/expiry", data);
  return res.data;
};

// Store Batch
export const storeBatch = async ({ productId, data }) => {
  const res = await apiClient.post(
    `/harees/api/products/${productId}/store-batch`,
    data
  );

  return res.data;
};

// Update Batch
export const updateBatch = async ({ batchId, data }) => {
  const res = await apiClient.put(
    `/harees/api/batch/${batchId}`,
    data
  );

  return res.data;
};

// Get Product Variants
export const getProductVariants = async (productId) => {
  const res = await apiClient.get(`/harees/products/${productId}/variants`);
  return res.data;
};

// Check Product Options (ask merchant)
export const checkProductOptions = async (productId) => {
  const res = await apiClient.get(`/harees/products/${productId}/check-options`);
  return res.data;
};