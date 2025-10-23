"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Role = "admin" | "instructor" | "student";

interface User {
  id: number;
  email: string;
  role: Role;
  token: string;
}

interface AuthState {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
  hasRole: (...roles: Role[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      hasRole: (...roles) => {
        const currentRole = get().user?.role;
        return currentRole ? roles.includes(currentRole) : false;
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
