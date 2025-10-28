"use client";
import { useStore } from "@/lib/store";

export default function SearchBarExpanded({ onSubmit }: { onSubmit: () => void }) {
  const { criteria, setCriteria, loading } = useStore();

  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <input
          className="rounded-xl bg-white/10 px-3 py-2 outline-none ring-1 ring-white/10"
          placeholder="Desde (OAX)"
          value={criteria.from}
          onChange={(e) => setCriteria({ from: e.target.value.toUpperCase() })}
        />
        <input
          className="rounded-xl bg-white/10 px-3 py-2 outline-none ring-1 ring-white/10"
          placeholder="Hacia (MEX)"
          value={criteria.to}
          onChange={(e) => setCriteria({ to: e.target.value.toUpperCase() })}
        />
        <input
          type="date"
          className="rounded-xl bg-white/10 px-3 py-2 outline-none ring-1 ring-white/10"
          value={criteria.dateFrom}
          onChange={(e) => setCriteria({ dateFrom: e.target.value })}
        />
        <input
          type="date"
          className="rounded-xl bg-white/10 px-3 py-2 outline-none ring-1 ring-white/10"
          value={criteria.dateTo}
          onChange={(e) => setCriteria({ dateTo: e.target.value })}
        />
        <input
          type="number"
          min={1}
          className="rounded-xl bg-white/10 px-3 py-2 outline-none ring-1 ring-white/10"
          value={criteria.pax}
          onChange={(e) => setCriteria({ pax: Number(e.target.value || 1) })}
        />
        <button
          onClick={onSubmit}
          disabled={loading}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-60"
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </div>
    </div>
  );
}
