"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ImportantDocumentItem } from "@/features/search/types";
import { http, isHttpErrorStatus } from "@/lib/http";
import { buildAuthHeaders, useSessionStore } from "@/lib/session-store";

const typeLabels: Record<ImportantDocumentItem["type"], string> = {
  PASSPORT: "Pasaporte",
  VISA: "Visa",
  INSURANCE: "Seguro",
  TICKET: "Boletos",
  VOUCHER: "Voucher",
  ITINERARY: "Itinerario",
  GUIDE: "Guía",
  FORM: "Formulario",
  OTHER: "Otro",
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

export default function DocumentosPage() {
  const { customer, token, hydrated, logout } = useSessionStore();
  const [documents, setDocuments] = useState<ImportantDocumentItem[]>([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | ImportantDocumentItem["type"]>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | ImportantDocumentItem["category"]>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    if (!token || !customer) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await http<ImportantDocumentItem[]>("/api/customers/me/documents", {
        headers: buildAuthHeaders(token),
      });
      setDocuments(response);
    } catch (loadError) {
      console.error(loadError);
      if (isHttpErrorStatus(loadError, 401)) {
        logout();
        setError("Tu sesión expiró. Inicia sesión nuevamente.");
      } else {
        setError("No pudimos cargar tus documentos.");
      }
    } finally {
      setLoading(false);
    }
  }, [customer, logout, token]);

  useEffect(() => {
    if (!hydrated) return;
    void loadDocuments();
  }, [hydrated, loadDocuments]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return documents.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        (item.description ?? "").toLowerCase().includes(normalizedQuery) ||
        (item.fileName ?? "").toLowerCase().includes(normalizedQuery);
      const matchesType = typeFilter === "ALL" || item.type === typeFilter;
      const matchesCategory = categoryFilter === "ALL" || item.category === categoryFilter;
      return matchesQuery && matchesType && matchesCategory;
    });
  }, [categoryFilter, documents, query, typeFilter]);

  const groupedByCategory = useMemo(() => {
    return {
      booking: filtered.filter((item) => item.category === "BOOKING_SPECIFIC"),
      general: filtered.filter((item) => item.category === "GENERAL"),
    };
  }, [filtered]);

  if (!hydrated) {
    return <main className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Cargando sesión...</main>;
  }

  if (!customer) {
    return (
      <main className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <h1 className="text-xl font-semibold text-amber-800">Inicia sesión para ver tus documentos</h1>
        <p className="mt-2 text-sm text-amber-700">Tus documentos se generan dinámicamente desde el panel administrativo.</p>
        <Link href="/app/acceder" className="mt-5 inline-flex rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700">
          Iniciar sesión
        </Link>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Mis documentos</h1>
        <p className="mt-1 text-sm text-slate-600">Documentos importantes asignados para tus viajes y trámites.</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_220px_auto] md:items-end">
          <label className="grid gap-2 text-sm">
            <span>Buscar</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Título, descripción o archivo"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span>Tipo</span>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as "ALL" | ImportantDocumentItem["type"])}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            >
              <option value="ALL">Todos</option>
              {Object.keys(typeLabels).map((key) => (
                <option key={key} value={key}>
                  {typeLabels[key as ImportantDocumentItem["type"]]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            <span>Categoría</span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value as "ALL" | ImportantDocumentItem["category"])}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            >
              <option value="ALL">Todas</option>
              <option value="GENERAL">General</option>
              <option value="BOOKING_SPECIFIC">Por reserva</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => void loadDocuments()}
            className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-500"
          >
            Actualizar
          </button>
        </div>
      </section>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Cargando documentos...</div> : null}

      {!loading && filtered.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">No hay documentos para este filtro</h2>
          <p className="mt-2 text-sm text-slate-600">Si esperabas un documento, pide soporte para que lo asignen desde administración.</p>
          <Link href="/app/soporte" className="mt-4 inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Ir a soporte
          </Link>
        </section>
      ) : null}

      {groupedByCategory.booking.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">Documentos por viaje</h2>
          <div className="grid gap-3">
            {groupedByCategory.booking.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {typeLabels[item.type]} · Reserva {item.bookingId ? `#${item.bookingId}` : "sin asignar"}
                </p>
                <p className="mt-2 text-sm text-slate-600">{item.description || "Sin descripción."}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>{item.fileName || "Archivo sin nombre"}</span>
                  <span>Actualizado: {formatDate(item.updatedAt)}</span>
                </div>
                <div className="mt-3">
                  <a
                    href={item.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-500"
                  >
                    Abrir documento
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {groupedByCategory.general.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">Documentos generales</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {groupedByCategory.general.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{typeLabels[item.type]}</p>
                <p className="mt-2 text-sm text-slate-600">{item.description || "Sin descripción."}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>{item.fileName || "Archivo sin nombre"}</span>
                  <span>Actualizado: {formatDate(item.updatedAt)}</span>
                </div>
                <div className="mt-3">
                  <a
                    href={item.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Abrir documento
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
