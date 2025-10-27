"use client";
import { useStore } from "@/lib/store";
import ResultsList from "./ResultsList";

export default function ResultsSection({ className = "" }: { className?: string }) {
  const { results } = useStore();
  return (
    <section className={className}>
      <h2 className="mb-2 text-sm font-semibold">Resultados</h2>
      <ResultsList items={results} />
    </section>
  );
}
