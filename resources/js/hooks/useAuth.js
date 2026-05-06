import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUser, logout } from "../services/authService";

export const useAuthUser = () => {
  return useQuery({
    queryKey: ["auth", "user"],
    queryFn: getUser,
    retry: false,
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/login";
    },
  });
};