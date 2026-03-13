"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CustomerSession } from "@/features/search/types";

type SessionState = {
  customer: CustomerSession | null;
  token: string | null;
  hydrated: boolean;
  setSession: (token: string, customer: CustomerSession) => void;
  setCustomer: (customer: CustomerSession | null) => void;
  setHydrated: (value: boolean) => void;
  logout: () => void;
};

export function buildAuthHeaders(token: string | null, init?: HeadersInit): HeadersInit {
  return {
    ...(init ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      customer: null,
      token: null,
      hydrated: false,
      setSession: (token, customer) => set({ token, customer }),
      setCustomer: (customer) => set({ customer }),
      setHydrated: (value) => set({ hydrated: value }),
      logout: () => set({ customer: null, token: null }),
    }),
    {
      name: "meraki-auth-session",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ customer: state.customer, token: state.token }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
