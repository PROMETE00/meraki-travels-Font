import { create } from "zustand";
import type { SearchCriteria, SearchResultItem } from "@/features/search/types";

type Store = {
  criteria: SearchCriteria;
  setCriteria: (c: Partial<SearchCriteria>) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  results: SearchResultItem[];
  setResults: (r: SearchResultItem[]) => void;
  searchError: string | null;
  setSearchError: (value: string | null) => void;
};

export const useStore = create<Store>((set) => ({
  criteria: { from: "OAX", to: "MEX", dateFrom: "", dateTo: "", pax: 1 },
  setCriteria: (c) => set((s) => ({ criteria: { ...s.criteria, ...c } })),
  loading: false,
  setLoading: (v) => set({ loading: v }),
  results: [],
  setResults: (r) => set({ results: r }),
  searchError: null,
  setSearchError: (value) => set({ searchError: value }),
}));
