import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      tenant: null,
      setAuth: (user, token, tenant) => set({ user, token, tenant }),
      logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        set({ user: null, token: null, tenant: null });
      },
    }),
    {
      name: "auth-storage",
    },
  ),
);

export const useSuperAdminStore = create(
  persist(
    (set) => ({
      superAdmin: null,
      superToken: null,
      setSuperAuth: (superAdmin, superToken) => set({ superAdmin, superToken }),
      logout: () => {
        localStorage.removeItem("superToken");
        set({ superAdmin: null, superToken: null });
      },
    }),
    {
      name: "super-admin-storage",
    },
  ),
);
