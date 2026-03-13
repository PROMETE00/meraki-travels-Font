"use client";
import { useStore } from "@/lib/store";
import { normalizeAirportCode } from "@/lib/validators";

export default function SearchBar({ onSearch }: { onSearch: () => void }) {
  const { criteria, setCriteria, loading, searchError } = useStore();
  return (
    <section className="rounded-2xl border border-white/10 bg-black/5 p-4 dark:bg-white/5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <input
          className="rounded-xl bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10"
          placeholder="Desde (OAX)"
          value={criteria.from}
          onChange={(e) => setCriteria({ from: normalizeAirportCode(e.target.value) })}
        />
        <input
          className="rounded-xl bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10"
          placeholder="Hacia (MEX)"
          value={criteria.to}
          onChange={(e) => setCriteria({ to: normalizeAirportCode(e.target.value) })}
        />
        <input
          type="date"
          className="rounded-xl bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10"
          value={criteria.dateFrom}
          onChange={(e) => setCriteria({ dateFrom: e.target.value })}
        />
        <input
          type="date"
          className="rounded-xl bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10"
          value={criteria.dateTo}
          onChange={(e) => setCriteria({ dateTo: e.target.value })}
        />
        <input
          type="number"
          min={1}
          className="rounded-xl bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10"
          value={criteria.pax}
          onChange={(e) => setCriteria({ pax: Number(e.target.value || 1) })}
        />
        <button
          onClick={onSearch}
          disabled={loading}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-60"
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </div>
      <p className="mt-2 text-[11px] text-zinc-500">
        Busca paquetes reales cargados por el backend y crea una reserva demo para pasar a checkout.
      </p>
      {searchError ? <p className="mt-2 text-xs text-red-300">{searchError}</p> : null}
    </section>
  );
}
