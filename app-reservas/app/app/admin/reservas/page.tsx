"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { BookingEventItem, BookingResponse } from "@/features/search/types";
import { http, isHttpErrorStatus } from "@/lib/http";
import { buildAuthHeaders, useSessionStore } from "@/lib/session-store";

const statusStyles: Record<string, string> = {
  PENDING: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  CONFIRMED: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
  CANCELLED: "border-rose-400/30 bg-rose-500/10 text-rose-100",
};

const actorStyles: Record<string, string> = {
  CUSTOMER: "border-sky-400/30 bg-sky-500/10 text-sky-100",
  ADMIN: "border-violet-400/30 bg-violet-500/10 text-violet-100",
  STRIPE_WEBHOOK: "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-100",
  SYSTEM: "border-zinc-400/30 bg-zinc-500/10 text-zinc-100",
};

function formatDate(date: string | null) {
  if (!date) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);
}

function readMetaValue(event: BookingEventItem, key: string) {
  const value = event.metadata?.[key];
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  return null;
}

export default function AdminReservasPage() {
  const { customer, token, hydrated, logout } = useSessionStore();
  const isAdmin = customer?.role === "ADMIN";
  const isOperations = customer?.role === "OPERATIONS";
  const canOperate = isAdmin || isOperations;

  const [items, setItems] = useState<BookingResponse[]>([]);
  const [timelineByBooking, setTimelineByBooking] = useState<Record<number, BookingEventItem[]>>({});
  const [timelineErrors, setTimelineErrors] = useState<Record<number, string | null>>({});
  const [expandedBookingId, setExpandedBookingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);
  const [timelineLoadingId, setTimelineLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    if (!token || !canOperate) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }
      if (query.trim()) {
        params.set("query", query.trim());
      }
      const suffix = params.toString() ? `?${params.toString()}` : "";
      const response = await http<BookingResponse[]>(`/api/admin/bookings${suffix}`, {
        headers: buildAuthHeaders(token),
      });
      setItems(response);
      setNotes((current) => {
        const next = { ...current };
        response.forEach((booking) => {
          if (next[booking.id] === undefined) {
            next[booking.id] = booking.adminNote ?? "";
          }
        });
        return next;
      });
    } catch (loadError) {
      console.error(loadError);
      if (isHttpErrorStatus(loadError, 401)) {
        logout();
        setError("Tu sesión expiró. Inicia sesión nuevamente para continuar.");
      } else if (isHttpErrorStatus(loadError, 403)) {
        setError("Tu usuario no tiene permisos para operar reservas.");
      } else {
        setError("No pudimos cargar las reservas administrativas.");
      }
    } finally {
      setLoading(false);
    }
  }, [canOperate, logout, query, statusFilter, token]);

  const loadTimeline = useCallback(
    async (bookingId: number) => {
      if (!token || !canOperate) {
        return;
      }

      try {
        setTimelineLoadingId(bookingId);
        setTimelineErrors((current) => ({ ...current, [bookingId]: null }));
        const response = await http<BookingEventItem[]>(`/api/admin/bookings/${bookingId}/events`, {
          headers: buildAuthHeaders(token),
        });
        setTimelineByBooking((current) => ({ ...current, [bookingId]: response }));
      } catch (timelineError) {
        console.error(timelineError);
        if (isHttpErrorStatus(timelineError, 401)) {
          logout();
          setError("Tu sesión expiró. Inicia sesión nuevamente para continuar.");
        } else if (isHttpErrorStatus(timelineError, 403)) {
          setTimelineErrors((current) => ({
            ...current,
            [bookingId]: "Tu usuario no tiene permisos para ver la bitácora.",
          }));
        } else {
          setTimelineErrors((current) => ({
            ...current,
            [bookingId]: "No pudimos cargar la bitácora de esta reserva.",
          }));
        }
      } finally {
        setTimelineLoadingId((current) => (current === bookingId ? null : current));
      }
    },
    [canOperate, logout, token],
  );

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    void loadBookings();
  }, [hydrated, loadBookings]);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [items],
  );

  async function runAction(id: number, action: "confirm" | "cancel" | "refund") {
    if (!token) {
      return;
    }
    try {
      setActingId(id);
      setError(null);
      const updated = await http<BookingResponse>(`/api/admin/bookings/${id}/${action}`, {
        method: "POST",
        headers: buildAuthHeaders(token, { "Content-Type": "application/json" }),
        body: JSON.stringify({ note: notes[id] ?? "" }),
      });
      setItems((current) => current.map((item) => (item.id === id ? updated : item)));
      setNotes((current) => ({ ...current, [id]: updated.adminNote ?? "" }));
      if (expandedBookingId === id || timelineByBooking[id]) {
        await loadTimeline(id);
        setExpandedBookingId(id);
      }
    } catch (actionError) {
      console.error(actionError);
      if (isHttpErrorStatus(actionError, 401)) {
        logout();
        setError("Tu sesión expiró. Inicia sesión nuevamente para continuar.");
      } else {
        setError("No pudimos ejecutar la acción operativa sobre la reserva.");
      }
    } finally {
      setActingId(null);
    }
  }

  async function toggleTimeline(bookingId: number) {
    if (expandedBookingId === bookingId) {
      setExpandedBookingId(null);
      return;
    }

    setExpandedBookingId(bookingId);
    if (!timelineByBooking[bookingId]) {
      await loadTimeline(bookingId);
    }
  }

  return (
    <main className="space-y-6 p-6 text-slate-900">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin · Reservas</h1>
          <p className="text-sm text-slate-600">
            Filtra reservas globales y ejecuta acciones manuales con nota operativa.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadBookings()}
            disabled={!canOperate}
            className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:opacity-60"
          >
            Actualizar
          </button>
        </div>
      </div>

      <section className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 md:grid-cols-[220px_1fr_auto] md:items-end">
        <label className="grid gap-2 text-sm">
          <span>Estado</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl bg-black/20 px-3 py-2 outline-none ring-1 ring-white/10"
          >
            <option value="ALL">Todos</option>
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm">
          <span>Buscar</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="rounded-xl bg-black/20 px-3 py-2 outline-none ring-1 ring-white/10"
            placeholder="Cliente, email, paquete, ruta o nota"
          />
        </label>

        <button
          type="button"
          onClick={() => void loadBookings()}
          disabled={!canOperate}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold transition hover:bg-blue-500 disabled:opacity-60"
        >
          Aplicar filtros
        </button>
      </section>

      {error ? <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}
      {!hydrated ? <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">Cargando sesión...</div> : null}
      {hydrated && !customer ? <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-6 text-sm text-amber-100">Necesitas iniciar sesión.</div> : null}
      {hydrated && customer && !canOperate ? <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-6 text-sm text-red-100">Tu cuenta no tiene permisos para operar reservas.</div> : null}
      {hydrated && canOperate && loading ? <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">Cargando reservas...</div> : null}

      <div className="grid gap-4">
        {sortedItems.map((booking) => (
          <article key={booking.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{booking.packageTitle}</h2>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[booking.status] ?? "border-white/15 bg-white/10 text-white"}`}>
                    {booking.status}
                  </span>
                </div>

                <div className="text-sm text-zinc-300">
                  {booking.customerName} · {booking.customerEmail}
                </div>
                <div className="text-sm text-zinc-400">
                  {booking.originCode} → {booking.destinationCode} · {formatMoney(booking.totalPrice)}
                </div>
                <div className="grid gap-1 text-sm text-zinc-500">
                  <div>Salida: {formatDate(booking.startDate)}</div>
                  <div>Regreso: {formatDate(booking.endDate)}</div>
                  <div>Creada: {formatDate(booking.createdAt)}</div>
                  {booking.adminNote ? <div>Nota actual: {booking.adminNote}</div> : null}
                </div>
              </div>

              <div className="grid gap-3 xl:min-w-[360px]">
                <textarea
                  value={notes[booking.id] ?? ""}
                  onChange={(event) => setNotes((current) => ({ ...current, [booking.id]: event.target.value }))}
                  className="min-h-28 rounded-xl bg-black/20 px-3 py-2 outline-none ring-1 ring-white/10"
                  placeholder="Nota operativa interna"
                />
                <div className="flex flex-wrap gap-2">
                  <Link href={`/app/checkout/${booking.id}`} className="rounded-xl border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10">
                    Ver checkout
                  </Link>
                  <button
                    type="button"
                    onClick={() => void toggleTimeline(booking.id)}
                    disabled={timelineLoadingId === booking.id}
                    className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-500/20 disabled:opacity-60"
                  >
                    {timelineLoadingId === booking.id && expandedBookingId !== booking.id
                      ? "Cargando bitácora..."
                      : expandedBookingId === booking.id
                        ? "Ocultar bitácora"
                        : "Ver bitácora"}
                  </button>
                  {booking.status !== "CANCELLED" ? (
                    <button
                      type="button"
                      onClick={() => void runAction(booking.id, "confirm")}
                      disabled={actingId === booking.id}
                      className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100 transition hover:bg-emerald-500/20 disabled:opacity-60"
                    >
                      {actingId === booking.id ? "Procesando..." : "Confirmar manualmente"}
                    </button>
                  ) : null}
                  {booking.status !== "CANCELLED" ? (
                    <button
                      type="button"
                      onClick={() => void runAction(booking.id, "cancel")}
                      disabled={actingId === booking.id}
                      className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm text-red-100 transition hover:bg-red-500/20 disabled:opacity-60"
                    >
                      {actingId === booking.id ? "Procesando..." : "Cancelar manualmente"}
                    </button>
                  ) : null}
                  {booking.status === "CONFIRMED" ? (
                    <button
                      type="button"
                      onClick={() => void runAction(booking.id, "refund")}
                      disabled={actingId === booking.id}
                      className="rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-sm text-sky-100 transition hover:bg-sky-500/20 disabled:opacity-60"
                    >
                      {actingId === booking.id ? "Procesando..." : "Reembolsar"}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {expandedBookingId === booking.id ? (
              <section className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-300">Bitácora</h3>
                    <p className="text-xs text-zinc-500">Eventos persistentes del ciclo de vida de la reserva.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadTimeline(booking.id)}
                    disabled={timelineLoadingId === booking.id}
                    className="rounded-xl border border-white/10 px-3 py-2 text-xs transition hover:bg-white/10 disabled:opacity-60"
                  >
                    {timelineLoadingId === booking.id ? "Actualizando..." : "Actualizar bitácora"}
                  </button>
                </div>

                {timelineErrors[booking.id] ? (
                  <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {timelineErrors[booking.id]}
                  </div>
                ) : null}

                {!timelineErrors[booking.id] && timelineLoadingId === booking.id && !timelineByBooking[booking.id] ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
                    Cargando eventos...
                  </div>
                ) : null}

                {!timelineErrors[booking.id] && timelineByBooking[booking.id]?.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
                    Esta reserva todavía no tiene eventos registrados.
                  </div>
                ) : null}

                <div className="grid gap-3">
                  {(timelineByBooking[booking.id] ?? []).map((event) => {
                    const fromStatus = readMetaValue(event, "fromStatus");
                    const toStatus = readMetaValue(event, "toStatus");
                    const paymentStatus = readMetaValue(event, "paymentStatus");
                    const provider = readMetaValue(event, "provider");
                    const providerPaymentId = readMetaValue(event, "providerPaymentId");
                    const note = readMetaValue(event, "note");

                    return (
                      <article key={event.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${actorStyles[event.actor] ?? "border-white/15 bg-white/10 text-white"}`}
                              >
                                {event.actor}
                              </span>
                              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-300">
                                {event.type}
                              </span>
                            </div>
                            <p className="text-sm text-zinc-100">{event.summary}</p>
                            <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
                              {fromStatus && toStatus ? <span>Estado: {fromStatus} → {toStatus}</span> : null}
                              {paymentStatus ? <span>Pago: {paymentStatus}</span> : null}
                              {provider ? <span>Proveedor: {provider}</span> : null}
                              {providerPaymentId ? <span>Ref: {providerPaymentId}</span> : null}
                              {note ? <span>Nota: {note}</span> : null}
                            </div>
                          </div>
                          <div className="text-xs text-zinc-500">{formatDate(event.createdAt)}</div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </article>
        ))}
      </div>
    </main>
  );
}
