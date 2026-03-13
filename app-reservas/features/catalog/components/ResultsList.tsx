"use client";
import ResultCard from "./ResultCard";
import type { SearchResultItem } from "@/features/search/types";

export default function ResultsList({ items = [] as SearchResultItem[] }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-white/10 p-6 text-center text-sm text-zinc-500">
        Sin resultados. Busca un destino con paquetes disponibles.
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4">
      {items.map((it) => (
        <li key={it.id}>
          <ResultCard item={it} />
        </li>
      ))}
    </ul>
  );
}
