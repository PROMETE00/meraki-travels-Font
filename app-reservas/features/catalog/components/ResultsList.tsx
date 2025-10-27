"use client";
type Item = { id: string; type: string; title: string; price: number };

export default function ResultsList({ items = [] as Item[] }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-white/10 p-6 text-center text-sm text-zinc-500">
        Sin resultados. Busca un destino.
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-1 gap-4">
      {items.map((it) => (
        <li key={it.id} className="rounded-2xl border border-white/10 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-semibold">{it.title}</div>
              <div className="text-xs text-zinc-500">{it.type}</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">${it.price}</div>
              <button className="mt-2 rounded-lg border border-white/20 px-3 py-1 text-xs hover:bg-white/5">
                Reservar
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}