import { create } from "zustand";
import type { User } from "../api/types";

export type AuthStatus = "loading" | "authed" | "guest";

type AuthState = {
  user: User | null;
  status: AuthStatus;
  setUser: (user: User | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "loading",
  setUser: (user) => set({ user, status: user ? "authed" : "guest" }),
}));
