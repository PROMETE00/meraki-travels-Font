"use client";
import { http } from "@/lib/http";
import { useStore } from "@/lib/store";
import { buildSearchParams, validateSearchCriteria } from "@/lib/validators";
import type { SearchResponse } from "../types";

export function useSearchClient() {
  const { criteria, setLoading, setResults, setSearchError } = useStore();

  async function runSearch() {
    const validationError = validateSearchCriteria(criteria);
    if (validationError) {
      setSearchError(validationError);
      setResults([]);
      return;
    }

    setLoading(true);
    setSearchError(null);
    try {
      const params = buildSearchParams(criteria);
      const json = await http<SearchResponse>(`/api/search?${params.toString()}`);
      setResults(json.items || []);
    } catch (error) {
      console.error(error);
      setResults([]);
      setSearchError("No pudimos cargar paquetes reales en este momento.");
    } finally {
      setLoading(false);
    }
  }

  return { runSearch };
}
