"use client";
import { useStore } from "@/lib/store";
import ResultsList from "./ResultsList";

export default function ResultsSection({ className = "" }: { className?: string }) {
  const { results, searchError } = useStore();
  return (
    <section className={className}>
      <h2 className="mb-2 text-sm font-semibold">Resultados</h2>
      {searchError ? (
        <div className="mb-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
          {searchError}
        </div>
      ) : null}
      <ResultsList items={results} />
    </section>
  );
}
