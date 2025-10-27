"use client";
import { useStore } from "@/lib/store";

export function useSearchClient() {
  const { criteria, setLoading, setResults } = useStore();

  async function runSearch() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: criteria.from || "OAX",
        to: criteria.to || "MEX",
        dateFrom: criteria.dateFrom || "",
        dateTo: criteria.dateTo || "",
        pax: String(criteria.pax || 1),
      });
      const res = await fetch(`/api/search?${params.toString()}`);
      const json = await res.json();
      setResults(json.items || []);
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return { runSearch };
}