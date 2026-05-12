import apiClient from "./apiClient";

export const getUser = async () => {
  const res = await apiClient.get("/api/user")
  return res.data;
};

export const logout = async () => {
  const res = await apiClient.post("/logout");
  return res.data;
};