import apiClient from "./apiClient";

export const getMustasharSettings = async (productId) => {
  const res = await apiClient.get(
    `/mustashar/settings/${productId}`
  );

  return res.data;
};

export const updateMustasharSettings = async (data) => {
  const res = await apiClient.post(
    "/mustashar/settings/update",
    data
  );

  return res.data;
};
