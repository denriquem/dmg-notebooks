import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { fetchMe, login, logout, register } from "../api/auth";
import { useAuthStore } from "../store/auth";

export const useHydrateAuth = (): void => {
  const setUser = useAuthStore((s) => s.setUser);
  useEffect(() => {
    void fetchMe().then(setUser);
  }, [setUser]);
};

export const useLogin = () => {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => login(email, password),
    onSuccess: (user) => setUser(user),
  });
};

export const useRegister = () => {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: ({ email, password, name }: { email: string; password: string; name: string }) =>
      register(email, password, name),
    onSuccess: (user) => setUser(user),
  });
};

export const useLogout = () => {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: logout,
    onSuccess: () => setUser(null),
  });
};
