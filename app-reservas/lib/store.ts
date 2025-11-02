// lib/store.ts
import { create } from "zustand";

export type Criteria = {
  from: string;
  to: string;
  dateFrom: string;
  dateTo: string;
  pax: number;
};

type Store = {
  criteria: Criteria;
  setCriteria: (c: Partial<Criteria>) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  results: any[];
  setResults: (r: any[]) => void;
};

export const useStore = create<Store>((set) => ({
  criteria: { from: "OAX", to: "MEX", dateFrom: "", dateTo: "", pax: 1 },
  setCriteria: (c) => set((s) => ({ criteria: { ...s.criteria, ...c } })),
  loading: false,
  setLoading: (v) => set({ loading: v }),
  results: [],
  setResults: (r) => set({ results: r }),
}));
