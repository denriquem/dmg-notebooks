import api from "./client";
import type { User } from "./types";

export const register = async (email: string, password: string, name: string): Promise<User> => {
  const { data } = await api.post<{ user: User }>("/auth/register", { email, password, name });
  return data.user;
};

export const login = async (email: string, password: string): Promise<User> => {
  const { data } = await api.post<{ user: User }>("/auth/login", { email, password });
  return data.user;
};

export const logout = async (): Promise<void> => {
  await api.post("/auth/logout");
};

export const fetchMe = async (): Promise<User | null> => {
  try {
    const { data } = await api.get<{ user: User }>("/auth/me");
    return data.user;
  } catch {
    return null;
  }
};
